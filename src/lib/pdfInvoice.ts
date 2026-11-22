import { jsPDF } from 'jspdf';
import { InvoiceRecord, SiteSettings } from '../types/hostnova';
import { formatDateShort, formatUSD } from './pricing';

async function loadImageAsDataUrl(url: string): Promise<{ dataUrl: string; ratio: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 600;
        canvas.height = img.naturalHeight || 200;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL('image/png'),
          ratio: canvas.width / Math.max(1, canvas.height),
        });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function downloadInvoicePdf(invoice: InvoiceRecord, settings: SiteSettings): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;

  // Top dark navy accent stripe
  doc.setFillColor(11, 18, 36);
  doc.rect(0, 0, pageWidth, 8, 'F');

  // Header: Logo on left, Invoice badge on right
  let headerY = 18;
  const logoImg = await loadImageAsDataUrl(settings.logoUrl);
  if (logoImg) {
    const logoHeight = 16;
    const logoWidth = Math.min(62, logoHeight * logoImg.ratio);
    doc.addImage(logoImg.dataUrl, 'PNG', margin, headerY, logoWidth, logoHeight);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text(settings.companyName.toUpperCase(), margin, headerY + 10);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(37, 99, 235);
  doc.text('INVOICE', pageWidth - margin, headerY + 7, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(settings.tagline, pageWidth - margin, headerY + 13, { align: 'right' });

  // Invoice Metadata & Customer Information 2-column grid
  let y = 44;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y - 3, pageWidth - margin, y - 3);

  // Left: Billed To
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('CUSTOMER INFORMATION', margin, y + 3);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.customerName, margin, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  doc.text(invoice.customerEmail, margin, y + 16);
  doc.text(
    `Domain: ${invoice.domain ? invoice.domain : 'No Domain Provided'}`,
    margin,
    y + 22
  );

  // Right: Invoice Details
  const rightColX = pageWidth / 2 + 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('INVOICE DETAILS', rightColX, y + 3);

  const displayPaymentStatus = invoice.paymentStatus === 'DEMO PAID' ? 'PAID' : invoice.paymentStatus;
  const metaRows: [string, string][] = [
    ['Invoice Number:', invoice.invoiceNumber],
    ['Invoice Date:', formatDateShort(invoice.invoiceDate)],
    ['Order Number:', invoice.orderNumber],
    ['Payment Status:', displayPaymentStatus],
  ];

  let metaY = y + 10;
  metaRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(label, rightColX, metaY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(label === 'Payment Status:' ? 22 : 15, label === 'Payment Status:' ? 163 : 23, label === 'Payment Status:' ? 74 : 42);
    doc.text(value, pageWidth - margin, metaY, { align: 'right' });
    metaY += 5.5;
  });

  // Order Breakdown Table
  y += 38;
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('HOSTING SERVICE DESCRIPTION', margin + 4, y + 6);
  doc.text('DURATION', margin + 102, y + 6);
  doc.text('MONTHLY', margin + 132, y + 6, { align: 'right' });
  doc.text('AMOUNT (USD)', pageWidth - margin - 4, y + 6, { align: 'right' });

  y += 9;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 24, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${invoice.planNameSnapshot} Web Hosting Plan`, margin + 4, y + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `${invoice.storageSnapshot} GB SSD Storage  |  Up to ${invoice.websiteLimitSnapshot} ${
      invoice.websiteLimitSnapshot === 1 ? 'Website' : 'Websites'
    }  |  Free SSL Certificate`,
    margin + 4,
    y + 13.5
  );
  doc.text(
    `Domain: ${invoice.domain ? invoice.domain : 'No Domain Provided'}`,
    margin + 4,
    y + 19.5
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `${invoice.durationMonths} ${invoice.durationMonths === 1 ? 'Month' : 'Months'}`,
    margin + 102,
    y + 9
  );
  doc.text(formatUSD(invoice.baseMonthlyPriceSnapshot), margin + 132, y + 9, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text(formatUSD(invoice.originalTotal), pageWidth - margin - 4, y + 9, { align: 'right' });

  // Financial Summary Box (Right-aligned)
  y += 32;
  const summaryX = pageWidth - margin - 82;
  const summaryRows: [string, string, boolean?][] = [
    ['Base Monthly Price', formatUSD(invoice.baseMonthlyPriceSnapshot)],
    ['Discounted Monthly Price', formatUSD(invoice.discountedMonthlyPrice)],
    ['Original Total', formatUSD(invoice.originalTotal)],
    [
      `Subscription Discount (${invoice.discountPercentage}%)`,
      invoice.discountAmount > 0 ? `-${formatUSD(invoice.discountAmount)}` : formatUSD(0),
    ],
  ];

  summaryRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text(label, summaryX, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(value, pageWidth - margin, y, { align: 'right' });
    y += 6.5;
  });

  doc.setDrawColor(203, 213, 225);
  doc.line(summaryX, y - 2, pageWidth - margin, y - 2);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Final Total (USD)', summaryX, y);
  doc.setTextColor(37, 99, 235);
  doc.text(formatUSD(invoice.finalTotal), pageWidth - margin, y, { align: 'right' });

  // Payment Information Block
  y += 18;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 30, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('PAYMENT INFORMATION', margin + 5, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Payment Method: ${invoice.paymentMethod.replace(/\s*\(Demo\)/gi, '')}`, margin + 5, y + 14.5);
  doc.text(`Transaction ID: ${invoice.transactionId}`, margin + 5, y + 21);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.text(`Payment Status: ${displayPaymentStatus}`, margin + 5, y + 27);

  // Company Footer
  const footerY = 268;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${settings.companyName} — ${settings.tagline}`, margin, footerY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`${settings.companyEmail}  |  ${settings.companyAddress}`, margin, footerY + 5);
  doc.text(
    'Thank you for choosing HostNova. Retain this invoice for your billing records.',
    margin,
    footerY + 10
  );

  doc.save(`HostNova-Invoice-${invoice.invoiceNumber}.pdf`);
}
