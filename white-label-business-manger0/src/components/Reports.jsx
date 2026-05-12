import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { BarChart, PieChart, TrendingUp, TrendingDown, Calendar, Download, Filter, Banknote, Landmark, Wallet } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PREMIUM_COLORS = [
  '#6366f1', '#8b5cf6', '#a78bfa',
  '#14b8a6', '#0ea5e9', '#ec4899',
  '#f59e0b', '#ef4444', '#10b981'
];

const tooltipStyle = {
  backgroundColor: 'rgba(15, 23, 42, 0.92)',
  titleFont: { size: 13, weight: '600', family: "'Inter', sans-serif" },
  bodyFont: { size: 12, family: "'Inter', sans-serif" },
  padding: { top: 10, bottom: 10, left: 14, right: 14 },
  cornerRadius: 10,
  borderColor: 'rgba(255,255,255,0.08)',
  borderWidth: 1,
  displayColors: true,
  boxPadding: 6,
};

const Reports = () => {
  const { store, metrics, updateEntity } = useData();
  const [period, setPeriod] = useState('30d');
  const barChartRef = useRef(null);

  const categoryData = useMemo(() => {
    const counts = {};
    store.products.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + p.currentStock;
    });
    const labels = Object.keys(counts);
    const values = Object.values(counts);
    
    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: PREMIUM_COLORS.slice(0, labels.length),
        borderWidth: 0,
        hoverOffset: 18,
        borderRadius: 4,
        spacing: 4
      }]
    };
  }, [store.products]);

  const salesByMonth = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const salesData = new Array(12).fill(0);
    const purchaseData = new Array(12).fill(0);
    
    store.transactions.forEach(t => {
      const month = new Date(t.date).getMonth();
      if (t.type === 'sale') salesData[month] += t.totalAmount;
      else purchaseData[month] += t.totalAmount;
    });

    return {
      labels: months,
      datasets: [
        {
          label: 'Sales',
          data: salesData,
          backgroundColor: (ctx) => {
            const chart = ctx.chart;
            const { ctx: canvasCtx, chartArea } = chart;
            if (!chartArea) return '#6366f1';
            const gradient = canvasCtx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
            gradient.addColorStop(0, 'rgba(99, 102, 241, 0.6)');
            gradient.addColorStop(1, 'rgba(139, 92, 246, 0.95)');
            return gradient;
          },
          borderRadius: { topLeft: 8, topRight: 8 },
          borderSkipped: false,
          barPercentage: 0.6,
          categoryPercentage: 0.7
        },
        {
          label: 'Purchases',
          data: purchaseData,
          backgroundColor: (ctx) => {
            const chart = ctx.chart;
            const { ctx: canvasCtx, chartArea } = chart;
            if (!chartArea) return '#f59e0b';
            const gradient = canvasCtx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
            gradient.addColorStop(0, 'rgba(245, 158, 11, 0.5)');
            gradient.addColorStop(1, 'rgba(251, 191, 36, 0.9)');
            return gradient;
          },
          borderRadius: { topLeft: 8, topRight: 8 },
          borderSkipped: false,
          barPercentage: 0.6,
          categoryPercentage: 0.7
        }
      ]
    };
  }, [store.transactions]);

  const barOptions = {
    maintainAspectRatio: false,
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          pointStyle: 'rectRounded',
          padding: 20,
          font: { size: 11, weight: '600', family: "'Inter', sans-serif" },
          color: '#64748b'
        }
      },
      tooltip: {
        ...tooltipStyle,
        callbacks: {
          label: (ctx) => `  ${ctx.dataset.label}: ₹${ctx.parsed.y.toLocaleString()}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 11, weight: '500', family: "'Inter', sans-serif" },
          color: '#94a3b8'
        },
        border: { display: false }
      },
      y: {
        grid: { color: 'rgba(226, 232, 240, 0.6)', drawBorder: false },
        ticks: {
          font: { size: 11, family: "'Inter', sans-serif" },
          color: '#94a3b8',
          callback: (val) => val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`,
          padding: 8
        },
        border: { display: false, dash: [4, 4] }
      }
    }
  };

  const doughnutOptions = {
    maintainAspectRatio: false,
    responsive: true,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
          font: { size: 11, weight: '500', family: "'Inter', sans-serif" },
          color: '#475569'
        }
      },
      tooltip: {
        ...tooltipStyle,
        callbacks: {
          label: (ctx) => `  ${ctx.label}: ${ctx.parsed} units`
        }
      }
    }
  };

  // Center text plugin for doughnut
  const centerTextPlugin = {
    id: 'centerText',
    afterDraw(chart) {
      if (chart.config.type !== 'doughnut') return;
      const { ctx, chartArea: { width, height, top, left } } = chart;
      const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
      ctx.save();
      ctx.font = "bold 22px 'Inter', sans-serif";
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(total.toLocaleString(), left + width / 2, top + height / 2 - 8);
      ctx.font = "500 11px 'Inter', sans-serif";
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Total Units', left + width / 2, top + height / 2 + 14);
      ctx.restore();
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <Calendar className="text-gray-400" size={20} />
          <select 
            className="text-sm font-semibold text-gray-700 bg-transparent border-none focus:ring-0 cursor-pointer"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="year">This Year</option>
          </select>
        </div>
        <button className="btn btn-secondary py-2 px-4 gap-2 text-xs" onClick={() => {
          const escapeCSV = (val) => `"${String(val || '').replace(/"/g, '""')}"`;
          
          // Dashboard Summary Section
          const summaryRows = [
            ['Dashboard Summary Report', ''],
            ['Generated On', new Date().toLocaleDateString()],
            [''],
            ['Total Revenue', `Rs. ${(metrics?.totalSalesRevenue || 0).toLocaleString()}`],
            ['Total Purchases', `Rs. ${(metrics?.totalPurchases || 0).toLocaleString()}`],
            ['Total Expenses', `Rs. ${(metrics?.totalExpenses || 0).toLocaleString()}`],
            ['Net Profit', `Rs. ${(metrics?.totalProfit || 0).toLocaleString()}`],
            ['Cash Balance', `Rs. ${(metrics?.totalCashBalance || 0).toLocaleString()}`],
            ['Bank Balance', `Rs. ${(metrics?.totalBankBalance || 0).toLocaleString()}`],
            [''],
            ['Detailed Transactions']
          ];

          const headers = [
            'Invoice No', 
            'Date', 
            'Type', 
            'Party Name', 
            'Phone', 
            'Payment Mode', 
            'Items Summary', 
            'Subtotal', 
            'Tax', 
            'Other Charges', 
            'Total Amount'
          ];

          const txRows = store.transactions.map(t => {
            const itemsSummary = t.products?.map(p => `${p.productName} (${p.quantity} ${p.unit})`).join(" | ") || '';
            const otherCharges = t.extraCharges?.reduce((sum, c) => sum + c.amount, 0) || 0;
            
            return [
              t.invoiceNumber,
              new Date(t.date).toLocaleDateString(),
              t.type.toUpperCase(),
              t.partyName,
              t.partyPhone || '',
              t.paymentMethod || 'Pending',
              itemsSummary,
              t.subtotal || 0,
              t.taxAmount || 0,
              otherCharges,
              t.totalAmount || 0
            ];
          });
          
          const combined = [
            ...summaryRows.map(row => row.map(escapeCSV).join(",")),
            headers.map(escapeCSV).join(","),
            ...txRows.map(row => row.map(escapeCSV).join(","))
          ].join("\n");
          
          const blob = new Blob([combined], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.setAttribute("href", url);
          link.setAttribute("download", `business_report_${new Date().toISOString().split('T')[0]}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }}>
          <Download size={14} />
          Export Detailed Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <ReportCard 
          title="Revenue" 
          value={`₹${(metrics?.totalSalesRevenue || 0).toLocaleString()}`} 
          trend="+12%" 
          color="bg-teal-50 text-teal-600"
          icon={<TrendingUp size={18} className="text-teal-500" />}
          subtitle="Total Sales"
        />
        <ReportCard 
          title="Expenses" 
          value={`₹${(metrics?.totalExpenses || 0).toLocaleString()}`} 
          trend="-5%" 
          color="bg-orange-50 text-orange-600"
          icon={<TrendingDown size={18} className="text-orange-500" />}
          subtitle="Total Expenses"
        />
        <ReportCard
          title="Cash Balance"
          value={`₹${(metrics?.totalCashBalance || 0).toLocaleString()}`}
          trend={metrics?.totalCashBalance >= (store.openingCashBalance || 0) ? 'Up' : 'Down'}
          color={metrics?.totalCashBalance >= (store.openingCashBalance || 0) ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}
          icon={<Banknote size={18} className="text-green-500" />}
          subtitle="Cash on hand"
        />
        <ReportCard
          title="Bank Balance"
          value={`₹${(metrics?.totalBankBalance || 0).toLocaleString()}`}
          trend={metrics?.totalBankBalance >= (store.openingBankBalance || 0) ? 'Up' : 'Down'}
          color={metrics?.totalBankBalance >= (store.openingBankBalance || 0) ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}
          icon={<Landmark size={18} className="text-blue-500" />}
          subtitle="UPI · Bank · Card"
        />
        <ReportCard 
          title="Net Balance" 
          value={`₹${(metrics?.netBalance || 0).toLocaleString()}`} 
          trend="Live" 
          color="bg-purple-50 text-purple-600"
          icon={<Wallet size={18} className="text-purple-500" />}
          subtitle="Overall Standing"
        />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 pt-6 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">Sales vs Purchases</h3>
              <p className="text-xs text-gray-400 mt-0.5">Monthly comparison overview</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'linear-gradient(to top, rgba(99,102,241,0.6), rgba(139,92,246,0.95))' }}></span>
                Sales
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'linear-gradient(to top, rgba(245,158,11,0.5), rgba(251,191,36,0.9))' }}></span>
                Purchases
              </span>
            </div>
          </div>
          <div className="px-6 pb-6 h-80">
            <Bar ref={barChartRef} data={salesByMonth} options={barOptions} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 pt-6 pb-4">
            <h3 className="text-base font-bold text-gray-900">Inventory Distribution</h3>
            <p className="text-xs text-gray-400 mt-0.5">Stock by category breakdown</p>
          </div>
          <div className="px-6 pb-6 h-80 flex items-center justify-center">
            <Doughnut data={categoryData} options={doughnutOptions} plugins={[centerTextPlugin]} />
          </div>
        </div>
      </div>

    </div>
  );
};

const ReportCard = ({ title, value, trend, color, icon, subtitle }) => (
  <div className="card p-6">
    <div className="flex items-center gap-2 mb-1">
      {icon && icon}
      <p className="text-sm text-gray-500 font-medium">{title}</p>
    </div>
    {subtitle && <p className="text-[10px] text-gray-400 mb-2">{subtitle}</p>}
    <div className="flex items-end justify-between">
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${color}`}>{trend}</span>
    </div>
  </div>
);

export default Reports;
