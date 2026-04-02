// controllers/acceptanceController.js
const asyncHandler = require('express-async-handler');
const Acceptance = require('../models/Acceptance');
const { generateQuotationFromTemplate } = require('../utils/generateFromWordTemplate');

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
    acceptedAt: new Date(),
  });

  const Quotation = require('../models/Quotation');
  const quotation = await Quotation.findOne({ proposalId });

  const transporter = req.app.get('emailTransporter');

  let attachmentBuffer = null;
  try {
    if (quotation) {
      attachmentBuffer = await generateQuotationFromTemplate(quotation, {
        name,
        signature,                    // ← Added signature
        positionHeld,
        contactNumbers,
        email,
        anticipatedStartDate,
        siteContact,
      });
    }
  } catch (err) {
    console.error('❌ Template generation failed:'.red, err.message);
  }

  const clientMailOptions = {
    from: `"Air Utilities" <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: `Thank You – Quotation Accepted (Ref: ${quotationRef || proposalId})`,
    html: `<h2>Thank You, ${name}!</h2><p>Your acceptance has been received. Please find the filled quotation attached.</p>`,
    attachments: attachmentBuffer ? [{
      filename: `Quotation_${proposalId}.docx`,
      content: attachmentBuffer,
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }] : []
  };

  const adminMailOptions = {
    from: `"Air Utilities System" <${process.env.FROM_EMAIL}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `New Acceptance – ${proposalId}`,
    html: `<h2>New Acceptance Received</h2><p>Proposal: ${proposalId}<br>Name: ${name}</p>`,
    attachments: attachmentBuffer ? [{
      filename: `Quotation_${proposalId}.docx`,
      content: attachmentBuffer,
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }] : []
  };

  try {
    await Promise.all([
      transporter.sendMail(clientMailOptions),
      transporter.sendMail(adminMailOptions)
    ]);
    console.log(`✅ Emails sent with filled quotation for ${proposalId}`);
  } catch (err) {
    console.error('❌ Email sending failed:'.red, err.message);
  }

  res.status(201).json({ 
    success: true, 
    message: 'Acceptance submitted successfully',
    data: acceptance 
  });
});

const getAllAcceptances = asyncHandler(async (req, res) => {
  const acceptances = await Acceptance.find().sort({ acceptedAt: -1 });
  res.json({ success: true, data: acceptances });
});

module.exports = {
  submitAcceptance,
  getAllAcceptances,
};