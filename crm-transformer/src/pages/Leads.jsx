import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import { LeadSchema } from '../lib/validators';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import ImportLeads from '../components/ImportLeads';
import { 
  Plus, 
  Upload, 
  Trash2, 
  Edit2, 
  UserCheck, 
  Users, 
  TrendingUp, 
  AlertTriangle 
} from 'lucide-react';
import { toast } from 'sonner';

export default function Leads() {
  const { 
    leads, 
    addLead, 
    updateLead, 
    deleteLead, 
    settings, 
    team, 
    stages 
  } = useCRM();
  
  const navigate = useNavigate();

  // State Variables
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});

  // Filter
  const [statusFilter, setStatusFilter] = useState('all');

  // Load configuration options
  const requirementOptions = settings?.requirement_options || [];
  const sourceOptions = settings?.lead_sources || [];
  const teamMembers = team || [];

  const emptyLead = {
    name: '',
    company: '',
    phone: '',
    email: '',
    source: sourceOptions[0] || 'Manual',
    status: 'Warm',
    stage: stages[0]?.slug || 'new',
    budget: '',
    requirement: requirementOptions[0] || '',
    deal_value: 0,
    won_amount: 0,
    notes: '',
    assigned_to: null,
    lost_reason: '',
    next_followup: null
  };

  const handleOpenAdd = () => {
    setFormData(emptyLead);
    setFormErrors({});
    setSelectedLeadId(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (lead, e) => {
    e.stopPropagation();
    setFormData({
      ...lead,
      deal_value: parseFloat(lead.deal_value) || 0,
      won_amount: parseFloat(lead.won_amount) || 0,
      assigned_to: lead.assigned_to ? Number(lead.assigned_to) : null
    });
    setFormErrors({});
    setSelectedLeadId(lead.id);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (leadId, e) => {
    e.stopPropagation();
    setSelectedLeadId(leadId);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedLeadId) {
      await deleteLead(selectedLeadId);
      setIsDeleteOpen(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    try {
      // Validate
      const cleanData = {
        ...formData,
        deal_value: parseFloat(formData.deal_value) || 0,
        won_amount: parseFloat(formData.won_amount) || 0,
        assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null
      };

      LeadSchema.parse(cleanData);

      if (selectedLeadId) {
        await updateLead(selectedLeadId, cleanData);
        toast.success('Lead updated successfully!');
      } else {
        await addLead(cleanData);
      }

      setIsFormOpen(false);
    } catch (err) {
      // Zod v4 uses err.issues as the primary array; v3 used err.errors
      const zodIssues = err?.issues || err?.errors;
      if (zodIssues?.length) {
        console.error('Validation Errors:', JSON.stringify(zodIssues, null, 2));
        const fieldErrors = {};
        const messages = [];
        zodIssues.forEach(issue => {
          if (issue.path[0]) fieldErrors[issue.path[0]] = issue.message;
          messages.push(issue.message);
        });
        setFormErrors(fieldErrors);
        toast.error(messages.join(' • '));
      } else {
        console.error(err);
        toast.error(err.message || 'Something went wrong');
      }
    }
  };

  // Status/Score badge formatting
  const getStatusVariant = (status) => {
    switch (status) {
      case 'Hot': return 'rose';
      case 'Warm': return 'amber';
      case 'Cold': return 'slate';
      case 'Converted': return 'green';
      case 'Rejected': return 'red';
      default: return 'slate';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 61) return 'text-emerald-700 bg-emerald-50 border-emerald-100';
    if (score >= 31) return 'text-amber-700 bg-amber-50 border-amber-100';
    return 'text-red-700 bg-red-50 border-red-100';
  };

  const getScoreLabel = (score) => {
    if (score >= 61) return 'High';
    if (score >= 31) return 'Medium';
    return 'Low';
  };

  // Filter leads
  const filteredLeads = useMemo(() => {
    if (statusFilter === 'all') return leads;
    return leads.filter(l => l.status === statusFilter);
  }, [leads, statusFilter]);

  // Column definitions for DataTable
  const columns = [
    {
      title: 'Lead Name',
      key: 'name',
      sortable: true,
      render: (row) => (
        <div className="space-y-0.5">
          <p className="font-bold text-slate-800 text-sm">{row.name}</p>
          <p className="text-[11px] font-semibold text-slate-400">{row.company || 'No Company'}</p>
        </div>
      )
    },
    {
      title: 'Contact Info',
      key: 'phone',
      sortable: true,
      render: (row) => (
        <div className="space-y-0.5 text-xs">
          <p className="font-semibold text-slate-600">{row.phone || '-'}</p>
          <p className="text-slate-400">{row.email || '-'}</p>
        </div>
      )
    },
    {
      title: 'Source',
      key: 'source',
      sortable: true,
      render: (row) => <Badge variant="indigo">{row.source}</Badge>
    },
    {
      title: 'Score',
      key: 'lead_score',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5 select-none">
          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border ${getScoreColor(row.lead_score)}`}>
            {row.lead_score}
          </span>
          <span className="text-[11px] text-slate-400 font-semibold">{getScoreLabel(row.lead_score)}</span>
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      sortable: true,
      render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge>
    },
    {
      title: 'Deal Value',
      key: 'deal_value',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-slate-700 text-sm">
          ₹{(parseFloat(row.deal_value) || 0).toLocaleString('en-IN')}
        </span>
      )
    },
    {
      title: 'Assigned To',
      key: 'assigned_to',
      render: (row) => {
        if (!row.assigned_to) return <span className="text-xs text-slate-400">Unassigned</span>;
        const member = teamMembers.find(t => t.id === Number(row.assigned_to));
        return (
          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
            {member ? member.name : 'Unknown'}
          </span>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => handleOpenEdit(row, e)}
            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
            title="Edit Lead"
            aria-label={`Edit lead: ${row.name}`}
          >
            <Edit2 className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            onClick={(e) => handleOpenDelete(row.id, e)}
            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="Delete Lead"
            aria-label={`Delete lead: ${row.name}`}
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Subheader page config */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Leads Hub</h2>
          <p className="text-xs text-slate-500">Add, segment, and track pipeline leads. Click a row to view complete timeline.</p>
        </div>
      </div>

      {/* Segment filters + Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Segment:</span>
          <div className="flex gap-1.5">
            {['all', 'Hot', 'Warm', 'Cold', 'Converted', 'Rejected'].map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  statusFilter === tab 
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-700 border border-transparent'
                }`}
              >
                {tab === 'all' ? 'All Leads' : tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Import CSV
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Table Section */}
      {filteredLeads.length > 0 ? (
        <DataTable
          columns={columns}
          data={filteredLeads}
          searchKey="name"
          searchPlaceholder="Search leads by name..."
          onRowClick={(row) => navigate(`/leads/${row.id}`)}
        />
      ) : (
        <EmptyState
          icon={Users}
          title="No Leads Found"
          description={
            statusFilter === 'all' 
              ? 'Get started by creating your first sales lead or uploading a bulk CSV list.'
              : `You don't have any leads classified as '${statusFilter}' at the moment.`
          }
          actionLabel="Create Lead"
          onAction={handleOpenAdd}
        />
      )}

      {/* CSV Import Modal */}
      <ImportLeads isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Lead"
        message="Are you absolutely sure you want to delete this lead? All associated quotations, tasks, and activity logs will be permanently deleted."
      />

      {/* Lead Add/Edit Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={selectedLeadId ? 'Edit Sales Lead' : 'Add New Sales Lead'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Lead Name *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Rajesh Sharma"
                className={`p-2.5 text-sm border rounded-xl bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all ${
                  formErrors.name ? 'border-red-500 focus:ring-red-100' : 'border-slate-200'
                }`}
              />
              {formErrors.name && <span className="text-[11px] text-red-500 font-semibold">{formErrors.name}</span>}
            </div>

            {/* Company */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Company Name</label>
              <input
                type="text"
                value={formData.company || ''}
                onChange={e => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. Sharma Logistics"
                className={`p-2.5 text-sm border rounded-xl bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all ${
                  formErrors.company ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {formErrors.company && <span className="text-[11px] text-red-500 font-semibold">{formErrors.company}</span>}
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Phone Number</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +91 98765 43210"
                className={`p-2.5 text-sm border rounded-xl bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all ${
                  formErrors.phone ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {formErrors.phone && <span className="text-[11px] text-red-500 font-semibold">{formErrors.phone}</span>}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Email Address</label>
              <input
                type="text"
                value={formData.email || ''}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. rajesh@sharmalogistics.com"
                className={`p-2.5 text-sm border rounded-xl bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all ${
                  formErrors.email ? 'border-red-500 focus:ring-red-100' : 'border-slate-200'
                }`}
              />
              {formErrors.email && <span className="text-[11px] text-red-500 font-semibold">{formErrors.email}</span>}
            </div>

            {/* Source */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Lead Source</label>
              <select
                value={formData.source || 'Manual'}
                onChange={e => setFormData({ ...formData, source: e.target.value })}
                className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                {sourceOptions.map(src => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Status</label>
              <select
                value={formData.status || 'Warm'}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                <option value="Hot">🔥 Hot</option>
                <option value="Warm">☀️ Warm</option>
                <option value="Cold">❄️ Cold</option>
                <option value="Converted">✅ Converted</option>
                <option value="Rejected">❌ Rejected</option>
              </select>
            </div>

            {/* Stage */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Pipeline Stage</label>
              <select
                value={formData.stage || ''}
                onChange={e => setFormData({ ...formData, stage: e.target.value })}
                className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                {stages.map(stg => (
                  <option key={stg.slug} value={stg.slug}>{stg.title}</option>
                ))}
              </select>
            </div>

            {/* Assigned to */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Assign Sales Rep</label>
              <select
                value={formData.assigned_to || ''}
                onChange={e => setFormData({ ...formData, assigned_to: e.target.value ? Number(e.target.value) : null })}
                className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                <option value="">-- Unassigned --</option>
                {teamMembers.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>

            {/* Requirement */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Requirement</label>
              <select
                value={formData.requirement || ''}
                onChange={e => setFormData({ ...formData, requirement: e.target.value })}
                className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                {requirementOptions.map(req => (
                  <option key={req} value={req}>{req}</option>
                ))}
              </select>
            </div>

            {/* Budget (Free Text) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Budget Range</label>
              <input
                type="text"
                value={formData.budget || ''}
                onChange={e => setFormData({ ...formData, budget: e.target.value })}
                placeholder="e.g. ₹5 Lakh, 50k, negotiable"
                className={`p-2.5 text-sm border rounded-xl bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all ${
                  formErrors.budget ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {formErrors.budget && <span className="text-[11px] text-red-500 font-semibold">{formErrors.budget}</span>}
            </div>

            {/* Deal Value */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Deal Value (₹) *</label>
              <input
                type="number"
                value={formData.deal_value === 0 ? '' : formData.deal_value}
                onChange={e => setFormData({ ...formData, deal_value: e.target.value })}
                placeholder="e.g. 500000"
                className={`p-2.5 text-sm border rounded-xl bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all ${
                  formErrors.deal_value ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {formErrors.deal_value && <span className="text-[11px] text-red-500 font-semibold">{formErrors.deal_value}</span>}
            </div>

            {/* Won Amount */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Won / Collected Amount (₹)</label>
              <input
                type="number"
                value={formData.won_amount === 0 ? '' : formData.won_amount}
                onChange={e => setFormData({ ...formData, won_amount: e.target.value })}
                placeholder="e.g. 250000"
                className={`p-2.5 text-sm border rounded-xl bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all ${
                  formErrors.won_amount ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {formErrors.won_amount && <span className="text-[11px] text-red-500 font-semibold">{formErrors.won_amount}</span>}
            </div>
          </div>

          {/* Lost Reason (Only shown if stage is rejected or status is Rejected) */}
          {(formData.stage === 'rejected' || formData.status === 'Rejected') && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Reason for Lead Loss</label>
              <input
                type="text"
                value={formData.lost_reason || ''}
                onChange={e => setFormData({ ...formData, lost_reason: e.target.value })}
                placeholder="e.g. Price too high, competitor selected"
                className={`p-2.5 text-sm border rounded-xl bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all ${
                  formErrors.lost_reason ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {formErrors.lost_reason && <span className="text-[11px] text-red-500 font-semibold">{formErrors.lost_reason}</span>}
            </div>
          )}

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">Notes & Requirements Details</label>
            <textarea
              rows="3"
              value={formData.notes || ''}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Provide background context or customer request details..."
              className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Save Lead
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
