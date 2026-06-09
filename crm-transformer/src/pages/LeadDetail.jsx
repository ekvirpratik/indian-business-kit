import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import LeadTimeline from '../components/LeadTimeline';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  Building2, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckSquare, 
  Clock, 
  FileText,
  UserCheck,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { TaskSchema } from '../lib/validators';
import { toast } from 'sonner';

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const leadId = Number(id);

  const { 
    leads, 
    tasks, 
    quotations, 
    activities, 
    team, 
    deleteLead,
    addTask,
    updateTask,
  } = useCRM();

  // Find current lead
  const lead = useMemo(() => {
    return leads.find(l => l.id === leadId);
  }, [leads, leadId]);

  // Lead tasks
  const leadTasks = useMemo(() => {
    return tasks.filter(t => t.lead_id === leadId);
  }, [tasks, leadId]);

  // Lead quotations
  const leadQuotations = useMemo(() => {
    return quotations.filter(q => q.lead_id === leadId);
  }, [quotations, leadId]);

  // State Variables
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  // Task form state
  const [taskData, setTaskData] = useState({
    description: '',
    lead_id: leadId,
    assigned_to: null,
    due_date: new Date().toISOString().split('T')[0],
    status: 'Pending',
    priority: 'Medium',
    type: 'task'
  });
  const [taskErrors, setTaskErrors] = useState({});

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center gap-4">
        <p className="text-sm font-semibold text-slate-500">Lead not found or has been deleted.</p>
        <button 
          onClick={() => navigate('/leads')}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Leads
        </button>
      </div>
    );
  }

  // Handle lead deletion
  const handleDeleteConfirm = async () => {
    const deleted = await deleteLead(leadId);
    if (deleted) {
      navigate('/leads');
    }
  };

  // Add linked task
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setTaskErrors({});

    try {
      TaskSchema.parse(taskData);
      await addTask(taskData);
      
      toast.success('Task scheduled successfully!');
      setIsTaskModalOpen(false);
      setTaskData({
        description: '',
        lead_id: leadId,
        assigned_to: null,
        due_date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        priority: 'Medium',
        type: 'task'
      });
    } catch (err) {
      const zodIssues = err?.issues || err?.errors;
      if (zodIssues?.length) {
        const fieldErrors = {};
        const messages = [];
        zodIssues.forEach(issue => {
          if (issue.path[0]) fieldErrors[issue.path[0]] = issue.message;
          messages.push(issue.message);
        });
        setTaskErrors(fieldErrors);
        toast.error(messages.join(' • '));
      } else {
        toast.error('Failed to create task');
      }
    }
  };

  // Toggle lead task status
  const handleToggleTask = async (task) => {
    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    await updateTask(task.id, { status: newStatus });
    toast.success(`Task marked as ${newStatus}`);
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Hot': return 'rose';
      case 'Warm': return 'amber';
      case 'Cold': return 'slate';
      case 'Converted': return 'emerald';
      case 'Rejected': return 'red';
      default: return 'slate';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-200">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button 
          onClick={() => navigate('/leads')}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Leads</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/quotations?create=true&leadId=${leadId}`)}
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            Create Quote
          </button>
          <button
            onClick={() => setIsDeleteOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Lead
          </button>
        </div>
      </div>

      {/* Main Grid: Info/Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Details & Actions (70%) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-slate-900 leading-tight">{lead.name}</h2>
                {lead.company && (
                  <p className="text-sm text-slate-500 font-semibold flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    {lead.company}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={getStatusVariant(lead.status)}>{lead.status}</Badge>
                <Badge variant="indigo">{lead.source}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-y border-slate-100 py-5">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deal Value</span>
                <p className="text-lg font-extrabold text-slate-800">
                  ₹{(parseFloat(lead.deal_value) || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Collected / Won</span>
                <p className="text-lg font-extrabold text-slate-800">
                  ₹{(parseFloat(lead.won_amount) || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lead Quality Score</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-sm font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                    {lead.lead_score} / 100
                  </span>
                </div>
              </div>
            </div>

            {/* Contacts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {lead.phone && (
                <a 
                  href={`tel:${lead.phone}`}
                  className="flex items-center gap-3 p-3 border border-slate-100 bg-slate-50/50 hover:bg-slate-50 rounded-xl text-slate-600 text-sm font-semibold transition-colors"
                >
                  <Phone className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <span>{lead.phone}</span>
                </a>
              )}
              {lead.email && (
                <a 
                  href={`mailto:${lead.email}`}
                  className="flex items-center gap-3 p-3 border border-slate-100 bg-slate-50/50 hover:bg-slate-50 rounded-xl text-slate-600 text-sm font-semibold transition-colors"
                >
                  <Mail className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <span className="truncate">{lead.email}</span>
                </a>
              )}
            </div>

            {/* Requirement / Notes */}
            <div className="space-y-3">
              {lead.requirement && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product / Service Requirement</span>
                  <p className="text-sm font-semibold text-slate-700">{lead.requirement}</p>
                </div>
              )}
              {lead.budget && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Budget Range</span>
                  <p className="text-sm font-semibold text-slate-700">{lead.budget}</p>
                </div>
              )}
              {lead.notes && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detailed Notes</span>
                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                    {lead.notes}
                  </p>
                </div>
              )}
              {lead.status === 'Rejected' && lead.lost_reason && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Rejected Reason</span>
                  <p className="text-sm text-red-700 bg-red-50/50 p-3 rounded-xl border border-red-100/50 font-medium">
                    {lead.lost_reason}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Linked Tasks */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Linked Tasks</h3>
              <button 
                onClick={() => setIsTaskModalOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Task
              </button>
            </div>

            {leadTasks.length > 0 ? (
              <div className="divide-y divide-slate-100 space-y-2.5">
                {leadTasks.map(task => (
                  <div key={task.id} className="flex items-start gap-3 pt-2.5 first:pt-0 text-sm">
                    <button 
                      onClick={() => handleToggleTask(task)}
                      className={`mt-0.5 w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                        task.status === 'Completed'
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 hover:border-indigo-500'
                      }`}
                    >
                      {task.status === 'Completed' && <span className="text-[10px] font-bold">✓</span>}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-slate-700 leading-normal ${task.status === 'Completed' ? 'line-through text-slate-400' : ''}`}>
                        {task.description}
                      </p>
                      
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400 font-semibold">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-300" />
                          Due: {task.due_date}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded-md border ${
                          task.priority === 'High' 
                            ? 'text-red-600 bg-red-50 border-red-100' 
                            : task.priority === 'Medium' 
                              ? 'text-amber-600 bg-amber-50 border-amber-100' 
                              : 'text-slate-600 bg-slate-50 border-slate-150'
                        }`}>
                          {task.priority} Priority
                        </span>
                        <span className="uppercase text-[9px] tracking-wider font-bold bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md text-slate-500">
                          {task.type}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-medium text-center py-4">No pending tasks for this lead.</p>
            )}
          </div>

          {/* Linked Quotations */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Related Quotations</h3>
              <button 
                onClick={() => navigate(`/quotations?create=true&leadId=${leadId}`)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Quote
              </button>
            </div>

            {leadQuotations.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {leadQuotations.map(quote => (
                  <div 
                    key={quote.id} 
                    onClick={() => navigate('/quotations')}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:bg-slate-50/30 px-2 -mx-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-indigo-500" />
                        {quote.quotation_no}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">Items: {quote.items?.length || 0} • Valid until: {quote.valid_until || '-'}</p>
                    </div>
                    
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p className="text-xs font-bold text-slate-800">₹{quote.total.toLocaleString('en-IN')}</p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                          quote.status === 'Accepted'
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                            : quote.status === 'Rejected'
                              ? 'text-red-700 bg-red-50 border-red-100'
                              : 'text-slate-600 bg-slate-50 border-slate-200'
                        }`}>
                          {quote.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-medium text-center py-4">No quotations generated for this lead yet.</p>
            )}
          </div>
        </div>

        {/* Right Side: Timeline Panel (30%) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs h-fit">
          <div className="border-b border-slate-100 pb-3 mb-5">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Activity History</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Timeline logs for customer engagement</p>
          </div>
          
          <LeadTimeline 
            leadId={leadId} 
            activities={activities} 
            teamMembers={team} 
          />
        </div>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Lead"
        message="Are you absolutely sure you want to delete this lead? All associated history will be lost."
      />

      {/* Task Creation Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Schedule Follow-up Task"
      >
        <form onSubmit={handleTaskSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">Task Description *</label>
            <input
              type="text"
              value={taskData.description}
              onChange={e => setTaskData({ ...taskData, description: e.target.value })}
              placeholder="e.g. Call Rajesh to discuss pricing proposal"
              className={`p-2.5 text-sm border rounded-xl bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all ${
                taskErrors.description ? 'border-red-500 focus:ring-red-100' : 'border-slate-200'
              }`}
            />
            {taskErrors.description && <span className="text-[11px] text-red-500 font-semibold">{taskErrors.description}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Due Date *</label>
              <input
                type="date"
                value={taskData.due_date}
                onChange={e => setTaskData({ ...taskData, due_date: e.target.value })}
                className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {taskErrors.due_date && <span className="text-[11px] text-red-500 font-semibold">{taskErrors.due_date}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Priority</label>
              <select
                value={taskData.priority}
                onChange={e => setTaskData({ ...taskData, priority: e.target.value })}
                className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                <option value="High">🔥 High</option>
                <option value="Medium">☀️ Medium</option>
                <option value="Low">❄️ Low</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Action Type</label>
              <select
                value={taskData.type}
                onChange={e => setTaskData({ ...taskData, type: e.target.value })}
                className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                <option value="task">Task / Email</option>
                <option value="followup">Follow Up</option>
                <option value="call">Phone Call</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Assign Rep</label>
              <select
                value={taskData.assigned_to || ''}
                onChange={e => setTaskData({ ...taskData, assigned_to: e.target.value ? Number(e.target.value) : null })}
                className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                <option value="">-- Unassigned --</option>
                {team.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsTaskModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Schedule Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
