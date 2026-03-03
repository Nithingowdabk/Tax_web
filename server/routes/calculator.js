const router = require('express').Router();

// ── GST Calculation ──────────────────────────────────────────
router.post('/gst', (req, res) => {
  try {
    const { amount, rate, type } = req.body; // type: 'exclusive' or 'inclusive'

    if (!amount || !rate) {
      return res.status(400).json({ error: 'Amount and GST rate are required' });
    }

    const amt = parseFloat(amount);
    const gstRate = parseFloat(rate);

    if (isNaN(amt) || isNaN(gstRate) || amt < 0 || gstRate < 0) {
      return res.status(400).json({ error: 'Invalid values' });
    }

    let result = {};

    if (type === 'inclusive') {
      // Amount includes GST
      const baseAmount = (amt * 100) / (100 + gstRate);
      const gstAmount = amt - baseAmount;
      result = {
        originalAmount: amt,
        baseAmount: Math.round(baseAmount * 100) / 100,
        gstAmount: Math.round(gstAmount * 100) / 100,
        cgst: Math.round((gstAmount / 2) * 100) / 100,
        sgst: Math.round((gstAmount / 2) * 100) / 100,
        igst: Math.round(gstAmount * 100) / 100,
        totalAmount: amt,
        gstRate
      };
    } else {
      // Amount excludes GST
      const gstAmount = (amt * gstRate) / 100;
      const totalAmount = amt + gstAmount;
      result = {
        originalAmount: amt,
        baseAmount: amt,
        gstAmount: Math.round(gstAmount * 100) / 100,
        cgst: Math.round((gstAmount / 2) * 100) / 100,
        sgst: Math.round((gstAmount / 2) * 100) / 100,
        igst: Math.round(gstAmount * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
        gstRate
      };
    }

    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: 'Calculation failed' });
  }
});

module.exports = router;
