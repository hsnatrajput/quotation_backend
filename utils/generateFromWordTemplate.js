// utils/generateFromWordTemplate.js
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

const generateQuotationFromTemplate = async (quotation, acceptanceData = {}) => {
  try {
    const templatePath = path.resolve(__dirname, '../templates/quotation-template.docx');

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`);
    }

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Data for template
    const data = {
      proposalId: quotation.proposalId || 'N/A',
      quotationDate: new Date().toLocaleDateString('en-GB'),
      customerName: quotation.customerName || 'Valued Customer',
      siteAddress: quotation.siteAddress || 'N/A',
      numberOfPlots: quotation.numberOfPlots || 'N/A',
      jobType: quotation.jobType ? quotation.jobType.join(' + ') : 'Utility Works',
      totalAmount: Number(quotation.totalAmount || 0).toLocaleString('en-GB'),
      vatRate: quotation.vatRate || 20,
      vatAmount: Number(quotation.vatAmount || 0).toLocaleString('en-GB'),
      subtotal: Number(quotation.subtotal || 0).toLocaleString('en-GB'),

      // Acceptance Form Data (from user input)
      acceptanceName: acceptanceData.name || '',
      acceptancePosition: acceptanceData.positionHeld || '',
      acceptanceContactNumbers: acceptanceData.contactNumbers || '',
      acceptanceEmail: acceptanceData.email || '',
      acceptanceAnticipatedStartDate: acceptanceData.anticipatedStartDate || '',
      acceptanceSiteContact: acceptanceData.siteContact || '',
    };

    doc.render(data);

    const docxBuffer = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    console.log(`✅ Word template filled successfully for proposal ${quotation.proposalId}`);
    return docxBuffer;

  } catch (error) {
    console.error('❌ Error filling Word template:', error.message);
    throw error;
  }
};

module.exports = { generateQuotationFromTemplate };
