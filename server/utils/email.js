const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📧 Email (dev mode): To: ${to}, Subject: ${subject}`);
      return { success: true, dev: true };
    }

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Aswathy Associates" <aswathyandco@gmail.com>',
      to,
      subject,
      html,
      text
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('Email send error:', err.message);
    return { success: false, error: err.message };
  }
};

const emailTemplates = {
  appointmentConfirmation: (data) => ({
    subject: 'Appointment Confirmation – Aswathy Associates',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: #0B1C2D; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Aswathy Associates</h1>
          <p style="margin: 5px 0 0; opacity: 0.8;">GST & Auditing</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #0E7C61;">Appointment Confirmed!</h2>
          <p>Dear ${data.name},</p>
          <p>Your appointment has been booked successfully. Here are the details:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Date</td><td style="padding: 10px; border-bottom: 1px solid #eee;">${data.date}</td></tr>
            <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Time</td><td style="padding: 10px; border-bottom: 1px solid #eee;">${data.time}</td></tr>
            <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Service</td><td style="padding: 10px; border-bottom: 1px solid #eee;">${data.service}</td></tr>
          </table>
          <p>We will confirm your appointment shortly. You will receive a confirmation call/SMS.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 13px; color: #666;">
            <p><strong>Aswathy Associates – GST & Auditing</strong></p>
            <p>📞 9846560665, 8304844504 | ✉️ aswathyandco@gmail.com</p>
            <p>📍 Mukalivila, Koviloor, Arinalloor P.O., Thevalakkara</p>
          </div>
        </div>
      </div>
    `
  }),

  inquiryReceived: (data) => ({
    subject: 'We Received Your Inquiry – Aswathy Associates',
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: #0B1C2D; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Aswathy Associates</h1>
          <p style="margin: 5px 0 0; opacity: 0.8;">GST & Auditing</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #0E7C61;">Thank You for Reaching Out!</h2>
          <p>Dear ${data.name},</p>
          <p>We have received your inquiry and our team will get back to you within 24 hours.</p>
          <p>If your matter is urgent, please call us directly at <strong>9846560665</strong>.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 13px; color: #666;">
            <p><strong>Aswathy Associates – GST & Auditing</strong></p>
            <p>📞 9846560665, 8304844504 | ✉️ aswathyandco@gmail.com</p>
          </div>
        </div>
      </div>
    `
  }),

  paymentReceipt: (data) => ({
    subject: `Payment Receipt #${data.invoiceNumber} – Aswathy Associates`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
        <div style="background: #0B1C2D; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Payment Receipt</h1>
          <p style="margin: 5px 0 0; opacity: 0.8;">Aswathy Associates – GST & Auditing</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #0E7C61;">Payment Successful!</h2>
          <p>Dear ${data.name},</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Invoice #</td><td style="padding: 10px; border-bottom: 1px solid #eee;">${data.invoiceNumber}</td></tr>
            <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Amount</td><td style="padding: 10px; border-bottom: 1px solid #eee;">₹${data.amount}</td></tr>
            <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Service</td><td style="padding: 10px; border-bottom: 1px solid #eee;">${data.service}</td></tr>
            <tr><td style="padding: 10px; font-weight: bold;">Payment ID</td><td style="padding: 10px;">${data.paymentId}</td></tr>
          </table>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 13px; color: #666;">
            <p><strong>Aswathy Associates – GST & Auditing</strong></p>
            <p>📞 9846560665 | ✉️ aswathyandco@gmail.com</p>
          </div>
        </div>
      </div>
    `
  })
};

module.exports = { sendEmail, emailTemplates };
