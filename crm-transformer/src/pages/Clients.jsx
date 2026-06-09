import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import DataTable from '../components/ui/DataTable';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { Briefcase, Download, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function Clients() {
  const { leads, deleteLead } = useCRM();
  const navigate = useNavigate();

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(null);

  // Filter Converted leads
  const clients = useMemo(() => {
    return leads.filter(l => l.status === 'Converted');
  }, [leads]);

  const handleExportCSV = () => {
    if (clients.length === 0) {
      toast.error('No clients to export.');
      return;
    }

    const headers = ['Client Name', 'Company', 'Project Value', 'Won Amount', 'Phone', 'Email', 'Requirement', 'Date Added'];
    const rows = clients.map(c => [
      c.name,
      c.company || '',
      c.deal_value || 0,
      c.won_amount || 0,
      c.phone || '',
      c.email || '',
      c.requirement || '',
      c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `clients_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Clients list exported successfully!');
  };

  const handleOpenDelete = (id, e) => {
    e.stopPropagation();
    setSelectedClientId(id);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedClientId) {
      await deleteLead(selectedClientId);
      setIsDeleteOpen(false);
    }
  };

  const columns = [
    {
      title: 'Client Name',
      key: 'name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs border border-emerald-100 flex-shrink-0">
            {(row.name || 'C').charAt(0).toUpperCase()}
          </div>
          <strong>{row.name || 'Unnamed Client'}</strong>
        </div>
      )
    },
    {
      title: 'Company',
      key: 'company',
      sortable: true,
      render: (row) => <span className="font-semibold text-slate-600">{row.company || '-'}</span>
    },
    {
      title: 'Project Value',
      key: 'deal_value',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-slate-700 text-sm">
          ₹{(parseFloat(row.deal_value) || 0).toLocaleString('en-IN')}
        </span>
      )
    },
    {
      title: 'Collected Amount',
      key: 'won_amount',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-emerald-600 text-sm">
          ₹{(parseFloat(row.won_amount) || 0).toLocaleString('en-IN')}
        </span>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: () => <Badge variant="emerald">Active Client</Badge>
    },
    {
      title: 'Date Added',
      key: 'created_at',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-500 font-medium">
          {row.created_at ? new Date(row.created_at).toLocaleDateString('en-IN') : '-'}
        </span>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/leads/${row.id}`)}
            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => handleOpenDelete(row.id, e)}
            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="Remove Client"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Business Clients</h2>
          <p className="text-xs text-slate-500">Successfully converted pipeline deals and active clients.</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {/* Clients list table */}
      {clients.length > 0 ? (
        <DataTable
          columns={columns}
          data={clients}
          searchKey="name"
          searchPlaceholder="Search clients..."
          onRowClick={(row) => navigate(`/leads/${row.id}`)}
        />
      ) : (
        <EmptyState
          icon={Briefcase}
          title="No Clients Yet"
          description="When you win a sales lead in the pipeline stage, it will automatically show up here as an active client."
          actionLabel="View Sales Pipeline"
          onAction={() => navigate('/pipeline')}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Remove Client"
        message="Are you sure you want to delete this client? This will remove the lead record permanently from the database."
      />
    </div>
  );
}
