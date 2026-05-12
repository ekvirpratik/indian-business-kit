import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Search, Filter, Plus, Edit2, Trash2, Calendar, CreditCard, DollarSign } from 'lucide-react';
import { expenseSchema } from '../lib/validations';
import { toast } from 'sonner';

const CATEGORIES = [
  'Rent',
  'Utilities',
  'Salary',
  'Travel',
  'Marketing',
  'Raw Materials',
  'Maintenance',
  'Miscellaneous'
];

const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Cheque'];

const Expenses = () => {
  const { store, addEntity, updateEntity, deleteEntity } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState('all');

  // Modal states
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [errors, setErrors] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: 'Miscellaneous',
    amount: '',
    paymentMethod: 'Cash',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const resetForm = () => {
    setFormData({
      title: '',
      category: 'Miscellaneous',
      amount: '',
      paymentMethod: 'Cash',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setErrors({});
  };

  const openAddModal = () => {
    resetForm();
    setIsAddingExpense(true);
  };

  const openEditModal = (expense) => {
    setFormData({
      title: expense.title,
      category: expense.category,
      amount: expense.amount.toString(),
      paymentMethod: expense.paymentMethod,
      date: expense.date,
      notes: expense.notes || ''
    });
    setEditingExpense(expense);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    const validation = expenseSchema.safeParse(formData);

    if (!validation.success) {
      const newErrors = {};
      validation.error.issues.forEach(issue => {
        newErrors[issue.path[0]] = issue.message;
      });
      setErrors(newErrors);
      toast.error("Validation failed. Check expense fields.");
      return;
    }

    addEntity('expenses', {
      ...formData,
      amount: validation.data.amount
    }, 'expenses');

    resetForm();
    setIsAddingExpense(false);
  };

  const handleUpdateExpense = (e) => {
    e.preventDefault();
    if (!editingExpense) return;

    const validation = expenseSchema.safeParse(formData);
    if (!validation.success) {
      const newErrors = {};
      validation.error.issues.forEach(issue => {
        newErrors[issue.path[0]] = issue.message;
      });
      setErrors(newErrors);
      toast.error("Validation failed. Check expense fields.");
      return;
    }

    updateEntity('expenses', editingExpense.id, {
      ...formData,
      amount: validation.data.amount
    });

    resetForm();
    setEditingExpense(null);
  };

  const handleDeleteExpense = (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteEntity('expenses', id);
    }
  };

  const filteredExpenses = (store.expenses || [])
    .reverse()
    .filter(e => {
      const matchesSearch = e.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || e.category === filterCategory;
      const matchesPayment = filterPaymentMethod === 'all' || e.paymentMethod === filterPaymentMethod;
      return matchesSearch && matchesCategory && matchesPayment;
    });

  const totalFilteredAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Expenses Tracker</h2>
          <p className="text-sm text-gray-500">Add, track, and analyze your business expenditures.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Add New Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-white border border-gray-100 shadow-sm">
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
              <DollarSign className="text-red-600" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Expenses</p>
              <h4 className="text-2xl font-bold text-gray-900">
                ₹{((store.expenses || []).reduce((sum, e) => sum + e.amount, 0)).toLocaleString()}
              </h4>
            </div>
          </div>
        </div>

        <div className="card bg-white border border-gray-100 shadow-sm">
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center border border-orange-100">
              <CreditCard className="text-orange-600" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Cash Expenses</p>
              <h4 className="text-2xl font-bold text-gray-900">
                ₹{((store.expenses || []).filter(e => e.paymentMethod === 'Cash').reduce((sum, e) => sum + e.amount, 0)).toLocaleString()}
              </h4>
            </div>
          </div>
        </div>

        <div className="card bg-white border border-gray-100 shadow-sm">
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
              <CreditCard className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Bank Expenses</p>
              <h4 className="text-2xl font-bold text-gray-900">
                ₹{((store.expenses || []).filter(e => ['Bank', 'UPI', 'Card', 'Cheque', 'Bank Transfer'].includes(e.paymentMethod)).reduce((sum, e) => sum + e.amount, 0)).toLocaleString()}
              </h4>
            </div>
          </div>
        </div>

        <div className="card bg-white border border-gray-100 shadow-sm">
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center border border-purple-100">
              <Calendar className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Selected List Total</p>
              <h4 className="text-2xl font-bold text-gray-900">
                ₹{totalFilteredAmount.toLocaleString()}
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* Action Filters and Table */}
      <div className="card bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="card-header border-b border-gray-100 flex flex-col md:flex-row justify-between gap-4 p-4 bg-white">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl flex-1 max-w-sm border border-gray-200 focus-within:border-primary-500 transition-colors">
            <Search size={18} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Search expense name..." 
              className="bg-transparent border-none outline-none text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select 
              className="form-control text-sm w-auto cursor-pointer border border-gray-200 rounded-xl px-3 py-1 bg-white hover:bg-gray-50"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>

            <select 
              className="form-control text-sm w-auto cursor-pointer border border-gray-200 rounded-xl px-3 py-1 bg-white hover:bg-gray-50"
              value={filterPaymentMethod}
              onChange={(e) => setFilterPaymentMethod(e.target.value)}
            >
              <option value="all">All Payment Methods</option>
              {PAYMENT_METHODS.map(pm => <option key={pm} value={pm}>{pm}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Title / Notes</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Payment Method</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    No expenses found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{e.title}</div>
                      {e.notes && <div className="text-xs text-gray-500 italic">{e.notes}</div>}
                    </td>
                    <td className="px-6 py-4 text-gray-700 capitalize">{e.category}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(e.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{e.paymentMethod}</td>
                    <td className="px-6 py-4 font-black tracking-tight text-red-600">
                      ₹{e.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(e)}
                          className="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-all active:scale-95 duration-150"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteExpense(e.id)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all active:scale-95 duration-150"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD/EDIT Expense Modal */}
      {(isAddingExpense || editingExpense) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 overflow-hidden relative select-none animate-fadeIn">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {editingExpense ? 'Edit Expense Record' : 'Log New Expense'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">Provide accurate bookkeeping details for real-time dashboard tracking.</p>

            <form onSubmit={editingExpense ? handleUpdateExpense : handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">Expense Title</label>
                <input
                  type="text"
                  name="title"
                  className={`form-control text-sm w-full border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 hover:bg-white focus:bg-white transition-colors ${errors.title ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                  placeholder="e.g. Office Stationery, Monthly Rent"
                  value={formData.title}
                  onChange={handleFormChange}
                />
                {errors.title && <p className="text-[10px] text-red-500 mt-1 font-medium">{errors.title}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">Category</label>
                  <select
                    name="category"
                    className="form-control text-sm w-full border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 hover:bg-white focus:bg-white transition-colors cursor-pointer"
                    value={formData.category}
                    onChange={handleFormChange}
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">Amount (₹)</label>
                  <input
                    type="number"
                    name="amount"
                    className={`form-control text-sm w-full border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 hover:bg-white focus:bg-white transition-colors ${errors.amount ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                    placeholder="0"
                    value={formData.amount}
                    onChange={handleFormChange}
                  />
                  {errors.amount && <p className="text-[10px] text-red-500 mt-1 font-medium">{errors.amount}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">Payment Method</label>
                  <select
                    name="paymentMethod"
                    className="form-control text-sm w-full border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 hover:bg-white focus:bg-white transition-colors cursor-pointer"
                    value={formData.paymentMethod}
                    onChange={handleFormChange}
                  >
                    {PAYMENT_METHODS.map(pm => <option key={pm} value={pm}>{pm}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    name="date"
                    className="form-control text-sm w-full border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 hover:bg-white focus:bg-white transition-colors cursor-pointer"
                    required
                    value={formData.date}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">Notes (Optional)</label>
                <textarea
                  name="notes"
                  rows="2"
                  className="form-control text-sm w-full border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 hover:bg-white focus:bg-white transition-colors"
                  placeholder="Any additional info..."
                  value={formData.notes}
                  onChange={handleFormChange}
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingExpense(false);
                    setEditingExpense(null);
                  }}
                  className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95"
                >
                  {editingExpense ? 'Save Changes' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
