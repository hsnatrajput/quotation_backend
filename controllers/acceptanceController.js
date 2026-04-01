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

  // 1. Save acceptance
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

  // 2. Fetch quotation data
  const Quotation = require('../models/Quotation');
  const quotation = await Quotation.findOne({ proposalId });

  if (!quotation) {
    console.warn(`Quotation ${proposalId} not found`);
  }

  const transporter = req.app.get('emailTransporter');

  // 3. Generate filled Word document
  let attachmentBuffer = null;
  try {
    if (quotation) {
      attachmentBuffer = await generateQuotationFromTemplate(quotation, {
        name,
        positionHeld,
        contactNumbers,
        email,
        anticipatedStartDate,
        siteContact,
      });
      console.log(`✅ Word template filled for proposal ${proposalId}`);
    }
  } catch (err) {
    console.error('❌ Template generation failed:'.red, err.message);
  }

  // ────── Email to Customer ──────
  const clientMailOptions = {
    from: `"Air Utilities" <${process.env.FROM_EMAIL}>`,
    to: email,
    subject: `Thank You – Quotation Accepted (Ref: ${quotationRef || proposalId})`,
    text: `Dear ${name},\n\nThank you for accepting our quotation.\nWe will contact you shortly.\n\nBest regards,\nAir Utilities Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 30px; background: #f9f9f9; border-radius: 12px;">
        <h2 style="color: #1e40af;">Thank You, ${name}!</h2>
        <p>We have successfully received your acceptance for the quotation.</p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <p><strong>Proposal ID:</strong> ${proposalId}</p>
          <p><strong>Reference:</strong> ${quotationRef || 'N/A'}</p>
          <p><strong>Anticipated Start Date:</strong> ${anticipatedStartDate}</p>
        </div>
        <p>Our team will review the details and contact you soon.</p>
        <p style="margin-top: 30px; color: #555;">
          Best regards,<br>
          <strong>Air Utilities Team</strong><br>
          admin@airutilities.co.uk
        </p>
      </div>
    `,
    attachments: attachmentBuffer ? [{
      filename: `Quotation_${proposalId}.docx`,        // You can change to .pdf later
      content: attachmentBuffer,
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }] : []
  };

  // ────── Email to Admin ──────
  const adminMailOptions = {
    from: `"Air Utilities System" <${process.env.FROM_EMAIL}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `New Quotation Acceptance – ${proposalId}`,
    text: `New acceptance received:\nProposal: ${proposalId}\nName: ${name}\nEmail: ${email}`,
    html: `
      <h2>New Acceptance Received</h2>
      <p><strong>Proposal ID:</strong> ${proposalId}</p>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
    `,
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
    console.log(`✅ Emails sent with filled quotation document for proposal ${proposalId}`);
  } catch (err) {
    console.error('❌ Failed to send email:'.red, err.message);
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