import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useClerk } from '@clerk/react';
import { useCRM } from '../context/CRMContext';
import { 
  Bell, 
  Search, 
  User, 
  Settings as SettingsIcon, 
  ChevronDown, 
  Mail, 
  Phone, 
  Building2,
  LogOut,
  Users,
  CheckSquare,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle
} from 'lucide-react';

export default function Header() {
  const { 
    leads, 
    tasks, 
    team, 
    notifications, 
    markNotificationRead, 
    markAllNotificationsRead, 
    settings 
  } = useCRM();
  const { signOut } = useClerk();
  
  const location = useLocation();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);

  const searchContainerRef = useRef(null);
  const notifContainerRef = useRef(null);
  const profileContainerRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Header Page Title Map
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/leads/')) return 'Lead Details';
    if (path === '/leads') return 'All Leads';
    if (path === '/pipeline') return 'Sales Pipeline';
    if (path === '/clients') return 'Clients';
    if (path === '/tasks') return 'Task Manager';
    if (path === '/follow-ups') return 'Follow-ups';
    if (path === '/whatsapp') return 'WhatsApp Queue';
    if (path === '/quotations') return 'Quotations';
    if (path === '/reports') return 'Reports';
    if (path === '/team') return 'Team';
    if (path === '/settings') return 'Settings';
    return 'CRM';
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileContainerRef.current && !profileContainerRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation for search
  const handleKeyDown = (e) => {
    if (!searchFocused || flatResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSearchIndex(prev => (prev + 1) % flatResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSearchIndex(prev => (prev - 1 + flatResults.length) % flatResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = flatResults[activeSearchIndex];
      navigate(selected.path);
      setSearchQuery('');
      setSearchFocused(false);
    } else if (e.key === 'Escape') {
      setSearchFocused(false);
    }
  };

  // Filtered search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { leads: [], tasks: [], team: [] };
    const query = searchQuery.toLowerCase();

    const filteredLeads = leads.filter(l => 
      l.name.toLowerCase().includes(query) || 
      l.company.toLowerCase().includes(query) || 
      l.phone.toLowerCase().includes(query) || 
      l.email.toLowerCase().includes(query)
    ).slice(0, 4);

    const filteredTasks = tasks.filter(t => 
      t.description.toLowerCase().includes(query)
    ).slice(0, 4);

    const filteredTeam = team.filter(m => 
      m.name.toLowerCase().includes(query)
    ).slice(0, 4);

    return { leads: filteredLeads, tasks: filteredTasks, team: filteredTeam };
  }, [searchQuery, leads, tasks, team]);

  const flatResults = useMemo(() => {
    const flat = [];
    searchResults.leads.forEach(l => flat.push({ type: 'lead', id: l.id, title: l.name, subtitle: l.company || 'Lead', path: `/leads/${l.id}` }));
    searchResults.tasks.forEach(t => flat.push({ type: 'task', id: t.id, title: t.description, subtitle: 'Task', path: `/tasks` }));
    searchResults.team.forEach(m => flat.push({ type: 'team', id: m.id, title: m.name, subtitle: m.role || 'Team Member', path: `/team` }));
    return flat;
  }, [searchResults]);

  // Adjust active search index when results change
  useEffect(() => {
    setActiveSearchIndex(0);
  }, [searchQuery]);

  const getNotifIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-emerald-500 bg-emerald-50 rounded-full" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500 bg-amber-50 rounded-full" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500 bg-red-50 rounded-full" />;
      default: return <Info className="w-4 h-4 text-blue-500 bg-blue-50 rounded-full" />;
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 flex-shrink-0 z-20 relative select-none">
      {/* Title */}
      <h1 className="text-lg font-extrabold text-slate-800 tracking-tight">
        {getPageTitle()}
      </h1>

      {/* Header Actions */}
      <div className="flex items-center gap-4">
        {/* Global Search */}
        <div ref={searchContainerRef} className="relative w-72 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads, tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={handleKeyDown}
              className="w-full pl-9.5 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-50 transition-all"
            />
          </div>

          {searchFocused && (searchQuery.trim() !== '') && (
            <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 overflow-hidden animate-in fade-in-0 duration-200">
              {flatResults.length > 0 ? (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {/* Leads */}
                  {searchResults.leads.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1">Leads</h4>
                      {searchResults.leads.map(l => {
                        const flatIdx = flatResults.findIndex(r => r.type === 'lead' && r.id === l.id);
                        const isSelected = flatIdx === activeSearchIndex;
                        return (
                          <div
                            key={l.id}
                            onClick={() => {
                              navigate(`/leads/${l.id}`);
                              setSearchQuery('');
                              setSearchFocused(false);
                            }}
                            className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                              isSelected ? 'bg-indigo-50 text-indigo-900' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold truncate">{l.name}</p>
                              {l.company && <p className="text-[10px] text-slate-400 truncate">{l.company}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Tasks */}
                  {searchResults.tasks.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1">Tasks</h4>
                      {searchResults.tasks.map(t => {
                        const flatIdx = flatResults.findIndex(r => r.type === 'task' && r.id === t.id);
                        const isSelected = flatIdx === activeSearchIndex;
                        return (
                          <div
                            key={t.id}
                            onClick={() => {
                              navigate('/tasks');
                              setSearchQuery('');
                              setSearchFocused(false);
                            }}
                            className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                              isSelected ? 'bg-indigo-50 text-indigo-900' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <CheckSquare className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold truncate">{t.description}</p>
                              <p className="text-[10px] text-slate-400">Due: {t.due_date}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Team */}
                  {searchResults.team.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1">Team</h4>
                      {searchResults.team.map(m => {
                        const flatIdx = flatResults.findIndex(r => r.type === 'team' && r.id === m.id);
                        const isSelected = flatIdx === activeSearchIndex;
                        return (
                          <div
                            key={m.id}
                            onClick={() => {
                              navigate('/team');
                              setSearchQuery('');
                              setSearchFocused(false);
                            }}
                            className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                              isSelected ? 'bg-indigo-50 text-indigo-900' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold truncate">{m.name}</p>
                              <p className="text-[10px] text-slate-400">{m.role}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center text-xs font-medium text-slate-400">
                  No results for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications (Bell) */}
        <div ref={notifContainerRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 active:scale-95 rounded-xl border border-slate-200/60 transition-all relative cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in-0 duration-200">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex-shrink-0">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllNotificationsRead}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-50">
                {notifications.length > 0 ? (
                  notifications.map(notif => (
                    <div 
                      key={notif.id}
                      onClick={() => {
                        markNotificationRead(notif.id);
                        if (notif.link_to) {
                          navigate(notif.link_to);
                          setShowNotifications(false);
                        }
                      }}
                      className={`flex gap-3 p-3 cursor-pointer hover:bg-slate-50/50 transition-all ${
                        !notif.is_read ? 'bg-indigo-50/20' : ''
                      }`}
                    >
                      <div className="flex-shrink-0 pt-0.5">
                        {getNotifIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs ${!notif.is_read ? 'font-bold text-slate-800' : 'text-slate-600'} leading-normal break-words`}>
                          {notif.text}
                        </p>
                        <span className="text-[9px] text-slate-400 font-semibold mt-1 block">
                          {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 font-medium flex flex-col items-center gap-1.5">
                    <span>🔔</span>
                    <span>No notifications yet</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div ref={profileContainerRef} className="relative">
          <div 
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded-xl border border-slate-200/60 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-semibold border border-slate-200/50 overflow-hidden flex-shrink-0">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-indigo-600" />
              )}
            </div>
            <div className="hidden lg:block text-left pr-1 select-none">
              <p className="text-xs font-bold text-slate-800 line-clamp-1 flex items-center gap-1">
                {settings?.owner_name || 'Admin User'}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              </p>
              <p className="text-[10px] text-slate-400 font-semibold line-clamp-1">{settings?.owner_role || 'Owner'}</p>
            </div>
          </div>

          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 overflow-hidden animate-in fade-in-0 duration-200">
              {/* Card User Info */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl mb-2 flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-indigo-600/10 text-indigo-600 flex items-center justify-center font-bold text-sm flex-shrink-0 overflow-hidden">
                  {settings?.logo_url ? (
                    <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    '💼'
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{settings?.owner_name || 'Admin User'}</p>
                  <p className="text-[10px] text-slate-400 font-semibold truncate">{settings?.owner_role || 'Workspace Owner'}</p>
                </div>
              </div>

              {/* Details list */}
              <div className="space-y-1 py-1 text-slate-500 font-medium text-xs">
                {settings?.email && (
                  <div className="flex items-center gap-2.5 px-3 py-1.5 text-slate-500 rounded-lg">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{settings.email}</span>
                  </div>
                )}
                {settings?.whatsapp && (
                  <div className="flex items-center gap-2.5 px-3 py-1.5 text-slate-500 rounded-lg">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{settings.whatsapp}</span>
                  </div>
                )}
                {settings?.company_name && (
                  <div className="flex items-center gap-2.5 px-3 py-1.5 text-slate-500 rounded-lg">
                    <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{settings.company_name}</span>
                  </div>
                )}
              </div>

              <div className="h-px bg-slate-100 my-2" />

              {/* Actions */}
              <Link 
                to="/settings"
                onClick={() => setShowProfile(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <SettingsIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                Preferences
              </Link>
              
              <button 
                onClick={() => {
                  setShowProfile(false);
                  signOut();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-red-400 flex-shrink-0" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
