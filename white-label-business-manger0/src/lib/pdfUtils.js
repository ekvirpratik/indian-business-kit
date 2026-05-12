import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

/**
 * Fetches an image from a URL and converts it to a base64 Data URI.
 * Required because jsPDF handles base64 reliably but struggles with remote URLs.
 */
const getBase64ImageFromUrl = async (imageUrl) => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('data:')) return imageUrl;
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error fetching image for PDF:', error);
    toast.error('Error fetching image for PDF: ' + error.message);
    return null;
  }
};

const getImageFormat = (dataUrl) => {
  if (dataUrl.startsWith('data:image/png')) return 'PNG';
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'JPEG';
  if (dataUrl.startsWith('data:image/webp')) return 'WEBP';
  return 'PNG'; // default fallback
};

/**
 * Shared utility to generate and download an invoice PDF.
 * @param {Object} transaction - The transaction object (sale or purchase).
 * @param {Object} store - The store object from DataContext.
 */
export const generatePDF = async (transaction, store) => {
    const doc = new jsPDF();
    const businessInfo = store.businessInfo;
    
    // Resolve images to base64 before building the PDF
    let logoData = null;
    let qrData = null;
    
    if (businessInfo.logo) {
      logoData = await getBase64ImageFromUrl(businessInfo.logo);
    }
    
    if (store.bankQR) {
      qrData = await getBase64ImageFromUrl(store.bankQR);
    }
    
    // Header
    let currentY = 25;
    let textX = 20;
    
    // Add Logo if exists (as a small icon to the left of name)
    if (logoData) {
      try {
        const logoSize = 12; // Smaller size for icon look
        const format = getImageFormat(logoData);
        doc.addImage(logoData, format, 20, currentY - 8, logoSize, logoSize);
        textX = 35; // Move text to the right of the logo
      } catch (e) {
        console.error('Failed to add Business Logo to PDF', e);
        toast.error('Failed to add Business Logo to PDF: ' + e.message);
      }
    }

    doc.setFontSize(22);
    doc.setTextColor(13, 148, 136); // Primary Color
    doc.text(businessInfo.name || 'Your Business Name', textX, currentY);
    
    doc.setFontSize(18);
    doc.setTextColor(31, 41, 55);
    const invoiceType = transaction.type === 'purchase' ? 'PURCHASE INVOICE' : 'TAX INVOICE';
    doc.text(invoiceType, 130, currentY);

    currentY += 10;
    doc.setFontSize(10);
    doc.setTextColor(100);

    // Right side column
    doc.text(`Invoice No: ${transaction.invoiceNumber}`, 130, currentY);
    doc.text(`Date: ${new Date(transaction.date).toLocaleDateString()}`, 130, currentY + 6);
    if (transaction.paymentMethod && transaction.paymentMethod !== 'Pending') {
      doc.text(`Payment: ${transaction.paymentMethod}`, 130, currentY + 12);
    }
    
    // Left side column
    // The right column starts at 130, so the max width should be 125 - textX
    const maxWidth = 125 - textX;
    const splitAddress = doc.splitTextToSize(businessInfo.address || 'Business Address', maxWidth);
    doc.text(splitAddress, textX, currentY);
    
    let leftY = currentY + (splitAddress.length * 5) + 2; 

    doc.text(`Phone: ${businessInfo.phone || 'N/A'}`, textX, leftY);
    leftY += 6;
    doc.text(`Email: ${businessInfo.email || 'N/A'}`, textX, leftY);
    if (businessInfo.gst) {
      leftY += 6;
      doc.text(`GST: ${businessInfo.gst}`, textX, leftY);
    }

    currentY = Math.max(leftY, currentY + 12);
    
    // Line Separator
    currentY += 7;
    doc.setDrawColor(229, 231, 235);
    doc.line(20, currentY, 190, currentY);

    // Bill To
    currentY += 10;
    doc.setFontSize(11);
    doc.setTextColor(31, 41, 55);
    doc.setFont('helvetica', 'bold');
    doc.text(`Bill To ${transaction.type === 'purchase' ? '(Supplier)' : '(Customer)'}:`, 20, currentY);
    
    doc.setFont('helvetica', 'normal');
    currentY += 7;
    doc.text(transaction.partyName??'', 20, currentY);
    if (transaction.partyAddress) {
      currentY += 6;
      doc.text(transaction.partyAddress, 20, currentY);
    }
    if (transaction.partyPhone) {
      currentY += 6;
      doc.text(`Phone: ${transaction.partyPhone}`, 20, currentY);
    }
    
    // Products Table Header
    currentY += 16;
    doc.setFillColor(243, 244, 246);
    doc.rect(20, currentY - 6, 170, 10, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Item Description', 25, currentY);
    doc.text('Qty', 85, currentY);
    doc.text('Rate', 110, currentY);
    doc.text('GST%', 135, currentY);
    doc.text('Amount', 160, currentY);
    
    currentY += 10;
    doc.setFont('helvetica', 'normal');
    
    // Table Rows
    transaction.products.forEach((product, i) => {
      // Alternating row colors
      if (i % 2 !== 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(20, currentY - 6, 170, 10, 'F');
      }
      doc.text(product.productName, 25, currentY);
      doc.text(`${product.quantity} ${product.unit}`, 85, currentY);
      doc.text(`Rs. ${product.rate.toFixed(2)}`, 110, currentY);
      doc.text(`${product.taxRate}%`, 135, currentY);
      doc.text(`Rs. ${product.amount.toFixed(2)}`, 160, currentY);
      currentY += 10;
    });
    
    // Totals Area
    doc.line(20, currentY, 190, currentY);
    currentY += 8;

    doc.setFontSize(10);
    doc.text('Subtotal:', 130, currentY);
    doc.text(`Rs. ${transaction.subtotal.toFixed(2)}`, 160, currentY);
    
    if (transaction.taxAmount > 0) {
      currentY += 6;
      doc.text(`Total Tax (GST):`, 130, currentY);
      doc.text(`Rs. ${transaction.taxAmount.toFixed(2)}`, 160, currentY);
    }

    if (transaction.extraCharges && transaction.extraCharges.length > 0) {
      transaction.extraCharges.forEach(charge => {
        currentY += 6;
        doc.text(`${charge.label}:`, 130, currentY);
        doc.text(`Rs. ${charge.amount.toFixed(2)}`, 160, currentY);
      });
    }

    currentY += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount:', 130, currentY);
    doc.setTextColor(13, 148, 136);
    doc.text(`Rs. ${transaction.totalAmount.toFixed(2)}`, 160, currentY);
    
    // Bank Details (Only for Sales)
    if (transaction.type === 'sale' && store.bankDetails.accountNumber) {
      currentY += 20;
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(10);
      doc.text('Bank Details for Payment:', 20, currentY);
      doc.setFont('helvetica', 'normal');
      currentY += 6;
      doc.text(`Bank: ${store.bankDetails.bankName}`, 20, currentY);
      currentY += 6;
      doc.text(`A/C No: ${store.bankDetails.accountNumber}`, 20, currentY);
      currentY += 6;
      doc.text(`IFSC: ${store.bankDetails.ifscCode}`, 20, currentY);
      
      // QR Code check
      if (qrData) {
        try {
          const format = getImageFormat(qrData);
          doc.addImage(qrData, format, 150, currentY - 15, 30, 30);
          doc.setFontSize(8);
          doc.text('Scan to Pay', 156, currentY + 18);
        } catch (e) {
             console.error('Failed to add QR Code to PDF', e);
             toast.error('Failed to add QR Code to PDF: ' + e.message);
        }
      }
    }

    // Footer & Terms
    const pageHeight = doc.internal.pageSize.getHeight();
    let footerY = pageHeight - 30;

    if (businessInfo.termsAndConditions) {
      const splitTerms = doc.splitTextToSize(businessInfo.termsAndConditions, 170);
      const termsHeight = splitTerms.length * 4 + 10;
      footerY = pageHeight - termsHeight - 15;

      if (currentY > footerY) {
         doc.addPage();
         footerY = pageHeight - termsHeight - 15;
      }

      doc.setFontSize(9);
      doc.setTextColor(31, 41, 55);
      doc.setFont('helvetica', 'bold');
      doc.text('Terms & Conditions:', 20, footerY);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(splitTerms, 20, footerY + 5);
    } else {
      if (currentY > footerY) doc.addPage();
    }

    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.text('Thank you for your business!', 105, pageHeight - 10, null, null, 'center');
    
    // Execute download
    const filename = `${transaction.invoiceNumber}_${transaction.date}.pdf`;
    doc.save(filename);
};
