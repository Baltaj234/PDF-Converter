const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const mammoth = require('mammoth');

const app = express();
const upload = multer({ dest: 'uploads/' }); // Temporary storage for uploaded files
const PORT = 3000;

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

      if (['.jpg', '.jpeg', '.png'].includes(fileExt)) {
        // Handle images
        const imageBytes = fs.readFileSync(filePath);
        const image = fileExt === '.png' 
          ? await pdfDoc.embedPng(imageBytes)
          : await pdfDoc.embedJpg(imageBytes);
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0 });

      } else if (fileExt === '.txt') {
        // Handle text files
        const text = fs.readFileSync(filePath, 'utf8');
        const page = pdfDoc.addPage();
        page.drawText(text, { x: 50, y: 500 });

      } else if (fileExt === '.docx') {
        // Handle Word files
        const result = await mammoth.extractRawText({ path: filePath });
        const page = pdfDoc.addPage();
        page.drawText(result.value, { x: 50, y: 500 });
      }

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
