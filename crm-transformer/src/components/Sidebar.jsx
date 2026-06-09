import React from 'react';
import { NavLink } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  GitBranch,
  CheckSquare,
  MessageCircle,
  FileText,
  BarChart3,
  UserCheck,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  BellRing
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/leads', icon: Users, label: 'All Leads' },
  { path: '/pipeline', icon: GitBranch, label: 'Sales Pipeline' },
  { path: '/clients', icon: Briefcase, label: 'Clients' },
  { path: '/tasks', icon: CheckSquare, label: 'Task Manager' },
  { path: '/follow-ups', icon: BellRing, label: 'Follow-ups', badge: true },
  { path: '/whatsapp', icon: MessageCircle, label: 'WhatsApp Queue' },
  { path: '/quotations', icon: FileText, label: 'Quotations' },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
  { path: '/team', icon: UserCheck, label: 'Team' },
  { path: '/settings', icon: SettingsIcon, label: 'Settings' }
];

export default function Sidebar({ collapsed, toggleSidebar }) {
  const { settings, tasks } = useCRM();

  // Calculate overdue followups for badge
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueCount = tasks.filter(t => t.status !== 'Completed' && t.due_date < todayStr).length;

  return (
    <aside 
      className={`bg-slate-900 text-slate-400 border-r border-slate-800 flex flex-col h-screen transition-all duration-300 relative select-none z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Collapse button */}
      <button 
        onClick={toggleSidebar}
        className="absolute -right-3 top-8 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white p-1 rounded-full cursor-pointer transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Logo Section */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800/60 overflow-hidden flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-base font-bold shadow-md shadow-indigo-600/30 flex-shrink-0 overflow-hidden">
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            '💼'
          )}
        </div>
        {!collapsed && (
          <span className="font-extrabold text-sm text-white tracking-wide truncate">
            {settings?.company_name || 'Business CRM'}
          </span>
        )}
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group relative cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                    : 'hover:bg-slate-800/50 hover:text-slate-200'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              
              {/* Badge for followups */}
              {item.badge && overdueCount > 0 && (
                <span className={`absolute font-bold text-[10px] px-1.5 py-0.5 rounded-full flex items-center justify-center border border-transparent shadow-xs animate-pulse ${
                  collapsed 
                    ? 'top-1 right-2 bg-red-500 text-white' 
                    : 'right-3 bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  {overdueCount}
                </span>
              )}

              {/* Tooltip for collapsed sidebar */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-2 py-1 bg-slate-950 text-white text-xs font-semibold rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-lg whitespace-nowrap z-50">
                  {item.label}
                  {item.badge && overdueCount > 0 && ` (${overdueCount})`}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-800/60 text-[11px] font-semibold text-slate-500 tracking-wider text-center flex-shrink-0 uppercase">
          Indian Business Kit
        </div>
      )}
    </aside>
  );
}
