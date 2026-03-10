// controllers/acceptanceController.js
const asyncHandler = require('express-async-handler');
const Acceptance = require('../models/Acceptance');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const submitAcceptance = asyncHandler(async (req, res) => {
  const {
    proposalId,
    quotationRef,
    name,
    signature,
    positionHeld,
    contactNumbers,
    email,
    anticipatedStartDate,
    siteContact,
  } = req.body;

  if (!proposalId || !name || !signature || !email || !anticipatedStartDate) {
    res.status(400);
    throw new Error('Missing required fields');
  }

  const acceptance = await Acceptance.create({
    proposalId,
    quotationRef,
    name,
    signature,
    positionHeld,
    contactNumbers,
    email,
    anticipatedStartDate,
    siteContact,
  });

  // Email to client
  const clientEmail = {
    to: email,
    from: process.env.FROM_EMAIL || 'admin@airutilities.co.uk',
    subject: 'Your Quotation Acceptance Confirmation',
    text: `Dear ${name},\n\nThank you for accepting our quotation (Ref: ${quotationRef || proposalId}).\n\nWe will contact you soon.\n\nBest regards,\nAir Utilities`,
    html: `<h2>Thank you, ${name}!</h2><p>Your acceptance for quotation <strong>${quotationRef || proposalId}</strong> has been received.</p><p>We will be in touch shortly.</p>`,
  };

  // Email to admin
  const adminEmail = {
    to: process.env.ADMIN_EMAIL || 'admin@airutilities.co.uk',
    from: process.env.FROM_EMAIL || 'admin@airutilities.co.uk',
    subject: `New Acceptance - Proposal ${proposalId}`,
    text: `New acceptance:\nProposal: ${proposalId}\nName: ${name}\nEmail: ${email}\nStart Date: ${anticipatedStartDate}`,
    html: `<h2>New Acceptance Received</h2><p>Proposal: ${proposalId}</p><p>Name: ${name}</p><p>Email: ${email}</p>`,
  };

  try {
    await sgMail.send([clientEmail, adminEmail]);
  } catch (err) {
    console.error('Email failed:', err);
  }

  res.status(201).json({ success: true, data: acceptance });
});

const getAllAcceptances = asyncHandler(async (req, res) => {
  const acceptances = await Acceptance.find().sort({ acceptedAt: -1 });
  res.json({ success: true, data: acceptances });
});

module.exports = {
  submitAcceptance,
  getAllAcceptances,
};