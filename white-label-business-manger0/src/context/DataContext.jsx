import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { useUser } from '@clerk/react';
import { supabase, getSupabaseClient } from '../lib/supabaseClient';
import { toast } from 'sonner';


const DataContext = createContext();

const defaultStore = {
  businessInfo: {
    name: "",
    proprietor: "",
    phone: "",
    email: "",
    address: "",
    gst: "",
    logo: "",
    termsAndConditions: "",
    whatsappTemplate: "Hi {customer_name}, here is your invoice {invoice_no} for Rs. {total_amount}. Thank you for your business! - {business_name}",
    setupComplete: false
  },
  openingCashBalance: 0,
  openingBankBalance: 0,
  bankDetails: {
    bankName: "",
    accountNumber: "",
    accountHolderName: "",
    ifscCode: ""
  },
  bankQR: "",
  categories: [
    { id: 1, name: "General", description: "Default category", icon: "📦" },
    { id: 2, name: "Electronics", description: "Gadgets and devices", icon: "💻" },
    { id: 3, name: "Clothing & Apparel", description: "Clothes and accessories", icon: "👕" },
    { id: 4, name: "Food & Beverages", description: "Edibles and drinks", icon: "🍎" },
    { id: 5, name: "Home & Kitchen", description: "Household items", icon: "🏠" },
    { id: 6, name: "Health & Beauty", description: "Personal care", icon: "✨" },
    { id: 7, name: "Stationery", description: "Office and school supplies", icon: "✏️" },
    { id: 8, name: "Hardware & Tools", description: "Building and repair", icon: "🛠️" },
    { id: 9, name: "Automotive", description: "Vehicle parts and accessories", icon: "🚗" },
    { id: 10, name: "Beverages", description: "Drinks and sodas", icon: "🥤" },
    { id: 11, name: "Dairy & Eggs", description: "Milk, cheese, and eggs", icon: "🥚" },
    { id: 12, name: "Meat & Poultry", description: "Fresh meat products", icon: "🥩" },
    { id: 13, name: "Produce", description: "Fruits and vegetables", icon: "🥬" },
    { id: 14, name: "Bakery", description: "Bread and pastries", icon: "🥐" },
    { id: 15, name: "Frozen Foods", description: "Items kept in freezer", icon: "🧊" },
    { id: 16, name: "Pet Supplies", description: "Items for pets", icon: "🐕" },
    { id: 17, name: "Baby Care", description: "Items for infants", icon: "👶" },
    { id: 18, name: "Sports & Outdoors", description: "Equipment and gear", icon: "⚽" },
    { id: 19, name: "Toys & Games", description: "Fun things for all ages", icon: "🧸" },
    { id: 20, name: "Books & Media", description: "Knowledge and entertainment", icon: "📚" },
    { id: 21, name: "Jewelry & Accessories", description: "Fine jewelry and watches", icon: "💎" },
    { id: 22, name: "Furniture", description: "Tables, chairs, and beds", icon: "🛋️" },
    { id: 23, name: "Electrical Supplies", description: "Wires, bulbs, and switches", icon: "⚡" },
    { id: 24, name: "Plumbing", description: "Pipes, taps, and fittings", icon: "🚿" },
    { id: 25, name: "Footwear", description: "Shoes, boots, and sandals", icon: "👞" }
  ],
  products: [],
  suppliers: [],
  customers: [],
  transactions: [],
  expenses: [],
  counters: {
    products: 1,
    suppliers: 1,
    customers: 1,
    categories: 26,
    transactions: 1,
    invoicePurchase: 1,
    invoiceSale: 1,
    expenses: 1
  }
};

export const DataProvider = ({ children }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const [store, setStore] = useState(defaultStore);
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  
  // Differential synchronization tracking to avoid redundant network calls
  const lastSavedStoreRef = useRef('');
  const lastSavedProductsRef = useRef('');

  // Load data from Supabase when user signs in
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      setIsDbLoaded(false);
      const client = getSupabaseClient(user.id);
      
      Promise.all([
        client.from('user_data').select('store_data').eq('user_id', user.id).single(),
        client.from('inventory_management').select('*').eq('user_id', user.id)
      ]).then(([resUserData, resInventory]) => {
        let storeDataLoaded = null;
        if (resUserData.data && resUserData.data.store_data) {
          storeDataLoaded = resUserData.data.store_data;
        }

        let productsLoaded = [];
        if (resInventory.data) {
          productsLoaded = resInventory.data.map(p => ({
            id: p.product_id,
            sku: p.sku || '',
            name: p.name || '',
            categoryId: p.category_id || '',
            category: p.category || '',
            purchasePrice: parseFloat(p.purchase_price) || 0,
            salePrice: parseFloat(p.sale_price) || 0,
            unit: p.unit || 'PIECES',
            currentStock: parseFloat(p.current_stock) || 0,
            reorderLevel: parseFloat(p.reorder_level) || 0,
            totalPurchased: parseFloat(p.total_purchased) || 0,
            totalSold: parseFloat(p.total_sold) || 0,
            createdAt: p.created_at
          }));
        }

        if (storeDataLoaded) {
          const merged = {
            ...defaultStore,
            ...storeDataLoaded,
            products: productsLoaded.length > 0 ? productsLoaded : (storeDataLoaded.products || []),
            counters: {
              ...defaultStore.counters,
              ...(storeDataLoaded.counters || {})
            },
            expenses: storeDataLoaded.expenses || []
          };
          setStore(merged);
          
          // Seed initial differential snapshots to prevent immediate redundant write-back
          lastSavedStoreRef.current = JSON.stringify(merged);
          lastSavedProductsRef.current = JSON.stringify(merged.products || []);
        } else {
          const fallbackStore = {
            ...defaultStore,
            products: productsLoaded.length > 0 ? productsLoaded : defaultStore.products
          };
          setStore(fallbackStore);
          
          lastSavedStoreRef.current = JSON.stringify(fallbackStore);
          lastSavedProductsRef.current = JSON.stringify(fallbackStore.products || []);
        }
        setIsDbLoaded(true);
      }).catch(err => {
        console.error('Failed to load data from Supabase:', err.message);
        toast.error('Failed to load data from Supabase: ' + err.message);
        setIsDbLoaded(true);
      });
    } else if (isLoaded && !isSignedIn) {
      setStore(defaultStore);
      setIsDbLoaded(false);
    }
  }, [user, isLoaded, isSignedIn]);

  // Optimized Auto-Save to Supabase: Utilizing Debouncing + Differential tracking
  useEffect(() => {
    if (!isSignedIn || !user || !isDbLoaded) return;

    // 2000ms Debounce window stacks rapid sequential user actions into one bundle
    const timer = setTimeout(async () => {
      const currentStoreStr = JSON.stringify(store);
      const currentProductsStr = JSON.stringify(store.products || []);

      // Level 1: Global short-circuit if absolutely nothing changed
      if (currentStoreStr === lastSavedStoreRef.current) {
        return;
      }

      const client = getSupabaseClient(user.id);
      const timestamp = new Date().toISOString();

      try {
        // Step 1: Atomic push to main user object registry
        const { error: userSaveError } = await client
          .from('user_data')
          .upsert({ user_id: user.id, store_data: store, updated_at: timestamp }, { onConflict: 'user_id' });

        if (userSaveError) {
          console.error('Failed to save data to Supabase:', userSaveError.message);
          toast.error('Failed to save data to Supabase: ' + userSaveError.message);
          return; // Halt cascading syncs if primary master save failed
        }

        // Update cache key upon confirmed cloud write
        lastSavedStoreRef.current = currentStoreStr;

        // Level 2: Secondary short-circuit. Only push to inventory_management if products drifted.
        if (currentProductsStr !== lastSavedProductsRef.current) {
          const productsToSave = (store.products || []).map(p => ({
            user_id: user.id,
            product_id: p.id,
            sku: p.sku || '',
            name: p.name || '',
            category_id: p.categoryId ? String(p.categoryId) : '',
            category: p.category || '',
            purchase_price: p.purchasePrice || 0,
            sale_price: p.salePrice || 0,
            unit: p.unit || 'PIECES',
            current_stock: p.currentStock || 0,
            reorder_level: p.reorderLevel || 0,
            total_purchased: p.totalPurchased || 0,
            total_sold: p.totalSold || 0
          }));

          if (productsToSave.length > 0) {
            const { error: insError } = await client
              .from('inventory_management')
              .upsert(productsToSave, { onConflict: 'user_id,product_id' });

            if (insError) {
              console.error('Failed to save inventory to Supabase:', insError.message);
              toast.error('Failed to save inventory to Supabase: ' + insError.message);
            } else {
              // Sync secondary differential key on successful cloud persistence
              lastSavedProductsRef.current = currentProductsStr;
            }
          } else {
             // Items array just went from content to empty - update current ref to avoid infinite loop
             lastSavedProductsRef.current = currentProductsStr;
          }
        }
      } catch (error) {
        console.error('Auto-save critical failure:', error);
      }
    }, 2000);

    // Debounce cleanup prevents prior in-flight triggers from firing when store state moves
    return () => clearTimeout(timer);
  }, [store, isSignedIn, user, isDbLoaded]);

  const updateBusinessInfo = (info) => {
    // Extract opening balances if they exist
    const { openingBalance, openingCashBalance, openingBankBalance, ...businessInfo } = info;
    
    setStore(prev => {
      const newStore = {
        ...prev,
        businessInfo: { ...prev.businessInfo, ...businessInfo, setupComplete: true }
      };

      // Handle migration or direct updates
      if (openingCashBalance !== undefined) {
        newStore.openingCashBalance = parseFloat(openingCashBalance) || 0;
      }
      if (openingBankBalance !== undefined) {
        newStore.openingBankBalance = parseFloat(openingBankBalance) || 0;
      }
      
      // Fallback for old single field
      if (openingBalance !== undefined && openingCashBalance === undefined) {
        newStore.openingCashBalance = parseFloat(openingBalance) || 0;
      }

      return newStore;
    });
  };

  const updateOpeningBalance = (balance) => {
    // Deprecated but kept for compatibility, updates cash
    setStore(prev => ({ ...prev, openingCashBalance: parseFloat(balance) || 0 }));
  };

  const updateOpeningBalances = (cash, bank) => {
    setStore(prev => ({ 
      ...prev, 
      openingCashBalance: parseFloat(cash) || 0,
      openingBankBalance: parseFloat(bank) || 0 
    }));
  };

  const updateBusinessLogo = (logo) => {
    setStore(prev => ({ ...prev, businessInfo: { ...prev.businessInfo, logo } }));
  };

  const updateBankDetails = (details) => {
    setStore(prev => ({ ...prev, bankDetails: { ...prev.bankDetails, ...details } }));
  };

  const updateBankQR = (bankQR) => {
    setStore(prev => ({ ...prev, bankQR }));
  };

  const updateWhatsappTemplate = (template) => {
    setStore(prev => ({ 
      ...prev, 
      businessInfo: { ...prev.businessInfo, whatsappTemplate: template } 
    }));
  };

  // Generic add function for standard entities
  const addEntity = (entityType, data, idCounterKey) => {
    const id = store.counters[idCounterKey];
    const newItem = { ...data, id, createdAt: new Date().toISOString() };
    
    // Initialize some specific fields based on entity
    if (entityType === 'products') {
      newItem.totalPurchased = newItem.currentStock || 0;
      newItem.totalSold = 0;
    } else if (entityType === 'suppliers' || entityType === 'customers') {
      newItem.totalPurchases = 0;
      newItem.lastPurchase = "";
    }

    setStore(prev => ({
      ...prev,
      [entityType]: [...prev[entityType], newItem],
      counters: { ...prev.counters, [idCounterKey]: prev.counters[idCounterKey] + 1 }
    }));
    
    return newItem;
  };

  const updateEntity = (entityType, id, updates) => {
    setStore(prev => ({
      ...prev,
      [entityType]: prev[entityType].map(item => item.id === id ? { ...item, ...updates } : item)
    }));
  };

  const deleteEntity = (entityType, id) => {
    if (entityType === 'products' && user) {
      const client = getSupabaseClient(user.id);
      client
        .from('inventory_management')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', id)
        .then(({ error }) => {
          if (error) {
            console.error('Failed to delete inventory from Supabase:', error.message);
            toast.error('Failed to delete inventory from Supabase: ' + error.message);
          }
        });
    }
    setStore(prev => ({
      ...prev,
      [entityType]: prev[entityType].filter(item => item.id !== id)
    }));
  };

  // Transactions logic
  const addTransaction = (transaction) => {
    const isPurchase = transaction.type === 'purchase';
    const id = store.counters.transactions;
    const invoiceNumber = isPurchase 
      ? `PUR-${String(store.counters.invoicePurchase).padStart(3, '0')}`
      : `SAL-${String(store.counters.invoiceSale).padStart(3, '0')}`;
    
    const newTransaction = {
      ...transaction,
      id,
      invoiceNumber,
      createdAt: new Date().toISOString()
    };

    setStore(prev => {
      let updatedProducts = [...prev.products];
      let updatedSuppliers = [...prev.suppliers];
      let updatedCustomers = [...prev.customers];

      // Update Stock
      transaction.products.forEach(item => {
        updatedProducts = updatedProducts.map(p => {
          if (p.id === item.productId) {
            const qty = item.quantity;
            if (isPurchase) {
              return { ...p, currentStock: p.currentStock + qty, totalPurchased: p.totalPurchased + qty };
            } else {
              return { ...p, currentStock: p.currentStock - qty, totalSold: p.totalSold + qty };
            }
          }
          return p;
        });
      });

      // Update Party
      if (isPurchase) {
        updatedSuppliers = updatedSuppliers.map(s => 
          s.id === transaction.partyId 
            ? { ...s, totalPurchases: s.totalPurchases + transaction.totalAmount, lastPurchase: transaction.date }
            : s
        );
      } else {
        updatedCustomers = updatedCustomers.map(c => 
          c.id === transaction.partyId 
            ? { ...c, totalPurchases: c.totalPurchases + transaction.totalAmount, lastPurchase: transaction.date }
            : c
        );
      }

      return {
        ...prev,
        transactions: [...prev.transactions, newTransaction],
        products: updatedProducts,
        suppliers: updatedSuppliers,
        customers: updatedCustomers,
        counters: {
          ...prev.counters,
          transactions: prev.counters.transactions + 1,
          invoicePurchase: isPurchase ? prev.counters.invoicePurchase + 1 : prev.counters.invoicePurchase,
          invoiceSale: !isPurchase ? prev.counters.invoiceSale + 1 : prev.counters.invoiceSale
        }
      };
    });

    return newTransaction;
  };

  const updateTransaction = (id, updatedTx) => {
    setStore(prev => {
      const oldTx = prev.transactions.find(t => t.id === id);
      if (!oldTx) return prev;

      let updatedProducts = [...prev.products];
      let updatedSuppliers = [...prev.suppliers];
      let updatedCustomers = [...prev.customers];

      // 1. REVERSE OLD TRANSACTION IMPACT
      const isOldPurchase = oldTx.type === 'purchase';
      
      // Reverse Stock
      oldTx.products.forEach(item => {
        updatedProducts = updatedProducts.map(p => {
          if (p.id === item.productId) {
            const qty = item.quantity;
            if (isOldPurchase) {
              return { ...p, currentStock: p.currentStock - qty, totalPurchased: Math.max(0, p.totalPurchased - qty) };
            } else {
              return { ...p, currentStock: p.currentStock + qty, totalSold: Math.max(0, p.totalSold - qty) };
            }
          }
          return p;
        });
      });

      // Reverse Party Total
      if (isOldPurchase) {
        updatedSuppliers = updatedSuppliers.map(s => 
          s.id === oldTx.partyId 
            ? { ...s, totalPurchases: Math.max(0, s.totalPurchases - oldTx.totalAmount) }
            : s
        );
      } else {
        updatedCustomers = updatedCustomers.map(c => 
          c.id === oldTx.partyId 
            ? { ...c, totalPurchases: Math.max(0, c.totalPurchases - oldTx.totalAmount) }
            : c
        );
      }

      // 2. APPLY NEW TRANSACTION IMPACT
      const isNewPurchase = updatedTx.type === 'purchase'; // Although we said type won't change, we stay safe
      
      // Apply New Stock
      updatedTx.products.forEach(item => {
        updatedProducts = updatedProducts.map(p => {
          if (p.id === item.productId) {
            const qty = item.quantity;
            if (isNewPurchase) {
              return { ...p, currentStock: p.currentStock + qty, totalPurchased: p.totalPurchased + qty };
            } else {
              return { ...p, currentStock: p.currentStock - qty, totalSold: p.totalSold + qty };
            }
          }
          return p;
        });
      });

      // Apply New Party Total
      if (isNewPurchase) {
        updatedSuppliers = updatedSuppliers.map(s => 
          s.id === updatedTx.partyId 
            ? { ...s, totalPurchases: s.totalPurchases + updatedTx.totalAmount, lastPurchase: updatedTx.date }
            : s
        );
      } else {
        updatedCustomers = updatedCustomers.map(c => 
          c.id === updatedTx.partyId 
            ? { ...c, totalPurchases: c.totalPurchases + updatedTx.totalAmount, lastPurchase: updatedTx.date }
            : c
        );
      }

      // 3. Update Transaction List
      const updatedTransactions = prev.transactions.map(t => 
        t.id === id ? { ...t, ...updatedTx, updatedAt: new Date().toISOString() } : t
      );

      return {
        ...prev,
        transactions: updatedTransactions,
        products: updatedProducts,
        suppliers: updatedSuppliers,
        customers: updatedCustomers
      };
    });
  };

  const calculateMetrics = () => {
    const totalInventoryValue = store.products.reduce((sum, p) => sum + (p.currentStock * p.purchasePrice), 0);
    const salesTransactions = store.transactions.filter(t => t.type === 'sale');
    const totalSalesRevenue = salesTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalPurchases = store.transactions.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.totalAmount, 0);
    
    // Expenses
    const totalExpenses = (store.expenses || []).reduce((sum, e) => sum + e.amount, 0);

    const totalProfit = totalSalesRevenue - totalPurchases - totalExpenses;
    const netBalance = (store.openingCashBalance || 0) + (store.openingBankBalance || 0) + totalSalesRevenue - totalPurchases - totalExpenses;
    const lowStockItems = store.products.filter(p => p.currentStock <= p.reorderLevel).length;

    // Cash vs Bank split
    // Cash: only "Cash" payment method
    // Bank: UPI, Bank Transfer, Card, Cheque (anything that goes through bank/digital)
    const BANK_METHODS = ['Bank', 'UPI', 'Card', 'Cheque'];

    const cashSales = store.transactions
      .filter(t => t.type === 'sale' && t.paymentMethod === 'Cash')
      .reduce((sum, t) => sum + t.totalAmount, 0);
    const cashPurchases = store.transactions
      .filter(t => t.type === 'purchase' && t.paymentMethod === 'Cash')
      .reduce((sum, t) => sum + t.totalAmount, 0);
    const cashExpenses = (store.expenses || [])
      .filter(e => e.paymentMethod === 'Cash')
      .reduce((sum, e) => sum + e.amount, 0);
    const cashNetProfit = cashSales - cashPurchases - cashExpenses;

    const bankSales = store.transactions
      .filter(t => t.type === 'sale' && BANK_METHODS.includes(t.paymentMethod))
      .reduce((sum, t) => sum + t.totalAmount, 0);
    const bankPurchases = store.transactions
      .filter(t => t.type === 'purchase' && BANK_METHODS.includes(t.paymentMethod))
      .reduce((sum, t) => sum + t.totalAmount, 0);
    const bankExpenses = (store.expenses || [])
      .filter(e => BANK_METHODS.includes(e.paymentMethod))
      .reduce((sum, e) => sum + e.amount, 0);
    const bankNetProfit = bankSales - bankPurchases - bankExpenses;

    const totalCashBalance = (store.openingCashBalance || 0) + cashSales - cashPurchases - cashExpenses;
    const totalBankBalance = (store.openingBankBalance || 0) + bankSales - bankPurchases - bankExpenses;

    return {
      totalInventoryValue,
      totalSalesRevenue,
      totalPurchases,
      totalExpenses,
      totalProfit,
      netBalance,
      openingCashBalance: store.openingCashBalance || 0,
      openingBankBalance: store.openingBankBalance || 0,
      lowStockItems,
      totalProducts: store.products.length,
      totalSuppliers: store.suppliers.length,
      totalCustomers: store.customers.length,
      totalExpensesCount: (store.expenses || []).length,
      cashNetProfit,
      bankNetProfit,
      totalCashBalance,
      totalBankBalance
    };
  };

  const contextValue = {
    store,
    isLoaded,
    isDbLoaded,
    updateBusinessInfo,
    updateBusinessLogo,
    updateBankDetails,
    updateBankQR,
    updateWhatsappTemplate,
    updateOpeningBalance,
    updateOpeningBalances,
    addEntity,
    updateEntity,
    deleteEntity,
    addTransaction,
    updateTransaction,
    metrics: useMemo(() => calculateMetrics(), [store.products, store.transactions, store.suppliers, store.customers, store.expenses])
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
