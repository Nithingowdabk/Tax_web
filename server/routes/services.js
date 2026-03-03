const router = require('express').Router();
const db = require('../config/database');

// ── Get All Active Services ──────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM services WHERE is_active = TRUE';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY sort_order ASC';
    const [services] = await db.query(query, params);
    res.json({ services });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// ── Get Service by Slug ──────────────────────────────────────
router.get('/:slug', async (req, res) => {
  try {
    const [services] = await db.query('SELECT * FROM services WHERE slug = ? AND is_active = TRUE', [req.params.slug]);
    if (services.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json({ service: services[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

// ── Get Service Categories ───────────────────────────────────
router.get('/meta/categories', async (req, res) => {
  try {
    const [cats] = await db.query('SELECT DISTINCT category FROM services WHERE is_active = TRUE ORDER BY category');
    res.json({ categories: cats.map(c => c.category) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;
