import React, { useState, useMemo, useRef } from 'react';
import { useCRM } from '../context/CRMContext';
import { TeamMemberSchema } from '../lib/validators';
import { uploadImage } from '../lib/storage';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { 
  Plus, 
  User, 
  Mail, 
  Phone, 
  Users, 
  Trash2, 
  Activity, 
  Upload, 
  Camera,
  CheckCircle,
  Inbox,
  Edit2
} from 'lucide-react';
import { toast } from 'sonner';

export default function Team() {
  const { 
    team, 
    leads, 
    activities, 
    addTeamMember, 
    deleteTeamMember,
    updateTeamMember,
    userId 
  } = useCRM();

  const fileInputRef = useRef(null);

  // Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);

  // Selected Members
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [editingMemberId, setEditingMemberId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Sales rep',
    status: 'Active',
    avatar_url: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  // Custom role especificarion
  const [isOtherRole, setIsOtherRole] = useState(false);
  const [customRole, setCustomRole] = useState('');

  const handleOpenAdd = () => {
    setEditingMemberId(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'Sales rep',
      status: 'Active',
      avatar_url: ''
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setIsOtherRole(false);
    setCustomRole('');
    setFormErrors({});
    setIsAddOpen(true);
  };

  const handleOpenEdit = (member, e) => {
    e.stopPropagation();
    setEditingMemberId(member.id);
    setFormData({
      name: member.name,
      email: member.email || '',
      phone: member.phone || '',
      role: ['Sales rep', 'Manager', 'Admin'].includes(member.role) ? member.role : 'Other',
      status: member.status,
      avatar_url: member.avatar_url || ''
    });
    if (!['Sales rep', 'Manager', 'Admin'].includes(member.role)) {
      setIsOtherRole(true);
      setCustomRole(member.role);
    } else {
      setIsOtherRole(false);
      setCustomRole('');
    }
    setAvatarFile(null);
    setAvatarPreview(member.avatar_url || null);
    setFormErrors({});
    setIsAddOpen(true);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    // Reset so the same file can be selected again
    e.target.value = '';
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    try {
      const finalRole = isOtherRole ? customRole : formData.role;
      if (!finalRole) {
        setFormErrors(prev => ({ ...prev, role: 'Role is required' }));
        return;
      }

      const payload = {
        ...formData,
        role: finalRole
      };

      // Validate
      TeamMemberSchema.parse(payload);

      toast.info(editingMemberId ? 'Updating team member details...' : 'Saving team member details...');
      
      let member;
      if (editingMemberId) {
        member = await updateTeamMember(editingMemberId, payload);
      } else {
        member = await addTeamMember(payload);
      }
      
      // 2. Upload avatar if selected
      if (member && avatarFile) {
        try {
          toast.info('Uploading profile avatar...');
          const fileExt = avatarFile.name.split('.').pop() || 'png';
          const filePath = `avatars/${member.id}_${Date.now()}.${fileExt}`;
          const avatarUrl = await uploadImage(userId, avatarFile, filePath);
          
          // Update member row with avatar url
          await updateTeamMember(member.id, { avatar_url: avatarUrl });
          toast.success(editingMemberId ? 'Member updated with profile photo!' : `${member.name} registered with profile photo!`);
        } catch (uploadErr) {
          console.error(uploadErr);
          toast.error('Member saved, but avatar upload failed.');
        }
      } else if (member) {
        toast.success(editingMemberId ? `Team member '${member.name}' updated!` : `Team member '${member.name}' registered!`);
      }

      // Reset all form state
      setAvatarFile(null);
      setAvatarPreview(null);
      setIsAddOpen(false);
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
        toast.error('Failed to save team member details');
      }
    }
  };

  const handleOpenDelete = (id, e) => {
    e.stopPropagation();
    setSelectedMemberId(id);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedMemberId) {
      await deleteTeamMember(selectedMemberId);
      setIsDeleteOpen(false);
    }
  };

  const handleOpenActivity = (member, e) => {
    e.stopPropagation();
    setSelectedMember(member);
    setIsActivityOpen(true);
  };

  // Filter activities for selected team member
  const memberActivities = useMemo(() => {
    if (!selectedMember) return [];
    return activities.filter(a => a.team_member_id === selectedMember.id);
  }, [activities, selectedMember]);

  // Derived lead count map
  const memberLeadCounts = useMemo(() => {
    const counts = {};
    leads.forEach(l => {
      if (l.assigned_to) {
        counts[l.assigned_to] = (counts[l.assigned_to] || 0) + 1;
      }
    });
    return counts;
  }, [leads]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Workspace Team</h2>
          <p className="text-xs text-slate-500">Manage account access, assign leads, and monitor sales representative activities.</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Member
        </button>
      </div>

      {/* Team Grid */}
      {team.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 select-none">
          {team.map((member) => {
            const leadCount = memberLeadCounts[member.id] || 0;
            return (
              <div 
                key={member.id} 
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-4 relative overflow-hidden group"
              >
                {/* Status dot */}
                <span className={`absolute top-4.5 right-5 w-2.5 h-2.5 rounded-full ring-4 ring-white ${
                  member.status === 'Active' 
                    ? 'bg-emerald-500' 
                    : member.status === 'Away' 
                      ? 'bg-amber-500' 
                      : 'bg-slate-400'
                }`} title={member.status} />

                {/* Avatar and name info */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 font-extrabold text-base flex-shrink-0 relative overflow-hidden">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{member.name}</h4>
                    <p className="text-[11px] text-indigo-600 font-bold tracking-wide mt-0.5">{member.role}</p>
                    <p className="text-[11px] text-slate-400 font-semibold flex items-center gap-1 mt-1 truncate">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      {member.email || 'No Email'}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 border-y border-slate-100 py-3 text-center">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Leads</p>
                    <p className="text-sm font-extrabold text-slate-700 mt-0.5">{leadCount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</p>
                    <p className="text-sm font-extrabold text-slate-700 mt-0.5">{member.status}</p>
                  </div>
                </div>

                {/* Card footer actions */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    onClick={(e) => handleOpenActivity(member, e)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-3xs"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    Activity Log
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleOpenEdit(member, e)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                      title="Edit Team Member"
                      aria-label={`Edit team member: ${member.name}`}
                    >
                      <Edit2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      onClick={(e) => handleOpenDelete(member.id, e)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      title="Remove Team Member"
                      aria-label={`Remove team member: ${member.name}`}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No Team Members"
          description="Register sales representatives to allocate leads and monitor activity histories."
          actionLabel="Add Member"
          onAction={handleOpenAdd}
        />
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Remove Team Member"
        message="Are you sure you want to remove this team member? All leads currently allocated to them will be unassigned."
      />

      {/* Add team member modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={editingMemberId ? "Edit Team Member" : "Add Team Member"}
        size="md"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-2 pb-2">
            <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-3xl relative overflow-hidden flex items-center justify-center text-slate-400 shadow-3xs group">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-slate-300" />
              )}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-slate-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-[10px] font-bold"
              >
                Upload
              </div>
            </div>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/png, image/jpeg, image/jpg, image/gif, image/webp" 
              onChange={handleAvatarChange} 
              className="hidden" 
            />
            <span className="text-[10px] font-medium text-slate-400">Click to upload member photo</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Anand Verma"
              className={`p-2.5 text-sm border rounded-xl bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all ${
                formErrors.name ? 'border-red-500 focus:ring-red-100' : 'border-slate-200'
              }`}
            />
            {formErrors.name && <span className="text-[11px] text-red-500 font-semibold">{formErrors.name}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">Email Address</label>
            <input
              type="text"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. anand@company.com"
              className={`p-2.5 text-sm border rounded-xl bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all ${
                formErrors.email ? 'border-red-500 focus:ring-red-100' : 'border-slate-200'
              }`}
            />
            {formErrors.email && <span className="text-[11px] text-red-500 font-semibold">{formErrors.email}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">Phone Number</label>
            <input
              type="text"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g. +91 98987 65432"
              className={`p-2.5 text-sm border rounded-xl bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all ${
                formErrors.phone ? 'border-red-500' : 'border-slate-200'
              }`}
            />
            {formErrors.phone && <span className="text-[11px] text-red-500 font-semibold">{formErrors.phone}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Assign Role</label>
              <select
                value={isOtherRole ? 'Other' : formData.role}
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'Other') {
                    setIsOtherRole(true);
                  } else {
                    setIsOtherRole(false);
                    setFormData({ ...formData, role: val });
                  }
                }}
                className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                <option value="Sales rep">Sales Representative</option>
                <option value="Manager">Sales Manager</option>
                <option value="Admin">Admin</option>
                <option value="Other">Other (Specify)</option>
              </select>
              {isOtherRole && (
                <input
                  type="text"
                  required
                  value={customRole}
                  onChange={e => setCustomRole(e.target.value)}
                  placeholder="e.g. Coordinator"
                  className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors mt-2"
                />
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                <option value="Active">🟢 Active</option>
                <option value="Away">🟡 Away</option>
                <option value="Offline">🔴 Offline</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {editingMemberId ? 'Save Changes' : 'Save Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Activity log modal */}
      <Modal
        isOpen={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
        title={selectedMember ? `Activity History: ${selectedMember.name}` : 'Team Activity Log'}
      >
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
          {memberActivities.length > 0 ? (
            memberActivities.map(act => (
              <div key={act.id} className="flex gap-2.5 items-start text-xs border-b border-slate-50 pb-2.5 last:border-b-0">
                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-700 leading-normal">{act.action}</p>
                  <p className="text-slate-500 mt-0.5 leading-relaxed">{act.description}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(act.created_at).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-slate-400 font-medium text-xs flex flex-col items-center gap-1.5">
              <Inbox className="w-5 h-5 text-slate-350" />
              <span>No logged activity for this user today.</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end pt-4 border-t border-slate-100">
          <button
            onClick={() => setIsActivityOpen(false)}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}
