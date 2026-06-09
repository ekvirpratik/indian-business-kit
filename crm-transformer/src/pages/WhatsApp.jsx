import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import DataTable from '../components/ui/DataTable';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { MessageSquare, MessageCircle, Send, History, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';

export default function WhatsApp() {
  const { leads, settings, whatsappLogs, addWhatsAppLog } = useCRM();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' or 'history'

  // Filter leads that are active in the pipeline (excluding Converted/Rejected)
  const activeLeads = useMemo(() => {
    return leads.filter(l => !['Converted', 'Rejected'].includes(l.status));
  }, [leads]);

  // Check if a lead has a sent message history
  const hasSentMessage = (leadId) => {
    return whatsappLogs.some(log => log.lead_id === leadId);
  };

  const handleSendTemplate = async (lead) => {
    const phone = lead.phone;
    if (!phone) {
      toast.error('No phone number found for this lead.');
      return;
    }

    const template = settings?.wa_template || 'Hi {{name}}, Thank you for contacting us...';
    let message = template
      .replace(/{{name}}/g, lead.name)
      .replace(/{{company}}/g, settings?.company_name || 'our company')
      .replace(/{{requirement}}/g, lead.requirement || 'your request');

    // WhatsApp url
    const phoneClean = phone.replace(/[^0-9]/g, '');
    const phonePrefixed = phoneClean.startsWith('91') ? phoneClean : `91${phoneClean}`;
    const url = `https://wa.me/${phonePrefixed}?text=${encodeURIComponent(message)}`;

    // Open WhatsApp
    window.open(url, '_blank');

    // Add log in Supabase
    await addWhatsAppLog({
      lead_id: lead.id,
      phone: phone,
      message: message,
      status: 'sent'
    });
    
    toast.success(`WhatsApp log created for ${lead.name}`);
  };

  const queueColumns = [
    {
      title: 'Lead Name',
      key: 'name',
      sortable: true,
      render: (row) => (
        <div className="space-y-0.5">
          <p className="font-bold text-slate-800 text-sm">{row.name}</p>
          <p className="text-[11px] text-slate-400 font-semibold">{row.company || 'No Company'}</p>
        </div>
      )
    },
    {
      title: 'Phone Number',
      key: 'phone',
      sortable: true,
      render: (row) => <span className="text-xs font-semibold text-slate-600">{row.phone || '-'}</span>
    },
    {
      title: 'Pipeline Stage',
      key: 'stage',
      sortable: true,
      render: (row) => <Badge variant="indigo">{row.stage}</Badge>
    },
    {
      title: 'Requirement',
      key: 'requirement',
      render: (row) => <span className="text-xs text-slate-500 font-medium">{row.requirement || '-'}</span>
    },
    {
      title: 'Log Status',
      key: 'log_status',
      render: (row) => {
        const sent = hasSentMessage(row.id);
        return (
          <Badge variant={sent ? 'emerald' : 'amber'}>
            {sent ? 'Logged Sent' : 'Pending Message'}
          </Badge>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (row) => (
        <button
          onClick={() => handleSendTemplate(row)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-600 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Send WA
        </button>
      )
    }
  ];

  const historyColumns = [
    {
      title: 'Lead Name',
      key: 'lead_id',
      sortable: true,
      render: (row) => {
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
      title: 'Phone Sent To',
      key: 'phone',
      sortable: true,
      render: (row) => <span className="text-xs font-semibold text-slate-600">{row.phone}</span>
    },
    {
      title: 'Message Content',
      key: 'message',
      render: (row) => (
        <p className="text-xs text-slate-500 font-medium max-w-sm truncate" title={row.message}>
          {row.message}
        </p>
      )
    },
    {
      title: 'Sent Time',
      key: 'sent_at',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-400 font-medium">
          {new Date(row.sent_at).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: () => <Badge variant="emerald">Sent Successfully</Badge>
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-900">WhatsApp Marketing & Logs</h2>
        <p className="text-xs text-slate-500">Send templated follow-up reminders via WhatsApp Web and track history.</p>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs flex items-center justify-between">
        <div className="flex gap-1.5">
          <button
            onClick={() => setActiveTab('queue')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'queue' 
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-xs' 
                : 'text-slate-500 hover:text-slate-700 border border-transparent'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Lead Messaging Queue
          </button>
          
          <button
            onClick={() => setActiveTab('history')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'history' 
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-xs' 
                : 'text-slate-500 hover:text-slate-700 border border-transparent'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Sent Message History
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'queue' ? (
        activeLeads.length > 0 ? (
          <DataTable
            columns={queueColumns}
            data={activeLeads}
            searchKey="name"
            searchPlaceholder="Search queue..."
          />
        ) : (
          <EmptyState
            icon={MessageCircle}
            title="No Active Leads"
            description="Leads in active pipeline stages will show up here to send templated check-ins."
            actionLabel="View All Leads"
            onAction={() => navigate('/leads')}
          />
        )
      ) : (
        whatsappLogs.length > 0 ? (
          <DataTable
            columns={historyColumns}
            data={whatsappLogs}
            searchKey="phone"
            searchPlaceholder="Search by phone..."
          />
        ) : (
          <EmptyState
            icon={History}
            title="No Messages Sent Yet"
            description="When you send messages to active leads, the history logs will accumulate here for audit trail."
          />
        )
      )}
    </div>
  );
}
