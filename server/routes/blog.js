const router = require('express').Router();
const db = require('../config/database');

// ── Get Published Blog Posts ─────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    let query = 'SELECT id, slug, title, excerpt, cover_image, category, tags, views, published_at FROM blog_posts WHERE is_published = TRUE';
    const params = [];

    if (category) { query += ' AND category = ?'; params.push(category); }
    query += ' ORDER BY published_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

    const [posts] = await db.query(query, params);
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// ── Get Single Post ──────────────────────────────────────────
router.get('/:slug', async (req, res) => {
  try {
    const [posts] = await db.query(
      'SELECT bp.*, u.name as author_name FROM blog_posts bp LEFT JOIN users u ON bp.author_id = u.id WHERE bp.slug = ? AND bp.is_published = TRUE',
      [req.params.slug]
    );
    if (posts.length === 0) return res.status(404).json({ error: 'Post not found' });

    // Increment views
    await db.query('UPDATE blog_posts SET views = views + 1 WHERE slug = ?', [req.params.slug]);
    res.json({ post: posts[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

module.exports = router;
