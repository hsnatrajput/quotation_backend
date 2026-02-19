// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const colors = require('colors');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const quotationRoutes = require('./routes/quotations');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/quotations', quotationRoutes);

// ────────────────────────────────────────────────
// PUBLIC ROUTE - Returns FULL quotation data
// ────────────────────────────────────────────────
app.get('/proposal/:proposalId', async (req, res) => {
  try {
    const Quotation = require('./models/Quotation');

    const quotation = await Quotation.findOne({ proposalId: req.params.proposalId });

    if (!quotation) {
      return res.status(404).json({ 
        success: false,
        message: 'Quotation not found or link has expired' 
      });
    }

    // Optional: track view
    if (quotation.status === 'sent') {
      quotation.status = 'viewed';
      await quotation.save({ validateBeforeSave: false });
    }

    // Return everything except sensitive fields
    const safeData = quotation.toObject();
    delete safeData.createdBy;
    delete safeData.__v;
    delete safeData.updatedAt;

    res.status(200).json({
      success: true,
      data: safeData
    });
  } catch (error) {
    console.error(`Error fetching proposal ${req.params.proposalId}:`.red, error.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error while loading quotation' 
    });
  }
});

// Root test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Air Utilities Quotation System API',
    status: 'running',
    date: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack.red);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Something went wrong on the server',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`.cyan.bold);
    });
  })
  .catch(err => {
    console.error('Failed to start server:'.red.bold, err.message);
    process.exit(1);
  });