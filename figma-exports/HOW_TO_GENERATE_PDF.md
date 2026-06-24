# How to Generate PDF from HTML

Since PDFKit is not available, use one of these methods:

## Method 1: Browser Print Dialog (Easiest) ✅

1. Open: `Amarapix-DesignSystem.html`
2. Press: **Cmd+P** (Mac) or **Ctrl+P** (Windows/Linux)
3. Click: "Save as PDF"
4. Choose location: Downloads or Desktop

**Advantages:**
- No additional software needed
- Perfect formatting
- Includes all styling and colors

---

## Method 2: Using macOS Preview

1. Open: `Amarapix-DesignSystem.html` in Safari
2. File → Print
3. Change printer to "Save as PDF"

---

## Method 3: Command Line - wkhtmltopdf

```bash
# Install wkhtmltopdf
brew install --cask wkhtmltopdf

# Generate PDF
wkhtmltopdf Amarapix-DesignSystem.html Amarapix-DesignSystem.pdf
```

---

## Method 4: Online Converter

1. Upload `Amarapix-DesignSystem.html` to:
   - https://cloudconvert.com/html-to-pdf
   - https://html2pdf.com/

---

## Recommended: Method 1 (Browser Print)

It's the fastest and gives the best results without any software installation.

**Steps:**
1. `open Amarapix-DesignSystem.html`
2. `Cmd+P`
3. `Save as PDF`
4. Done! ✅

---

Generated: 4/24/2026
