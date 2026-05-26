import PDFDocument from 'pdfkit';
import fs from 'fs';

// Read development_notes.md
const markdown = fs.readFileSync('development_notes.md', 'utf8');

// Create a new PDF document with standard page layout
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
  bufferPages: true
});

// Stream PDF output to a file
const outputStream = fs.createWriteStream('development_notes.pdf');
doc.pipe(outputStream);

// Vintage Diary Color Palette (Built-in RGB)
const COLOR_PRIMARY = '#121212';
const COLOR_ACCENT = '#7b7b7b';
const COLOR_BG_BLOCK = '#eae9e0';
const COLOR_RULE = '#d2d0c2';

// Set up Header and Footer listeners
doc.on('pageAdded', () => {
  // We will draw running headers and footers later using bufferPages
});

// ==========================================
// 📜 COVER PAGE
// ==========================================
doc.rect(40, 40, doc.page.width - 80, doc.page.height - 80).stroke(COLOR_PRIMARY);
doc.rect(45, 45, doc.page.width - 90, doc.page.height - 90).stroke(COLOR_PRIMARY);

doc.moveDown(8);
doc.font('Courier-Bold').fontSize(32).fillColor(COLOR_PRIMARY).text('HABITQUEST', { align: 'center', letterSpacing: 2 });
doc.moveDown(0.5);
doc.font('Courier').fontSize(16).fillColor(COLOR_ACCENT).text('Developer Study & Learning Guide', { align: 'center' });

doc.moveDown(2);
doc.font('Courier').fontSize(10).fillColor(COLOR_PRIMARY).text('A Zero-Dependency Vanilla PWA & Electron Architecture', { align: 'center' });

doc.moveDown(12);
doc.font('Courier-Bold').fontSize(11).fillColor(COLOR_PRIMARY).text('Author: Antigravity Pair Program', { align: 'center' });
doc.font('Courier').fontSize(10).fillColor(COLOR_ACCENT).text('Published: May 2026', { align: 'center' });

// Add page break
doc.addPage();

// ==========================================
// 🖋️ PARSING & RENDERING ENGINE
// ==========================================
const lines = markdown.split('\n');
let inCodeBlock = false;
let codeBuffer = [];

doc.font('Courier').fontSize(11).fillColor(COLOR_PRIMARY);

for (let i = 0; i < lines.length; i++) {
  let line = lines[i].trim();
  const rawLine = lines[i];

  // Handle Code Blocks
  if (line.startsWith('```')) {
    if (inCodeBlock) {
      // Draw Code Block Box
      inCodeBlock = false;
      doc.save();
      doc.fillColor(COLOR_PRIMARY);
      
      const codeText = codeBuffer.join('\n');
      const boxWidth = doc.page.width - 100;
      const heightEstimate = doc.heightOfString(codeText, { width: boxWidth - 20, font: 'Courier', size: 9 }) + 14;
      
      // Draw background
      doc.rect(doc.x, doc.y, boxWidth, heightEstimate).fill(COLOR_BG_BLOCK);
      
      // Write text inside
      doc.fillColor(COLOR_PRIMARY).font('Courier').fontSize(9);
      doc.text(codeText, doc.x + 10, doc.y - heightEstimate + 7, { width: boxWidth - 20, lineGap: 2 });
      doc.restore();
      doc.moveDown(1.5);
      codeBuffer = [];
    } else {
      inCodeBlock = true;
    }
    continue;
  }

  if (inCodeBlock) {
    codeBuffer.push(rawLine);
    continue;
  }

  // Handle Headings
  if (line.startsWith('# ')) {
    const headingText = line.substring(2).toUpperCase();
    doc.moveDown(2.5);
    doc.font('Courier-Bold').fontSize(18).fillColor(COLOR_PRIMARY).text(headingText);
    
    // Draw horizontal rule
    doc.strokeColor(COLOR_PRIMARY).lineWidth(1.5);
    doc.moveTo(doc.x, doc.y + 4).lineTo(doc.page.width - 50, doc.y + 4).stroke();
    doc.moveDown(1.5);
    continue;
  }

  if (line.startsWith('## ')) {
    const headingText = line.substring(3);
    doc.moveDown(2);
    doc.font('Courier-Bold').fontSize(14).fillColor(COLOR_PRIMARY).text(headingText);
    doc.moveDown(1);
    continue;
  }

  if (line.startsWith('### ')) {
    const headingText = line.substring(4);
    doc.moveDown(1.5);
    doc.font('Courier-Bold').fontSize(11).fillColor(COLOR_PRIMARY).text(headingText);
    doc.moveDown(0.5);
    continue;
  }

  // Handle Horizontal Dividers
  if (line === '---') {
    doc.moveDown(1.5);
    doc.strokeColor(COLOR_RULE).lineWidth(0.8);
    doc.moveTo(doc.x, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
    doc.moveDown(1.5);
    continue;
  }

  // Handle Lists
  if (line.startsWith('- ') || line.startsWith('* ')) {
    const listText = line.substring(2);
    doc.font('Courier').fontSize(10.5).fillColor(COLOR_PRIMARY);
    
    // Custom bold formatting inside bullets
    const bulletX = doc.x;
    doc.text('•', bulletX + 10, doc.y, { continued: true });
    doc.text('  ' + listText, { width: doc.page.width - 120, lineGap: 3 });
    doc.moveDown(0.5);
    continue;
  }

  // Handle numbered lists e.g. "1. "
  const numMatch = line.match(/^(\d+)\.\s(.*)/);
  if (numMatch) {
    const num = numMatch[1];
    const text = numMatch[2];
    doc.font('Courier').fontSize(10.5).fillColor(COLOR_PRIMARY);
    doc.text(`${num}. `, doc.x + 10, doc.y, { continued: true });
    doc.text(' ' + text, { width: doc.page.width - 120, lineGap: 3 });
    doc.moveDown(0.5);
    continue;
  }

  // Handle empty lines
  if (line === '') {
    doc.moveDown(0.8);
    continue;
  }

  // Handle Quotes / Info alerts e.g. "> [!IMPORTANT]"
  if (line.startsWith('> ')) {
    let quoteText = line.substring(2);
    if (quoteText.includes('[!IMPORTANT]')) {
      quoteText = quoteText.replace('[!IMPORTANT]', '⚠️ IMPORTANT:');
    }
    if (quoteText.includes('[!TIP]')) {
      quoteText = quoteText.replace('[!TIP]', '💡 TIP:');
    }
    doc.save();
    doc.font('Courier-Oblique').fontSize(10).fillColor(COLOR_PRIMARY);
    const boxWidth = doc.page.width - 100;
    const heightEstimate = doc.heightOfString(quoteText, { width: boxWidth - 20 }) + 10;
    
    // Draw Quote Border on Left
    doc.strokeColor(COLOR_PRIMARY).lineWidth(2);
    doc.moveTo(doc.x + 5, doc.y).lineTo(doc.x + 5, doc.y + heightEstimate).stroke();
    
    doc.text(quoteText, doc.x + 18, doc.y + 5, { width: boxWidth - 30, lineGap: 2 });
    doc.restore();
    doc.moveDown(1.5);
    continue;
  }

  // Normal Paragraph
  doc.font('Courier').fontSize(10.5).fillColor(COLOR_PRIMARY);
  
  // Quick bold text formatting replacement helper (removes ** **)
  if (line.includes('**')) {
    const parts = line.split('**');
    for (let k = 0; k < parts.length; k++) {
      const isBold = k % 2 === 1;
      doc.font(isBold ? 'Courier-Bold' : 'Courier');
      if (k === parts.length - 1) {
        doc.text(parts[k], { lineGap: 3 });
      } else {
        doc.text(parts[k], { continued: true });
      }
    }
  } else {
    doc.text(line, { lineGap: 3 });
  }
  doc.moveDown(0.8);
}

// ==========================================
// 📖 RUNNING HEADERS & FOOTERS (Multi-page)
// ==========================================
const range = doc.bufferedPageRange(); // { start: 0, count: X }
for (let p = 1; p < range.count; p++) {
  doc.switchToPage(p);
  
  // Running Header
  doc.font('Courier').fontSize(8).fillColor(COLOR_ACCENT);
  doc.text('HABITQUEST - DEVELOPMENT STUDY NOTES', 50, 25, { align: 'left' });
  doc.strokeColor(COLOR_RULE).lineWidth(0.5);
  doc.moveTo(50, 35).lineTo(doc.page.width - 50, 35).stroke();
  
  // Running Footer
  const pageStr = `Page ${p + 1} of ${range.count}`;
  doc.text(pageStr, 50, doc.page.height - 35, { align: 'right' });
}

// End the PDF generation
doc.end();

outputStream.on('finish', () => {
  console.log('PDF compiled successfully! File saved: development_notes.pdf');
});
