const asyncHandler = require('express-async-handler');
const Quotation = require('../models/Quotation');

// ────────────────────────────────────────────────
// CREATE new quotation
// ────────────────────────────────────────────────
const createQuotation = asyncHandler(async (req, res) => {
  // Dynamic import of nanoid (ESM-only package)
  const { customAlphabet } = await import('nanoid');
  const generateProposalId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10);

  const {
    customerName,
    customerEmail,
    customerPhone,
    siteAddress,                  // ← NEW required field (replaced projectAddress)
    jobType,                      // ← NEW array field
    projectTitle = '',
    projectDescription = '',
    items,
    subtotal,
    vatRate = 20,
    vatAmount,
    totalAmount,
    exclusions = [],
    paymentTerms = '',
    hourlyRates = [],
    validUntil,
  } = req.body;

  // Updated required fields validation
  if (
    !customerName ||
    !customerEmail ||
    !siteAddress ||
    !Array.isArray(jobType) || jobType.length === 0 ||
    !Array.isArray(items) || items.length === 0 ||
    totalAmount == null                    // allow 0, but must be defined
  ) {
    res.status(400);
    throw new Error(
      'Missing required fields: customerName, customerEmail, siteAddress, jobType[], items[], totalAmount'
    );
  }

  const proposalId = generateProposalId();

  const quotation = await Quotation.create({
    proposalId,
    customerName,
    customerEmail,
    customerPhone: customerPhone || '',
    siteAddress,                   // ← used here
    jobType,                       // ← used here
    projectTitle,
    projectDescription,
    items: items.map(item => ({
      ...item,
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    })),
    subtotal: Number(subtotal),
    vatRate: Number(vatRate),
    vatAmount: Number(vatAmount),
    totalAmount: Number(totalAmount),
    exclusions,
    paymentTerms,
    hourlyRates,
    validUntil: validUntil ? new Date(validUntil) : undefined,
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

  // Only creator can access
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
    message: 'Quotation marked as sent. Copy the link below and send it manually via your email (one.com webmail / Outlook / etc.)',
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