const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const xss = require('xss');
const validator = require('validator');
const db = require('../config/database');
const { sendEmail, emailTemplates } = require('../utils/email');

// ── Submit Inquiry ───────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    let { name, email, phone, subject, message, service_interest } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const uuid = uuidv4();
    name = xss(name.trim());
    email = email.trim().toLowerCase();
    message = xss(message.trim());

    await db.query(`
      INSERT INTO inquiries (uuid, name, email, phone, subject, message, service_interest)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [uuid, name, email, phone || null, subject ? xss(subject) : null, message, service_interest ? xss(service_interest) : null]);

    // Send acknowledgment
    const template = emailTemplates.inquiryReceived({ name });
    sendEmail({ to: email, ...template });

    // Notify admin
    sendEmail({
      to: process.env.ADMIN_EMAIL || 'aswathyandco@gmail.com',
      subject: `New Inquiry from ${name}`,
      html: `<p><strong>From:</strong> ${name} (${email})</p><p><strong>Phone:</strong> ${phone || 'N/A'}</p><p><strong>Subject:</strong> ${subject || 'General'}</p><p><strong>Message:</strong> ${message}</p>`
    });

    res.status(201).json({ message: 'Inquiry submitted successfully! We will get back to you shortly.' });
  } catch (err) {
    console.error('Inquiry error:', err);
    res.status(500).json({ error: 'Failed to submit inquiry' });
  }
});

module.exports = router;
