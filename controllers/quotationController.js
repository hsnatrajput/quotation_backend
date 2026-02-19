// controllers/quotationController.js
const asyncHandler = require('express-async-handler');
const Quotation = require('../models/Quotation');

// ────────────────────────────────────────────────
// CREATE new quotation (accepts ALL fields from frontend)
// ────────────────────────────────────────────────
const createQuotation = asyncHandler(async (req, res) => {
  // Dynamic import of nanoid (ESM-only package)
  const { customAlphabet } = await import('nanoid');
  const generateProposalId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10);

  // Get ALL data from request body - no destructuring limits
  const quotationData = req.body;

  // Basic required field validation
  if (!quotationData.customerName || !quotationData.customerEmail || !quotationData.siteAddress) {
    res.status(400);
    throw new Error('Missing required fields: customerName, customerEmail, siteAddress');
  }

  if (!Array.isArray(quotationData.jobType) || quotationData.jobType.length === 0) {
    res.status(400);
    throw new Error('jobType must be a non-empty array (Electric, Gas, and/or Water)');
  }

  if (!Array.isArray(quotationData.items) || quotationData.items.length === 0) {
    res.status(400);
    throw new Error('items must be a non-empty array');
  }

  const proposalId = generateProposalId();

  // Create quotation with ALL sent fields + required defaults
  const quotation = await Quotation.create({
    proposalId,
    ...quotationData,                    // Spread everything from frontend
    createdBy: req.user.id,
    status: 'draft',
    // Ensure numbers are correctly typed (Mongoose will coerce, but safer here)
    subtotal: Number(quotationData.subtotal) || 0,
    vatRate: Number(quotationData.vatRate) || 20,
    vatAmount: Number(quotationData.vatAmount) || 0,
    totalAmount: Number(quotationData.totalAmount) || 0,
  });

  const publicLink = `${process.env.FRONTEND_PUBLIC_URL || 'http://localhost:3000'}/proposal/${proposalId}`;

  res.status(201).json({
    success: true,
    data: quotation,
    publicLink,
    message: 'Quotation created. Copy the link and send it manually via email.',
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

  // Prevent changing critical fields
  const { proposalId, createdBy, status, ...updateData } = req.body;

  const updated = await Quotation.findByIdAndUpdate(
    req.params.id,
    { ...updateData, updatedAt: Date.now() },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    data: updated,
    publicLink: `${process.env.FRONTEND_PUBLIC_URL || 'http://localhost:3000'}/proposal/${updated.proposalId}`,
  });
});

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