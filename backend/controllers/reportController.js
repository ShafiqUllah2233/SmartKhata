const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');

// @desc    Generate PDF report for a customer
// @route   GET /api/reports/customer/:customerId/pdf
exports.generateCustomerPDF = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.customerId,
      user: req.user._id
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const transactions = await Transaction.find({
      customer: customer._id
    }).sort({ date: 1 });

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${customer.name}-report.pdf`);

    doc.pipe(res);

    // Title
    doc.fontSize(20).text('Smart Khata - Customer Report', { align: 'center' });
    doc.moveDown();

    // Customer Info
    doc.fontSize(14).text(`Customer: ${customer.name}`);
    if (customer.phone) doc.fontSize(11).text(`Phone: ${customer.phone}`);
    if (customer.address) doc.fontSize(11).text(`Address: ${customer.address}`);
    doc.fontSize(12).text(`Current Balance: Rs. ${Math.abs(customer.balance).toFixed(2)} ${customer.balance > 0 ? '(Customer Owes)' : customer.balance < 0 ? '(You Owe)' : '(Settled)'}`);
    doc.moveDown();

    // Report date
    doc.fontSize(10).text(`Report Generated: ${new Date().toLocaleDateString('en-PK')}`, { align: 'right' });
    doc.moveDown();

    // Table Header
    doc.fontSize(10);
    const tableTop = doc.y;
    doc.text('Date', 50, tableTop);
    doc.text('Type', 150, tableTop);
    doc.text('Amount', 250, tableTop);
    doc.text('Description', 340, tableTop);
    doc.text('Balance', 470, tableTop);

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    let y = tableTop + 25;

    transactions.forEach(t => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      const dateStr = new Date(t.date).toLocaleDateString('en-PK');
      doc.text(dateStr, 50, y);
      doc.text(t.type === 'GIVEN' ? 'Money Given' : 'Money Received', 150, y);
      doc.text(`Rs. ${t.amount.toFixed(2)}`, 250, y);
      doc.text(t.description || '-', 340, y, { width: 120 });
      doc.text(`Rs. ${t.balanceAfter.toFixed(2)}`, 470, y);
      y += 20;
    });

    // Summary
    doc.moveDown(2);
    const totalGiven = transactions.filter(t => t.type === 'GIVEN').reduce((s, t) => s + t.amount, 0);
    const totalReceived = transactions.filter(t => t.type === 'RECEIVED').reduce((s, t) => s + t.amount, 0);

    doc.fontSize(12).text(`Total Money Given: Rs. ${totalGiven.toFixed(2)}`);
    doc.text(`Total Money Received: Rs. ${totalReceived.toFixed(2)}`);
    doc.text(`Net Balance: Rs. ${customer.balance.toFixed(2)}`);

    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Export customer transactions to CSV
// @route   GET /api/reports/customer/:customerId/csv
exports.exportCustomerCSV = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.customerId,
      user: req.user._id
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const transactions = await Transaction.find({
      customer: customer._id
    }).sort({ date: 1 });

    const data = transactions.map(t => ({
      Date: new Date(t.date).toLocaleDateString('en-PK'),
      Type: t.type === 'GIVEN' ? 'Money Given' : 'Money Received',
      Amount: t.amount.toFixed(2),
      Description: t.description || '-',
      'Balance After': t.balanceAfter.toFixed(2)
    }));

    const parser = new Parser({
      fields: ['Date', 'Type', 'Amount', 'Description', 'Balance After']
    });
    const csv = parser.parse(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${customer.name}-transactions.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all customers report CSV
// @route   GET /api/reports/all/csv
exports.exportAllCustomersCSV = async (req, res) => {
  try {
    const customers = await Customer.find({ user: req.user._id }).sort({ name: 1 });

    const data = customers.map(c => ({
      Name: c.name,
      Phone: c.phone || '-',
      Address: c.address || '-',
      Balance: c.balance.toFixed(2),
      Status: c.balance > 0 ? 'Customer Owes' : c.balance < 0 ? 'You Owe' : 'Settled'
    }));

    const parser = new Parser({
      fields: ['Name', 'Phone', 'Address', 'Balance', 'Status']
    });
    const csv = parser.parse(data);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=all-customers-report.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
