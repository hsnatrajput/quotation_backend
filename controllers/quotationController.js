// controllers/quotationController.js
const asyncHandler = require('express-async-handler');
const Quotation = require('../models/Quotation');

// ────────────────────────────────────────────────
// CREATE new quotation (accepts ALL fields from frontend)
// ────────────────────────────────────────────────
const createQuotation = asyncHandler(async (req, res) => {
  const { customAlphabet } = await import('nanoid');
  const generateProposalId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10);

  const quotationData = req.body;

  // Validation (keep your existing checks)
  if (!quotationData.customerName || !quotationData.customerEmail || !quotationData.siteAddress) {
    res.status(400);
    throw new Error('Missing required fields: customerName, customerEmail, siteAddress');
  }

  if (!Array.isArray(quotationData.jobType) || quotationData.jobType.length === 0) {
    res.status(400);
    throw new Error('jobType must be a non-empty array');
  }

  if (!Array.isArray(quotationData.items) || quotationData.items.length === 0) {
    res.status(400);
    throw new Error('items must be a non-empty array');
  }

  const proposalId = generateProposalId();

  // Explicitly preserve nested/complex fields
  const safeData = {
    ...quotationData,
    // Force numbers where needed
    subtotal: Number(quotationData.subtotal) || 0,
    vatRate: Number(quotationData.vatRate) || 20,
    vatAmount: Number(quotationData.vatAmount) || 0,
    totalAmount: Number(quotationData.totalAmount) || 0,
    // Preserve nested objects exactly as sent (prevents Mongoose coercion issues)
    tenderInclusions: quotationData.tenderInclusions || {},
    scopeTable: quotationData.scopeTable || {},
    airSourceHeatPumps: quotationData.airSourceHeatPumps || {},
    nonContestableCharges: quotationData.nonContestableCharges || {},
    pocDocumentation: quotationData.pocDocumentation || {},
    // Add any other nested fields if needed
  };

  const quotation = await Quotation.create({
    proposalId,
    ...safeData,
    createdBy: req.user.id,
    status: 'draft',
  });

  const publicLink = `${process.env.FRONTEND_PUBLIC_URL || 'http://localhost:3000'}/proposal/${proposalId}`;

  res.status(201).json({
    success: true,
    data: quotation,
    publicLink,
    message: 'Quotation created. Copy the link and send it manually via email.',
  });
});

// UPDATE (similar fix)
const updateQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);

  if (!quotation) {
    res.status(404);
    throw new Error('Quotation not found');
  }

  if (quotation.createdBy.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to update this quotation');
  }

  const { proposalId, createdBy, status, ...updateData } = req.body;

  // Explicitly preserve nested fields
  const safeUpdate = {
    ...updateData,
    tenderInclusions: updateData.tenderInclusions || quotation.tenderInclusions || {},
    scopeTable: updateData.scopeTable || quotation.scopeTable || {},
    airSourceHeatPumps: updateData.airSourceHeatPumps || quotation.airSourceHeatPumps || {},
    nonContestableCharges: updateData.nonContestableCharges || quotation.nonContestableCharges || {},
    pocDocumentation: updateData.pocDocumentation || quotation.pocDocumentation || {},
    // etc.
  };

  const updated = await Quotation.findByIdAndUpdate(
    req.params.id,
    { ...safeUpdate, updatedAt: Date.now() },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    data: updated,
    publicLink: `${process.env.FRONTEND_PUBLIC_URL || 'http://localhost:3000'}/proposal/${updated.proposalId}`,
  });
});

// ────────────────────────────────────────────────
// GET all quotations created by logged-in user
// ────────────────────────────────────────────────
const getQuotations = asyncHandler(async (req, res) => {
  const quotations = await Quotation.find({ createdBy: req.user.id })
    .sort({ createdAt: -1 })
    .select('-__v -updatedAt');

  res.json({
    success: true,
    count: quotations.length,
    data: quotations,
  });
});

// ────────────────────────────────────────────────
// GET single quotation by MongoDB _id (for admin edit/view)
// ────────────────────────────────────────────────
const getQuotationById = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);

  if (!quotation) {
    res.status(404);
    throw new Error('Quotation not found');
  }

  if (quotation.createdBy.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to access this quotation');
  }

  res.json({
    success: true,
    data: quotation,
  });
});

// ────────────────────────────────────────────────
// UPDATE quotation
// ────────────────────────────────────────────────
// const updateQuotation = asyncHandler(async (req, res) => {
//   const quotation = await Quotation.findById(req.params.id);

//   if (!quotation) {
//     res.status(404);
//     throw new Error('Quotation not found');
//   }

//   if (quotation.createdBy.toString() !== req.user.id) {
//     res.status(403);
//     throw new Error('Not authorized to update this quotation');
//   }

//   // Prevent changing critical fields
//   const { proposalId, createdBy, status, ...updateData } = req.body;

//   const updated = await Quotation.findByIdAndUpdate(
//     req.params.id,
//     { ...updateData, updatedAt: Date.now() },
//     { new: true, runValidators: true }
//   );

//   res.json({
//     success: true,
//     data: updated,
//     publicLink: `${process.env.FRONTEND_PUBLIC_URL || 'http://localhost:3000'}/proposal/${updated.proposalId}`,
//   });
// });

// ────────────────────────────────────────────────
// DELETE quotation
// ────────────────────────────────────────────────
const deleteQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);

  if (!quotation) {
    res.status(404);
    throw new Error('Quotation not found');
  }

  if (quotation.createdBy.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized');
  }

  await quotation.deleteOne();

  res.json({
    success: true,
    message: 'Quotation deleted successfully',
  });
});

// ────────────────────────────────────────────────
// MARK AS SENT (admin confirms they sent the link manually)
// ────────────────────────────────────────────────
const sendQuotation = asyncHandler(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);

  if (!quotation) {
    res.status(404);
    throw new Error('Quotation not found');
  }

  if (quotation.createdBy.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized');
  }

  if (quotation.status === 'sent' || quotation.status === 'accepted') {
    res.status(400);
    throw new Error('Quotation has already been sent or accepted');
  }

  quotation.status = 'sent';
  quotation.updatedAt = Date.now();
  await quotation.save();

  const publicLink = `${process.env.FRONTEND_PUBLIC_URL || 'http://localhost:3000'}/proposal/${quotation.proposalId}`;

  res.json({
    success: true,
    message: 'Quotation marked as sent. Copy the link below and send it manually via your email.',
    publicLink,
    proposalId: quotation.proposalId,
  });
});

module.exports = {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
  sendQuotation,
};