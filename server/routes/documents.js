const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

// ── Upload Document ──────────────────────────────────────────
router.post('/upload', authenticate, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { category, remarks } = req.body;
    const uuid = uuidv4();

    await db.query(`
      INSERT INTO documents (uuid, user_id, category, file_name, original_name, file_path, file_size, mime_type, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      uuid,
      req.user.id,
      category || 'other',
      req.file.filename,
      req.file.originalname,
      req.file.path,
      req.file.size,
      req.file.mimetype,
      remarks || null
    ]);

    res.status(201).json({ message: 'Document uploaded successfully', uuid });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// ── Get My Documents ─────────────────────────────────────────
router.get('/my', authenticate, async (req, res) => {
  try {
    const [docs] = await db.query(
      `SELECT uuid, category, original_name, file_size, mime_type, status, remarks, admin_remarks, uploaded_at, reviewed_at
       FROM documents WHERE user_id = ? ORDER BY uploaded_at DESC`,
      [req.user.id]
    );
    res.json({ documents: docs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// ── Delete My Document ───────────────────────────────────────
router.delete('/:uuid', authenticate, async (req, res) => {
  try {
    const [doc] = await db.query('SELECT * FROM documents WHERE uuid = ? AND user_id = ?', [req.params.uuid, req.user.id]);
    if (doc.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete file from disk
    const fs = require('fs');
    if (fs.existsSync(doc[0].file_path)) {
      fs.unlinkSync(doc[0].file_path);
    }

    await db.query('DELETE FROM documents WHERE uuid = ?', [req.params.uuid]);
    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

module.exports = router;
