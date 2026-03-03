const router = require('express').Router();
const db = require('../config/database');
const { authenticate, requireAdmin, requireStaff } = require('../middleware/auth');

// All admin routes require authentication + admin/staff role
router.use(authenticate);

// ── Dashboard Stats ──────────────────────────────────────────
router.get('/stats', requireStaff, async (req, res) => {
  try {
    const [[inquiryCount]] = await db.query("SELECT COUNT(*) as count FROM inquiries");
    const [[newInquiries]] = await db.query("SELECT COUNT(*) as count FROM inquiries WHERE status = 'new'");
    const [[appointmentCount]] = await db.query("SELECT COUNT(*) as count FROM appointments");
    const [[pendingAppointments]] = await db.query("SELECT COUNT(*) as count FROM appointments WHERE status = 'pending'");
    const [[clientCount]] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'client'");
    const [[revenue]] = await db.query("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'paid'");
    const [[monthlyRevenue]] = await db.query("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'paid' AND MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())");
    const [[documentCount]] = await db.query("SELECT COUNT(*) as count FROM documents");
    const [[pendingDocs]] = await db.query("SELECT COUNT(*) as count FROM documents WHERE status = 'pending'");

    res.json({
      totalInquiries: inquiryCount.count,
      newInquiries: newInquiries.count,
      totalAppointments: appointmentCount.count,
      pendingAppointments: pendingAppointments.count,
      totalClients: clientCount.count,
      totalRevenue: revenue.total,
      monthlyRevenue: monthlyRevenue.total,
      totalDocuments: documentCount.count,
      pendingDocuments: pendingDocs.count
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ── Get All Inquiries ────────────────────────────────────────
router.get('/inquiries', requireStaff, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    let query = 'SELECT * FROM inquiries';
    const params = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const [inquiries] = await db.query(query, params);
    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM inquiries' + (status ? ' WHERE status = ?' : ''), status ? [status] : []);

    res.json({ inquiries, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

// ── Update Inquiry Status ────────────────────────────────────
router.put('/inquiries/:uuid', requireStaff, async (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    await db.query('UPDATE inquiries SET status = ?, admin_notes = ? WHERE uuid = ?', [status, admin_notes || null, req.params.uuid]);
    res.json({ message: 'Inquiry updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update inquiry' });
  }
});

// ── Get All Appointments ─────────────────────────────────────
router.get('/appointments', requireStaff, async (req, res) => {
  try {
    const { status, date, page = 1, limit = 20 } = req.query;
    let query = 'SELECT a.*, s.title as service_title FROM appointments a LEFT JOIN services s ON a.service_id = s.id WHERE 1=1';
    const params = [];

    if (status) { query += ' AND a.status = ?'; params.push(status); }
    if (date) { query += ' AND a.appointment_date = ?'; params.push(date); }

    query += ' ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const [appointments] = await db.query(query, params);
    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// ── Update Appointment ───────────────────────────────────────
router.put('/appointments/:uuid', requireStaff, async (req, res) => {
  try {
    const { status, admin_notes, appointment_date, appointment_time } = req.body;
    const updates = [];
    const params = [];

    if (status) { updates.push('status = ?'); params.push(status); }
    if (admin_notes !== undefined) { updates.push('admin_notes = ?'); params.push(admin_notes); }
    if (appointment_date) { updates.push('appointment_date = ?'); params.push(appointment_date); }
    if (appointment_time) { updates.push('appointment_time = ?'); params.push(appointment_time); }

    if (updates.length === 0) return res.status(400).json({ error: 'No updates provided' });

    params.push(req.params.uuid);
    await db.query(`UPDATE appointments SET ${updates.join(', ')} WHERE uuid = ?`, params);
    res.json({ message: 'Appointment updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// ── Get All Documents ────────────────────────────────────────
router.get('/documents', requireStaff, async (req, res) => {
  try {
    const { status, category, user_id } = req.query;
    let query = 'SELECT d.*, u.name as client_name, u.email as client_email FROM documents d JOIN users u ON d.user_id = u.id WHERE 1=1';
    const params = [];

    if (status) { query += ' AND d.status = ?'; params.push(status); }
    if (category) { query += ' AND d.category = ?'; params.push(category); }
    if (user_id) { query += ' AND d.user_id = ?'; params.push(user_id); }

    query += ' ORDER BY d.uploaded_at DESC';
    const [docs] = await db.query(query, params);
    res.json({ documents: docs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// ── Update Document Status ───────────────────────────────────
router.put('/documents/:uuid', requireStaff, async (req, res) => {
  try {
    const { status, admin_remarks } = req.body;
    await db.query('UPDATE documents SET status = ?, admin_remarks = ?, reviewed_at = NOW() WHERE uuid = ?', [status, admin_remarks || null, req.params.uuid]);
    res.json({ message: 'Document updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// ── Download Document ────────────────────────────────────────
router.get('/documents/download/:uuid', requireStaff, async (req, res) => {
  try {
    const [docs] = await db.query('SELECT * FROM documents WHERE uuid = ?', [req.params.uuid]);
    if (docs.length === 0) return res.status(404).json({ error: 'Document not found' });
    res.download(docs[0].file_path, docs[0].original_name);
  } catch (err) {
    res.status(500).json({ error: 'Failed to download document' });
  }
});

// ── Get All Clients ──────────────────────────────────────────
router.get('/clients', requireStaff, async (req, res) => {
  try {
    const [clients] = await db.query(
      "SELECT uuid, name, email, phone, company_name, gstin, is_active, created_at FROM users WHERE role = 'client' ORDER BY created_at DESC"
    );
    res.json({ clients });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// ── Get All Payments ─────────────────────────────────────────
router.get('/payments', requireStaff, async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT p.*, u.name as client_name, u.email as client_email FROM payments p LEFT JOIN users u ON p.user_id = u.id';
    const params = [];

    if (status) { query += ' WHERE p.status = ?'; params.push(status); }
    query += ' ORDER BY p.created_at DESC';

    const [payments] = await db.query(query, params);
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// ── Manage Services ──────────────────────────────────────────
router.put('/services/:id', requireAdmin, async (req, res) => {
  try {
    const { title, description, price_starting, price_label, is_active } = req.body;
    const updates = [];
    const params = [];

    if (title) { updates.push('title = ?'); params.push(title); }
    if (description) { updates.push('description = ?'); params.push(description); }
    if (price_starting !== undefined) { updates.push('price_starting = ?'); params.push(price_starting); }
    if (price_label) { updates.push('price_label = ?'); params.push(price_label); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active); }

    params.push(req.params.id);
    await db.query(`UPDATE services SET ${updates.join(', ')} WHERE id = ?`, params);
    res.json({ message: 'Service updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// ── Manage Users (Admin) ─────────────────────────────────────
router.put('/users/:uuid/role', requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['client', 'staff', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    await db.query('UPDATE users SET role = ? WHERE uuid = ?', [role, req.params.uuid]);
    res.json({ message: 'User role updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.put('/users/:uuid/status', requireAdmin, async (req, res) => {
  try {
    const { is_active } = req.body;
    await db.query('UPDATE users SET is_active = ? WHERE uuid = ?', [is_active, req.params.uuid]);
    res.json({ message: 'User status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ── Blog Management ──────────────────────────────────────────
router.post('/blog', requireAdmin, async (req, res) => {
  try {
    const { title, slug, excerpt, content, category, tags, is_published } = req.body;
    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    await db.query(`
      INSERT INTO blog_posts (slug, title, excerpt, content, category, tags, author_id, is_published, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [finalSlug, title, excerpt, content, category, tags, req.user.id, is_published || false, is_published ? new Date() : null]);

    res.status(201).json({ message: 'Blog post created' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});

router.put('/blog/:id', requireAdmin, async (req, res) => {
  try {
    const { title, excerpt, content, category, tags, is_published } = req.body;
    await db.query(
      'UPDATE blog_posts SET title=?, excerpt=?, content=?, category=?, tags=?, is_published=?, published_at=IF(? AND published_at IS NULL, NOW(), published_at) WHERE id=?',
      [title, excerpt, content, category, tags, is_published, is_published, req.params.id]
    );
    res.json({ message: 'Blog post updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});

// ── Revenue Analytics ────────────────────────────────────────
router.get('/analytics/revenue', requireAdmin, async (req, res) => {
  try {
    const [monthly] = await db.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(amount) as total, COUNT(*) as count
      FROM payments WHERE status = 'paid'
      GROUP BY month ORDER BY month DESC LIMIT 12
    `);

    const [byService] = await db.query(`
      SELECT service_type, SUM(amount) as total, COUNT(*) as count
      FROM payments WHERE status = 'paid' AND service_type IS NOT NULL
      GROUP BY service_type ORDER BY total DESC
    `);

    res.json({ monthly, byService });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
