#!/usr/bin/env node

/**
 * Amarapix UI - Figma Export Script
 * Automatically creates Figma frames from component documentation
 * 
 * Prerequisites:
 * 1. Install: npm install figma-api
 * 2. Get Figma API token from: https://www.figma.com/developers/api
 * 3. Create .env file with: FIGMA_TOKEN=your_token_here
 */

const fs = require('fs');
const path = require('path');

// Load project structure
const projectStructurePath = path.join(__dirname, 'amarapix-ui-structure.json');
const PROJECT_STRUCTURE = JSON.parse(fs.readFileSync(projectStructurePath, 'utf-8'));

/**
 * Manual Figma Export Guide
 * Since Figma API is limited for frame creation, use this guide for manual setup
 */

const FIGMA_SETUP_GUIDE = `
# Manual Figma File Setup for Amarapix UI

## Step 1: Create Figma File

1. Go to https://www.figma.com
2. Create new file: "Amarapix Client UI"
3. Create these pages:

## Page Structure

### Page: Design System
- Frame: "Colors"
  - ${JSON.stringify(PROJECT_STRUCTURE.theme.colors, null, 2)}
- Frame: "Typography"
  - Font: Lato
  - Weights: ${PROJECT_STRUCTURE.theme.typography.weights.join(', ')}
- Frame: "Spacing"
  - Base unit: ${PROJECT_STRUCTURE.theme.spacing}

### Page: Journeys Overview
For each journey in the journeys array:
- Create Frame: Journey Name
- Add route flow diagram
- Add component list

### Page: Components Library
For each component group:
- Frame: Component Name
- Add component states
- Document props/features

### Page: Mobile Responsive
- Frame: Mobile (375px)
- Frame: Tablet (768px)
- Frame: Desktop (1440px)

## Sections to Create

${PROJECT_STRUCTURE.journeys.map((journey, i) => `
### Journey ${i + 1}: ${journey.title}
**Description:** ${journey.description}

**Routes:**
${journey.routes.map(r => `- ${r.path} → ${r.component}`).join('\n')}

**Features:**
${journey.routes.flatMap(r => r.features).map(f => `- ${f}`).join('\n')}
`).join('\n')}

## Component States to Document

### Authentication Components
- LoginComponent
  - Empty form
  - Form filled
  - Loading
  - Error state
  - Success redirect

- RegisterComponent
  - Email validation state
  - Password strength indicator
  - Terms agreement
  - Loading state

### Asset Components
- AssetCard
  - Default state
  - Hover state
  - Downloaded state
  - Selected state

- AssetDetailComponent
  - Image preview
  - Download panel
  - Share modal
  - Similar assets grid

### Print Components
- PrintConfiguratorComponent
  - Product selection
  - Size options
  - Price display (UGX)
  - Checkout form
  - Payment method selection (MTN/Airtel)

### Collections
- CollectionsComponent
  - Empty state
  - Populated grid
  - Search results
  
- CollectionDetailComponent
  - Items grid
  - Item hover states
  - Click to asset detail

## Responsive Breakpoints

Create mockups for:
- Mobile: 360px - 480px
- Tablet: 768px - 1024px
- Desktop: 1200px+

## Dark Mode

For each page, show:
- Light mode version
- Dark mode version
- Theme toggle interaction

## Interactive Prototypes

Create links between frames:
- Login → Register
- Register → Marketplace
- Asset List → Asset Detail
- Collections → Collection Detail → Asset Detail
- Print Home → Configurator → Orders

## Assets to Include

Paste actual screenshots from:
\`\`\`bash
npm start
\`\`\`

Then screenshot each page at:
- localhost:4200/
- localhost:4200/auth/login
- localhost:4200/auth/register
- localhost:4200/marketplace
- localhost:4200/marketplace/asset/example
- localhost:4200/collections
- localhost:4200/collections/safe-birth
- localhost:4200/print
- localhost:4200/pricing
- etc.

## Export Settings

When exporting to PDF:
1. File → Export → PDF
2. Include all pages
3. Include artboards
4. Verify fonts are embedded

## Sharing

1. Right-click file
2. Share → Set permissions
3. Copy link
4. Share with backend team

## Version Control

Keep Figma file in sync:
- Update when UI changes
- Document changes in file history
- Tag major versions
- Link to commits in GitHub
`;

/**
 * Generate comprehensive Figma setup instructions
 */
function generateFigmaGuide() {
  const outputPath = path.join(__dirname, 'FIGMA_SETUP_INSTRUCTIONS.md');
  
  fs.writeFileSync(outputPath, FIGMA_SETUP_GUIDE);
  console.log(`✓ Figma setup instructions saved: ${outputPath}`);
}

/**
 * Generate component inventory CSV for Figma
 */
function generateComponentInventory() {
  let csv = 'Component Name,Location,Type,States,Notes\n';
  
  const components = [
    {
      name: 'Header',
      location: 'src/app/shared/components/header/',
      type: 'Shared',
      states: 'Default, Authenticated, Dark Mode'
    },
    {
      name: 'Footer',
      location: 'src/app/shared/components/footer/',
      type: 'Shared',
      states: 'Default'
    },
    {
      name: 'Modal',
      location: 'src/app/shared/components/modal/',
      type: 'Shared',
      states: 'Closed, Open, Loading'
    },
    {
      name: 'Asset Card',
      location: 'src/app/shared/components/asset-card/',
      type: 'Shared',
      states: 'Default, Hover, Selected, Downloaded'
    },
    {
      name: 'Pagination',
      location: 'src/app/shared/components/pagination/',
      type: 'Shared',
      states: 'Default, Disabled, Active'
    },
    {
      name: 'Search Bar',
      location: 'src/app/shared/components/search-bar/',
      type: 'Shared',
      states: 'Empty, Focused, With Results'
    },
    {
      name: 'Login',
      location: 'src/app/features/auth/login/',
      type: 'Feature',
      states: 'Default, Loading, Error, Success'
    },
    {
      name: 'Register',
      location: 'src/app/features/auth/register/',
      type: 'Feature',
      states: 'Default, Validation, Loading, Error'
    },
    {
      name: 'Asset List',
      location: 'src/app/features/marketplace/asset-list/',
      type: 'Feature',
      states: 'Empty, Populated, Loading, Search Results'
    },
    {
      name: 'Asset Detail',
      location: 'src/app/features/marketplace/asset-detail/',
      type: 'Feature',
      states: 'Default, Downloaded, Share Open, Similar Assets'
    },
    {
      name: 'Collections',
      location: 'src/app/features/collections/collections/',
      type: 'Feature',
      states: 'Grid View, Search Results, Empty'
    },
    {
      name: 'Collection Detail',
      location: 'src/app/features/collections/collection-detail/',
      type: 'Feature',
      states: 'Items Grid, Loading, Empty'
    },
    {
      name: 'Print Home',
      location: 'src/app/features/print/print-home/',
      type: 'Feature',
      states: 'Default, Hero Slider, Product Grid'
    },
    {
      name: 'Print Configurator',
      location: 'src/app/features/print/print-configurator/',
      type: 'Feature',
      states: 'Product Selection, Size/Color/Quantity, Pricing, Checkout'
    },
    {
      name: 'Pricing',
      location: 'src/app/features/subscription/pricing/',
      type: 'Feature',
      states: 'Default, Tier Comparison, CTA States'
    },
    {
      name: 'Canvas Editor',
      location: 'src/app/features/editor/canvas-editor/',
      type: 'Feature',
      states: 'Tools Visible, Template Selection, Design View'
    },
    {
      name: 'Course List',
      location: 'src/app/features/academy/course-list/',
      type: 'Feature',
      states: 'Grid View, Filter States, Loading'
    },
    {
      name: 'Course Player',
      location: 'src/app/features/academy/course-player/',
      type: 'Feature',
      states: 'Video Playing, Progress Bar, Navigation'
    },
  ];
  
  components.forEach(comp => {
    csv += `"${comp.name}","${comp.location}","${comp.type}","${comp.states}",""\n`;
  });
  
  const outputPath = path.join(__dirname, 'component-inventory.csv');
  fs.writeFileSync(outputPath, csv);
  console.log(`✓ Component inventory saved: ${outputPath}`);
}

/**
 * Generate API endpoints reference for Figma annotations
 */
function generateAPIReference() {
  let reference = '# API Endpoints Reference for UI Annotations\n\n';
  
  Object.entries(PROJECT_STRUCTURE.api_endpoints).forEach(([category, endpoints]) => {
    reference += `## ${category.toUpperCase()}\n\n`;
    
    Object.entries(endpoints).forEach(([endpoint, details]) => {
      reference += `### ${endpoint}\n`;
      if (details.params) reference += `**Params:** ${details.params}\n`;
      if (details.body) reference += `**Body:** ${details.body}\n`;
      if (details.response) reference += `**Response:** ${details.response}\n`;
      reference += '\n';
    });
  });
  
  const outputPath = path.join(__dirname, 'API_REFERENCE.md');
  fs.writeFileSync(outputPath, reference);
  console.log(`✓ API reference saved: ${outputPath}`);
}

/**
 * Main execution
 */
function main() {
  console.log('\n🎨 Generating Figma Export Assets...\n');
  
  generateFigmaGuide();
  generateComponentInventory();
  generateAPIReference();
  
  console.log('\n✅ Figma export assets generated!\n');
  console.log('📋 Files created:');
  console.log('   1. FIGMA_SETUP_INSTRUCTIONS.md - Manual Figma setup guide');
  console.log('   2. component-inventory.csv - Component listing for reference');
  console.log('   3. API_REFERENCE.md - API endpoints to annotate in Figma');
  console.log('\n💡 Next Steps:');
  console.log('   1. Open FIGMA_SETUP_INSTRUCTIONS.md');
  console.log('   2. Follow the step-by-step guide');
  console.log('   3. Create frames in Figma based on the structure');
  console.log('   4. Use component-inventory.csv to track progress');
  console.log('   5. Annotate with API endpoints from API_REFERENCE.md');
  console.log('   6. Export Figma file as PDF');
  console.log('\n');
}

if (require.main === module) {
  main();
}

module.exports = {
  generateFigmaGuide,
  generateComponentInventory,
  generateAPIReference
};
