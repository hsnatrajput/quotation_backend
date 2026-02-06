const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema({
  proposalId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  customerName:      { type: String, required: true },
  customerEmail:     { type: String, required: true },
  customerPhone:     String,

  // Job Type – now array, only 3 options allowed
  jobType: {
    type: [String],
    enum: ['Electric', 'Gas', 'Water'],
    required: true,
    minlength: 1,  // at least one must be selected
  },

  // Single address field: siteAddress (replaces projectAddress)
  siteAddress: {
    type: String,
    required: true,
    trim: true,
  },

  projectTitle:      String,
  projectDescription:String,

  quotationDate: {
    type: Date,
    default: Date.now
  },

  items: [{
    serviceName:   { type: String, required: true },
    description:   String,
    quantity:      { type: Number, default: 1 },
    unitPrice:     { type: Number, required: true },
    totalPrice:    { type: Number, required: true }
  }],

  subtotal:    { type: Number, required: true },
  vatRate:     { type: Number, default: 20 },
  vatAmount:   { type: Number, required: true },
  totalAmount: { type: Number, required: true },

  exclusions:    [String],
  paymentTerms:  String,
  hourlyRates:   [{ role: String, rate: Number }],

  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'],
    default: 'draft'
  },

  validUntil: Date,

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

}, {
  timestamps: true
});

module.exports = mongoose.model('Quotation', quotationSchema);