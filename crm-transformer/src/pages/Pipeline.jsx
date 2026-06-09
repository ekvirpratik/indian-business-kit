import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import { Plus, X, Award, AlertCircle, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Pipeline() {
  const { leads, updateLead, addLead, stages, addStage, deleteStage } = useCRM();
  const navigate = useNavigate();

  const [draggedCard, setDraggedCard] = useState(null);
  
  // Modals state
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);

  // Forms state
  const [newStageData, setNewStageData] = useState({ title: '', color: '#6366f1' });
  const [newLeadData, setNewLeadData] = useState({ name: '', company: '', deal_value: 0, stage: '' });
  const [lostReasonData, setLostReasonData] = useState({ leadId: null, targetStage: 'rejected', reason: '' });

  const onDragStart = (e, cardId, colSlug) => {
    setDraggedCard({ cardId, colSlug });
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = async (e, targetColSlug) => {
    e.preventDefault();
    if (!draggedCard || draggedCard.colSlug === targetColSlug) return;

    const leadId = draggedCard.cardId;
    
    if (targetColSlug === 'rejected') {
      // Trigger lost reason prompt modal
      setLostReasonData({ leadId, targetStage: targetColSlug, reason: '' });
      setIsLostModalOpen(true);
    } else {
      const isWon = targetColSlug === 'won';
      await updateLead(leadId, { 
        stage: targetColSlug, 
        status: isWon ? 'Converted' : 'Warm' 
      });
      toast.success(`Lead moved to '${targetColSlug}'`);
    }
    
    setDraggedCard(null);
  };

  const handleLostReasonSubmit = async (e) => {
    e.preventDefault();
    if (!lostReasonData.reason.trim()) {
      toast.error('Please provide a reason for losing this lead.');
      return;
    }

    await updateLead(lostReasonData.leadId, {
      stage: lostReasonData.targetStage,
      status: 'Rejected',
      lost_reason: lostReasonData.reason
    });

    toast.success('Lead marked as Rejected');
    setIsLostModalOpen(false);
  };

  const handleAddStageSubmit = async (e) => {
    e.preventDefault();
    if (!newStageData.title.trim()) {
      toast.error('Stage title is required');
      return;
    }

    const slug = newStageData.title.toLowerCase().trim().replace(/\s+/g, '-');
    
    // Check if slug already exists
    if (stages.some(s => s.slug === slug)) {
      toast.error('A stage with this name already exists.');
      return;
    }

    const position = stages.length;
    await addStage({
      slug,
      title: newStageData.title,
      color: newStageData.color,
      position
    });

    setIsStageModalOpen(false);
    setNewStageData({ title: '', color: '#6366f1' });
  };

  const handleAddLeadSubmit = async (e) => {
    e.preventDefault();
    if (!newLeadData.name.trim()) {
      toast.error('Lead name is required');
      return;
    }

    await addLead({
      name: newLeadData.name,
      company: newLeadData.company,
      phone: '',
      email: '',
      source: 'Manual',
      status: 'Warm',
      stage: newLeadData.stage,
      budget: '',
      requirement: 'Quick inquiry',
      deal_value: parseFloat(newLeadData.deal_value) || 0,
      notes: ''
    });

    setIsLeadModalOpen(false);
    setNewLeadData({ name: '', company: '', deal_value: 0, stage: '' });
  };

  const openQuickLeadModal = (stageSlug) => {
    setNewLeadData({ name: '', company: '', deal_value: 0, stage: stageSlug });
    setIsLeadModalOpen(true);
  };

  // Helper colors
  const getScoreColor = (score) => {
    if (score >= 61) return 'bg-emerald-500';
    if (score >= 31) return 'bg-amber-500';
    return 'bg-red-400';
  };

  const getBorderColor = (color) => {
    // Basic helper to prevent raw color insertion into class
    return { borderTopColor: color };
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in-0 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Sales Pipeline</h2>
          <p className="text-xs text-slate-500">Track deal progress by dragging leads between pipeline stages.</p>
        </div>
        <button
          onClick={() => setIsStageModalOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Stage
        </button>
      </div>

      {/* Kanban Board Container */}
      <div className="flex gap-4 overflow-x-auto pb-4 items-start scrollbar-thin">
        {stages.map((col) => {
          const colLeads = leads.filter(l => l.stage === col.slug);
          const colValueSum = colLeads.reduce((s, l) => s + (parseFloat(l.deal_value) || 0), 0);

          return (
            <div
              key={col.slug}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, col.slug)}
              className="w-72 bg-slate-100/60 border border-slate-200/50 rounded-2xl flex flex-col max-h-[75vh] flex-shrink-0"
            >
              {/* Column Header */}
              <div 
                className="p-4 border-t-4 rounded-t-2xl flex items-center justify-between bg-white border-b border-slate-100 shadow-3xs"
                style={getBorderColor(col.color)}
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-800 tracking-wide line-clamp-1">{col.title}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    ₹{colValueSum.toLocaleString('en-IN')} • {colLeads.length} leads
                  </p>
                </div>
                {/* Prevent delete core stages */}
                {!['new', 'contacted', 'proposal', 'won', 'rejected'].includes(col.slug) && (
                  <button 
                    onClick={() => deleteStage(col.id)}
                    className="p-1 hover:bg-slate-50 rounded text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Cards list container */}
              <div className="p-3 overflow-y-auto space-y-3 flex-1 min-h-[150px] scrollbar-none">
                {colLeads.length > 0 ? (
                  colLeads.map((card) => (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, card.id, col.slug)}
                      onClick={() => navigate(`/leads/${card.id}`)}
                      className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-3xs hover:shadow-xs hover:border-slate-300 transition-all cursor-grab active:cursor-grabbing space-y-3 group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h5 className="text-xs font-bold text-slate-800 leading-snug line-clamp-1 group-hover:text-indigo-600 transition-colors">
                          {card.name}
                        </h5>
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${getScoreColor(card.lead_score)}`} title={`Lead Score: ${card.lead_score}`} />
                      </div>
                      
                      {card.company && (
                        <p className="text-[10px] text-slate-400 font-semibold line-clamp-1">{card.company}</p>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                        <span className="text-[11px] font-extrabold text-slate-700">
                          ₹{(parseFloat(card.deal_value) || 0).toLocaleString('en-IN')}
                        </span>
                        
                        {/* Source badge */}
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase">
                          {card.source}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-28 flex flex-col items-center justify-center text-center text-slate-400 gap-1.5">
                    <HelpCircle className="w-5 h-5 text-slate-300" />
                    <span className="text-[10px] font-medium">Stage is empty</span>
                  </div>
                )}
              </div>

              {/* Quick Add Button */}
              <div className="p-3 border-t border-slate-100 bg-white/40 rounded-b-2xl">
                <button
                  onClick={() => openQuickLeadModal(col.slug)}
                  className="w-full py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 shadow-3xs hover:shadow-2xs active:scale-98 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Quick Add Lead</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stage Add Modal */}
      <Modal
        isOpen={isStageModalOpen}
        onClose={() => setIsStageModalOpen(false)}
        title="Add Pipeline Stage"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddStageSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">Stage Title *</label>
            <input
              type="text"
              value={newStageData.title}
              onChange={e => setNewStageData({ ...newStageData, title: e.target.value })}
              placeholder="e.g. Negotiation, Cold Call"
              className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">Stage Theme Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={newStageData.color}
                onChange={e => setNewStageData({ ...newStageData, color: e.target.value })}
                className="w-10 h-10 border border-slate-200 rounded-xl p-0.5 cursor-pointer bg-white"
              />
              <span className="text-xs font-mono text-slate-400">{newStageData.color.toUpperCase()}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsStageModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Create Stage
            </button>
          </div>
        </form>
      </Modal>

      {/* Lead Quick Add Modal */}
      <Modal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        title="Quick Add Pipeline Lead"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddLeadSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">Lead Name *</label>
            <input
              type="text"
              required
              value={newLeadData.name}
              onChange={e => setNewLeadData({ ...newLeadData, name: e.target.value })}
              placeholder="e.g. Rajesh Sharma"
              className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">Company Name</label>
            <input
              type="text"
              value={newLeadData.company}
              onChange={e => setNewLeadData({ ...newLeadData, company: e.target.value })}
              placeholder="e.g. Sharma Logistics"
              className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">Estimated Deal Value (₹)</label>
            <input
              type="number"
              value={newLeadData.deal_value === 0 ? '' : newLeadData.deal_value}
              onChange={e => setNewLeadData({ ...newLeadData, deal_value: e.target.value })}
              placeholder="e.g. 150000"
              className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsLeadModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Add Lead
            </button>
          </div>
        </form>
      </Modal>

      {/* Lost Reason Prompt Modal */}
      <Modal
        isOpen={isLostModalOpen}
        onClose={() => setIsLostModalOpen(false)}
        title="Reason for Lead Loss"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleLostReasonSubmit} className="space-y-4">
          <div className="flex flex-col gap-2 text-center items-center py-2">
            <div className="p-3 bg-red-50 text-red-500 rounded-full border border-red-100">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
              Help your sales team improve conversion performance by analyzing why this deal was rejected.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600">Loss Reason *</label>
            <input
              type="text"
              required
              value={lostReasonData.reason}
              onChange={e => setLostReasonData({ ...lostReasonData, reason: e.target.value })}
              placeholder="e.g. Price too high, chose competitor X, project delayed"
              className="p-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsLostModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Confirm Rejection
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
