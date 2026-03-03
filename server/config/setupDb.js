require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function setupDatabase() {
  // Connect without database first
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  });

  const DB = process.env.DB_NAME || 'aswathy_associates';

  console.log('🔧 Setting up Aswathy Associates database...\n');

  // Create database
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE \`${DB}\``);

  // ── Users Table ────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      phone VARCHAR(15),
      password VARCHAR(255) NOT NULL,
      role ENUM('client', 'staff', 'admin') DEFAULT 'client',
      company_name VARCHAR(200),
      gstin VARCHAR(20),
      address TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      email_verified BOOLEAN DEFAULT FALSE,
      avatar VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_role (role)
    ) ENGINE=InnoDB
  `);
  console.log('  ✅ users table created');

  // ── Services Table ─────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS services (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(100) NOT NULL UNIQUE,
      category VARCHAR(60) NOT NULL,
      title VARCHAR(200) NOT NULL,
      short_desc TEXT,
      description TEXT,
      who_needs TEXT,
      documents_required TEXT,
      process_steps TEXT,
      price_starting DECIMAL(10,2) DEFAULT 0,
      price_label VARCHAR(100),
      is_active BOOLEAN DEFAULT TRUE,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_category (category),
      INDEX idx_slug (slug)
    ) ENGINE=InnoDB
  `);
  console.log('  ✅ services table created');

  // ── Appointments Table ─────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL UNIQUE,
      user_id INT,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL,
      phone VARCHAR(15) NOT NULL,
      service_id INT,
      service_type VARCHAR(100),
      appointment_date DATE NOT NULL,
      appointment_time TIME NOT NULL,
      message TEXT,
      status ENUM('pending', 'approved', 'rescheduled', 'completed', 'cancelled') DEFAULT 'pending',
      admin_notes TEXT,
      payment_required BOOLEAN DEFAULT FALSE,
      payment_status ENUM('unpaid', 'paid') DEFAULT 'unpaid',
      payment_id VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
      INDEX idx_date (appointment_date),
      INDEX idx_status (status)
    ) ENGINE=InnoDB
  `);
  console.log('  ✅ appointments table created');

  // ── Inquiries Table ────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL,
      phone VARCHAR(15),
      subject VARCHAR(200),
      message TEXT NOT NULL,
      service_interest VARCHAR(100),
      status ENUM('new', 'read', 'replied', 'closed') DEFAULT 'new',
      admin_notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_status (status)
    ) ENGINE=InnoDB
  `);
  console.log('  ✅ inquiries table created');

  // ── Documents Table ────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL UNIQUE,
      user_id INT NOT NULL,
      category ENUM('gst', 'income_tax', 'company_docs', 'other') DEFAULT 'other',
      file_name VARCHAR(255) NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_size INT NOT NULL,
      mime_type VARCHAR(100),
      status ENUM('pending', 'reviewed', 'completed', 'rejected') DEFAULT 'pending',
      remarks TEXT,
      admin_remarks TEXT,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TIMESTAMP NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user (user_id),
      INDEX idx_category (category),
      INDEX idx_status (status)
    ) ENGINE=InnoDB
  `);
  console.log('  ✅ documents table created');

  // ── Payments Table ─────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL UNIQUE,
      user_id INT,
      appointment_id INT,
      razorpay_order_id VARCHAR(100),
      razorpay_payment_id VARCHAR(100),
      razorpay_signature VARCHAR(255),
      amount DECIMAL(10,2) NOT NULL,
      currency VARCHAR(5) DEFAULT 'INR',
      description VARCHAR(255),
      service_type VARCHAR(100),
      status ENUM('created', 'paid', 'failed', 'refunded') DEFAULT 'created',
      invoice_number VARCHAR(50),
      invoice_path VARCHAR(500),
      payment_method VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
      INDEX idx_user (user_id),
      INDEX idx_status (status),
      INDEX idx_razorpay (razorpay_order_id)
    ) ENGINE=InnoDB
  `);
  console.log('  ✅ payments table created');

  // ── Blog Table ─────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(200) NOT NULL UNIQUE,
      title VARCHAR(255) NOT NULL,
      excerpt TEXT,
      content LONGTEXT,
      cover_image VARCHAR(500),
      author_id INT,
      category VARCHAR(60),
      tags VARCHAR(255),
      is_published BOOLEAN DEFAULT FALSE,
      views INT DEFAULT 0,
      published_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_slug (slug),
      INDEX idx_published (is_published)
    ) ENGINE=InnoDB
  `);
  console.log('  ✅ blog_posts table created');

  // ── Notifications Table ────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      title VARCHAR(200) NOT NULL,
      message TEXT,
      type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
      is_read BOOLEAN DEFAULT FALSE,
      link VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_read (user_id, is_read)
    ) ENGINE=InnoDB
  `);
  console.log('  ✅ notifications table created');

  // ── Create Admin User ──────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL || 'aswathyandco@gmail.com';
  const adminPass = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [adminEmail]);
  
  if (existing.length === 0) {
    const { v4: uuidv4 } = require('uuid');
    const hash = await bcrypt.hash(adminPass, 12);
    await conn.query(`
      INSERT INTO users (uuid, name, email, phone, password, role, is_active, email_verified)
      VALUES (?, ?, ?, ?, ?, 'admin', TRUE, TRUE)
    `, [uuidv4(), 'Aswathy Raju', adminEmail, '9846560665', hash]);
    console.log('\n  👤 Admin user created:', adminEmail);
  }

  console.log('\n✅ Database setup complete!\n');
  await conn.end();
  process.exit(0);
}

setupDatabase().catch(err => {
  console.error('❌ Setup failed:', err);
  process.exit(1);
});
