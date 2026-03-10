const mongoose = require('mongoose');

const acceptanceSchema = new mongoose.Schema({
  proposalId: {
    type: String,
    required: true,
  },
  quotationRef: String,
  name: {
    type: String,
    required: true,
  },
  signature: {
    type: String,
    required: true,
  },
  positionHeld: {
    type: String,
    required: true,
  },
  contactNumbers: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  anticipatedStartDate: {
    type: Date,
    required: true,
  },
  siteContact: {
    type: String,
    required: true,
  },
  acceptedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Acceptance', acceptanceSchema);