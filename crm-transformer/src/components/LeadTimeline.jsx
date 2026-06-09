import React from 'react';
import { 
  User, 
  ArrowRight, 
  MessageCircle, 
  FileText, 
  CheckSquare, 
  Trash, 
  Edit, 
  Phone, 
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';

export default function LeadTimeline({ leadId, activities, teamMembers }) {
  // Filter activities for this lead
  const leadActivities = activities.filter(a => a.lead_id === leadId);

  const getActionIcon = (action) => {
    const act = action.toLowerCase();
    if (act.includes('created') || act.includes('add')) {
      return <User className="w-4 h-4" />;
    }
    if (act.includes('stage') || act.includes('move')) {
      return <ArrowRight className="w-4 h-4" />;
    }
    if (act.includes('whatsapp') || act.includes('message')) {
      return <MessageCircle className="w-4 h-4" />;
    }
    if (act.includes('quotation') || act.includes('proposal') || act.includes('quote')) {
      return <FileText className="w-4 h-4" />;
    }
    if (act.includes('task') || act.includes('follow-up') || act.includes('schedule')) {
      return <CheckSquare className="w-4 h-4" />;
    }
    if (act.includes('call') || act.includes('phone')) {
      return <Phone className="w-4 h-4" />;
    }
    if (act.includes('won') || act.includes('converted') || act.includes('accept')) {
      return <CheckCircle className="w-4 h-4 text-emerald-600" />;
    }
    return <FileSpreadsheet className="w-4 h-4" />;
  };

  const getActionStyles = (action) => {
    const act = action.toLowerCase();
    if (act.includes('won') || act.includes('converted') || act.includes('accept')) {
      return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
    }
    if (act.includes('lost') || act.includes('reject') || act.includes('delete') || act.includes('cancel')) {
      return 'bg-red-50 text-red-600 border border-red-100';
    }
    if (act.includes('whatsapp') || act.includes('message')) {
      return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
    }
    if (act.includes('quotation')) {
      return 'bg-blue-50 text-blue-600 border border-blue-100';
    }
    if (act.includes('task') || act.includes('schedule')) {
      return 'bg-amber-50 text-amber-600 border border-amber-100';
    }
    return 'bg-slate-50 text-slate-600 border border-slate-100';
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTeamMemberName = (memberId) => {
    if (!memberId) return 'System';
    const member = teamMembers.find(t => t.id === memberId);
    return member ? member.name : 'Unknown Team Member';
  };

  if (leadActivities.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400 font-medium text-xs">
        No activities logged for this lead yet.
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {leadActivities.map((activity, index) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {/* Connector line */}
              {index !== leadActivities.length - 1 && (
                <span 
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-100" 
                  aria-hidden="true" 
                />
              )}
              
              <div className="relative flex space-x-3 items-start">
                <div>
                  <span className={`h-8.5 w-8.5 rounded-xl flex items-center justify-center shadow-2xs ${getActionStyles(activity.action)}`}>
                    {getActionIcon(activity.action)}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      {activity.action}
                    </p>
                    <span className="text-[10px] text-slate-400 font-medium bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">
                      {formatTime(activity.created_at)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    {activity.description}
                  </p>
                  
                  <p className="text-[11px] text-slate-400 mt-1">
                    By: <span className="font-semibold text-slate-500">{getTeamMemberName(activity.team_member_id)}</span>
                  </p>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
