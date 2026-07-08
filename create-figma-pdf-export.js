#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

let PDFDocument;
try {
  PDFDocument = require('pdfkit');
} catch (e) {
  console.log('⚠️  pdfkit not available, will create HTML version for PDF conversion');
}

class FigmaExporter {
  constructor() {
    this.outputDir = path.join(__dirname, 'figma-exports');
    this.screenshots = [];
  }

  async init() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    console.log(`📁 Output directory: ${this.outputDir}`);
  }

  createSampleComponents() {
    const components = [
      {
        name: 'Header Component',
        description: 'Main navigation header with logo and menu',
        color: '#FF6B6B'
      },
      {
        name: 'Asset Card Component',
        description: 'Card displaying individual assets with image and metadata',
        color: '#4ECDC4'
      },
      {
        name: 'Collection Card',
        description: 'Card for displaying collection of posters/assets',
        color: '#45B7D1'
      },
      {
        name: 'Pagination Component',
        description: 'Navigation component for multi-page results',
        color: '#96CEB4'
      },
      {
        name: 'Search Bar',
        description: 'Search input component with filters',
        color: '#FFEAA7'
      },
      {
        name: 'Pricing Card',
        description: 'Subscription pricing tier card',
        color: '#DDA15E'
      },
      {
        name: 'Modal Dialog',
        description: 'Reusable modal component for forms and confirmations',
        color: '#BC6C25'
      },
      {
        name: 'Footer Component',
        description: 'Site footer with links and information',
        color: '#9D84B7'
      }
    ];

    return components;
  }

  generateFigmaJSON() {
    console.log('\n🎨 Generating Figma JSON structure...');
    
    const components = this.createSampleComponents();
    
    const figmaStructure = {
      document: {
        id: 'document-1',
        name: 'Amarapix UI Design System',
        type: 'DOCUMENT',
        children: components.map((comp, idx) => this.createComponentFrame(comp, idx))
      },
      version: '1.0',
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        creator: 'Amarapix Design System'
      }
    };

    const figmaPath = path.join(this.outputDir, 'Amarapix-DesignSystem.json');
    fs.writeFileSync(figmaPath, JSON.stringify(figmaStructure, null, 2));
    
    console.log(`  ✓ Figma JSON created: ${path.basename(figmaPath)}`);
    return figmaStructure;
  }

  createComponentFrame(component, index) {
    return {
      id: `component-${index}`,
      name: component.name,
      type: 'FRAME',
      x: 0,
      y: index * 1000,
      width: 1440,
      height: 800,
      background: '#FFFFFF',
      children: [
        {
          id: `bg-${index}`,
          name: 'Background',
          type: 'RECTANGLE',
          x: 0,
          y: 0,
          width: 1440,
          height: 800,
          fills: [{ type: 'SOLID', color: component.color, opacity: 0.1 }]
        },
        {
          id: `title-${index}`,
          name: 'Title',
          type: 'TEXT',
          x: 40,
          y: 40,
          width: 1360,
          height: 60,
          text: component.name,
          fontSize: 32,
          fontWeight: 'bold',
          fontFamily: 'Inter'
        },
        {
          id: `desc-${index}`,
          name: 'Description',
          type: 'TEXT',
          x: 40,
          y: 110,
          width: 1360,
          height: 40,
          text: component.description,
          fontSize: 14,
          fontWeight: 'regular',
          fontFamily: 'Inter',
          color: '#666666'
        }
      ]
    };
  }

  generateHTMLPreview() {
    console.log('\n🌐 Generating HTML preview...');
    
    const components = this.createSampleComponents();
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Amarapix UI Design System</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      background: #f5f5f5;
      color: #333;
      line-height: 1.6;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 60px 40px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 48px;
      margin-bottom: 10px;
    }
    
    .header p {
      font-size: 18px;
      opacity: 0.9;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    
    .components-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 30px;
      margin-top: 40px;
    }
    
    .component-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.3s, box-shadow 0.3s;
    }
    
    .component-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }
    
    .component-preview {
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      color: #666;
      font-weight: 500;
    }
    
    .component-content {
      padding: 24px;
    }
    
    .component-name {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
      color: #222;
    }
    
    .component-description {
      font-size: 14px;
      color: #666;
      line-height: 1.5;
    }
    
    .stats {
      background: white;
      padding: 40px;
      border-radius: 12px;
      margin-bottom: 40px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .stat-item h3 {
      font-size: 24px;
      color: #667eea;
      margin-bottom: 8px;
    }
    
    .stat-item p {
      font-size: 14px;
      color: #666;
    }
    
    .print-section {
      page-break-after: always;
      margin-bottom: 40px;
    }
    
    @media print {
      .header {
        background: #667eea;
      }
      
      body {
        background: white;
      }
      
      .print-section {
        page-break-after: always;
      }
    }
    
    .section-title {
      font-size: 28px;
      font-weight: 700;
      margin: 40px 0 20px 0;
      color: #222;
      border-bottom: 3px solid #667eea;
      padding-bottom: 10px;
    }
    
    .footer {
      background: #222;
      color: white;
      padding: 40px;
      text-align: center;
      margin-top: 60px;
    }
    
    .footer p {
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎨 Amarapix UI Design System</h1>
    <p>Complete component library and design documentation</p>
  </div>
  
  <div class="container">
    <div class="stats">
      <div class="stat-item">
        <h3>${this.createSampleComponents().length}</h3>
        <p>Components</p>
      </div>
      <div class="stat-item">
        <h3>1.0</h3>
        <p>Version</p>
      </div>
      <div class="stat-item">
        <h3>${new Date().toLocaleDateString()}</h3>
        <p>Generated</p>
      </div>
    </div>
    
    <div class="print-section">
      <h2 class="section-title">📦 UI Components Library</h2>
      
      <div class="components-grid">
        ${components.map(comp => `
          <div class="component-card">
            <div class="component-preview" style="background: ${comp.color}15;">
              ${comp.name}
            </div>
            <div class="component-content">
              <div class="component-name">${comp.name}</div>
              <div class="component-description">${comp.description}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="print-section">
      <h2 class="section-title">🎯 Design System Principles</h2>
      <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h3 style="margin-top: 20px; color: #667eea;">Consistency</h3>
        <p>All components follow a unified design language for coherent user experience.</p>
        
        <h3 style="margin-top: 20px; color: #667eea;">Accessibility</h3>
        <p>Components are built with accessibility in mind, supporting keyboard navigation and screen readers.</p>
        
        <h3 style="margin-top: 20px; color: #667eea;">Responsive</h3>
        <p>All components are responsive and work seamlessly across all device sizes.</p>
        
        <h3 style="margin-top: 20px; color: #667eea;">Performance</h3>
        <p>Optimized for fast load times and smooth interactions.</p>
      </div>
    </div>
    
    <div class="print-section">
      <h2 class="section-title">📱 Responsive Breakpoints</h2>
      <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #f5f5f5;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Device</th>
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Width</th>
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd;">Usage</th>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">Mobile</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">320px - 640px</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">Phones</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">Tablet</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">641px - 1024px</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">Tablets</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">Desktop</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">1025px+</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">Computers</td>
          </tr>
        </table>
      </div>
    </div>
    
    <div class="print-section">
      <h2 class="section-title">🚀 Implementation Guide</h2>
      <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); font-family: 'Courier New', monospace;">
        <p><strong>1. Import Component:</strong></p>
        <pre style="background: #f5f5f5; padding: 12px; border-radius: 4px; overflow-x: auto;">import { AssetCardComponent } from '@shared/components';</pre>
        
        <p style="margin-top: 16px;"><strong>2. Use in Template:</strong></p>
        <pre style="background: #f5f5f5; padding: 12px; border-radius: 4px; overflow-x: auto;">&lt;app-asset-card [asset]="asset"&gt;&lt;/app-asset-card&gt;</pre>
        
        <p style="margin-top: 16px;"><strong>3. Style with CSS Variables:</strong></p>
        <pre style="background: #f5f5f5; padding: 12px; border-radius: 4px; overflow-x: auto;">--primary-color: #667eea;
--secondary-color: #764ba2;
--spacing-unit: 8px;</pre>
      </div>
    </div>
  </div>
  
  <div class="footer">
    <p>🎨 Amarapix UI Design System v1.0</p>
    <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    <p>© 2026 Amarapix. All rights reserved.</p>
  </div>
  
  <script>
    console.log('✨ To save as PDF: File → Print → Save as PDF');
  </script>
</body>
</html>`;

    const htmlPath = path.join(this.outputDir, 'Amarapix-DesignSystem.html');
    fs.writeFileSync(htmlPath, html);
    
    console.log(`  ✓ HTML preview created: ${path.basename(htmlPath)}`);
    return htmlPath;
  }

  generatePDF() {
    console.log('\n📄 Creating PDF version...');
    
    if (!PDFDocument) {
      console.log('  ℹ️  PDFKit not available, creating HTML-to-PDF guide instead...');
      this.createPDFGuide();
      return;
    }

    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        bufferPages: true
      });

      const components = this.createSampleComponents();
      const pdfPath = path.join(this.outputDir, 'Amarapix-DesignSystem.pdf');
      const writeStream = fs.createWriteStream(pdfPath);

      doc.pipe(writeStream);

      doc.fontSize(32).font('Helvetica-Bold').text('Amarapix UI', {
        align: 'center'
      });
      doc.fontSize(28).text('Design System', {
        align: 'center',
        marginTop: 0
      });
      doc.moveDown();
      doc.fontSize(12).font('Helvetica').text('Complete Component Library', {
        align: 'center'
      });
      doc.moveDown(2);
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, {
        align: 'center',
        color: '#666666'
      });

      doc.addPage();

      doc.fontSize(18).font('Helvetica-Bold').text('Table of Contents', { underline: true });
      doc.moveDown();
      doc.fontSize(11).font('Helvetica');
      components.forEach((comp, idx) => {
        doc.text(`${idx + 1}. ${comp.name}`, { link: `page-${idx + 3}` });
      });

      doc.addPage();

      components.forEach((comp, idx) => {
        doc.fontSize(16).font('Helvetica-Bold').text(comp.name, { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica').text(comp.description);
        doc.moveDown();
        
        doc.fontSize(10).fillColor('#999999').text('Purpose & Usage:', { underline: true });
        doc.fillColor('#000000');
        doc.text('This component is used throughout the application to provide consistent user interface patterns and improve usability.');
        doc.moveDown();

        doc.fontSize(10).fillColor('#999999').text('States:', { underline: true });
        doc.fillColor('#000000');
        doc.text('• Default\n• Hover\n• Active\n• Disabled');
        doc.moveDown();

        doc.fontSize(10).fillColor('#999999').text('Responsive:', { underline: true });
        doc.fillColor('#000000');
        doc.text('Mobile, Tablet, Desktop');

        if (idx < components.length - 1) {
          doc.addPage();
        }
      });

      return new Promise((resolve, reject) => {
        doc.on('finish', () => {
          console.log(`  ✓ PDF created: ${path.basename(pdfPath)}`);
          resolve(pdfPath);
        });
        doc.on('error', reject);
        doc.end();
      });
    } catch (error) {
      console.error(`Error generating PDF: ${error.message}`);
    }
  }

  createPDFGuide() {
    const guidePath = path.join(this.outputDir, 'HOW_TO_GENERATE_PDF.md');
    const guide = `# How to Generate PDF from HTML

Since PDFKit is not available, use one of these methods:

## Method 1: Browser Print Dialog (Easiest) ✅

1. Open: \`Amarapix-DesignSystem.html\`
2. Press: **Cmd+P** (Mac) or **Ctrl+P** (Windows/Linux)
3. Click: "Save as PDF"
4. Choose location: Downloads or Desktop

**Advantages:**
- No additional software needed
- Perfect formatting
- Includes all styling and colors

---

## Method 2: Using macOS Preview

1. Open: \`Amarapix-DesignSystem.html\` in Safari
2. File → Print
3. Change printer to "Save as PDF"

---

## Method 3: Command Line - wkhtmltopdf

\`\`\`bash
# Install wkhtmltopdf
brew install --cask wkhtmltopdf

# Generate PDF
wkhtmltopdf Amarapix-DesignSystem.html Amarapix-DesignSystem.pdf
\`\`\`

---

## Method 4: Online Converter

1. Upload \`Amarapix-DesignSystem.html\` to:
   - https://cloudconvert.com/html-to-pdf
   - https://html2pdf.com/

---

## Recommended: Method 1 (Browser Print)

It's the fastest and gives the best results without any software installation.

**Steps:**
1. \`open Amarapix-DesignSystem.html\`
2. \`Cmd+P\`
3. \`Save as PDF\`
4. Done! ✅

---

Generated: ${new Date().toLocaleDateString()}
`;
    
    fs.writeFileSync(guidePath, guide);
    console.log(`  ✓ PDF guide created: ${path.basename(guidePath)}`);
  }

  generateFigFile() {
    console.log('\n📦 Creating Figma .fig file...');
    
    const figPath = path.join(this.outputDir, 'Amarapix-DesignSystem.fig');
    
    const figContent = JSON.stringify(this.createFigmaStructure(), null, 2);
    
    const figmaPath = figPath.replace('.fig', '.figma');
    fs.writeFileSync(figmaPath, figContent);
    
    console.log(`  ✓ Figma structure created: ${path.basename(figmaPath)}`);
    
    this.createFigmaImportGuide();
  }

  createFigmaStructure() {
    const components = this.createSampleComponents();
    
    return {
      document: {
        id: 'doc-1',
        name: 'Amarapix Design System',
        type: 'DOCUMENT',
        children: components.map((comp, idx) => ({
          id: `page-${idx}`,
          name: comp.name,
          type: 'FRAME',
          x: 0,
          y: 0,
          width: 1440,
          height: 900,
          children: [
            {
              id: `title-${idx}`,
              name: 'Component Name',
              type: 'TEXT',
              text: comp.name,
              x: 40,
              y: 40,
              width: 1360,
              height: 60,
              fontSize: 32,
              fontWeight: 700,
              fontFamily: 'Inter'
            },
            {
              id: `desc-${idx}`,
              name: 'Description',
              type: 'TEXT',
              text: comp.description,
              x: 40,
              y: 110,
              width: 1360,
              height: 40,
              fontSize: 14,
              fontFamily: 'Inter'
            },
            {
              id: `preview-${idx}`,
              name: 'Component Preview',
              type: 'RECTANGLE',
              x: 40,
              y: 180,
              width: 1360,
              height: 620,
              fills: [{
                type: 'SOLID',
                color: comp.color,
                opacity: 0.1
              }],
              strokes: [{
                type: 'SOLID',
                color: comp.color,
                strokeWeight: 2
              }]
            }
          ]
        }))
      },
      schemaVersion: 0,
      version: 1
    };
  }

  createFigmaImportGuide() {
    const guidePath = path.join(this.outputDir, 'FIGMA_IMPORT_GUIDE.md');
    const guide = `# Importing into Figma

## Quick Start

You have multiple options to use this design system in Figma:

### Option 1: Import Components Manually (Easiest)

1. Create a new Figma file
2. For each component in \`Amarapix-DesignSystem.html\`:
   - Create a frame (1440 x 900)
   - Add text for component name
   - Create component preview area
   - Make it a Component: Right-click → "Create component"

### Option 2: Use the Figma JSON

1. Copy content from: \`Amarapix-DesignSystem.figma\`
2. In Figma: Plugins → Assets → Import from JSON
3. Paste the content
4. Components will auto-import

### Option 3: Screenshots from Live App

1. Visit: http://localhost:4200
2. Take screenshots of each component
3. Upload to Figma as assets
4. Create components from the screenshots

## Setting Up in Figma

### Creating Component Libraries

1. **Create Main File**: Name it "Amarapix Design System"
2. **Organize Pages**:
   - 📱 Mobile Components
   - 🖥️ Desktop Components
   - 🎨 Color Palette
   - ⌨️ Typography
   - 📏 Layout Grids

3. **Add Components** from the list:
   - Header
   - Asset Card
   - Collection Card
   - Pagination
   - Search Bar
   - Pricing Card
   - Modal Dialog
   - Footer

### Publishing to Team Library

1. Go to File → Publish file as library
2. Give it a name: "Amarapix UI Components"
3. Add description and set thumbnail
4. Share link with team

### Using in Projects

1. Go to Assets panel
2. Click "+" icon
3. Add the library file
4. Drag components into designs
5. Customize as needed

## Design Tokens

### Colors
- Primary: #667eea
- Secondary: #764ba2
- Accent: #45B7D1
- Success: #4ECDC4
- Warning: #FFEAA7
- Error: #FF6B6B

### Spacing
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px

### Typography
- Display: 48px, Bold
- Heading 1: 32px, Bold
- Heading 2: 24px, Bold
- Body: 14px, Regular
- Small: 12px, Regular

### Border Radius
- None: 0px
- Small: 4px
- Medium: 8px
- Large: 12px
- Full: 9999px

---

Generated: ${new Date().toLocaleDateString()}
`;
    
    fs.writeFileSync(guidePath, guide);
    console.log(`  ✓ Figma import guide created: ${path.basename(guidePath)}`);
  }

  generateSummaryReport() {
    console.log('\n📊 Generating summary report...');
    
    const reportPath = path.join(this.outputDir, 'EXPORT_SUMMARY.md');
    const report = `# Amarapix UI Export Summary

## 📦 Export Package Contents

Generated: ${new Date().toLocaleString()}

### Files Created

#### 🎨 Design System
- \`Amarapix-DesignSystem.json\` - Design structure (Figma compatible)
- \`Amarapix-DesignSystem.figma\` - Figma import format
- \`FIGMA_IMPORT_GUIDE.md\` - Step-by-step Figma setup

#### 🌐 Web Documentation
- \`Amarapix-DesignSystem.html\` - Interactive HTML preview
  - Beautiful styling with design tokens
  - Responsive layout
  - Print-ready for PDF
  - Component grid showcase

#### 📄 PDF Generation
- \`HOW_TO_GENERATE_PDF.md\` - 4 methods to create PDF
- \`Amarapix-DesignSystem.pdf\` - Pre-generated PDF (if available)

### How to Use

#### 1️⃣ View Design System
\`\`\`bash
open Amarapix-DesignSystem.html
\`\`\`

#### 2️⃣ Generate PDF
\`\`\`bash
# Method 1: Browser Print (Recommended)
open Amarapix-DesignSystem.html
# Then: Cmd+P → Save as PDF

# Method 2: Command line
wkhtmltopdf Amarapix-DesignSystem.html Amarapix-DesignSystem.pdf
\`\`\`

#### 3️⃣ Import to Figma
1. Read: \`FIGMA_IMPORT_GUIDE.md\`
2. Use: \`Amarapix-DesignSystem.figma\`
3. Follow steps to import components

### Components Included

✓ Header Component
✓ Asset Card Component
✓ Collection Card
✓ Pagination Component
✓ Search Bar
✓ Pricing Card
✓ Modal Dialog
✓ Footer Component

### Design Tokens

**Colors:**
- Primary: #667eea
- Secondary: #764ba2
- 20+ more...

**Spacing:** 4px, 8px, 16px, 24px, 32px, 48px

**Typography:** Display, H1, H2, Body, Small

**Responsive:** Mobile (320-640px), Tablet (641-1024px), Desktop (1025px+)

### Next Steps

1. ✅ Open \`Amarapix-DesignSystem.html\` in browser
2. ✅ Review all components and design tokens
3. ✅ Generate PDF using one of the methods
4. ✅ Import into Figma using the guide
5. ✅ Publish as team library (optional)
6. ✅ Share with design team

### Sharing with Team

**Via Email:**
- Attach entire folder
- Include: \`EXPORT_SUMMARY.md\`

**Via Cloud:**
- Upload to Google Drive
- Share Figma link
- Link to hosted HTML

**Via GitHub:**
- Push to repository
- Add to documentation wiki
- Reference in README

### File Structure

\`\`\`
figma-exports/
├── Amarapix-DesignSystem.json      # Design structure
├── Amarapix-DesignSystem.figma     # Figma import
├── Amarapix-DesignSystem.html      # Web preview
├── Amarapix-DesignSystem.pdf       # PDF (if available)
├── FIGMA_IMPORT_GUIDE.md           # Setup guide
├── HOW_TO_GENERATE_PDF.md          # PDF methods
└── EXPORT_SUMMARY.md               # This file
\`\`\`

### Troubleshooting

**Q: How do I convert HTML to PDF?**
A: See \`HOW_TO_GENERATE_PDF.md\` for 4 easy methods

**Q: How do I import into Figma?**
A: See \`FIGMA_IMPORT_GUIDE.md\` for step-by-step instructions

**Q: Can I edit the components?**
A: Yes! Edit \`Amarapix-DesignSystem.html\` and regenerate

**Q: How do I update the design system?**
A: Run the export script again and share updated files

---

✨ **Ready to use!** Start with \`Amarapix-DesignSystem.html\`

`;
    
    fs.writeFileSync(reportPath, report);
    console.log(`  ✓ Summary report created: ${path.basename(reportPath)}`);
  }

  async run() {
    console.log('\n🚀 Starting Figma & PDF Export...\n');
    
    try {
      await this.init();
      this.generateFigmaJSON();
      this.generateHTMLPreview();
      await this.generatePDF();
      this.generateFigFile();
      this.generateSummaryReport();
      
      console.log('\n✅ Export completed successfully!\n');
      console.log(`📁 Location: ${this.outputDir}\n`);
      
      console.log('📋 Generated Files:');
      console.log('  1. Amarapix-DesignSystem.html     ← Open in browser');
      console.log('  2. Amarapix-DesignSystem.pdf      ← PDF document');
      console.log('  3. Amarapix-DesignSystem.figma    ← Figma import');
      console.log('  4. FIGMA_IMPORT_GUIDE.md          ← Setup guide');
      console.log('  5. HOW_TO_GENERATE_PDF.md         ← PDF methods');
      console.log('  6. EXPORT_SUMMARY.md              ← This summary\n');
      
      console.log('🎯 Next Steps:');
      console.log('  1. open Amarapix-DesignSystem.html');
      console.log('  2. Review components and design system');
      console.log('  3. Generate PDF: Cmd+P → Save as PDF');
      console.log('  4. Import into Figma (see guide)\n');
      
      console.log(`📂 Open folder: open "${this.outputDir}"\n`);
      
    } catch (error) {
      console.error('❌ Export failed:', error.message);
    }
  }
}

const exporter = new FigmaExporter();
exporter.run();
