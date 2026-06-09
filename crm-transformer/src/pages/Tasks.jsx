import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import { TaskSchema } from '../lib/validators';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { 
  Plus, 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Check, 
  RotateCcw,
  Users,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

export default function Tasks() {
  const { 
    tasks, 
    team, 
    leads, 
    addTask, 
    updateTask, 
    deleteTask 
  } = useCRM();
  
  const navigate = useNavigate();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  
  const [formData, setFormData] = useState({
    description: '',
    lead_id: null,
    assigned_to: null,
    due_date: new Date().toISOString().split('T')[0],
    status: 'Pending',
    priority: 'Medium',
    type: 'task'
  });
  const [formErrors, setFormErrors] = useState({});

  const handleOpenAdd = () => {
    setFormData({
      description: '',
      lead_id: null,
      assigned_to: null,
      due_date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      priority: 'Medium',
      type: 'task'
    });
    setFormErrors({});
    setSelectedTaskId(null);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (id) => {
    setSelectedTaskId(id);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedTaskId) {
      await deleteTask(selectedTaskId);
      setIsDeleteOpen(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    try {
      const payload = {
        ...formData,
        lead_id: formData.lead_id ? Number(formData.lead_id) : null,
        assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null
      };

      TaskSchema.parse(payload);
      await addTask(payload);

      toast.success('Task created successfully!');
      setIsFormOpen(false);
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
        console.error(err);
        toast.error('Failed to create task');
      }
    }
  };

  const handleToggleTask = async (task) => {
    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    await updateTask(task.id, { status: newStatus });
    toast.success(`Task status updated to ${newStatus}`);
  };

  const getPriorityVariant = (p) => {
    switch (p) {
      case 'High': return 'red';
      case 'Medium': return 'amber';
      case 'Low': return 'slate';
      default: return 'slate';
    }
  };

  const getStatusVariant = (s) => {
    switch (s) {
      case 'Completed': return 'emerald';
      case 'In Progress': return 'blue';
      default: return 'amber';
    }
  };

  const isOverdue = (dueDate, status) => {
    if (status === 'Completed') return false;
    const todayStr = new Date().toISOString().split('T')[0];
    return dueDate < todayStr;
  };

  const columns = [
    {
      title: 'Task Description',
      key: 'description',
      sortable: true,
      render: (row) => {
        const overdue = isOverdue(row.due_date, row.status);
        return (
          <div className="space-y-0.5 max-w-md">
            <p className={`font-semibold text-slate-700 text-sm leading-normal ${row.status === 'Completed' ? 'line-through text-slate-400' : ''}`}>
              {row.description}
            </p>
            {overdue && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
                <AlertCircle className="w-3 h-3" /> Overdue
              </span>
            )}
          </div>
        );
      }
    },
    {
      title: 'Linked Lead',
      key: 'lead_id',
      render: (row) => {
        if (!row.lead_id) return <span className="text-xs text-slate-400">-</span>;
        const lead = leads.find(l => l.id === Number(row.lead_id));
        if (!lead) return <span className="text-xs text-slate-400">-</span>;
        return (
          <button
            onClick={() => navigate(`/leads/${lead.id}`)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors cursor-pointer text-left"
          >
            <Eye className="w-3.5 h-3.5" />
            {lead.name}
          </button>
        );
      }
    },
    {
      title: 'Assigned To',
      key: 'assigned_to',
      render: (row) => {
        if (!row.assigned_to) return <span className="text-xs text-slate-400">Unassigned</span>;
        const member = team.find(t => t.id === Number(row.assigned_to));
        return <span className="text-xs font-semibold text-slate-600">{member ? member.name : 'Unknown'}</span>;
      }
    },
    {
      title: 'Due Date',
      key: 'due_date',
      sortable: true,
      render: (row) => (
        <span className={`text-xs font-semibold ${isOverdue(row.due_date, row.status) ? 'text-red-600' : 'text-slate-500'}`}>
          {row.due_date}
        </span>
      )
    },
    {
      title: 'Status',
      key: 'status',
      sortable: true,
      render: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge>
    },
    {
      title: 'Priority',
      key: 'priority',
      sortable: true,
      render: (row) => <Badge variant={getPriorityVariant(row.priority)}>{row.priority}</Badge>
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleToggleTask(row)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              row.status === 'Completed'
                ? 'text-amber-600 bg-amber-50 border-amber-100 hover:bg-amber-100'
                : 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100'
            }`}
            title={row.status === 'Completed' ? 'Mark Pending' : 'Mark Completed'}
          >
            {row.status === 'Completed' ? <RotateCcw className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => handleOpenDelete(row.id)}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-150 transition-all cursor-pointer"
            title="Delete Task"
          >
            <Trash2 className="w-3.5 h-3.5" />
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
          <h2 className="text-xl font-bold text-slate-900">Task Manager</h2>
          <p className="text-xs text-slate-500">Organize calls, appointments, and follow-ups. Linked tasks show active lead profiles.</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Task
        </button>
      </div>

      {/* Task List */}
      {tasks.length > 0 ? (
        <DataTable
          columns={columns}
          data={tasks}
          searchKey="description"
          searchPlaceholder="Search task descriptions..."
        />
      ) : (
        <EmptyState
          icon={CheckSquare}
          title="No Tasks Found"
          description="Create your first workflow task or lead follow-up to organize your day."
          actionLabel="Create Task"
          onAction={handleOpenAdd}
        />
      )}

      {/* Task form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Schedule New Task"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">Task Description *</label>
            <input
              type="text"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Discuss pricing with Rajesh"
              className={`p-2.5 text-sm border rounded-xl bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all ${
                formErrors.description ? 'border-red-500 focus:ring-red-100' : 'border-slate-200'
              }`}
            />
            {formErrors.description && <span className="text-[11px] text-red-500 font-semibold">{formErrors.description}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Due Date *</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {formErrors.due_date && <span className="text-[11px] text-red-500 font-semibold">{formErrors.due_date}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Linked Lead (Optional)</label>
              <select
                value={formData.lead_id || ''}
                onChange={e => setFormData({ ...formData, lead_id: e.target.value ? Number(e.target.value) : null })}
                className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                <option value="">-- None --</option>
                {leads.map(lead => (
                  <option key={lead.id} value={lead.id}>{lead.name} ({lead.company || 'No Company'})</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Priority</label>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                <option value="High">🔥 High Priority</option>
                <option value="Medium">☀️ Medium Priority</option>
                <option value="Low">❄️ Low Priority</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Task Type</label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                <option value="task">📝 Task / Action</option>
                <option value="followup">🔔 Follow Up</option>
                <option value="call">📞 Phone Call</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Assign Rep</label>
              <select
                value={formData.assigned_to || ''}
                onChange={e => setFormData({ ...formData, assigned_to: e.target.value ? Number(e.target.value) : null })}
                className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                <option value="">-- Unassigned --</option>
                {team.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Initial Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
              </select>
            </div>
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
              Schedule Task
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Task"
        message="Are you absolutely sure you want to cancel and delete this scheduled task?"
      />
    </div>
  );
}
