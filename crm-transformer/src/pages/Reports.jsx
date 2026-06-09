import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import Badge from '../components/ui/Badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  CheckCircle, 
  DollarSign, 
  Clock, 
  CalendarDays,
  Inbox,
  Award,
  ArrowUpRight
} from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export default function Reports() {
  const { leads, team, metrics } = useCRM();
  const navigate = useNavigate();

  // Date range filter
  const [dateRange, setDateRange] = useState('this-month');

  // Filter leads based on selected date range
  const filteredLeads = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    
    if (dateRange === 'this-week') {
      const day = now.getDay();
      startDate.setDate(now.getDate() - day + (day === 0 ? -6 : 1)); // start of week (Monday)
      startDate.setHours(0, 0, 0, 0);
    } else if (dateRange === 'this-month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (dateRange === 'last-3-months') {
      startDate.setMonth(now.getMonth() - 3);
    } else if (dateRange === 'this-year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      return leads; // 'all'
    }

    return leads.filter(l => new Date(l.created_at || l.date) >= startDate);
  }, [leads, dateRange]);

  // KPI calculations
  const kpis = useMemo(() => {
    const total = filteredLeads.length;
    const converted = filteredLeads.filter(l => l.status === 'Converted').length;
    const rate = total === 0 ? 0 : Math.round((converted / total) * 100);
    
    const revenue = filteredLeads
      .filter(l => l.status === 'Converted')
      .reduce((sum, l) => sum + (parseFloat(l.won_amount) || parseFloat(l.deal_value) || 0), 0);
      
    return {
      total,
      rate,
      revenue
    };
  }, [filteredLeads]);

  // Chart 1: Leads by Source
  const sourceChartData = useMemo(() => {
    const counts = {};
    filteredLeads.forEach(l => {
      counts[l.source] = (counts[l.source] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key]
    })).sort((a, b) => b.value - a.value);
  }, [filteredLeads]);

  // Chart 2: Status Distribution
  const statusChartData = useMemo(() => {
    const counts = {};
    filteredLeads.forEach(l => {
      counts[l.status] = (counts[l.status] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({
      name: key,
      value: counts[key]
    })).filter(item => item.value > 0);
  }, [filteredLeads]);

  // Chart 3: Funnel stage
  const funnelChartData = useMemo(() => {
    const counts = {
      new: 0,
      contacted: 0,
      proposal: 0,
      won: 0,
      rejected: 0
    };
    filteredLeads.forEach(l => {
      if (counts[l.stage] !== undefined) {
        counts[l.stage]++;
      }
    });
    return [
      { name: 'New Leads', value: counts.new },
      { name: 'Contacted', value: counts.contacted },
      { name: 'Proposal Sent', value: counts.proposal },
      { name: 'Won / Closed', value: counts.won },
      { name: 'Rejected Deal', value: counts.rejected }
    ];
  }, [filteredLeads]);

  // Actionable: Stale Leads (no update in 15+ days)
  const staleLeads = useMemo(() => {
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    
    return leads.filter(l => {
      if (['Converted', 'Rejected'].includes(l.status)) return false;
      const lastUpdate = new Date(l.updated_at || l.created_at || l.date);
      return lastUpdate < fifteenDaysAgo;
    }).slice(0, 5); // limit to 5
  }, [leads]);

  // Actionable: Top Team Performers (Won/Total)
  const performers = useMemo(() => {
    return team.map(member => {
      const memberLeads = leads.filter(l => l.assigned_to === member.id);
      const wonLeads = memberLeads.filter(l => l.status === 'Converted');
      const conversionRate = memberLeads.length === 0 ? 0 : Math.round((wonLeads.length / memberLeads.length) * 100);
      const revenue = wonLeads.reduce((sum, l) => sum + (parseFloat(l.won_amount) || parseFloat(l.deal_value) || 0), 0);
      
      return {
        id: member.id,
        name: member.name,
        role: member.role,
        totalLeads: memberLeads.length,
        conversionRate,
        revenue
      };
    }).sort((a, b) => b.conversionRate - a.conversionRate || b.revenue - a.revenue);
  }, [team, leads]);

  return (
    <div className="space-y-6 select-none animate-in fade-in-0 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Lead & Sales Analytics</h2>
          <p className="text-xs text-slate-500">Analyze team performance, lead source conversions, and pipeline metrics.</p>
        </div>

        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="text-xs font-semibold border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white hover:bg-slate-50 focus:outline-none transition-colors cursor-pointer"
        >
          <option value="all">All-time Data</option>
          <option value="this-week">This Week</option>
          <option value="this-month">This Month</option>
          <option value="last-3-months">Last 3 Months</option>
          <option value="this-year">This Year</option>
        </select>
      </div>

      {/* Row 1: KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Leads</span>
            <TrendingUp className="w-4.5 h-4.5 text-indigo-500" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 mt-2">{kpis.total}</p>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Conversion Rate</span>
            <CheckCircle className="w-4.5 h-4.5 text-emerald-500" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 mt-2">{kpis.rate}%</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Revenue Won</span>
            <DollarSign className="w-4.5 h-4.5 text-emerald-500" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 mt-2">₹{kpis.revenue.toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Response Time</span>
            <Clock className="w-4.5 h-4.5 text-amber-500" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 mt-2">{metrics.avgResponseTime} Days</p>
        </div>
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Funnel chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col h-[350px]">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Pipeline Funnel Stage</h4>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelChartData} layout="vertical" margin={{ left: 15, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Source analysis chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col h-[350px]">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Leads by Platform Source</h4>
          <div className="flex-1 min-h-0">
            {sourceChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceChartData} margin={{ bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} angle={-15} textAnchor="end" />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">No source data available</div>
            )}
          </div>
        </div>

        {/* Status Donut chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col h-[350px]">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Lead Quality Split</h4>
          <div className="flex-1 min-h-0 flex flex-col justify-center items-center">
            {statusChartData.length > 0 ? (
              <>
                <div className="w-full h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {statusChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2.5 justify-center mt-2 select-none text-[11px] font-semibold text-slate-500">
                  {statusChartData.map((entry, idx) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span>{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-400 font-medium">No segment data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Actionable Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stale Leads (no updates in 15 days) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              ⚠️ Attention Needed: Stale Leads
            </h4>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Active leads with no pipeline progress in 15+ days.</p>
          </div>

          {staleLeads.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {staleLeads.map(lead => {
                const days = Math.floor((new Date() - new Date(lead.updated_at || lead.created_at || lead.date)) / (1000 * 60 * 60 * 24));
                return (
                  <div key={lead.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-800">{lead.name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">Stage: {lead.stage} • Idle for {days} days</p>
                    </div>
                    
                    <button
                      onClick={() => navigate(`/leads/${lead.id}`)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg border border-transparent hover:border-indigo-100 transition-all cursor-pointer"
                    >
                      <span>Follow Up</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 font-medium text-xs flex flex-col items-center gap-1.5">
              <Inbox className="w-5 h-5 text-slate-300" />
              <span>Great job! No idle leads found.</span>
            </div>
          )}
        </div>

        {/* Top Performers */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              🏆 Rep Conversion Leaderboard
            </h4>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Sales rep conversion rates and closed revenue totals.</p>
          </div>

          {performers.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {performers.map((perf, index) => (
                <div key={perf.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-extrabold text-slate-400 w-4">#{index + 1}</span>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-800">{perf.name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{perf.role} • Assigned: {perf.totalLeads} leads</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xs font-extrabold text-slate-800">{perf.conversionRate}% Conv</p>
                    <p className="text-[10px] text-emerald-600 font-bold">₹{perf.revenue.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 font-medium text-xs flex flex-col items-center gap-1.5">
              <Award className="w-5 h-5 text-slate-300" />
              <span>No team members registered.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
