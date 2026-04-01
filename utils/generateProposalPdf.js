// utils/generateProposalPDF.js
const puppeteer = require('puppeteer');

const generateProposalPDF = async (quotation) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1400 });
    await page.emulateMediaType('screen');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Quotation - ${quotation.proposalId}</title>
        <style>
          body { 
            font-family: Arial, Helvetica, sans-serif; 
            font-size: 11.5pt; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 40px 60px;
          }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { font-size: 18pt; margin: 0; }
          .header p { margin: 5px 0; }
          h2 { 
            font-size: 14pt; 
            border-bottom: 2px solid #000; 
            padding-bottom: 6px; 
            margin-top: 40px; 
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
          }
          th, td { 
            border: 1px solid #666; 
            padding: 10px; 
            text-align: left; 
            vertical-align: top;
          }
          th { background-color: #f4f4f4; font-weight: bold; }
          .right { text-align: right; }
          .total { font-size: 13pt; font-weight: bold; margin-top: 20px; text-align: right; }
          .footer { 
            margin-top: 60px; 
            text-align: center; 
            font-size: 10pt; 
            color: #555; 
          }
          .page-break { page-break-before: always; }
        </style>
      </head>
      <body>

        <div class="header">
          <h1>Air Utilities Ltd</h1>
          <p>34 Meadow Mill, Water Street, Stockport, SK1 2BU</p>
          <p>Date: ${new Date().toLocaleDateString('en-GB')}</p>
          <p><strong>Quotation Reference:</strong> ${quotation.proposalId || 'N/A'}</p>
        </div>

        <p><strong>NAME AND ADDRESS OF CUSTOMER:</strong> ${quotation.customerName || 'N/A'}</p>
        <p><strong>Development Address:</strong> ${quotation.siteAddress || 'N/A'}</p>
        <p><strong>Number of plots:</strong> ${quotation.numberOfPlots || 'N/A'}</p>
        <p><strong>Scope:</strong> ${quotation.jobType ? quotation.jobType.join(', ') : 'N/A'}</p>

        <p>Thank you for allowing Air Utilities Ltd to quote for these works. We have the pleasure of submitting this quotation proposal for the design, installation, and connection of new utility infrastructure on the above development.</p>

        <p><strong>Total Price:</strong> £${Number(quotation.totalAmount || 0).toLocaleString('en-GB')} + ${quotation.vatRate || 20}% VAT</p>
        <p>This quotation is valid for 30 days.</p>

        <p>We trust this quotation is of interest. If you require any further information, please contact us. To accept this quotation please sign and return the attached Acceptance Form.</p>

        <p>Yours Sincerely<br>
        For and on behalf of Air Utilities Ltd (AU)<br>
        Muhammad Khan<br>
        Director<br>
        Landline: 0330 058 4001</p>

        <h2>Section 1 – Scope of works and tender overview</h2>
        <p>This quotation has been prepared using the following drawing: [Drawing Reference]</p>

        <h2>QUOTATION SUMMARY</h2>
        <table>
          <thead>
            <tr><th>Description</th><th class="right">Amount (£)</th></tr>
          </thead>
          <tbody>
            ${(quotation.items || []).map(item => `
              <tr>
                <td>${item.serviceName || item.description || item.name || 'Service'}</td>
                <td class="right">£${Number(item.totalPrice || item.price || 0).toLocaleString('en-GB')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="total">
          Subtotal: £${Number(quotation.subtotal || 0).toLocaleString('en-GB')}<br>
          VAT (${quotation.vatRate || 20}%): £${Number(quotation.vatAmount || 0).toLocaleString('en-GB')}<br>
          <strong>Total Due: £${Number(quotation.totalAmount || 0).toLocaleString('en-GB')}</strong>
        </div>

        <h2>DELIVERY STANDARDS</h2>
        <p><strong>Design Period:</strong> AU require 8-10 weeks from receipt of the required documentation and upfront payment to mobilisation to site.</p>
        <p><strong>Non-contestable works:</strong> These works are completed by the host company...</p>
        <p><strong>Substations:</strong> Substations can have a lead time of up to 18 weeks...</p>
        <!-- Add more delivery standards as needed -->

        <div class="footer">
          Air Utilities Ltd • 34 Meadow Mill, Water Street, Stockport, SK1 2BU<br>
          Proposal ID: ${quotation.proposalId} | Generated on ${new Date().toLocaleDateString('en-GB')}
        </div>

      </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: false,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    });

    console.log(`✅ Clean PDF generated for proposal ${quotation.proposalId}`);
    return pdfBuffer;

  } catch (error) {
    console.error('PDF generation failed:', error.message);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
};

module.exports = { generateProposalPDF };