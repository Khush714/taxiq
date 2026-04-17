import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TaxComparison, Strategy } from './types';
import { formatCurrency } from './taxEngine';

export function generateTaxReport(
  userName: string,
  comparison: TaxComparison,
  strategies: Strategy[],
): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // Brand: deep sky blue (primary) for the PDF accents
  const goldR = 14, goldG = 165, goldB = 233; // hsl(200 95% 50%) ≈ #0EA5E9
  const darkR = 18, darkG = 22, darkB = 30;

  // Header bar
  doc.setFillColor(darkR, darkG, darkB);
  doc.rect(0, 0, pageWidth, 40, 'F');
  doc.setFillColor(goldR, goldG, goldB);
  doc.rect(0, 38, pageWidth, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(goldR, goldG, goldB);
  doc.text('TaxSmart AI', margin, 18);
  doc.setFontSize(10);
  doc.setTextColor(180, 180, 180);
  doc.text('India | Premium Tax Report', margin, 26);
  doc.setFontSize(9);
  doc.text(`FY 2024-25 | Generated ${new Date().toLocaleDateString('en-IN')}`, margin, 33);

  y = 50;

  // Prepared for
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text('Prepared for', margin, y);
  doc.setFontSize(16);
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.text(userName, margin, y + 8);
  y += 20;

  // Regime Comparison
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin, y, contentWidth, 45, 3, 3, 'F');
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.text('Tax Regime Comparison', margin + 5, y + 8);

  const halfW = contentWidth / 2 - 3;

  // Old regime box
  const oldBoxX = margin + 2;
  doc.setFillColor(comparison.recommended === 'old' ? 255 : 252, comparison.recommended === 'old' ? 248 : 252, comparison.recommended === 'old' ? 230 : 252);
  doc.roundedRect(oldBoxX, y + 12, halfW, 28, 2, 2, 'F');
  if (comparison.recommended === 'old') {
    doc.setDrawColor(goldR, goldG, goldB);
    doc.roundedRect(oldBoxX, y + 12, halfW, 28, 2, 2, 'S');
  }
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(comparison.recommended === 'old' ? '✓ RECOMMENDED' : 'Old Regime', oldBoxX + 4, y + 19);
  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(comparison.oldRegime.totalTax), oldBoxX + 4, y + 28);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(`Deductions: ${formatCurrency(comparison.oldRegime.totalDeductions)}`, oldBoxX + 4, y + 35);

  // New regime box
  const newBoxX = margin + halfW + 4;
  doc.setFillColor(comparison.recommended === 'new' ? 255 : 252, comparison.recommended === 'new' ? 248 : 252, comparison.recommended === 'new' ? 230 : 252);
  doc.roundedRect(newBoxX, y + 12, halfW, 28, 2, 2, 'F');
  if (comparison.recommended === 'new') {
    doc.setDrawColor(goldR, goldG, goldB);
    doc.roundedRect(newBoxX, y + 12, halfW, 28, 2, 2, 'S');
  }
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(comparison.recommended === 'new' ? '✓ RECOMMENDED' : 'New Regime', newBoxX + 4, y + 19);
  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(comparison.newRegime.totalTax), newBoxX + 4, y + 28);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text('Std. Deduction: Rs.75,000', newBoxX + 4, y + 35);

  y += 52;

  // Recommendation
  doc.setFillColor(goldR, goldG, goldB);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');
  doc.setFontSize(10);
  doc.setTextColor(30, 25, 10);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `${comparison.recommended === 'old' ? 'Old' : 'New'} Regime saves you ${formatCurrency(comparison.savings)}`,
    margin + 5, y + 7
  );
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const reasonLines = doc.splitTextToSize(comparison.reason, contentWidth - 10);
  doc.text(reasonLines.slice(0, 2), margin + 5, y + 13);
  y += 24;

  // Tax Breakdown Table
  const r = comparison.recommended === 'old' ? comparison.oldRegime : comparison.newRegime;
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.text(`Tax Breakdown (${comparison.recommended === 'old' ? 'Old' : 'New'} Regime)`, margin, y + 5);
  y += 8;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Component', 'Amount']],
    body: [
      ['Gross Income', formatCurrency(r.grossIncome)],
      ['Total Deductions', `- ${formatCurrency(r.totalDeductions)}`],
      ['Taxable Income', formatCurrency(r.taxableIncome)],
      ['Base Tax', formatCurrency(r.baseTax)],
      ['Surcharge', formatCurrency(r.surcharge)],
      ['Health & Education Cess (4%)', formatCurrency(r.cess)],
      ['Total Tax Payable', formatCurrency(r.totalTax)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [darkR, darkG, darkB], textColor: [goldR, goldG, goldB], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    styles: { cellPadding: 3 },
    didParseCell: (data) => {
      if (data.row.index === 6 && data.section === 'body') {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [255, 248, 230];
        data.cell.styles.textColor = [darkR, darkG, darkB];
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Strategies
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.text('Tax-Saving Strategies', margin, y + 5);
  y += 8;

  const totalSavings = strategies.reduce((acc, s) => acc + s.estimatedSavings, 0);
  doc.setFontSize(9);
  doc.setTextColor(34, 139, 34);
  doc.text(`Total Potential Savings: ${formatCurrency(totalSavings)}`, margin, y + 4);
  y += 8;

  const strategyRows = strategies.map((s, i) => [
    `${i + 1}`,
    s.name,
    formatCurrency(s.estimatedSavings),
    s.riskLevel,
    s.difficulty,
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['#', 'Strategy', 'Est. Savings', 'Risk', 'Difficulty']],
    body: strategyRows,
    theme: 'grid',
    headStyles: { fillColor: [darkR, darkG, darkB], textColor: [goldR, goldG, goldB], fontSize: 7, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7, textColor: [50, 50, 50] },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 70 },
      2: { cellWidth: 25, halign: 'right' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
    },
    styles: { cellPadding: 2.5 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const val = data.cell.raw as string;
        if (val === 'Safe') data.cell.styles.textColor = [34, 139, 34];
        else if (val === 'Moderate') data.cell.styles.textColor = [200, 150, 0];
        else data.cell.styles.textColor = [50, 100, 200];
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Strategy details - each on potentially new page
  strategies.forEach((s, i) => {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFillColor(248, 248, 248);
    const detailHeight = 42;
    doc.roundedRect(margin, y, contentWidth, detailHeight, 2, 2, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(goldR, goldG, goldB);
    doc.text(`Strategy ${i + 1}`, margin + 4, y + 6);
    doc.setTextColor(30, 30, 30);
    doc.text(s.name, margin + 30, y + 6);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    const whatLines = doc.splitTextToSize(`What to do: ${s.whatToDo}`, contentWidth - 10);
    doc.text(whatLines.slice(0, 2), margin + 4, y + 13);

    const whyLines = doc.splitTextToSize(`Why for you: ${s.whyApplicable}`, contentWidth - 10);
    doc.text(whyLines.slice(0, 2), margin + 4, y + 24);

    doc.setFontSize(7);
    doc.setTextColor(34, 139, 34);
    doc.setFont('helvetica', 'bold');
    doc.text(`Savings: ${formatCurrency(s.estimatedSavings)}`, margin + 4, y + 35);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'normal');
    doc.text(`Risk: ${s.riskLevel} | Difficulty: ${s.difficulty}`, margin + 60, y + 35);

    if (s.complianceNote) {
      doc.setTextColor(180, 120, 0);
      doc.text(`Note: ${s.complianceNote.substring(0, 80)}...`, margin + 4, y + 40);
    }

    y += detailHeight + 4;
  });

  // Footer on last page
  if (y > 260) {
    doc.addPage();
    y = 20;
  }

  y += 5;
  doc.setDrawColor(goldR, goldG, goldB);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  const disclaimer = 'Disclaimer: This report is for informational purposes only. Consult a qualified Chartered Accountant before making tax decisions. All strategies are based on the Indian Income Tax Act and commonly accepted interpretations. TaxSmart AI does not provide legal or financial advice.';
  const disclaimerLines = doc.splitTextToSize(disclaimer, contentWidth);
  doc.text(disclaimerLines, margin, y);

  y += disclaimerLines.length * 4 + 5;
  doc.setFillColor(darkR, darkG, darkB);
  doc.rect(0, doc.internal.pageSize.getHeight() - 12, pageWidth, 12, 'F');
  doc.setFontSize(7);
  doc.setTextColor(goldR, goldG, goldB);
  doc.text('TaxSmart AI - India | taxsmart.ai', margin, doc.internal.pageSize.getHeight() - 5);
  doc.setTextColor(150, 150, 150);
  doc.text('100% Legal Strategies | CA-Level Intelligence', pageWidth - margin - 60, doc.internal.pageSize.getHeight() - 5);

  return doc;
}

export function downloadTaxReport(
  userName: string,
  comparison: TaxComparison,
  strategies: Strategy[],
) {
  const doc = generateTaxReport(userName, comparison, strategies);
  doc.save(`TaxSmart_AI_Report_${userName.replace(/\s+/g, '_')}.pdf`);
}

export function getTaxReportBlob(
  userName: string,
  comparison: TaxComparison,
  strategies: Strategy[],
): Blob {
  const doc = generateTaxReport(userName, comparison, strategies);
  return doc.output('blob');
}
