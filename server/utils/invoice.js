const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generateInvoice(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const invoiceDir = path.join(__dirname, '..', '..', 'uploads', 'invoices');
    if (!fs.existsSync(invoiceDir)) fs.mkdirSync(invoiceDir, { recursive: true });

    const filePath = path.join(invoiceDir, `${data.invoiceNumber}.pdf`);
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Header
    doc.rect(0, 0, 612, 120).fill('#0B1C2D');
    doc.fill('#FFFFFF').fontSize(26).font('Helvetica-Bold').text('Aswathy Associates', 50, 35);
    doc.fontSize(12).font('Helvetica').text('GST & Auditing', 50, 65);
    doc.fontSize(9).text('Mukalivila, Koviloor, Arinalloor P.O., Thevalakkara', 50, 85);
    doc.text('Phone: 9846560665, 8304844504 | Email: aswathyandco@gmail.com', 50, 98);

    // Invoice Title
    doc.fill('#0B1C2D').fontSize(22).font('Helvetica-Bold').text('INVOICE', 50, 145);
    
    // Invoice Details (right aligned)
    doc.fontSize(10).font('Helvetica');
    doc.text(`Invoice #: ${data.invoiceNumber}`, 380, 145);
    doc.text(`Date: ${data.date}`, 380, 160);
    doc.text(`Status: PAID`, 380, 175);

    // Divider
    doc.moveTo(50, 200).lineTo(562, 200).stroke('#0E7C61');

    // Bill To
    doc.fontSize(12).font('Helvetica-Bold').fill('#0E7C61').text('BILL TO', 50, 220);
    doc.fontSize(10).font('Helvetica').fill('#333333');
    doc.text(data.clientName, 50, 240);
    doc.text(data.clientEmail, 50, 255);
    if (data.clientPhone) doc.text(data.clientPhone, 50, 270);

    // Table Header
    const tableTop = 310;
    doc.rect(50, tableTop, 512, 30).fill('#0B1C2D');
    doc.fill('#FFFFFF').fontSize(10).font('Helvetica-Bold');
    doc.text('Description', 60, tableTop + 9);
    doc.text('Qty', 350, tableTop + 9);
    doc.text('Rate', 400, tableTop + 9);
    doc.text('Amount', 480, tableTop + 9);

    // Table Row
    const rowY = tableTop + 40;
    doc.fill('#333333').font('Helvetica');
    doc.text(data.description || data.serviceType, 60, rowY, { width: 280 });
    doc.text('1', 355, rowY);
    doc.text(`₹${parseFloat(data.amount).toLocaleString('en-IN')}`, 395, rowY);
    doc.text(`₹${parseFloat(data.amount).toLocaleString('en-IN')}`, 475, rowY);

    // Divider
    doc.moveTo(50, rowY + 25).lineTo(562, rowY + 25).stroke('#ddd');

    // Total
    const totalY = rowY + 45;
    doc.rect(380, totalY - 5, 182, 35).fill('#0E7C61');
    doc.fill('#FFFFFF').fontSize(12).font('Helvetica-Bold');
    doc.text('TOTAL', 395, totalY + 3);
    doc.text(`₹${parseFloat(data.amount).toLocaleString('en-IN')}`, 475, totalY + 3);

    // Payment Info
    const payY = totalY + 60;
    doc.fill('#333333').fontSize(10).font('Helvetica-Bold').text('Payment Information', 50, payY);
    doc.font('Helvetica').fontSize(9);
    doc.text(`Payment Method: ${data.paymentMethod || 'Online Payment'}`, 50, payY + 18);
    doc.text(`Transaction ID: ${data.paymentId || 'N/A'}`, 50, payY + 33);
    doc.text(`Payment Date: ${data.date}`, 50, payY + 48);

    // Footer
    doc.moveTo(50, 700).lineTo(562, 700).stroke('#ddd');
    doc.fontSize(8).fill('#888888').font('Helvetica');
    doc.text('This is a computer-generated invoice and does not require a physical signature.', 50, 715, { align: 'center' });
    doc.text('Aswathy Associates – GST & Auditing | aswathyandco@gmail.com | 9846560665', 50, 730, { align: 'center' });

    // Gold accent line at bottom
    doc.rect(0, 780, 612, 4).fill('#C9A227');

    doc.end();

    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

module.exports = { generateInvoice };
