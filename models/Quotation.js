// models/Quotation.js
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
  customerAddress:   String,
  developmentAddress: String,

  jobType: {
    type: [String],
    enum: ['Electric', 'Gas', 'Water'],
    required: true,
    minlength: 1,
  },

  siteAddress: {
    type: String,
    required: true,
    trim: true,
  },

  projectTitle:      String,
  projectDescription: String,
  quotationType:     String,
  scope:             String,

  quotationDate: {
    type: Date,
    default: Date.now
  },

  items: [{
    serviceName:   { type: String, required: true },
    description:   String,
    quantity:      { type: Number, default: 1 },
    unitPrice:     { type: Number, required: true },
    totalPrice:    { type: Number, required: true },
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

  // ────────────────────────────────────────────────
  // All your extra fields — MUST be here to be saved
  // ────────────────────────────────────────────────
  scopeTable: {
    drawing: String,
    totalPlots: String,
    futurePhaseAllowance: String,
    totalLoadAllowance: String,
    heatingType: String,
    plotConnections: String,
    meters: String,
    electricConnectionVoltage: String,
    waterMainType: String,
    waterWasteSustainability: String,
    mainsConnectionsCommissioning: String,
  },

  tenderInclusions: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },

  airSourceHeatPumps: {
    numPlots: String,
    plotNumbers: String,
    dataSheetProvided: Boolean,
    pumpModel: String,
    ashpLoadAllowancePerPlot: String,
  },

  nonContestableCharges: {
    electricPOC: String,
    waterPOCIncumbent: String,
    waterInfraFees: String,
    wasteWaterInfraFees: String,
    environmentalComponent: String,
    meterAdminCharges: String,
    uuApprovalFee: String,
    councilCharges: String,
  },

  deliveryStandards: {
    serviceCallOff: String,
    mainsCallOff: String,
    mobilisationDesignApproval: String,
    draftDuctLayouts: String,
  },

  pocDocumentation: {
    waterPocRef: String,
    waterPocExpiry: String,
    mainsElectricPocRef: String,
    mainsElectricPocExpiry: String,
  },

  constructionAssumptions: {
    siteSpecific: String,
    generalTerms: String,
  },

  responsibilities: {
    customer: String,
    au: String,
  },

  legalDocumentation: {
    customerContact: String,
    landownerDetails: String,
    solicitorsActing: String,
  },

}, {
  timestamps: true,
  strict: false // ← allows extra fields if you add more later (optional safety)
});

module.exports = mongoose.model('Quotation', quotationSchema);