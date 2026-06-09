import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCRM } from '../context/CRMContext';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CheckCircle, 
  RefreshCw, 
  DollarSign, 
  Activity, 
  Clock,
  ArrowRight,
  UserPlus,
  FileText,
  PhoneCall,
  MessageCircle,
  CalendarDays
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Weekly buckets for clean month display
function buildMonthlyChart(leads, monthOffset = 0) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + monthOffset;
  const refDate = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dayMap = {};
  for (let d = 1; d <= daysInMonth; d++) {
    dayMap[d] = 0;
  }

  leads.forEach(lead => {
    if (lead.status !== 'Converted') return;
    const lDate = new Date(lead.created_at || lead.updated_at);
    if (lDate.getFullYear() === refDate.getFullYear() && lDate.getMonth() === refDate.getMonth()) {
      const day = lDate.getDate();
      dayMap[day] += parseFloat(lead.won_amount) || parseFloat(lead.deal_value) || 0;
    }
  });

  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  const weeklyData = weeks.map((label, i) => {
    let total = 0;
    const startDay = i * 7 + 1;
    const endDay = Math.min(startDay + 6, daysInMonth);
    for (let d = startDay; d <= endDay; d++) {
      total += dayMap[d] || 0;
    }
    return { name: label, revenue: total };
  });

  return weeklyData;
}

// Monthly buckets for yearly display
function buildYearlyChart(leads) {
  const now = new Date();
  const year = now.getFullYear();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const monthMap = {};
  months.forEach((_, i) => { monthMap[i] = 0; });

  leads.forEach(lead => {
    if (lead.status !== 'Converted') return;
    const lDate = new Date(lead.created_at || lead.updated_at);
    if (lDate.getFullYear() === year) {
      monthMap[lDate.getMonth()] += parseFloat(lead.won_amount) || parseFloat(lead.deal_value) || 0;
    }
  });

  return months.map((label, i) => ({ name: label, revenue: monthMap[i] }));
}

export default function Dashboard() {
  const { leads, activities, settings, metrics } = useCRM();
  const navigate = useNavigate();
  const [chartPeriod, setChartPeriod] = useState('this-month');

  // Compute Trends
  const trends = useMemo(() => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const getCount = (list, filterFn, start, end) => {
      return list.filter(item => {
        const d = new Date(item.created_at || item.due_date);
        const inRange = start && end ? (d >= start && d <= end) : (start ? d >= start : true);
        return inRange && filterFn(item);
      }).length;
    };

    const getSum = (list, filterFn, valFn, start, end) => {
      return list
        .filter(item => {
          const d = new Date(item.created_at);
          const inRange = start && end ? (d >= start && d <= end) : (start ? d >= start : true);
          return inRange && filterFn(item);
        })
        .reduce((sum, item) => sum + (parseFloat(valFn(item)) || 0), 0);
    };

    // 1. Total Leads Trend
    const thisMonthLeads = getCount(leads, () => true, thisMonthStart);
    const lastMonthLeads = getCount(leads, () => true, lastMonthStart, lastMonthEnd);
    const leadsTrend = lastMonthLeads === 0 ? 100 : ((thisMonthLeads - lastMonthLeads) / lastMonthLeads) * 100;

    // 2. Converted Leads Trend
    const thisMonthWon = getCount(leads, (l) => l.status === 'Converted', thisMonthStart);
    const lastMonthWon = getCount(leads, (l) => l.status === 'Converted', lastMonthStart, lastMonthEnd);
    const wonTrend = lastMonthWon === 0 ? 100 : ((thisMonthWon - lastMonthWon) / lastMonthWon) * 100;

    // 3. Pipeline Trend (deals currently active in pipeline)
    const thisMonthActive = getCount(leads, (l) => !['Converted', 'Rejected'].includes(l.status), thisMonthStart);
    const lastMonthActive = getCount(leads, (l) => !['Converted', 'Rejected'].includes(l.status), lastMonthStart, lastMonthEnd);
    const activeTrend = lastMonthActive === 0 ? 100 : ((thisMonthActive - lastMonthActive) / lastMonthActive) * 100;

    // 4. Revenue Trend
    const thisMonthRev = getSum(leads, (l) => l.status === 'Converted', (l) => l.won_amount || l.deal_value || 0, thisMonthStart);
    const lastMonthRev = getSum(leads, (l) => l.status === 'Converted', (l) => l.won_amount || l.deal_value || 0, lastMonthStart, lastMonthEnd);
    const revTrend = lastMonthRev === 0 ? 100 : ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100;

    return {
      leads: { trend: `${leadsTrend >= 0 ? '+' : ''}${Math.round(leadsTrend)}%`, isUp: leadsTrend >= 0 },
      won: { trend: `${wonTrend >= 0 ? '+' : ''}${Math.round(wonTrend)}%`, isUp: wonTrend >= 0 },
      active: { trend: `${activeTrend >= 0 ? '+' : ''}${Math.round(activeTrend)}%`, isUp: activeTrend >= 0 },
      revenue: { trend: `${revTrend >= 0 ? '+' : ''}${Math.round(revTrend)}%`, isUp: revTrend >= 0 }
    };
  }, [leads]);

  // Chart Data
  const chartData = useMemo(() => {
    if (chartPeriod === 'this-month') return buildMonthlyChart(leads, 0);
    if (chartPeriod === 'last-month') return buildMonthlyChart(leads, -1);
    if (chartPeriod === 'this-year') return buildYearlyChart(leads);
    return [];
  }, [leads, chartPeriod]);

  const totalForPeriod = useMemo(() => {
    return chartData.reduce((s, d) => s + d.revenue, 0);
  }, [chartData]);

  // Dashboard KPI Cards
  const cards = [
    {
      title: 'Total Leads',
      value: metrics.totalLeads,
      trend: trends.leads.trend,
      isUp: trends.leads.isUp,
      icon: Users,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100'
    },
    {
      title: 'Conversion Rate',
      value: `${metrics.conversionRate}%`,
      trend: trends.won.trend,
      isUp: trends.won.isUp,
      icon: CheckCircle,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100'
    },
    {
      title: 'Pipeline Value',
      value: `₹${metrics.pipelineValue.toLocaleString('en-IN')}`,
      trend: trends.active.trend,
      isUp: trends.active.isUp,
      icon: RefreshCw,
      color: 'text-amber-600 bg-amber-50 border-amber-100'
    },
    {
      title: 'Revenue Won',
      value: `₹${metrics.revenueWon.toLocaleString('en-IN')}`,
      trend: trends.revenue.trend,
      isUp: trends.revenue.isUp,
      icon: DollarSign,
      color: 'text-rose-600 bg-rose-50 border-rose-100'
    }
  ];

  // Activity log icon mapper
  const getActivityIcon = (action) => {
    const act = action.toLowerCase();
    if (act.includes('created') || act.includes('add')) return <UserPlus className="w-3.5 h-3.5" />;
    if (act.includes('stage') || act.includes('move')) return <ArrowRight className="w-3.5 h-3.5" />;
    if (act.includes('whatsapp') || act.includes('message')) return <MessageCircle className="w-3.5 h-3.5" />;
    if (act.includes('quotation')) return <FileText className="w-3.5 h-3.5" />;
    if (act.includes('task') || act.includes('schedule')) return <CalendarDays className="w-3.5 h-3.5" />;
    if (act.includes('call') || act.includes('phone')) return <PhoneCall className="w-3.5 h-3.5" />;
    return <Activity className="w-3.5 h-3.5" />;
  };

  const getActivityColor = (action) => {
    const act = action.toLowerCase();
    if (act.includes('won') || act.includes('converted') || act.includes('accept')) {
      return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    }
    if (act.includes('rejected') || act.includes('reject')) {
      return 'bg-red-50 text-red-600 border-red-100';
    }
    if (act.includes('whatsapp') || act.includes('message')) {
      return 'bg-teal-50 text-teal-600 border-teal-100';
    }
    if (act.includes('quotation')) {
      return 'bg-blue-50 text-blue-600 border-blue-100';
    }
    return 'bg-slate-100 text-slate-500 border-slate-200';
  };

  const formatActivityTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const diffMs = new Date() - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-200">
      {/* Welcome banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Welcome back, {settings?.owner_name || 'Partner'}! 👋</h2>
          <p className="text-xs text-slate-500 leading-relaxed">Here's a snapshot of your sales performance and pipeline activities today.</p>
        </div>
        <button 
          onClick={() => navigate('/leads')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-100 hover:shadow-lg active:scale-95 cursor-pointer whitespace-nowrap"
        >
          Add New Lead
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              className="bg-white border border-slate-200 rounded-2xl p-5 min-h-[120px] shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.title}</span>
                <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center border ${card.color}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-slate-900 tracking-tight">{card.value}</span>
                <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                  card.isUp ? 'text-emerald-600' : 'text-red-500'
                }`}>
                  {card.isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  <span>{card.trend}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dashboard Core Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Overview Area */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col h-[380px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-shrink-0">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Revenue Overview</h3>
              <p className="text-[11px] text-slate-400 font-semibold">
                {totalForPeriod > 0 ? `₹${totalForPeriod.toLocaleString('en-IN')} total converted revenue` : 'No revenue recorded in this period'}
              </p>
            </div>
            <select
              value={chartPeriod}
              onChange={(e) => setChartPeriod(e.target.value)}
              className="text-xs font-semibold border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 focus:outline-none transition-colors cursor-pointer"
            >
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="this-year">This Year</option>
            </select>
          </div>
          
          <div className="flex-1 min-h-0 mt-4 flex items-center justify-center">
            {totalForPeriod === 0 ? (
              <div className="flex flex-col items-center text-center gap-2 max-w-sm">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-400">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700">No chart data available</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">Converted leads with deal values must exist in the selected period to display revenue curves.</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} 
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                    tickFormatter={(val) => val >= 100000 ? `${val / 100000}L` : val}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}
                    formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#6366f1" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#colorRev)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col h-[380px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-shrink-0">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Recent Action Logs</h3>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>

          <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-3.5 scrollbar-thin">
            {activities.length > 0 ? (
              activities.slice(0, 7).map((activity) => (
                <div key={activity.id} className="flex gap-3 items-start text-xs">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center border flex-shrink-0 ${getActivityColor(activity.action)}`}>
                    {getActivityIcon(activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-slate-800 line-clamp-1">{activity.action}</p>
                      <span className="text-[9px] text-slate-400 font-semibold flex-shrink-0">{formatActivityTime(activity.created_at)}</span>
                    </div>
                    <p className="text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{activity.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 gap-1.5">
                <Activity className="w-6 h-6 text-slate-300" />
                <span className="text-xs font-medium">No actions logged yet</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
