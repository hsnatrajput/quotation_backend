// utils/generateFromWordTemplate.js
const fs = require('fs');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

const generateQuotationFromTemplate = async (quotation, acceptance = {}) => {
  try {
    const templatePath = path.resolve(__dirname, '../templates/quotation-template.docx');

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found at: ${templatePath}`);
    }

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    const data = {
      // Basic Quotation Info
      quotationDate: new Date().toLocaleDateString('en-GB'),
      proposalId: quotation.proposalId || 'N/A',
      customerName: quotation.customerName || 'N/A',
      siteAddress: quotation.siteAddress || 'N/A',
      developmentAddress: quotation.developmentAddress || quotation.siteAddress || 'N/A',
      numberOfPlots: quotation.scopeTable?.totalPlots || 'N/A',
      jobType: quotation.jobType ? quotation.jobType.join(' + ') : 'N/A',

      // Financial
      totalAmount: Number(quotation.totalAmount || 0).toLocaleString('en-GB'),
      vatRate: quotation.vatRate || 20,
      vatAmount: Number(quotation.vatAmount || 0).toLocaleString('en-GB'),
      subtotal: Number(quotation.subtotal || 0).toLocaleString('en-GB'),

      // Payment Total Line (Clean formatted)
      paymentTotal: `£${Number(quotation.totalAmount || 0).toLocaleString('en-GB')} Inc ${quotation.vatRate || 20}% VAT`,

      // Scope Table
      drawing: quotation.scopeTable?.drawing || 'N/A',
      totalPlots: quotation.scopeTable?.totalPlots || 'N/A',
      futurePhaseAllowance: quotation.scopeTable?.futurePhaseAllowance || 'N/A',
      totalLoadAllowance: quotation.scopeTable?.totalLoadAllowance || 'N/A',
      heatingType: quotation.scopeTable?.heatingType || 'N/A',
      plotConnections: quotation.scopeTable?.plotConnections || 'N/A',
      meters: quotation.scopeTable?.meters || 'N/A',
      electricConnectionVoltage: quotation.scopeTable?.electricConnectionVoltage || 'N/A',
      waterMainType: quotation.scopeTable?.waterMainType || 'N/A',
      waterWasteSustainability: quotation.scopeTable?.waterWasteSustainability || 'N/A',
      mainsConnections: quotation.scopeTable?.mainsConnections || 'N/A',

      // Air Source Heat Pumps
      ashpNumPlots: quotation.airSourceHeatPumps?.numPlots || 'N/A',
      ashpPlotNumbers: quotation.airSourceHeatPumps?.plotNumbers || 'N/A',
      ashpDataSheetProvided: quotation.airSourceHeatPumps?.dataSheetProvided ? 'Yes' : 'No',
      ashpPumpModel: quotation.airSourceHeatPumps?.pumpModel || 'N/A',
      ashpLoadPerPlot: quotation.airSourceHeatPumps?.ashpLoadAllowancePerPlot || 'N/A',

      // Non-Contestable Charges
      electricPOC: quotation.nonContestableCharges?.electricPOC || '0',
      waterPOCIncumbent: quotation.nonContestableCharges?.waterPOCIncumbent || '0',
      waterInfraFees: quotation.nonContestableCharges?.waterInfraFees || '0',
      wasteWaterInfraFees: quotation.nonContestableCharges?.wasteWaterInfraFees || '0',
      environmentalComponent: quotation.nonContestableCharges?.environmentalComponent || '0',
      meterAdminCharges: quotation.nonContestableCharges?.meterAdminCharges || '0',
      uuApprovalFee: quotation.nonContestableCharges?.uuApprovalFee || '0',
      councilCharges: quotation.nonContestableCharges?.councilCharges || '0',

      // POC Documentation
      waterPocRef: quotation.pocDocumentation?.waterPocRef || 'N/A',
      waterPocExpiry: quotation.pocDocumentation?.waterPocExpiry || 'N/A',
      mainsElectricPocRef: quotation.pocDocumentation?.mainsElectricPocRef || 'N/A',
      mainsElectricPocExpiry: quotation.pocDocumentation?.mainsElectricPocExpiry || 'N/A',

      // Acceptance Form Data (from user who accepted)
      acceptanceName: acceptance.name || '',
      acceptancePosition: acceptance.positionHeld || '',
      acceptanceContactNumbers: acceptance.contactNumbers || '',
      acceptanceEmail: acceptance.email || '',
      acceptanceAnticipatedStartDate: acceptance.anticipatedStartDate 
        ? new Date(acceptance.anticipatedStartDate).toLocaleDateString('en-GB') 
        : '',
      acceptanceSiteContact: acceptance.siteContact || '',
      signature: acceptance.signature || '',           // ← Added for signature
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