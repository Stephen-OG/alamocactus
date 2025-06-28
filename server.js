const express = require("express");
const multer = require('multer');
const path = require('path');
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // serve contact.html
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Default route (optional, serves index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB per file
});

const transporter = nodemailer.createTransport({
    service: "gmail", // or any other SMTP provider
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Handle form Post
app.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;

  const mailOptions = {
    from: email,
    to: process.env.EMAIL_USER,
    subject: `Message from ${name}`,
    text: message
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
});

// Handle form POST
app.post('/appointment', upload.array('insurance_card', 2), async (req, res) => {
  try {
    const formData = req.body;
    const files = req.files.map(file => `${req.protocol}://${req.get('host')}/uploads/${file.filename}`);

    const mailOptions = {
      from: 'your_email@gmail.com',
      to: process.env.EMAIL_USER,
      subject: 'New Patient Intake Submission',
      html: `<h3>New Submission</h3><pre>${JSON.stringify(formData, null, 2)}</pre><p>Attachments:</p><ul>${files.map(f => `<li><a href="${f}">${f}</a></li>`).join('')}</ul>`
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Form submitted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Submission failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
