const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const mammoth = require('mammoth');
const mysql = require('mysql2');  // Add mysql2 package for database interaction

const app = express();
const upload = multer({ dest: 'uploads/' }); // Temporary storage for uploaded files
const PORT = 3000;

// MySQL Database Connection
const db = mysql.createConnection({
  host: 'localhost',  // Replace with your database host
  user: 'root',  // Replace with your database username
  password: '',  // Replace with your database password
  database: 'file_converter'  // Replace with your database name
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);  // Exit if database connection fails
  }
  console.log('Connected to MySQL database');
});

// Serve the insert.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'insert.html'));
});

// Handle PDF generation
app.post('/convert-to-pdf', upload.array('files[]'), async (req, res) => {
  const pdfDoc = await PDFDocument.create();

  try {
    for (const file of req.files) {
      const filePath = path.join(__dirname, file.path);
      const fileExt = path.extname(file.originalname).toLowerCase();

      // Handle files (images, text, or docx)
      if (['.jpg', '.jpeg', '.png'].includes(fileExt)) {
        const imageBytes = fs.readFileSync(filePath);
        const image = fileExt === '.png' 
          ? await pdfDoc.embedPng(imageBytes)
          : await pdfDoc.embedJpg(imageBytes);
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0 });

      } else if (fileExt === '.txt') {
        const text = fs.readFileSync(filePath, 'utf8');
        const page = pdfDoc.addPage();
        page.drawText(text, { x: 50, y: 500 });

      } else if (fileExt === '.docx') {
        const result = await mammoth.extractRawText({ path: filePath });
        const page = pdfDoc.addPage();
        page.drawText(result.value, { x: 50, y: 500 });
      }

      // Save file metadata to the database
      const filename = file.originalname;
      const filepath = file.path;
      const mimetype = file.mimetype;

      const query = 'INSERT INTO files (filename, filepath, mimetype) VALUES (?, ?, ?)';
      db.query(query, [filename, filepath, mimetype], (err, result) => {
        if (err) {
          console.error('Error inserting file into database:', err);
        } else {
          console.log('File metadata inserted into database:', result);
        }
      });

      // Delete temporary file
      fs.unlinkSync(filePath);
    }

    // Send the generated PDF
    const pdfBytes = await pdfDoc.save();
    res.contentType('application/pdf');
    res.send(Buffer.from(pdfBytes));

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Failed to generate PDF');
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
