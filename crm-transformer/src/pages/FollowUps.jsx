import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { 
  Phone, 
  MessageCircle, 
  Check, 
  Clock, 
  AlertCircle, 
  CalendarDays,
  CornerDownRight,
  TrendingUp,
  Inbox
} from 'lucide-react';
import { toast } from 'sonner';

export default function FollowUps() {
  const { tasks, leads, updateTask, settings, addWhatsAppLog } = useCRM();
  const navigate = useNavigate();

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter pending follow-up tasks
  const pendingFollowups = useMemo(() => {
    return tasks.filter(t => t.status !== 'Completed');
  }, [tasks]);

  // Segment tasks
  const segments = useMemo(() => {
    const overdue = [];
    const today = [];
    const upcoming = [];

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    pendingFollowups.forEach(task => {
      if (task.due_date < todayStr) {
        overdue.push(task);
      } else if (task.due_date === todayStr) {
        today.push(task);
      } else if (task.due_date <= nextWeekStr) {
        upcoming.push(task);
      }
    });

    // Sort overdue oldest first
    overdue.sort((a, b) => a.due_date.localeCompare(b.due_date));
    // Sort today and upcoming earliest first
    today.sort((a, b) => a.due_date.localeCompare(b.due_date));
    upcoming.sort((a, b) => a.due_date.localeCompare(b.due_date));

    return { overdue, today, upcoming };
  }, [pendingFollowups, todayStr]);

  const handleMarkCompleted = async (task) => {
    await updateTask(task.id, { status: 'Completed' });
    toast.success('Follow-up marked as completed!');
  };

  const handleSnooze = async (task, days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const nextDueDate = date.toISOString().split('T')[0];
    
    await updateTask(task.id, { due_date: nextDueDate });
    toast.success(`Follow-up snoozed to ${nextDueDate}`);
  };

  const handleWhatsAppClick = (lead) => {
    if (!lead || !lead.phone) {
      toast.error('Lead phone number is missing.');
      return;
    }

    const template = settings?.wa_template || 'Hi {{name}}, checking in regarding your inquiry...';
    let message = template
      .replace(/{{name}}/g, lead.name)
      .replace(/{{company}}/g, settings?.company_name || 'our company')
      .replace(/{{requirement}}/g, lead.requirement || 'your request');

    // Clean phone number (keep digits only)
    const phoneClean = lead.phone.replace(/[^0-9]/g, '');
    const phonePrefixed = phoneClean.startsWith('91') ? phoneClean : `91${phoneClean}`;
    const url = `https://wa.me/${phonePrefixed}?text=${encodeURIComponent(message)}`;

    // Log the action to WA logs
    addWhatsAppLog({
      lead_id: lead.id,
      phone: lead.phone,
      message: message,
      status: 'sent'
    });

    window.open(url, '_blank');
  };

  const getPriorityVariant = (p) => {
    switch (p) {
      case 'High': return 'red';
      case 'Medium': return 'amber';
      default: return 'slate';
    }
  };

  const renderFollowupCard = (task, borderClass, isOverdue = false) => {
    const lead = leads.find(l => l.id === Number(task.lead_id));
    
    // Days since lead was created (simulate last contact)
    const daysSinceCreated = lead?.created_at
      ? Math.floor((new Date() - new Date(lead.created_at)) / (1000 * 60 * 60 * 24))
      : 0;

    return (
      <div 
        key={task.id}
        className={`bg-white border rounded-2xl p-5 shadow-3xs hover:shadow-2xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 ${borderClass}`}
      >
        {/* Info */}
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 
              onClick={() => lead && navigate(`/leads/${lead.id}`)}
              className="text-sm font-bold text-slate-800 hover:text-indigo-600 transition-colors cursor-pointer truncate"
            >
              {lead ? lead.name : 'Unlinked Task'}
            </h4>
            {lead?.company && (
              <span className="text-xs font-semibold text-slate-400 truncate">({lead.company})</span>
            )}
            <Badge variant={getPriorityVariant(task.priority)}>{task.priority} Priority</Badge>
            {lead?.source && <Badge variant="indigo">{lead.source}</Badge>}
          </div>

          <p className="text-xs text-slate-600 font-semibold leading-relaxed flex items-center gap-1.5">
            <CornerDownRight className="w-3.5 h-3.5 text-slate-400" />
            {task.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-1.5 text-[11px] text-slate-400 font-semibold select-none">
            {lead?.budget && (
              <span>Budget: <strong className="text-slate-600 font-bold">{lead.budget}</strong></span>
            )}
            <span>Added: {daysSinceCreated === 0 ? 'Today' : `${daysSinceCreated}d ago`}</span>
            {isOverdue && (
              <span className="text-red-500 font-bold">Scheduled: {task.due_date}</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap">
          {/* Quick Call */}
          {lead?.phone && (
            <a
              href={`tel:${lead.phone}`}
              className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl transition-all cursor-pointer shadow-3xs"
              title="Call Customer"
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
          
          {/* Quick WhatsApp */}
          {lead && (
            <button
              onClick={() => handleWhatsAppClick(lead)}
              className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-emerald-500 hover:text-emerald-600 rounded-xl transition-all cursor-pointer shadow-3xs"
              title="Send WhatsApp Check-in"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          )}

          {/* Done */}
          <button
            onClick={() => handleMarkCompleted(task)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-600 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-3xs"
            title="Mark Completed"
          >
            <Check className="w-3.5 h-3.5" />
            Done
          </button>

          {/* Snooze Dropdown */}
          <div className="relative group">
            <button
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-3xs"
            >
              <Clock className="w-3.5 h-3.5" />
              Snooze
            </button>
            <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-1.5 hidden group-hover:block divide-y divide-slate-50 text-slate-600 font-medium text-xs">
              <button 
                onClick={() => handleSnooze(task, 1)}
                className="w-full text-left px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                Tomorrow
              </button>
              <button 
                onClick={() => handleSnooze(task, 3)}
                className="w-full text-left px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                In 3 Days
              </button>
              <button 
                onClick={() => handleSnooze(task, 7)}
                className="w-full text-left px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                Next Week
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-900">Lead Follow-ups</h2>
        <p className="text-xs text-slate-500">Prevent revenue leaks with scheduled customer touchpoints and quick actions.</p>
      </div>

      {pendingFollowups.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Inbox Zero!"
          description="All follow-ups have been resolved. Excellent work keeping up with your leads!"
          actionLabel="View All Leads"
          onAction={() => navigate('/leads')}
        />
      ) : (
        <div className="space-y-8">
          {/* Overdue Section */}
          {segments.overdue.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5 select-none">
                <AlertCircle className="w-4.5 h-4.5" />
                Overdue Follow-ups ({segments.overdue.length})
              </h3>
              <div className="space-y-3">
                {segments.overdue.map(task => renderFollowupCard(task, 'border-l-red-500', true))}
              </div>
            </div>
          )}

          {/* Today Section */}
          {segments.today.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5 select-none">
                <Clock className="w-4.5 h-4.5" />
                Due Today ({segments.today.length})
              </h3>
              <div className="space-y-3">
                {segments.today.map(task => renderFollowupCard(task, 'border-l-amber-500'))}
              </div>
            </div>
          )}

          {/* Upcoming Section */}
          {segments.upcoming.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 select-none">
                <CalendarDays className="w-4.5 h-4.5" />
                Upcoming Next 7 Days ({segments.upcoming.length})
              </h3>
              <div className="space-y-3">
                {segments.upcoming.map(task => renderFollowupCard(task, 'border-l-indigo-500'))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
