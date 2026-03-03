require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Security Middleware ──────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors());

// ── Rate Limiting ────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests. Please try again later.' }
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts. Please try again later.' }
});
app.use('/api/auth/login', authLimiter);

// ── Body Parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static Files ─────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── Ensure upload directories exist ──────────────────────────
const uploadDirs = ['uploads', 'uploads/documents', 'uploads/invoices'];
uploadDirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
});

// ── API Routes ───────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/inquiries', require('./routes/inquiries'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/services', require('./routes/services'));
app.use('/api/blog', require('./routes/blog'));
app.use('/api/calculator', require('./routes/calculator'));

// ── Page Routes ──────────────────────────────────────────────
const servePage = (page) => (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', page));
};

app.get('/', servePage('index.html'));
app.get('/about', servePage('pages/about.html'));
app.get('/services', servePage('pages/services.html'));
app.get('/contact', servePage('pages/contact.html'));
app.get('/gst-calculator', servePage('pages/gst-calculator.html'));
app.get('/book-appointment', servePage('pages/appointment.html'));
app.get('/login', servePage('pages/login.html'));
app.get('/register', servePage('pages/register.html'));
app.get('/portal', servePage('portal/dashboard.html'));
app.get('/portal/*', servePage('portal/dashboard.html'));
app.get('/admin', servePage('admin/dashboard.html'));
app.get('/admin/*', servePage('admin/dashboard.html'));

// ── 404 Handler ──────────────────────────────────────────────
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.status(404).sendFile(path.join(__dirname, '..', 'public', 'pages', '404.html'));
});

// ── Error Handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start Server ─────────────────────────────────────────────
const db = require('./config/database');

db.getConnection()
  .then(conn => {
    console.log('✅ MySQL Database connected');
    conn.release();
    app.listen(PORT, () => {
      console.log(`🚀 Aswathy Associates server running on port ${PORT}`);
      console.log(`🌐 Visit: http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    console.log('⚠️  Starting server without database...');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} (no database)`);
    });
  });

module.exports = app;
