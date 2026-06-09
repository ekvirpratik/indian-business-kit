import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import { QuotationSchema } from '../lib/validators';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Download, 
  MessageCircle, 
  PlusCircle, 
  Trash, 
  Check, 
  X,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

// Helper image fetcher
const getBase64ImageFromUrl = async (imageUrl) => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('data:')) return imageUrl;
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error fetching image for PDF:', error);
    return null;
  }
};

export default function Quotations() {
  const { 
    quotations, 
    leads, 
    settings, 
    addQuotation, 
    updateQuotation, 
    deleteQuotation,
    addWhatsAppLog
  } = useCRM();

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const createQueryParam = searchParams.get('create');
  const leadIdQueryParam = searchParams.get('leadId');

  // View state: 'list' or 'form'
  const [viewMode, setViewMode] = useState('list');
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    lead_id: null,
    quotation_no: '',
    items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
    gst_percent: 18,
    notes: '',
    valid_until: '',
    status: 'Draft'
  });
  const [formErrors, setFormErrors] = useState({});

  // Auto-generate invoice/quotation number
  const generateQuotationNo = () => {
    const random = Math.floor(100 + Math.random() * 900);
    return `QT-${new Date().getFullYear()}-${random}`;
  };

  // Switch to Form mode if query params are present
  useEffect(() => {
    if (createQueryParam === 'true') {
      const initialLeadId = leadIdQueryParam ? Number(leadIdQueryParam) : null;
      // Defer setState calls out of the synchronous effect body to avoid cascading renders
      setTimeout(() => {
        setFormData({
          lead_id: initialLeadId,
          quotation_no: generateQuotationNo(),
          items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
          gst_percent: 18,
          notes: settings?.wa_template ? 'Standard proposal conditions apply.' : '',
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days valid
          status: 'Draft'
        });
        setFormErrors({});
        setSelectedQuoteId(null);
        setViewMode('form');
      }, 0);
    } else {
      setTimeout(() => setViewMode('list'), 0);
    }
  }, [createQueryParam, leadIdQueryParam, settings]);

  // Handle forms items additions/deletions
  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, rate: 0, amount: 0 }]
    }));
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length === 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items];
      const current = { ...newItems[index] };
      
      if (field === 'description') {
        current.description = value;
      } else if (field === 'quantity') {
        current.quantity = Math.max(1, parseInt(value) || 0);
        current.amount = current.quantity * current.rate;
      } else if (field === 'rate') {
        current.rate = Math.max(0, parseFloat(value) || 0);
        current.amount = current.quantity * current.rate;
      }

      newItems[index] = current;
      return { ...prev, items: newItems };
    });
  };

  // Subtotal/GST calculations
  const totals = useMemo(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const gstAmount = subtotal * (formData.gst_percent / 100);
    const total = subtotal + gstAmount;
    return { subtotal, gstAmount, total };
  }, [formData.items, formData.gst_percent]);

  // Submit Form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    try {
      const payload = {
        ...formData,
        lead_id: formData.lead_id ? Number(formData.lead_id) : null,
        gst_percent: parseFloat(formData.gst_percent) || 0,
        subtotal: totals.subtotal,
        gst_amount: totals.gstAmount,
        total: totals.total
      };

      // Zod validation check
      QuotationSchema.parse(payload);

      if (selectedQuoteId) {
        await updateQuotation(selectedQuoteId, payload);
        toast.success('Quotation updated!');
      } else {
        await addQuotation(payload);
      }

      // Back to list
      setSearchParams({});
    } catch (err) {
      const zodIssues = err?.issues || err?.errors;
      if (zodIssues?.length) {
        const fieldErrors = {};
        const messages = [];
        zodIssues.forEach(issue => {
          if (issue.path[0]) fieldErrors[issue.path[0]] = issue.message;
          messages.push(issue.message);
        });
        setFormErrors(fieldErrors);
        toast.error(messages.join(' • '));
      } else {
        toast.error('Failed to create proposal');
      }
    }
  };

  // PDF Download Helper
  const handleDownloadPDF = async (quote) => {
    toast.info('Generating PDF document...');
    const lead = leads.find(l => l.id === Number(quote.lead_id));
    
    const doc = new jsPDF();
    let logoData = null;
    
    if (settings?.logo_url) {
      logoData = await getBase64ImageFromUrl(settings.logo_url);
    }

    let currentY = 25;
    let textX = 20;

    if (logoData) {
      try {
        doc.addImage(logoData, 'PNG', 20, currentY - 8, 12, 12);
        textX = 35;
      } catch (e) {
        console.error(e);
      }
    }

    doc.setFontSize(20);
    doc.setTextColor(99, 102, 241);
    doc.setFont('helvetica', 'bold');
    doc.text(settings?.company_name || 'Our Company', textX, currentY);

    doc.setFontSize(16);
    doc.setTextColor(31, 41, 55);
    doc.text('PROPOSAL / QUOTATION', 130, currentY);

    currentY += 10;
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    
    doc.text(`Quotation No: ${quote.quotation_no}`, 130, currentY);
    doc.text(`Date: ${new Date(quote.created_at).toLocaleDateString('en-IN')}`, 130, currentY + 6);
    doc.text(`Valid Until: ${quote.valid_until || 'N/A'}`, 130, currentY + 12);

    const ownerDetails = [
      settings?.owner_name ? `Contact: ${settings.owner_name} (${settings.owner_role || 'Owner'})` : '',
      settings?.whatsapp ? `WhatsApp: ${settings.whatsapp}` : '',
      settings?.email ? `Email: ${settings.email}` : ''
    ].filter(Boolean);

    let leftY = currentY;
    ownerDetails.forEach(line => {
      doc.text(line, textX, leftY);
      leftY += 6;
    });

    currentY = Math.max(leftY, currentY + 18);
    doc.setDrawColor(229, 231, 235);
    doc.line(20, currentY, 190, currentY);

    currentY += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text('Proposal Prepared For:', 20, currentY);

    doc.setFont('helvetica', 'normal');
    currentY += 6;
    doc.text(lead ? lead.name : 'Client Name', 20, currentY);
    if (lead?.company) {
      currentY += 5;
      doc.text(lead.company, 20, currentY);
    }
    if (lead?.phone) {
      currentY += 5;
      doc.text(`Phone: ${lead.phone}`, 20, currentY);
    }
    if (lead?.email) {
      currentY += 5;
      doc.text(`Email: ${lead.email}`, 20, currentY);
    }

    currentY += 15;
    doc.setFillColor(243, 244, 246);
    doc.rect(20, currentY - 5, 170, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Description', 25, currentY);
    doc.text('Qty', 110, currentY);
    doc.text('Rate', 135, currentY);
    doc.text('Amount', 165, currentY);

    doc.setFont('helvetica', 'normal');
    currentY += 8;

    quote.items.forEach((item, i) => {
      if (i % 2 !== 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(20, currentY - 5, 170, 8, 'F');
      }
      doc.text(item.description, 25, currentY);
      doc.text(String(item.quantity), 110, currentY);
      doc.text(`Rs. ${(item.rate).toFixed(2)}`, 135, currentY);
      doc.text(`Rs. ${(item.amount).toFixed(2)}`, 165, currentY);
      currentY += 8;
    });

    doc.line(20, currentY, 190, currentY);
    currentY += 8;

    doc.text('Subtotal:', 125, currentY);
    doc.text(`Rs. ${(quote.subtotal || 0).toFixed(2)}`, 165, currentY);

    currentY += 6;
    doc.text(`GST (${quote.gst_percent}%):`, 125, currentY);
    doc.text(`Rs. ${(quote.gst_amount || 0).toFixed(2)}`, 165, currentY);

    currentY += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('Grand Total:', 125, currentY);
    doc.text(`Rs. ${(quote.total || 0).toFixed(2)}`, 165, currentY);

    if (quote.notes) {
      currentY += 15;
      doc.setFont('helvetica', 'bold');
      doc.text('Notes / Special Conditions:', 20, currentY);
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(quote.notes, 170);
      doc.text(splitNotes, 20, currentY + 5);
    }

    doc.save(`Quote_${quote.quotation_no}.pdf`);
    toast.success('Proposal PDF downloaded!');
  };

  // WhatsApp share
  const handleShareWhatsApp = (quote) => {
    const lead = leads.find(l => l.id === Number(quote.lead_id));
    if (!lead || !lead.phone) {
      toast.error('No phone number found for this lead.');
      return;
    }

    const message = `Hi ${lead.name},\n\nWe have generated a commercial proposal (${quote.quotation_no}) regarding your requirements.\n\n*Total Amount:* ₹${quote.total.toLocaleString('en-IN')}\n*Valid Until:* ${quote.valid_until || '-'}\n\nPlease let us know if you have any questions. Thank you!\n\n-${settings?.company_name || 'Sales Team'}`;

    const phoneClean = lead.phone.replace(/[^0-9]/g, '');
    const phonePrefixed = phoneClean.startsWith('91') ? phoneClean : `91${phoneClean}`;
    const url = `https://wa.me/${phonePrefixed}?text=${encodeURIComponent(message)}`;

    // Log the message
    addWhatsAppLog({
      lead_id: lead.id,
      phone: lead.phone,
      message: message,
      status: 'sent'
    });

    window.open(url, '_blank');
  };

  const handleOpenDelete = (id) => {
    setSelectedQuoteId(id);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedQuoteId) {
      await deleteQuotation(selectedQuoteId);
      setIsDeleteOpen(false);
    }
  };

  const handleUpdateStatus = async (quote, nextStatus) => {
    await updateQuotation(quote.id, { status: nextStatus });
    toast.success(`Quotation marked as ${nextStatus}`);
  };

  const listColumns = [
    {
      title: 'Quotation No',
      key: 'quotation_no',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <FileText className="w-4.5 h-4.5 text-indigo-500 flex-shrink-0" />
          <span className="font-bold text-slate-800">{row.quotation_no}</span>
        </div>
      )
    },
    {
      title: 'Recipient Lead',
      key: 'lead_id',
      render: (row) => {
        if (!row.lead_id) return <span className="text-xs text-slate-400">-</span>;
        const lead = leads.find(l => l.id === Number(row.lead_id));
        return (
          <button
            onClick={() => lead && navigate(`/leads/${lead.id}`)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer text-left"
          >
            {lead ? lead.name : 'Unknown Lead'}
          </button>
        );
      }
    },
    {
      title: 'Grand Total',
      key: 'total',
      sortable: true,
      render: (row) => (
        <span className="font-extrabold text-slate-700 text-sm">
          ₹{row.total.toLocaleString('en-IN')}
        </span>
      )
    },
    {
      title: 'Valid Until',
      key: 'valid_until',
      sortable: true,
      render: (row) => <span className="text-xs text-slate-500 font-medium">{row.valid_until || '-'}</span>
    },
    {
      title: 'Status',
      key: 'status',
      sortable: true,
      render: (row) => {
        const variants = {
          Draft: 'slate',
          Sent: 'indigo',
          Accepted: 'emerald',
          Rejected: 'red'
        };
        return <Badge variant={variants[row.status]}>{row.status}</Badge>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          {/* Status Updates */}
          {row.status === 'Draft' && (
            <button
              onClick={() => handleUpdateStatus(row, 'Sent')}
              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
              title="Mark Sent"
            >
              <Clock className="w-3.5 h-3.5" />
            </button>
          )}
          {row.status === 'Sent' && (
            <>
              <button
                onClick={() => handleUpdateStatus(row, 'Accepted')}
                className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                title="Mark Accepted"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleUpdateStatus(row, 'Rejected')}
                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Mark Rejected"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {/* Share */}
          <button
            onClick={() => handleShareWhatsApp(row)}
            className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
            title="Share via WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
          
          {/* Download PDF */}
          <button
            onClick={() => handleDownloadPDF(row)}
            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </button>
          
          {/* Delete */}
          <button
            onClick={() => handleOpenDelete(row.id)}
            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="Delete Quote"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {viewMode === 'list' ? (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">Quotations & Proposals</h2>
              <p className="text-xs text-slate-500">Generate commercial estimates and PDF quotes. Accept quotes to win deals.</p>
            </div>
            <button
              onClick={() => setSearchParams({ create: 'true' })}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Create Quote
            </button>
          </div>

          {quotations.length > 0 ? (
            <DataTable
              columns={listColumns}
              data={quotations}
              searchKey="quotation_no"
              searchPlaceholder="Search by number..."
            />
          ) : (
            <EmptyState
              icon={FileText}
              title="No Quotations Created"
              description="Easily generate professional estimations, apply GST tax, and export them as PDFs."
              actionLabel="Create Quotation"
              onAction={() => setSearchParams({ create: 'true' })}
            />
          )}
        </>
      ) : (
        /* Create / Edit View Mode */
        <div className="space-y-6 animate-in fade-in-0 duration-200">
          {/* Navigation */}
          <button
            onClick={() => setSearchParams({})}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Proposals</span>
          </button>

          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Builder Column (70%) */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 flex-shrink-0">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Quotation Editor</h3>
                <span className="text-xs font-bold text-slate-400 bg-slate-50 border border-slate-150 px-2.5 py-1 rounded-xl">
                  {formData.quotation_no}
                </span>
              </div>

              {/* Recipient */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">Select Customer Lead *</label>
                  <select
                    value={formData.lead_id || ''}
                    onChange={e => setFormData({ ...formData, lead_id: e.target.value ? Number(e.target.value) : null })}
                    className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                  >
                    <option value="">-- Select Lead --</option>
                    {leads.map(lead => (
                      <option key={lead.id} value={lead.id}>{lead.name} ({lead.company || 'No Company'})</option>
                    ))}
                  </select>
                  {formErrors.lead_id && <span className="text-[11px] text-red-500 font-semibold">{formErrors.lead_id}</span>}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-600">Proposal Validity *</label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={e => setFormData({ ...formData, valid_until: e.target.value })}
                    className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  {formErrors.valid_until && <span className="text-[11px] text-red-500 font-semibold">{formErrors.valid_until}</span>}
                </div>
              </div>

              {/* Items Line Editor */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Line Items</h4>
                </div>

                {formErrors.items && <span className="text-[11px] text-red-500 font-semibold block">{formErrors.items}</span>}

                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-3 items-end bg-slate-50/50 border border-slate-150 p-4 rounded-xl relative group">
                      <div className="flex-1 space-y-1.5 w-full">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={e => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Project design, license, implementation service"
                          className="w-full p-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      
                      <div className="w-24 space-y-1.5 flex-shrink-0">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Qty</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-full p-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-500 text-center"
                        />
                      </div>

                      <div className="w-32 space-y-1.5 flex-shrink-0">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rate (₹)</label>
                        <input
                          type="number"
                          value={item.rate === 0 ? '' : item.rate}
                          onChange={e => handleItemChange(index, 'rate', e.target.value)}
                          placeholder="0.00"
                          className="w-full p-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-500 text-right font-semibold"
                        />
                      </div>

                      <div className="w-28 space-y-1.5 flex-shrink-0">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount (₹)</label>
                        <div className="w-full p-2 text-sm border border-slate-100 rounded-lg bg-slate-100 text-right font-extrabold text-slate-700">
                          {(item.amount).toLocaleString('en-IN')}
                        </div>
                      </div>

                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 text-slate-400 hover:text-red-500 rounded-lg border border-transparent hover:border-red-100 bg-white transition-colors cursor-pointer"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-dashed border-indigo-200 rounded-xl px-4 py-2 w-full justify-center transition-all cursor-pointer mt-2"
                >
                  <PlusCircle className="w-4 h-4" /> Add Item Line
                </button>
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1.5 pt-2">
                <label className="text-xs font-semibold text-slate-600">Proposal Terms / Notes</label>
                <textarea
                  rows="3"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Terms of payment, project schedule, support services details..."
                  className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
            </div>

            {/* Right Summary Column (30%) */}
            <div className="space-y-6">
              {/* Financial Totals summary card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Deal Summary</h4>
                
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-700">₹{totals.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-slate-500 gap-3">
                    <span className="flex-shrink-0">GST Tax (%):</span>
                    <input
                      type="number"
                      value={formData.gst_percent}
                      onChange={e => setFormData({ ...formData, gst_percent: parseFloat(e.target.value) || 0 })}
                      className="w-16 p-1 text-center border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-between text-slate-500">
                    <span>Tax Amount:</span>
                    <span className="font-semibold text-slate-700">₹{totals.gstAmount.toLocaleString('en-IN')}</span>
                  </div>
                  
                  <div className="h-px bg-slate-100 my-2" />

                  <div className="flex justify-between text-slate-800 font-extrabold text-sm pt-1">
                    <span>Grand Total:</span>
                    <span className="text-indigo-600 text-base">₹{totals.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Status / Publish Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Proposal Status</h4>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Option</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="p-2.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer text-center"
                  >
                    Save Proposal
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchParams({})}
                    className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                  >
                    Discard
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Quotation"
        message="Are you sure you want to permanently delete this commercial quotation?"
      />
    </div>
  );
}
