import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Search, Filter, Download, Eye, Edit3, X, Plus, Trash2, Printer, CheckCircle2 } from 'lucide-react';
import { generatePDF } from '../lib/pdfUtils';

const Transactions = () => {
  const { store, updateEntity, updateTransaction } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // Modal states
  const [viewingTx, setViewingTx] = useState(null);
  const [editingTx, setEditingTx] = useState(null);

  const filteredTransactions = [...store.transactions].reverse().filter(t => {
    const matchesSearch = (t.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleDownloadPDF = (t) => {
    generatePDF(t, store);
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transactions Ledger</h2>
          <p className="text-sm text-gray-500">Manage, view, and correct your past invoices.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header border-b border-gray-100 flex flex-col md:flex-row justify-between gap-4 p-4">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl flex-1 max-w-sm border border-gray-200 focus-within:border-primary-500 transition-colors">
            <Search size={18} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Search invoices or parties..." 
              className="bg-transparent border-none outline-none text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
             <select 
               className="form-control text-sm w-auto cursor-pointer"
               value={filterType}
               onChange={(e) => setFilterType(e.target.value)}
             >
               <option value="all">All Types</option>
               <option value="sale">Sales Only</option>
               <option value="purchase">Purchases Only</option>
             </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Invoice No</th>
                <th className="px-6 py-4">Party & Date</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Payment Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-gray-900">{t.invoiceNumber}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800">{t.partyName}</div>
                      <div className="text-xs text-gray-500">{new Date(t.date).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 capitalize">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${t.type === 'sale' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black tracking-tight text-gray-900">₹{t.totalAmount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="relative w-fit">
                        <select 
                          className={`
                            appearance-none font-bold uppercase text-[10px] rounded-full px-3 py-1.5 pr-8 border shadow-sm outline-none cursor-pointer transition-all hover:opacity-90 active:scale-95
                            ${t.paymentMethod && t.paymentMethod !== 'Pending' 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : 'bg-red-50 text-red-600 border-red-200'
                            }
                          `}
                          value={t.paymentMethod || 'Pending'}
                          onChange={(e) => updateEntity('transactions', t.id, { paymentMethod: e.target.value })}
                        >
                          <option value="Pending">⚠️ Unpaid / Pending</option>
                          <option value="Cash">PAID: CASH</option>
                          <option value="Bank">PAID: BANK</option>
                          <option value="UPI">PAID: UPI</option>
                          <option value="Card">PAID: CARD</option>
                        </select>
                        <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 ${t.paymentMethod && t.paymentMethod !== 'Pending' ? 'text-green-600' : 'text-red-500'}`}>
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setViewingTx(t)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => setEditingTx({ ...t })}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit Invoice"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDownloadPDF(t)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <Download size={18} />
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

      {/* Viewing Modal */}
      {viewingTx && (
        <InvoicePreviewModal 
          transaction={viewingTx} 
          onClose={() => setViewingTx(null)} 
          onDownload={() => handleDownloadPDF(viewingTx)}
        />
      )}

      {/* Editing Modal */}
      {editingTx && (
        <EditInvoiceModal 
          transaction={editingTx} 
          store={store}
          onClose={() => setEditingTx(null)} 
          onSave={(updated) => {
            updateTransaction(editingTx.id, updated);
            setEditingTx(null);
          }}
        />
      )}
    </div>
  );
};

/**
 * Invoice Preview Modal Component
 */
const InvoicePreviewModal = ({ transaction, onClose, onDownload }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Invoice Details</h3>
            <p className="text-xs text-gray-500">#{transaction.invoiceNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Party Details</label>
              <div className="mt-1 font-bold text-gray-900 uppercase">{transaction.partyName}</div>
              <div className="text-sm text-gray-600">{transaction.partyAddress || 'No Address Provided'}</div>
              <div className="text-sm text-gray-600">{transaction.partyPhone}</div>
            </div>
            <div className="text-right">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Date & Status</label>
              <div className="mt-1 font-bold text-gray-900">{new Date(transaction.date).toLocaleDateString()}</div>
              <div className="mt-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${transaction.paymentMethod !== 'Pending' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {transaction.paymentMethod === 'Pending' ? 'Unpaid' : `Paid via ${transaction.paymentMethod}`}
                </span>
              </div>
            </div>
          </div>

          <div className="border border-gray-100 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 font-semibold">Item</th>
                  <th className="px-4 py-3 font-semibold text-center">Qty</th>
                  <th className="px-4 py-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transaction.products.map((p, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 font-medium text-gray-900">{p.productName}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{p.quantity} {p.unit}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">₹{p.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl space-y-2">
             <div className="flex justify-between text-sm text-gray-500">
               <span>Subtotal</span>
               <span>₹{transaction.subtotal.toLocaleString()}</span>
             </div>
             {transaction.taxAmount > 0 && (
               <div className="flex justify-between text-sm text-gray-500">
                 <span>GST Total</span>
                 <span>₹{transaction.taxAmount.toLocaleString()}</span>
               </div>
             )}
             {transaction.extraCharges?.map((ec, i) => (
                <div key={i} className="flex justify-between text-sm text-gray-500">
                  <span>{ec.label}</span>
                  <span>₹{ec.amount.toLocaleString()}</span>
                </div>
             ))}
             <div className="flex justify-between pt-2 border-t border-gray-200">
               <span className="font-bold text-gray-900">Grand Total</span>
               <span className="text-xl font-black text-primary-600">₹{transaction.totalAmount.toLocaleString()}</span>
             </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button 
            onClick={onDownload}
            className="flex-1 btn btn-primary flex items-center justify-center gap-2 py-3"
          >
            <Printer size={18} />
            Print / Download PDF
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Edit Invoice Modal Component
 */
const EditInvoiceModal = ({ transaction, store, onClose, onSave }) => {
  const [edited, setEdited] = useState({ ...transaction });
  
  // Local state for product editing
  const [currentProduct, setCurrentProduct] = useState('');
  const [currentQty, setCurrentQty] = useState(1);
  const [currentRate, setCurrentRate] = useState('');
  const [currentTax, setCurrentTax] = useState(0);

  // Recalculate totals whenever products or charges change
  useEffect(() => {
    const subtotal = edited.products.reduce((sum, p) => sum + (p.quantity * p.rate), 0);
    const taxAmount = edited.products.reduce((sum, p) => sum + (p.taxAmount || 0), 0);
    const extraTotal = edited.extraCharges?.reduce((sum, c) => sum + c.amount, 0) || 0;
    
    setEdited(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      totalAmount: subtotal + taxAmount + extraTotal
    }));
  }, [edited.products, edited.extraCharges]);

  const addProduct = () => {
    if (!currentProduct || !currentQty || !currentRate) return;
    const pInfo = store.products.find(p => p.id.toString() === currentProduct.toString());
    const qty = parseFloat(currentQty);
    const rate = parseFloat(currentRate);
    const taxRate = parseFloat(currentTax) || 0;
    const itemSub = qty * rate;
    const itemTax = itemSub * (taxRate / 100);

    const newItem = {
      productId: pInfo.id,
      productName: pInfo.name,
      quantity: qty,
      unit: pInfo.unit,
      rate,
      taxRate,
      taxAmount: itemTax,
      amount: itemSub + itemTax
    };

    setEdited(prev => ({
      ...prev,
      products: [...prev.products, newItem]
    }));
    
    setCurrentProduct('');
    setCurrentQty(1);
    setCurrentRate('');
    setCurrentTax(0);
  };

  const removeProduct = (idx) => {
    setEdited(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== idx)
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Edit Transaction</h3>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">{edited.invoiceNumber}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
           {/* Section 1: Basic Info */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block">Party Name</label>
                <input 
                  type="text" 
                  className="form-control bg-white font-bold" 
                  value={edited.partyName} 
                  onChange={(e) => setEdited({...edited, partyName: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block">Date</label>
                <input 
                  type="date" 
                  className="form-control bg-white" 
                  value={edited.date} 
                  onChange={(e) => setEdited({...edited, date: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block">Payment Mode</label>
                <select 
                  className="form-control bg-white font-bold" 
                  value={edited.paymentMethod}
                  onChange={(e) => setEdited({...edited, paymentMethod: e.target.value})}
                >
                  <option value="Pending">Pending</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                </select>
              </div>
           </div>

           {/* Section 2: Products */}
           <div className="space-y-4">
              <h4 className="text-sm font-black text-gray-800 uppercase tracking-wider">Correct Product Items</h4>
              <div className="flex flex-col md:flex-row gap-3 items-end bg-primary-50/30 p-4 rounded-xl border border-primary-100">
                  <div className="flex-1 w-full">
                    <label className="text-[10px] font-bold text-primary-600 mb-1 block">Product</label>
                    <select 
                      className="form-control bg-white text-sm" 
                      value={currentProduct} 
                      onChange={(e) => {
                        setCurrentProduct(e.target.value);
                        const p = store.products.find(x => x.id.toString() === e.target.value);
                        if (p) setCurrentRate(edited.type === 'sale' ? p.salePrice : p.purchasePrice);
                      }}
                    >
                      <option value="">Add item...</option>
                      {store.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="w-full md:w-24">
                    <label className="text-[10px] font-bold text-primary-600 mb-1 block">Qty</label>
                    <input type="number" className="form-control bg-white text-sm" value={currentQty} onChange={(e) => setCurrentQty(e.target.value)} />
                  </div>
                  <div className="w-full md:w-28">
                    <label className="text-[10px] font-bold text-primary-600 mb-1 block">Rate</label>
                    <input type="number" className="form-control bg-white text-sm" value={currentRate} onChange={(e) => setCurrentRate(e.target.value)} />
                  </div>
                  <div className="w-full md:w-20">
                    <label className="text-[10px] font-bold text-primary-600 mb-1 block">GST%</label>
                    <input type="number" className="form-control bg-white text-sm" value={currentTax} onChange={(e) => setCurrentTax(e.target.value)} />
                  </div>
                  <button onClick={addProduct} className="btn bg-primary-600 text-white h-[42px] px-4 rounded-xl hover:bg-primary-700">
                    <Plus size={20} />
                  </button>
              </div>

              <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-bold">
                    <tr>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3 text-right">Rate</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {edited.products.map((p, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-gray-900">{p.productName}</td>
                        <td className="px-4 py-3 text-center">{p.quantity} {p.unit}</td>
                        <td className="px-4 py-3 text-right">₹{p.rate.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-black">₹{p.amount.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => removeProduct(i)} className="text-red-400 hover:text-red-600 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>

           {/* Section 3: Summary & Total */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <h4 className="text-sm font-black text-gray-800 uppercase tracking-wider">Other Info</h4>
                 <div className="space-y-3">
                    <label className="text-[10px] font-bold text-gray-400 block mb-1">Billing Address</label>
                    <textarea 
                      className="form-control text-sm min-h-[80px]" 
                      value={edited.partyAddress} 
                      onChange={(e) => setEdited({...edited, partyAddress: e.target.value})}
                      placeholder="Enter party address..."
                    />
                 </div>
              </div>

              <div className="bg-gray-900 text-white p-8 rounded-[2rem] shadow-xl space-y-4">
                  <div className="flex justify-between items-center text-gray-400 text-sm">
                    <span>Subtotal</span>
                    <span className="font-bold">₹{edited.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-400 text-sm">
                    <span>Tax (GST)</span>
                    <span className="font-bold">₹{edited.taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="pt-4 border-t border-gray-800 flex justify-between items-end">
                    <div>
                      <div className="text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-1">Final Amount</div>
                      <div className="text-3xl font-black">₹{edited.totalAmount.toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                       <CheckCircle2 size={32} className="text-primary-500 opacity-50" />
                    </div>
                  </div>
              </div>
           </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-4 bg-gray-50/50">
           <button 
             onClick={() => onSave(edited)}
             className="flex-1 py-4 bg-primary-600 text-white font-black rounded-2xl shadow-lg shadow-primary-200 hover:bg-primary-700 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
           >
             Save Corrected Invoice
           </button>
           <button 
             onClick={onClose}
             className="px-8 py-4 bg-white border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-colors"
           >
             Discard
           </button>
        </div>
      </div>
    </div>
  );
};

export default Transactions;
