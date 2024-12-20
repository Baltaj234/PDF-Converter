

CREATE TABLE downloads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fileName VARCHAR(255) NOT NULL,
    fileContent LONGBLOB NOT NULL,
    downloadDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255),
  filepath VARCHAR(255),
  mimetype VARCHAR(50),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
