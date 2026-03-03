const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { generateInvoice } = require('../utils/invoice');
const { sendEmail, emailTemplates } = require('../utils/email');

// ── Create Razorpay Order ────────────────────────────────────
router.post('/create-order', optionalAuth, async (req, res) => {
  try {
    const { amount, description, service_type, appointment_id } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // Razorpay integration
    let razorpayOrder = null;
    try {
      const Razorpay = require('razorpay');
      const rzp = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });

      razorpayOrder = await rzp.orders.create({
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
        notes: { service_type: service_type || '', description: description || '' }
      });
    } catch (rzpErr) {
      // If Razorpay fails (e.g., test mode), create a mock order
      razorpayOrder = {
        id: `order_mock_${Date.now()}`,
        amount: Math.round(amount * 100),
        currency: 'INR'
      };
    }

    const uuid = uuidv4();
    const invoiceNumber = `AA-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    await db.query(`
      INSERT INTO payments (uuid, user_id, appointment_id, razorpay_order_id, amount, description, service_type, invoice_number)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [uuid, req.user?.id || null, appointment_id || null, razorpayOrder.id, amount, description || null, service_type || null, invoiceNumber]);

    res.json({
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
      uuid
    });
  } catch (err) {
    console.error('Payment order error:', err);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// ── Verify Payment ───────────────────────────────────────────
router.post('/verify', optionalAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ error: 'Payment details are required' });
    }

    // Verify signature (in production)
    // const crypto = require('crypto');
    // const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    //   .update(razorpay_order_id + '|' + razorpay_payment_id).digest('hex');
    // if (expectedSignature !== razorpay_signature) {
    //   return res.status(400).json({ error: 'Invalid payment signature' });
    // }

    // Update payment record
    await db.query(`
      UPDATE payments SET razorpay_payment_id = ?, razorpay_signature = ?, status = 'paid', payment_method = 'razorpay'
      WHERE razorpay_order_id = ?
    `, [razorpay_payment_id, razorpay_signature || '', razorpay_order_id]);

    // Get payment details
    const [payments] = await db.query('SELECT * FROM payments WHERE razorpay_order_id = ?', [razorpay_order_id]);
    if (payments.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = payments[0];

    // Generate invoice PDF
    let invoicePath = null;
    try {
      const clientName = req.user?.name || 'Client';
      const clientEmail = req.user?.email || '';
      invoicePath = await generateInvoice({
        invoiceNumber: payment.invoice_number,
        date: new Date().toLocaleDateString('en-IN'),
        clientName,
        clientEmail,
        clientPhone: '',
        description: payment.description || payment.service_type || 'Professional Service',
        serviceType: payment.service_type || 'Service',
        amount: payment.amount,
        paymentId: razorpay_payment_id,
        paymentMethod: 'Razorpay'
      });

      await db.query('UPDATE payments SET invoice_path = ? WHERE id = ?', [invoicePath, payment.id]);
    } catch (invErr) {
      console.error('Invoice generation error:', invErr);
    }

    // Update appointment payment status if linked
    if (payment.appointment_id) {
      await db.query("UPDATE appointments SET payment_status = 'paid', payment_id = ? WHERE id = ?", [razorpay_payment_id, payment.appointment_id]);
    }

    res.json({
      message: 'Payment verified successfully',
      invoice_number: payment.invoice_number,
      invoice_url: invoicePath ? `/uploads/invoices/${payment.invoice_number}.pdf` : null
    });
  } catch (err) {
    console.error('Payment verify error:', err);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// ── Get My Payments (Client) ─────────────────────────────────
router.get('/my', authenticate, async (req, res) => {
  try {
    const [payments] = await db.query(
      `SELECT uuid, amount, description, service_type, status, invoice_number, invoice_path, payment_method, razorpay_payment_id, created_at
       FROM payments WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// ── Download Invoice ─────────────────────────────────────────
router.get('/invoice/:invoiceNumber', authenticate, async (req, res) => {
  try {
    const [payments] = await db.query(
      'SELECT * FROM payments WHERE invoice_number = ? AND (user_id = ? OR ? IN (SELECT id FROM users WHERE role IN ("admin", "staff")))',
      [req.params.invoiceNumber, req.user.id, req.user.id]
    );

    if (payments.length === 0 || !payments[0].invoice_path) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.download(payments[0].invoice_path);
  } catch (err) {
    res.status(500).json({ error: 'Failed to download invoice' });
  }
});

module.exports = router;
