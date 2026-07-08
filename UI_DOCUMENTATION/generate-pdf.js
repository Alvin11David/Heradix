#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function generatePrintableHTML() {
  const htmlPath = path.join(__dirname, 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  
  const printStyled = htmlContent.replace(
    '</style>',
    `
        @media print {
            body {
                font-size: 11px;
                line-height: 1.4;
            }
            .container {
                max-width: 100%;
                padding: 0;
            }
            header {
                page-break-after: always;
            }
            .section {
                page-break-inside: avoid;
                margin-bottom: 30px;
            }
            @page {
                margin: 0.5in;
            }
        }
    </style>`
  );
  
  const outputPath = path.join(__dirname, 'index-printable.html');
  fs.writeFileSync(outputPath, printStyled);
  
  return outputPath;
}

function generatePDFInstructions() {
  const instructions = `
# How to Generate PDF from HTML

## Option 1: Browser Print Dialog (Easiest)

1. Open \`index.html\` in your browser:
   \`\`\`bash
   open UI_DOCUMENTATION/index.html
   # or
   open UI_DOCUMENTATION/index-printable.html
   \`\`\`

2. Press \`Cmd+P\` (Mac) or \`Ctrl+P\` (Windows/Linux)

3. Configure print settings:
   - Destination: "Save as PDF"
   - Paper size: "A4"
   - Margins: "Normal"
   - Background graphics: ON
   - More settings:
     - Scaling: 100%
     - Paper type: Standard

4. Click "Save" and name the file:
   \`Amarapix_UI_Documentation.pdf\`

## Option 2: Command Line (Node.js - Puppeteer)

### Install Puppeteer
\`\`\`bash
npm install --save-dev puppeteer
\`\`\`

### Run PDF generation
\`\`\`bash
node scripts/generate-pdf.js
\`\`\`

## Option 3: Using wkhtmltopdf (Advanced)

### Install wkhtmltopdf
\`\`\`bash
# macOS
brew install --cask wkhtmltopdf

# Ubuntu/Debian
sudo apt-get install wkhtmltopdf

# CentOS/RHEL
sudo yum install wkhtmltopdf
\`\`\`

### Generate PDF
\`\`\`bash
wkhtmltopdf UI_DOCUMENTATION/index-printable.html Amarapix_UI_Documentation.pdf
\`\`\`

## Option 4: Online Conversion

1. Upload \`index.html\` to: https://convertio.co/html-pdf/
2. Download the PDF

## Verification Checklist

After generating PDF:
- [ ] File size is reasonable (< 50MB)
- [ ] All pages are included
- [ ] Images are visible
- [ ] Text is readable
- [ ] Colors are preserved
- [ ] Links work in PDF (if supported)
- [ ] Table of contents is accurate

## PDF File Details

- **Filename:** Amarapix_UI_Documentation.pdf
- **Location:** UI_DOCUMENTATION/ folder
- **Recommended Size:** Keep under 20MB for easy sharing
- **Format:** A4 (210 × 297 mm)
- **Orientation:** Portrait

## Sharing the PDF

1. Save PDF in UI_DOCUMENTATION folder
2. Commit to git:
   \`\`\`bash
   git add UI_DOCUMENTATION/Amarapix_UI_Documentation.pdf
   git commit -m "docs: add UI documentation PDF"
   \`\`\`

3. Share via:
   - Email attachment
   - Google Drive
   - Slack
   - GitHub releases
   - Project wiki

## PDF Contents

The generated PDF includes:
- ✓ Project overview
- ✓ All 10 user journeys with detailed flows
- ✓ Route specifications
- ✓ Component structure
- ✓ Shared components list
- ✓ Feature components by section
- ✓ Theme and styling information
- ✓ Color palette
- ✓ Typography scales
- ✓ All API endpoints
- ✓ Route guards documentation
- ✓ Key features list
- ✓ Getting started guide for backend developers

## Troubleshooting

### PDF is blank
- Enable "Background graphics" in print settings
- Use a Chromium-based browser (Chrome, Edge, Brave)

### Images not showing
- Make sure image paths are correct
- Use absolute paths in HTML

### File too large
- Disable background colors in print preview
- Reduce image quality

### Text is too small
- Adjust zoom level in print preview (120-150%)
- Change Scaling to "Fit to page width"

## Automation

To generate PDF automatically on every documentation update:

\`\`\`bash
# In package.json
{
  "scripts": {
    "docs": "python3 generate_ui_docs.py && node UI_DOCUMENTATION/export-to-figma.js && echo 'Now open index.html and save as PDF'",
    "docs:pdf": "npm run docs && echo 'Please save index-printable.html as PDF using browser print dialog'"
  }
}
\`\`\`

Run with:
\`\`\`bash
npm run docs:pdf
\`\`\`

---

**Recommended Approach:** Use Option 1 (Browser Print) for the best quality and control.
`;

  const outputPath = path.join(__dirname, 'PDF_GENERATION_GUIDE.md');
  fs.writeFileSync(outputPath, instructions);
  
  return outputPath;
}

function main() {
  console.log('\n📄 Preparing PDF Export...\n');
  
  const htmlPath = generatePrintableHTML();
  console.log(`✓ Printable HTML created: ${htmlPath}`);
  
  const guideOath = generatePDFInstructions();
  console.log(`✓ PDF generation guide created: ${guideOath}`);
  
  console.log('\n✅ PDF export preparation complete!\n');
  console.log('📋 Next Steps:');
  console.log('   1. Open: UI_DOCUMENTATION/index-printable.html');
  console.log('   2. Press: Cmd+P (Mac) or Ctrl+P (Windows/Linux)');
  console.log('   3. Click: "Save as PDF"');
  console.log('   4. Name: Amarapix_UI_Documentation.pdf');
  console.log('   5. Location: UI_DOCUMENTATION/');
  console.log('\n💡 Or follow PDF_GENERATION_GUIDE.md for automation');
  console.log('\n');
}

if (require.main === module) {
  main();
}

module.exports = {
  generatePrintableHTML,
  generatePDFInstructions
};
