import React, { useState } from 'react';
import { toast } from 'sonner';
import { useData } from '../context/DataContext';
import { FileDown, Plus, Trash2, MessageCircle } from 'lucide-react';
import { generatePDF } from '../lib/pdfUtils';

const InvoiceGenerator = () => {
  const { store, addTransaction } = useData();
  const [type, setType] = useState('sale'); // purchase or sale
  const [partyId, setPartyId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Pending');
  const [selectedProducts, setSelectedProducts] = useState([]);
  
  // Current product selection state
  const [currentProduct, setCurrentProduct] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState(1);
  const [currentRate, setCurrentRate] = useState('');
  const [currentTaxRate, setCurrentTaxRate] = useState(0);

  const [taxRate, setTaxRate] = useState(0);
  const [extraCharges, setExtraCharges] = useState([]);
  const [chargeLabel, setChargeLabel] = useState('');
  const [chargeAmount, setChargeAmount] = useState('');

  const handleAddProduct = () => {
    if (!currentProduct || !currentQuantity || !currentRate) return;
    
    const product = store.products.find(p => p.id.toString() === currentProduct.toString());
    if (!product) return;

    const quantity = parseFloat(currentQuantity);
    const rate = parseFloat(currentRate);
    const taxRate = parseFloat(currentTaxRate) || 0;
    const itemSubtotal = quantity * rate;
    const itemTax = itemSubtotal * (taxRate / 100);

    const newProductLine = {
      productId: product.id,
      productName: product.name,
      quantity,
      unit: product.unit,
      rate,
      taxRate,
      taxAmount: itemTax,
      amount: itemSubtotal + itemTax
    };

    setSelectedProducts([...selectedProducts, newProductLine]);
    setCurrentProduct('');
    setCurrentQuantity(1);
    setCurrentRate('');
    setCurrentTaxRate(0);
  };

  const handleAddCharge = () => {
    if (!chargeLabel || !chargeAmount) return;
    setExtraCharges([...extraCharges, { label: chargeLabel, amount: parseFloat(chargeAmount) }]);
    setChargeLabel('');
    setChargeAmount('');
  };

  const removeProduct = (index) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const removeCharge = (index) => {
    setExtraCharges(extraCharges.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    // Returns net amount (before tax)
    return selectedProducts.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  };

  const calculateTotalTax = () => {
    return selectedProducts.reduce((sum, item) => sum + item.taxAmount, 0);
  };

  const calculateExtraChargesTotal = () => {
    return extraCharges.reduce((sum, item) => sum + item.amount, 0);
  };

  const handleGenerateInvoice = () => {
    if (!partyId || selectedProducts.length === 0) {
      toast.error("Please select a party and add at least one product.");
      return;
    }

    const party = type === 'purchase' 
      ? store.suppliers.find(s => s.id.toString() === partyId)
      : store.customers.find(c => c.id.toString() === partyId);

    const subtotal = calculateSubtotal();
    const totalTax = calculateTotalTax();
    const extraChargesTotal = calculateExtraChargesTotal();
    const totalAmount = subtotal + totalTax + extraChargesTotal;

    const transaction = {
      type,
      partyId: party.id,
      partyName: party.name,
      partyPhone: party.phone || '',
      partyAddress: party.address || '',
      date,
      paymentMethod,
      products: selectedProducts,
      subtotal,
      taxAmount: totalTax,
      extraCharges,
      totalAmount
    };

    // Save to DataContext and get the fully formed transaction (with ID and Invoice Number)
    const newTransaction = addTransaction(transaction);

    // Generate PDF with the correct invoice number
    generatePDF(newTransaction, store);
    toast.success("Invoice generated successfully!");

    // Reset Form
    setSelectedProducts([]);
    setExtraCharges([]);
    setPartyId('');
    setTaxRate(0);
    setPaymentMethod('Pending');
  };

  const handleWhatsAppShare = () => {
    if (!partyId || selectedProducts.length === 0) {
      toast.error("Please select a party and add at least one product.");
      return;
    }

    const party = store.customers.find(c => c.id.toString() === partyId);
    if (!party) {
      toast.error("Customer details not found.");
      return;
    }

    if (!party.phone) {
      toast.error("Customer phone number is missing.");
      return;
    }

    const subtotal = calculateSubtotal();
    const totalTax = calculateTotalTax();
    const extraChargesTotal = calculateExtraChargesTotal();
    const totalAmount = subtotal + totalTax + extraChargesTotal;

    const transaction = {
      type,
      partyId: party.id,
      partyName: party.name,
      partyPhone: party.phone || '',
      partyAddress: party.address || '',
      date,
      paymentMethod,
      products: selectedProducts,
      subtotal,
      taxAmount: totalTax,
      extraCharges,
      totalAmount
    };

    // 1. Save Transaction
    const newTransaction = addTransaction(transaction);

    // 2. Prepare WhatsApp Message
    let message = store.businessInfo.whatsappTemplate || "Hi {customer_name}, here is your invoice {invoice_no} for Rs. {total_amount}.";
    
    message = message.replace('{customer_name}', party.name)
                     .replace('{invoice_no}', newTransaction.invoiceNumber)
                     .replace('{total_amount}', totalAmount.toFixed(2))
                     .replace('{date}', new Date(date).toLocaleDateString())
                     .replace('{business_name}', store.businessInfo.name || 'Our Business');

    // 3. Open WhatsApp
    const phoneNumber = party.phone.replace(/\D/g, ''); // Remove non-digits
    const whatsappUrl = `https://wa.me/${phoneNumber.startsWith('91') ? phoneNumber : '91' + phoneNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');

    // 4. Also Generate PDF for documentation
    generatePDF(newTransaction, store);
    toast.success("Invoice generated and shared successfully!");

    // 5. Reset Form
    setSelectedProducts([]);
    setExtraCharges([]);
    setPartyId('');
    setTaxRate(0);
    setPaymentMethod('Pending');
  };


  return (
    <div className="space-y-6">
      <div className="card max-w-4xl mx-auto">
        <div className="card-header flex justify-between items-center">
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Create Transaction</h2>
          
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${type === 'sale' ? 'bg-white shadow text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setType('sale')}
            >
              Sales Invoice
            </button>
            <button 
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${type === 'purchase' ? 'bg-white shadow text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setType('purchase')}
            >
              Purchase Bill
            </button>
          </div>
        </div>
        
        <div className="card-body space-y-8">
          {/* Top Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <label className="form-label">{type === 'sale' ? 'Customer' : 'Supplier'} *</label>
              <select className="form-control" value={partyId} onChange={(e) => setPartyId(e.target.value)}>
                <option value="">Select party...</option>
                {type === 'sale' 
                  ? store.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                  : store.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                }
              </select>
            </div>
            <div>
              <label className="form-label">Date</label>
              <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Payment Mode</label>
              <select className="form-control" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="Pending">Pending / Unpaid</option>
                <option value="Cash">Cash</option>
                <option value="Bank">Bank Transfer</option>
                <option value="UPI">UPI / QR Scan</option>
                <option value="Card">Credit/Debit Card</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          {/* Product Adder */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 border-b border-gray-200 pb-2">Add Products</h3>
            <div className="flex flex-col md:flex-row gap-3 items-end">
              <div className="flex-1 w-full">
                <label className="text-xs text-gray-500 mb-1 block">Product</label>
                <select className="form-control" value={currentProduct} onChange={(e) => {
                  setCurrentProduct(e.target.value);
                  const p = store.products.find(x => x.id.toString() === e.target.value);
                  if (p) setCurrentRate(type === 'sale' ? p.salePrice : p.purchasePrice);
                }}>
                  <option value="">Choose...</option>
                  {store.products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.currentStock} {p.unit} left)</option>
                  ))}
                </select>
              </div>
              <div className="w-full md:w-32">
                <label className="text-xs text-gray-500 mb-1 block">Qty</label>
                <input type="number" min="1" step="0.01" className="form-control" value={currentQuantity} onChange={(e) => setCurrentQuantity(e.target.value)} />
              </div>
              <div className="w-full md:w-40">
                <label className="text-xs text-gray-500 mb-1 block">Rate (₹)</label>
                <input type="number" min="0" step="0.01" className="form-control" value={currentRate} onChange={(e) => setCurrentRate(e.target.value)} />
              </div>
              <div className="w-full md:w-24">
                <label className="text-xs text-gray-500 mb-1 block">GST %</label>
                <input type="number" min="0" step="0.01" className="form-control" value={currentTaxRate} onChange={(e) => setCurrentTaxRate(e.target.value)} />
              </div>
              <button 
                type="button" 
                onClick={handleAddProduct}
                className="btn btn-secondary h-10.5 px-4 w-full md:w-auto mt-2 md:mt-0"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Line Items Table */}
          {selectedProducts.length > 0 && (
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product Name</th>
                    <th className="px-4 py-3 font-medium text-center">Qty</th>
                    <th className="px-4 py-3 font-medium text-right">Rate</th>
                    <th className="px-4 py-3 font-medium text-right">GST</th>
                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                    <th className="px-4 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedProducts.map((item, idx) => (
                    <tr key={idx} className="bg-white hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium border-r border-gray-50">{item.productName}</td>
                      <td className="px-4 py-3 text-center border-r border-gray-50">{item.quantity} {item.unit}</td>
                      <td className="px-4 py-3 text-right border-r border-gray-50">₹{item.rate.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right border-r border-gray-50 text-xs text-gray-400">
                        {item.taxRate}% (₹{item.taxAmount.toFixed(2)})
                      </td>
                      <td className="px-4 py-3 font-semibold text-right border-r border-gray-50">₹{item.amount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => removeProduct(idx)} className="text-red-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-all">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tax and Extra Charges Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 border-b border-gray-200 pb-2">Additional Charges</h3>
              
              <div className="flex gap-2 items-end bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="flex-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block tracking-wider">Charge Label</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Transport" 
                    className="form-control text-sm" 
                    value={chargeLabel}
                    onChange={(e) => setChargeLabel(e.target.value)}
                  />
                </div>
                <div className="w-32">
                  <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block tracking-wider">Amount (₹)</label>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    className="form-control text-sm" 
                    value={chargeAmount}
                    onChange={(e) => setChargeAmount(e.target.value)}
                  />
                </div>
                <button 
                  onClick={handleAddCharge}
                  className="btn btn-secondary h-10 px-3 bg-white"
                >
                  <Plus size={16} />
                </button>
              </div>

              {extraCharges.length > 0 && (
                <div className="space-y-2">
                  {extraCharges.map((charge, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2.5 bg-white border border-gray-200 rounded-lg shadow-sm animate-slide-up">
                      <span className="text-sm font-medium text-gray-600">{charge.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-900">₹{charge.amount.toFixed(2)}</span>
                        <button onClick={() => removeCharge(idx)} className="text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Subtotal (Net)</span>
                <span className="font-semibold text-gray-900">₹{calculateSubtotal().toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Total Tax (GST)</span>
                <span className="font-semibold text-gray-900">₹{calculateTotalTax().toFixed(2)}</span>
              </div>

              {extraCharges.length > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Other Charges</span>
                  <span className="font-semibold text-gray-900">₹{calculateExtraChargesTotal().toFixed(2)}</span>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Grand Total</span>
                <span className="text-2xl font-black text-primary-600">
                  ₹{(calculateSubtotal() + calculateTotalTax() + calculateExtraChargesTotal()).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4">
            {type === 'sale' && (
              <button 
                className="btn btn-secondary gap-2 px-8 py-4 text-lg border-2 border-green-500 text-green-600 hover:bg-green-50 shadow-md transition-all active:scale-95"
                onClick={handleWhatsAppShare}
              >
                <MessageCircle size={22} className="text-green-500" />
                WhatsApp
              </button>
            )}
            <button 
              className="btn btn-primary gap-2 px-10 py-4 text-lg shadow-lg hover:shadow-primary-100 hover:-translate-y-0.5"
              onClick={handleGenerateInvoice}
            >
              <FileDown size={22} />
              Save & Generate PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;
