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

// Clean & Modern Technical Document Color Palette (RGB)
const COLOR_TEXT = '#2d3748';      // Clean slate/dark gray text
const COLOR_PRIMARY = '#1a202c';   // Off-black for headings
const COLOR_MUTED = '#718096';     // Muted gray for footers
const COLOR_BG_CODE = '#f7fafc';   // Light gray for code boxes
const COLOR_RULE = '#e2e8f0';      // Very clean subtle rule color

// ==========================================
// 🖋️ FIRST PAGE: HEADER & TITLE
// ==========================================
doc.font('Helvetica-Bold').fontSize(22).fillColor(COLOR_PRIMARY).text('HabitQuest: Developer Study & Learning Guide', { lineGap: 4 });
doc.moveDown(0.2);
doc.font('Helvetica').fontSize(10).fillColor(COLOR_MUTED).text('A Technical Breakdown of Zero-Dependency Static PWA & Electron Shell Architectures');

doc.moveDown(0.8);
doc.strokeColor(COLOR_RULE).lineWidth(1);
doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
doc.moveDown(1.5);

// ==========================================
// 🖋️ PARSING & RENDERING ENGINE
// ==========================================
const lines = markdown.split('\n');
let inCodeBlock = false;
let codeBuffer = [];

// Skip the first title block in markdown since we drew a premium one
let skipFirstHeading = true;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i].trim();
  const rawLine = lines[i];

  // Handle Code Blocks
  if (line.startsWith('```')) {
    if (inCodeBlock) {
      inCodeBlock = false;
      doc.save();
      
      const codeText = codeBuffer.join('\n');
      const boxWidth = doc.page.width - 100;
      // Estimate height precisely
      const heightEstimate = doc.heightOfString(codeText, { width: boxWidth - 20, font: 'Courier', size: 8.5 }) + 14;
      
      // Prevent orphan code blocks by checking if it fits on page
      if (doc.y + heightEstimate > doc.page.height - 60) {
        doc.addPage();
      }
      
      // Draw background box
      doc.rect(doc.x, doc.y, boxWidth, heightEstimate).fill(COLOR_BG_CODE);
      
      // Write text inside using standard monospace Courier
      doc.fillColor(COLOR_PRIMARY).font('Courier').fontSize(8.5);
      doc.text(codeText, doc.x + 10, doc.y - heightEstimate + 7, { width: boxWidth - 20, lineGap: 2 });
      doc.restore();
      doc.moveDown(1.2);
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
    if (skipFirstHeading) {
      skipFirstHeading = false;
      continue;
    }
    const headingText = line.substring(2);
    
    // Add page break if heading is close to bottom
    if (doc.y > doc.page.height - 120) {
      doc.addPage();
    } else {
      doc.moveDown(2);
    }
    
    doc.font('Helvetica-Bold').fontSize(15).fillColor(COLOR_PRIMARY).text(headingText);
    doc.moveDown(0.6);
    continue;
  }

  if (line.startsWith('## ')) {
    const headingText = line.substring(3);
    
    if (doc.y > doc.page.height - 100) {
      doc.addPage();
    } else {
      doc.moveDown(1.5);
    }
    
    doc.font('Helvetica-Bold').fontSize(12).fillColor(COLOR_PRIMARY).text(headingText);
    doc.moveDown(0.5);
    continue;
  }

  if (line.startsWith('### ')) {
    const headingText = line.substring(4);
    
    if (doc.y > doc.page.height - 80) {
      doc.addPage();
    } else {
      doc.moveDown(1.2);
    }
    
    doc.font('Helvetica-Bold').fontSize(10).fillColor(COLOR_PRIMARY).text(headingText);
    doc.moveDown(0.4);
    continue;
  }

  // Handle Horizontal Dividers
  if (line === '---') {
    doc.moveDown(1);
    doc.strokeColor(COLOR_RULE).lineWidth(0.5);
    doc.moveTo(doc.x, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
    doc.moveDown(1);
    continue;
  }

  // Handle Lists
  if (line.startsWith('- ') || line.startsWith('* ')) {
    const listText = line.substring(2);
    doc.font('Helvetica').fontSize(9.5).fillColor(COLOR_TEXT);
    
    const bulletX = doc.x;
    doc.text('•', bulletX + 10, doc.y, { continued: true });
    
    // Format bold items in list
    if (listText.includes('**')) {
      const parts = listText.split('**');
      doc.text('  ', { continued: true });
      for (let k = 0; k < parts.length; k++) {
        const isBold = k % 2 === 1;
        doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica');
        if (k === parts.length - 1) {
          doc.text(parts[k], { width: doc.page.width - 120, lineGap: 3 });
        } else {
          doc.text(parts[k], { continued: true });
        }
      }
    } else {
      doc.text('  ' + listText, { width: doc.page.width - 120, lineGap: 3 });
    }
    doc.moveDown(0.4);
    continue;
  }

  // Handle Numbered Lists
  const numMatch = line.match(/^(\d+)\.\s(.*)/);
  if (numMatch) {
    const num = numMatch[1];
    const text = numMatch[2];
    doc.font('Helvetica').fontSize(9.5).fillColor(COLOR_TEXT);
    
    doc.text(`${num}. `, doc.x + 10, doc.y, { continued: true });
    
    if (text.includes('**')) {
      const parts = text.split('**');
      doc.text(' ', { continued: true });
      for (let k = 0; k < parts.length; k++) {
        const isBold = k % 2 === 1;
        doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica');
        if (k === parts.length - 1) {
          doc.text(parts[k], { width: doc.page.width - 120, lineGap: 3 });
        } else {
          doc.text(parts[k], { continued: true });
        }
      }
    } else {
      doc.text(' ' + text, { width: doc.page.width - 120, lineGap: 3 });
    }
    doc.moveDown(0.4);
    continue;
  }

  // Handle empty lines
  if (line === '') {
    doc.moveDown(0.5);
    continue;
  }

  // Handle Quotes / Alerts
  if (line.startsWith('> ')) {
    let quoteText = line.substring(2);
    if (quoteText.includes('[!IMPORTANT]')) {
      quoteText = quoteText.replace('[!IMPORTANT]', 'IMPORTANT:');
    }
    if (quoteText.includes('[!TIP]')) {
      quoteText = quoteText.replace('[!TIP]', 'TIP:');
    }
    doc.save();
    doc.font('Helvetica-Oblique').fontSize(9.5).fillColor(COLOR_TEXT);
    const boxWidth = doc.page.width - 100;
    const heightEstimate = doc.heightOfString(quoteText, { width: boxWidth - 30 }) + 8;
    
    if (doc.y + heightEstimate > doc.page.height - 60) {
      doc.addPage();
    }
    
    // Draw running left accent line
    doc.strokeColor(COLOR_MUTED).lineWidth(1.5);
    doc.moveTo(doc.x + 5, doc.y).lineTo(doc.x + 5, doc.y + heightEstimate).stroke();
    
    doc.text(quoteText, doc.x + 15, doc.y + 4, { width: boxWidth - 25, lineGap: 3 });
    doc.restore();
    doc.moveDown(1);
    continue;
  }

  // Normal Paragraph
  doc.font('Helvetica').fontSize(9.5).fillColor(COLOR_TEXT);
  
  if (line.includes('**')) {
    const parts = line.split('**');
    for (let k = 0; k < parts.length; k++) {
      const isBold = k % 2 === 1;
      doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica');
      if (k === parts.length - 1) {
        doc.text(parts[k], { lineGap: 3 });
      } else {
        doc.text(parts[k], { continued: true });
      }
    }
  } else {
    doc.text(line, { lineGap: 3 });
  }
  doc.moveDown(0.6);
}

// ==========================================
// 📖 RUNNING FOOTERS (Buffer rendering)
// ==========================================
const range = doc.bufferedPageRange(); // { start: 0, count: X }
for (let p = 0; p < range.count; p++) {
  doc.switchToPage(p);
  
  // Clean Running Footer with thin line
  doc.strokeColor(COLOR_RULE).lineWidth(0.5);
  doc.moveTo(50, doc.page.height - 40).lineTo(doc.page.width - 50, doc.page.height - 40).stroke();
  
  doc.font('Helvetica').fontSize(7.5).fillColor(COLOR_MUTED);
  doc.text('HabitQuest Study Guide', 50, doc.page.height - 32, { align: 'left' });
  
  const pageStr = `Page ${p + 1} of ${range.count}`;
  doc.text(pageStr, 50, doc.page.height - 32, { align: 'right' });
}

// End the PDF generation
doc.end();

outputStream.on('finish', () => {
  console.log('Clean PDF compiled successfully! File saved: development_notes.pdf');
});
