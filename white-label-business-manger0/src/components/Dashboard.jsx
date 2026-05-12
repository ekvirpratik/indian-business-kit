import React, { useMemo, useRef } from 'react';
import { useData } from '../context/DataContext';
import { 
  TrendingUp, 
  Package, 
  Truck, 
  Users, 
  AlertTriangle 
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Utility for formatting currency
const formatCurrency = (amount) => {
  return `₹${(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#14b8a6', '#f59e0b', '#ec4899'];

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

const Dashboard = ({ setCurrentView }) => {
  const { store, metrics } = useData();
  const lineChartRef = useRef(null);

  // --- Chart Data Preparation ---
  const salesChartData = useMemo(() => {
    const labels = [];
    const data = [];
    const now = new Date();
    
    const sales = store.transactions.filter(t => t.type === 'sale');
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      labels.push(dateString);
      
      const daySum = sales.reduce((sum, t) => {
        const tDate = new Date(t.date);
        if (tDate.getDate() === d.getDate() && tDate.getMonth() === d.getMonth() && tDate.getFullYear() === d.getFullYear()) {
          return sum + t.totalAmount;
        }
        return sum;
      }, 0);
      data.push(daySum);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Sales Revenue',
          data,
          borderColor: '#6366f1',
          backgroundColor: (ctx) => {
            const chart = ctx.chart;
            const { ctx: canvasCtx, chartArea } = chart;
            if (!chartArea) return 'rgba(99, 102, 241, 0.1)';
            const gradient = canvasCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(99, 102, 241, 0.28)');
            gradient.addColorStop(0.6, 'rgba(139, 92, 246, 0.08)');
            gradient.addColorStop(1, 'rgba(139, 92, 246, 0.01)');
            return gradient;
          },
          fill: true,
          tension: 0.4,
          borderWidth: 2.5,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#6366f1',
          pointBorderWidth: 2.5,
          pointHoverBackgroundColor: '#6366f1',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 3,
        },
      ],
    };
  }, [store.transactions]);

  const lineOptions = {
    maintainAspectRatio: false,
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'end',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: { size: 11, weight: '600', family: "'Inter', sans-serif" },
          color: '#64748b'
        }
      },
      tooltip: {
        ...tooltipStyle,
        callbacks: {
          label: (ctx) => `  Revenue: ₹${ctx.parsed.y.toLocaleString()}`
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
        border: { display: false }
      }
    }
  };

  const productChartData = useMemo(() => {
    const sortedProducts = [...store.products]
      .sort((a, b) => (b.totalSold * b.salePrice) - (a.totalSold * a.salePrice))
      .slice(0, 5);

    if (sortedProducts.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [1], backgroundColor: ['#e2e8f0'], borderWidth: 0 }]
      };
    }

    return {
      labels: sortedProducts.map(p => p.name),
      datasets: [
        {
          data: sortedProducts.map(p => p.totalSold * p.salePrice),
          backgroundColor: CHART_COLORS.slice(0, sortedProducts.length),
          borderWidth: 0,
          hoverOffset: 14,
          spacing: 3,
        },
      ],
    };
  }, [store.products]);

  const doughnutOptions = {
    maintainAspectRatio: false,
    responsive: true,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 14,
          font: { size: 11, weight: '500', family: "'Inter', sans-serif" },
          color: '#475569'
        }
      },
      tooltip: {
        ...tooltipStyle,
        callbacks: {
          label: (ctx) => `  ${ctx.label}: ₹${ctx.parsed.toLocaleString()}`
        }
      }
    }
  };

  // Center text plugin for doughnut
  const centerTextPlugin = {
    id: 'dashboardCenterText',
    afterDraw(chart) {
      if (chart.config.type !== 'doughnut') return;
      const { ctx, chartArea: { width, height, top, left } } = chart;
      const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
      ctx.save();
      ctx.font = "bold 20px 'Inter', sans-serif";
      ctx.fillStyle = '#1e293b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`₹${total.toLocaleString()}`, left + width / 2, top + height / 2 - 8);
      ctx.font = "500 10px 'Inter', sans-serif";
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Total Revenue', left + width / 2, top + height / 2 + 12);
      ctx.restore();
    }
  };

  const recentTransactions = [...store.transactions]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Revenue" 
          value={formatCurrency(metrics.totalSalesRevenue)} 
          icon={<TrendingUp className="text-primary-600" size={24} />} 
        />
        <MetricCard 
          title="Total Products" 
          value={metrics.totalProducts} 
          icon={<Package className="text-secondary-600" size={24} />} 
        />
        <MetricCard 
          title="Active Customers" 
          value={metrics.totalCustomers} 
          icon={<Users className="text-blue-500" size={24} />} 
        />
        <MetricCard 
          title="Low Stock Warning" 
          value={metrics.lowStockItems} 
          icon={<AlertTriangle className={`${metrics.lowStockItems > 0 ? 'text-red-500' : 'text-gray-400'}`} size={24} />}
          isAlert={metrics.lowStockItems > 0}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden lg:col-span-2">
          <div className="px-6 pt-6 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">Sales Overview</h3>
              <p className="text-xs text-gray-400 mt-0.5">Last 7 days revenue trend</p>
            </div>
          </div>
          <div className="px-6 pb-6 h-80">
             <Line ref={lineChartRef} data={salesChartData} options={lineOptions} />
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 pt-6 pb-4">
            <h3 className="text-base font-bold text-gray-900">Top Products</h3>
            <p className="text-xs text-gray-400 mt-0.5">By revenue contribution</p>
          </div>
          <div className="px-6 pb-6 h-80 flex items-center justify-center">
             <Doughnut data={productChartData} options={doughnutOptions} plugins={[centerTextPlugin]} />
          </div>
        </div>
      </div>

      {/* Recent Transactions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header border-b border-gray-100 pb-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            {setCurrentView && (
              <button 
                onClick={() => setCurrentView('transactions')}
                className="text-primary-600 text-sm font-semibold hover:underline"
              >
                View All
              </button>
            )}
          </div>
          <ul className="divide-y divide-gray-100">
            {recentTransactions.length === 0 ? (
              <li className="p-6 text-center text-gray-500">No recent transactions.</li>
            ) : (
              recentTransactions.map(t => (
                <li key={t.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'purchase' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                      {t.type === 'purchase' ? <Truck size={18} /> : <TrendingUp size={18} />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{t.partyName}</p>
                      <p className="text-xs text-gray-500">{new Date(t.date).toLocaleDateString()} • {t.invoiceNumber}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className={`font-semibold ${t.type === 'purchase' ? 'text-gray-600' : 'text-green-600'}`}>
                      {t.type === 'purchase' ? '-' : '+'}{formatCurrency(t.totalAmount)}
                    </div>
                    {t.paymentMethod && t.paymentMethod !== 'Pending' && (
                       <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-md ${t.type === 'purchase' ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-600'}`}>
                         {t.paymentMethod}
                       </span>
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Action Highlights or Quick Links could go here */}
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, icon, isAlert }) => (
  <div className={`card overflow-hidden relative ${isAlert ? 'border-red-200 shadow-sm shadow-red-100' : ''}`}>
    {isAlert && <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />}
    <div className="card-body flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h4 className="text-2xl font-bold text-gray-900">{value}</h4>
      </div>
    </div>
  </div>
);

export default Dashboard;
