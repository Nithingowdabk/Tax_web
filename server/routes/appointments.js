const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const xss = require('xss');
const validator = require('validator');
const db = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../utils/email');

// ── Book Appointment ─────────────────────────────────────────
router.post('/', optionalAuth, async (req, res) => {
  try {
    let { name, email, phone, service_id, service_type, appointment_date, appointment_time, message } = req.body;

    if (!name || !email || !phone || !appointment_date || !appointment_time) {
      return res.status(400).json({ error: 'Name, email, phone, date, and time are required' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const uuid = uuidv4();
    name = xss(name.trim());
    email = email.trim().toLowerCase();

    await db.query(`
      INSERT INTO appointments (uuid, user_id, name, email, phone, service_id, service_type, appointment_date, appointment_time, message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [uuid, req.user?.id || null, name, email, phone, service_id || null, service_type ? xss(service_type) : null, appointment_date, appointment_time, message ? xss(message) : null]);

    // Send confirmation email
    const template = emailTemplates.appointmentConfirmation({
      name,
      date: new Date(appointment_date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      time: appointment_time,
      service: service_type || 'General Consultation'
    });
    sendEmail({ to: email, ...template });

    res.status(201).json({ message: 'Appointment booked successfully! We will confirm shortly.', uuid });
  } catch (err) {
    console.error('Appointment error:', err);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

// ── Get My Appointments (Client) ─────────────────────────────
router.get('/my', authenticate, async (req, res) => {
  try {
    const [appointments] = await db.query(
      'SELECT uuid, name, service_type, appointment_date, appointment_time, status, payment_status, admin_notes, created_at FROM appointments WHERE user_id = ? ORDER BY appointment_date DESC',
      [req.user.id]
    );
    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// ── Get Available Slots ──────────────────────────────────────
router.get('/slots', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Date is required' });

    // Get booked slots
    const [booked] = await db.query(
      "SELECT appointment_time FROM appointments WHERE appointment_date = ? AND status NOT IN ('cancelled')",
      [date]
    );

    const bookedTimes = booked.map(b => b.appointment_time.substring(0, 5));

    // Generate all slots (9 AM to 6 PM, 30-min intervals)
    const allSlots = [];
    for (let h = 9; h < 18; h++) {
      allSlots.push(`${String(h).padStart(2, '0')}:00`);
      allSlots.push(`${String(h).padStart(2, '0')}:30`);
    }

    const dayOfWeek = new Date(date).getDay();
    if (dayOfWeek === 0) {
      return res.json({ slots: [], message: 'Closed on Sundays' });
    }

    const availableSlots = allSlots.filter(s => !bookedTimes.includes(s));
    res.json({ slots: availableSlots });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
});

module.exports = router;
