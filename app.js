// Global state management (in-memory, no localStorage)
let savedROICalculations = [];
let cashFlowData = {
    best: {},
    likely: {},
    worst: {}
};
let currentCFScenario = 'best';
let actualsMode = false;
let multiInventory = [];
let abcProducts = [];
let customers = [];
let marketingCampaigns = [];
let currentEditingCustomerId = null;
let currentViewingCustomerId = null;
let currentSortColumn = null;
let currentSortDirection = 'asc';

// Utility functions
function formatINR(amount) {
    return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatNumber(num, decimals = 2) {
    return num.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// Main tab switching
function switchMainTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.main-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + '-content').classList.add('active');
    
    // Add active class to clicked tab
    event.target.classList.add('active');
    
    // Initialize specific tab content
    if (tabName === 'cashflow') {
        initializeCashFlowTable();
    } else if (tabName === 'inventory') {
        updateMultiInventoryTable();
    } else if (tabName === 'crm') {
        updateCustomersTable();
        updateCRMStats();
    } else if (tabName === 'marketing') {
        updateCampaignsTable();
    }
}

// ============================================
// CUSTOMER DATABASE MANAGER (CRM)
// ============================================

function saveCustomer() {
    const name = document.getElementById('crm-name').value.trim();
    const phone = document.getElementById('crm-phone').value.trim();
    
    if (!name || !phone) {
        alert('Please enter customer name and phone number');
        return;
    }
    
    // Validate phone number (10 digits)
    if (!/^\d{10}$/.test(phone)) {
        alert('Please enter a valid 10-digit phone number');
        return;
    }
    
    // Validate email if provided
    const email = document.getElementById('crm-email').value.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('Please enter a valid email address');
        return;
    }
    
    const customer = {
        id: currentEditingCustomerId || Date.now(),
        name: name,
        company: document.getElementById('crm-company').value.trim(),
        email: email,
        phone: phone,
        whatsapp: document.getElementById('crm-whatsapp').value.trim(),
        address: document.getElementById('crm-address').value.trim(),
        category: document.getElementById('crm-category').value,
        birthday: document.getElementById('crm-birthday').value,
        anniversary: document.getElementById('crm-anniversary').value,
        tags: document.getElementById('crm-tags').value.trim(),
        lastContact: document.getElementById('crm-last-contact').value || new Date().toISOString().split('T')[0],
        nextFollowup: document.getElementById('crm-next-followup').value,
        notes: document.getElementById('crm-notes').value.trim(),
        purchases: currentEditingCustomerId ? customers.find(c => c.id === currentEditingCustomerId)?.purchases || [] : [],
        createdDate: currentEditingCustomerId ? customers.find(c => c.id === currentEditingCustomerId)?.createdDate : new Date().toISOString().split('T')[0]
    };
    
    if (currentEditingCustomerId) {
        const index = customers.findIndex(c => c.id === currentEditingCustomerId);
        customers[index] = customer;
        alert('Customer updated successfully!');
    } else {
        customers.push(customer);
        alert('Customer added successfully!');
    }
    
    clearCustomerForm();
    updateCustomersTable();
    updateCRMStats();
}

function clearCustomerForm() {
    document.getElementById('crm-name').value = '';
    document.getElementById('crm-company').value = '';
    document.getElementById('crm-email').value = '';
    document.getElementById('crm-phone').value = '';
    document.getElementById('crm-whatsapp').value = '';
    document.getElementById('crm-address').value = '';
    document.getElementById('crm-category').value = 'A';
    document.getElementById('crm-birthday').value = '';
    document.getElementById('crm-anniversary').value = '';
    document.getElementById('crm-tags').value = '';
    document.getElementById('crm-last-contact').value = '';
    document.getElementById('crm-next-followup').value = '';
    document.getElementById('crm-notes').value = '';
    currentEditingCustomerId = null;
}

function editCustomer(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;
    
    currentEditingCustomerId = id;
    document.getElementById('crm-name').value = customer.name;
    document.getElementById('crm-company').value = customer.company;
    document.getElementById('crm-email').value = customer.email;
    document.getElementById('crm-phone').value = customer.phone;
    document.getElementById('crm-whatsapp').value = customer.whatsapp;
    document.getElementById('crm-address').value = customer.address;
    document.getElementById('crm-category').value = customer.category;
    document.getElementById('crm-birthday').value = customer.birthday;
    document.getElementById('crm-anniversary').value = customer.anniversary;
    document.getElementById('crm-tags').value = customer.tags;
    document.getElementById('crm-last-contact').value = customer.lastContact;
    document.getElementById('crm-next-followup').value = customer.nextFollowup;
    document.getElementById('crm-notes').value = customer.notes;
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteCustomer(id) {
    if (confirm('Are you sure you want to delete this customer?')) {
        customers = customers.filter(c => c.id !== id);
        updateCustomersTable();
        updateCRMStats();
    }
}

function getTotalPurchases(customer) {
    if (!customer.purchases || customer.purchases.length === 0) return 0;
    return customer.purchases.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
}

function updateCustomersTable() {
    const tbody = document.getElementById('customers-tbody');
    tbody.innerHTML = '';
    
    let filteredCustomers = filterCustomersList();
    
    if (filteredCustomers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">No customers found</td></tr>';
        return;
    }
    
    filteredCustomers.forEach(customer => {
        const totalPurchases = getTotalPurchases(customer);
        const row = document.createElement('tr');
        
        let categoryClass = 'status-green';
        if (customer.category === 'B') categoryClass = 'status-yellow';
        if (customer.category === 'C') categoryClass = 'status-red';
        
        // Check follow-up status
        let followupStatus = '';
        if (customer.nextFollowup) {
            const today = new Date().toISOString().split('T')[0];
            if (customer.nextFollowup < today) {
                followupStatus = ' style="background: #FEE2E2;"';
            } else if (customer.nextFollowup === today) {
                followupStatus = ' style="background: #FEF3C7;"';
            }
        }
        
        row.innerHTML = `
            <td style="cursor: pointer;" onclick="viewCustomerDetails(${customer.id})">${customer.name}</td>
            <td>${customer.company || '-'}</td>
            <td>${customer.phone}</td>
            <td>${customer.email || '-'}</td>
            <td><span class="status-badge ${categoryClass}">${customer.category}</span></td>
            <td>${formatINR(totalPurchases)}</td>
            <td>${customer.lastContact || '-'}</td>
            <td${followupStatus}>${customer.nextFollowup || '-'}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewCustomerDetails(${customer.id})">View</button>
                <button class="btn btn-sm btn-primary" onclick="editCustomer(${customer.id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteCustomer(${customer.id})">Del</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterCustomersList() {
    const searchTerm = document.getElementById('crm-search').value.toLowerCase();
    const categoryFilter = document.getElementById('filter-category').value;
    const followupFilter = document.getElementById('filter-followup').value;
    
    let filtered = customers.filter(customer => {
        const matchesSearch = customer.name.toLowerCase().includes(searchTerm) ||
                             (customer.company && customer.company.toLowerCase().includes(searchTerm)) ||
                             customer.phone.includes(searchTerm) ||
                             (customer.email && customer.email.toLowerCase().includes(searchTerm));
        
        const matchesCategory = !categoryFilter || customer.category === categoryFilter;
        
        let matchesFollowup = true;
        if (followupFilter && customer.nextFollowup) {
            const today = new Date().toISOString().split('T')[0];
            if (followupFilter === 'overdue') {
                matchesFollowup = customer.nextFollowup < today;
            } else if (followupFilter === 'today') {
                matchesFollowup = customer.nextFollowup === today;
            } else if (followupFilter === 'upcoming') {
                matchesFollowup = customer.nextFollowup > today;
            }
        }
        
        return matchesSearch && matchesCategory && matchesFollowup;
    });
    
    return filtered;
}

function filterCustomers() {
    updateCustomersTable();
}

function sortCustomers(column) {
    if (currentSortColumn === column) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortColumn = column;
        currentSortDirection = 'asc';
    }
    
    customers.sort((a, b) => {
        let valA, valB;
        
        if (column === 'name') {
            valA = a.name.toLowerCase();
            valB = b.name.toLowerCase();
        } else if (column === 'company') {
            valA = (a.company || '').toLowerCase();
            valB = (b.company || '').toLowerCase();
        } else if (column === 'category') {
            valA = a.category;
            valB = b.category;
        } else if (column === 'totalPurchases') {
            valA = getTotalPurchases(a);
            valB = getTotalPurchases(b);
        }
        
        if (valA < valB) return currentSortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return currentSortDirection === 'asc' ? 1 : -1;
        return 0;
    });
    
    updateCustomersTable();
}

function autoCategorize() {
    if (!confirm('Auto-categorize customers based on purchase value?\n\nA: >₹50,000\nB: ₹10,000-₹50,000\nC: <₹10,000')) {
        return;
    }
    
    customers.forEach(customer => {
        const totalPurchases = getTotalPurchases(customer);
        if (totalPurchases > 50000) {
            customer.category = 'A';
        } else if (totalPurchases >= 10000) {
            customer.category = 'B';
        } else {
            customer.category = 'C';
        }
    });
    
    updateCustomersTable();
    updateCRMStats();
    alert('Customers categorized successfully!');
}

function updateCRMStats() {
    const totalCustomers = customers.length;
    const totalRevenue = customers.reduce((sum, c) => sum + getTotalPurchases(c), 0);
    const avgValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
    
    document.getElementById('stat-total-customers').textContent = totalCustomers;
    document.getElementById('stat-total-revenue').textContent = formatINR(totalRevenue);
    document.getElementById('stat-avg-value').textContent = formatINR(avgValue);
    
    // Category counts
    const catA = customers.filter(c => c.category === 'A').length;
    const catB = customers.filter(c => c.category === 'B').length;
    const catC = customers.filter(c => c.category === 'C').length;
    
    document.getElementById('cat-a-count').textContent = catA;
    document.getElementById('cat-b-count').textContent = catB;
    document.getElementById('cat-c-count').textContent = catC;
    
    // Reminders
    const today = new Date().toISOString().split('T')[0];
    const overdue = customers.filter(c => c.nextFollowup && c.nextFollowup < today).length;
    const dueToday = customers.filter(c => c.nextFollowup === today).length;
    
    // Birthdays and anniversaries in next 30 days
    const next30Days = new Date();
    next30Days.setDate(next30Days.getDate() + 30);
    
    const upcomingBirthdays = customers.filter(c => {
        if (!c.birthday) return false;
        const bday = new Date(c.birthday);
        const thisYearBday = new Date(new Date().getFullYear(), bday.getMonth(), bday.getDate());
        return thisYearBday >= new Date() && thisYearBday <= next30Days;
    }).length;
    
    const upcomingAnniversaries = customers.filter(c => {
        if (!c.anniversary) return false;
        const anniv = new Date(c.anniversary);
        const thisYearAnniv = new Date(new Date().getFullYear(), anniv.getMonth(), anniv.getDate());
        return thisYearAnniv >= new Date() && thisYearAnniv <= next30Days;
    }).length;
    
    document.getElementById('reminder-overdue').textContent = `${overdue} Overdue`;
    document.getElementById('reminder-today').textContent = `${dueToday} Due Today`;
    document.getElementById('reminder-birthdays').textContent = `${upcomingBirthdays} Birthdays`;
    document.getElementById('reminder-anniversaries').textContent = `${upcomingAnniversaries} Anniversaries`;
    
    // Reminder details
    let reminderHTML = '';
    if (overdue > 0) {
        reminderHTML += '<div style="color: #DC2626; font-weight: bold;">Overdue Follow-ups:</div>';
        customers.filter(c => c.nextFollowup && c.nextFollowup < today).slice(0, 3).forEach(c => {
            reminderHTML += `<div>• ${c.name}</div>`;
        });
    }
    if (dueToday > 0) {
        reminderHTML += '<div style="color: #F59E0B; font-weight: bold; margin-top: 8px;">Due Today:</div>';
        customers.filter(c => c.nextFollowup === today).slice(0, 3).forEach(c => {
            reminderHTML += `<div>• ${c.name}</div>`;
        });
    }
    document.getElementById('reminder-details').innerHTML = reminderHTML;
}

function exportCustomersCSV() {
    if (customers.length === 0) {
        alert('No customers to export');
        return;
    }
    
    let csv = 'Name,Company,Email,Phone,WhatsApp,Address,Category,Birthday,Anniversary,Tags,Last Contact,Next Follow-up,Total Purchases,Notes\n';
    
    customers.forEach(c => {
        const totalPurchases = getTotalPurchases(c);
        csv += `"${c.name}","${c.company}","${c.email}","${c.phone}","${c.whatsapp}","${c.address}","${c.category}","${c.birthday}","${c.anniversary}","${c.tags}","${c.lastContact}","${c.nextFollowup}","${totalPurchases}","${c.notes}"\n`;
    });
    
    downloadCSV(csv, `Customers_${new Date().toISOString().split('T')[0]}.csv`);
}

function exportWhatsAppNumbers() {
    const whatsappCustomers = customers.filter(c => c.whatsapp);
    
    if (whatsappCustomers.length === 0) {
        alert('No customers with WhatsApp numbers');
        return;
    }
    
    let text = whatsappCustomers.map(c => `+91${c.whatsapp}`).join('\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WhatsApp_Numbers_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
}

function exportEmailList() {
    const emailCustomers = customers.filter(c => c.email);
    
    if (emailCustomers.length === 0) {
        alert('No customers with email addresses');
        return;
    }
    
    let csv = 'Name,Email\n';
    emailCustomers.forEach(c => {
        csv += `"${c.name}","${c.email}"\n`;
    });
    
    downloadCSV(csv, `Email_List_${new Date().toISOString().split('T')[0]}.csv`);
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
}

function viewCustomerDetails(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;
    
    currentViewingCustomerId = id;
    
    document.getElementById('modal-customer-name').textContent = customer.name;
    
    const totalPurchases = getTotalPurchases(customer);
    const lastPurchase = customer.purchases && customer.purchases.length > 0 ? 
                        customer.purchases[customer.purchases.length - 1].date : 'Never';
    const avgOrderValue = customer.purchases && customer.purchases.length > 0 ?
                         totalPurchases / customer.purchases.length : 0;
    
    let infoHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
            <div><strong>Company:</strong> ${customer.company || 'N/A'}</div>
            <div><strong>Category:</strong> ${customer.category}</div>
            <div><strong>Phone:</strong> ${customer.phone}</div>
            <div><strong>Email:</strong> ${customer.email || 'N/A'}</div>
            <div><strong>WhatsApp:</strong> ${customer.whatsapp || 'N/A'}</div>
            <div><strong>Last Contact:</strong> ${customer.lastContact || 'N/A'}</div>
            <div><strong>Next Follow-up:</strong> ${customer.nextFollowup || 'N/A'}</div>
            <div><strong>Birthday:</strong> ${customer.birthday || 'N/A'}</div>
            <div><strong>Anniversary:</strong> ${customer.anniversary || 'N/A'}</div>
            <div><strong>Tags:</strong> ${customer.tags || 'N/A'}</div>
            <div><strong>Total Purchases:</strong> ${formatINR(totalPurchases)}</div>
            <div><strong>Last Purchase:</strong> ${lastPurchase}</div>
            <div><strong>Avg Order Value:</strong> ${formatINR(avgOrderValue)}</div>
            <div><strong>Purchase Count:</strong> ${customer.purchases ? customer.purchases.length : 0}</div>
        </div>
    `;
    
    if (customer.address) {
        infoHTML += `<div style="margin-bottom: 12px;"><strong>Address:</strong> ${customer.address}</div>`;
    }
    
    if (customer.notes) {
        infoHTML += `<div style="margin-bottom: 12px;"><strong>Notes:</strong><br>${customer.notes}</div>`;
    }
    
    document.getElementById('modal-customer-info').innerHTML = infoHTML;
    
    // Update purchase history table
    updatePurchasesTable();
    
    // Show modal
    document.getElementById('customerModal').style.display = 'block';
}

function closeCustomerModal() {
    document.getElementById('customerModal').style.display = 'none';
    currentViewingCustomerId = null;
}

function editCustomerFromModal() {
    closeCustomerModal();
    editCustomer(currentViewingCustomerId);
}

function addPurchase() {
    if (!currentViewingCustomerId) return;
    
    const date = document.getElementById('purchase-date').value;
    const product = document.getElementById('purchase-product').value.trim();
    const amount = parseFloat(document.getElementById('purchase-amount').value);
    const payment = document.getElementById('purchase-payment').value;
    const invoice = document.getElementById('purchase-invoice').value.trim();
    
    if (!date || !product || !amount) {
        alert('Please fill in date, product, and amount');
        return;
    }
    
    const customer = customers.find(c => c.id === currentViewingCustomerId);
    if (!customer) return;
    
    if (!customer.purchases) {
        customer.purchases = [];
    }
    
    customer.purchases.push({
        id: Date.now(),
        date: date,
        product: product,
        amount: amount,
        payment: payment,
        invoice: invoice
    });
    
    // Clear form
    document.getElementById('purchase-date').value = '';
    document.getElementById('purchase-product').value = '';
    document.getElementById('purchase-amount').value = '';
    document.getElementById('purchase-invoice').value = '';
    
    updatePurchasesTable();
    updateCustomersTable();
    updateCRMStats();
}

function updatePurchasesTable() {
    const customer = customers.find(c => c.id === currentViewingCustomerId);
    if (!customer) return;
    
    const tbody = document.getElementById('purchases-tbody');
    tbody.innerHTML = '';
    
    const totalPurchases = getTotalPurchases(customer);
    document.getElementById('modal-total-purchases').textContent = formatINR(totalPurchases);
    
    if (!customer.purchases || customer.purchases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No purchases recorded</td></tr>';
        return;
    }
    
    customer.purchases.forEach(purchase => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${purchase.date}</td>
            <td>${purchase.product}</td>
            <td>${formatINR(purchase.amount)}</td>
            <td>${purchase.payment}</td>
            <td>${purchase.invoice || '-'}</td>
            <td><button class="btn btn-sm btn-danger" onclick="deletePurchase(${purchase.id})">Del</button></td>
        `;
        tbody.appendChild(row);
    });
}

function deletePurchase(purchaseId) {
    if (!confirm('Delete this purchase?')) return;
    
    const customer = customers.find(c => c.id === currentViewingCustomerId);
    if (!customer) return;
    
    customer.purchases = customer.purchases.filter(p => p.id !== purchaseId);
    
    updatePurchasesTable();
    updateCustomersTable();
    updateCRMStats();
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('customerModal');
    if (event.target === modal) {
        closeCustomerModal();
    }
}

// ============================================
// MARKETING ROI CALCULATOR
// ============================================

const platformBenchmarks = {
    'Google Ads': { cpl: [500, 2000], convRate: [3, 5], roas: [2, 4] },
    'Facebook Ads': { cpl: [200, 800], convRate: [2, 4], roas: [3, 5] },
    'Instagram Ads': { cpl: [300, 1000], convRate: [1, 3], roas: [2, 4] },
    'WhatsApp': { cpl: [100, 500], convRate: [5, 10], roas: [4, 6] },
    'LinkedIn': { cpl: [1000, 3000], convRate: [2, 3], roas: [2, 3] },
    'Email': { cpl: [50, 200], convRate: [3, 6], roas: [5, 8] }
};

function calculateMarketingROI() {
    const campaignName = document.getElementById('mkt-campaign-name').value.trim();
    const platform = document.getElementById('mkt-platform').value;
    const adSpend = parseFloat(document.getElementById('mkt-ad-spend').value) || 0;
    const creativeCost = parseFloat(document.getElementById('mkt-creative-cost').value) || 0;
    const agencyFee = parseFloat(document.getElementById('mkt-agency-fee').value) || 0;
    const otherCosts = parseFloat(document.getElementById('mkt-other-costs').value) || 0;
    const revenue = parseFloat(document.getElementById('mkt-revenue-gen').value) || 0;
    const leads = parseFloat(document.getElementById('mkt-leads').value) || 0;
    const customers = parseFloat(document.getElementById('mkt-customers-acq').value) || 0;
    
    if (!campaignName || adSpend === 0 || leads === 0 || customers === 0) {
        alert('Please fill in all required fields');
        return;
    }
    
    const totalCost = adSpend + creativeCost + agencyFee + otherCosts;
    
    // Calculate CLV
    const aov = parseFloat(document.getElementById('mkt-aov').value) || 0;
    const frequency = parseFloat(document.getElementById('mkt-frequency').value) || 0;
    const lifespan = parseFloat(document.getElementById('mkt-lifespan').value) || 0;
    const margin = parseFloat(document.getElementById('mkt-margin').value) || 0;
    
    const clv = aov && frequency && lifespan && margin ? 
                (aov * frequency * lifespan * margin / 100) : 0;
    
    // Core metrics
    const roi = ((revenue - totalCost) / totalCost) * 100;
    const roas = revenue / totalCost;
    const cac = totalCost / customers;
    const cpl = totalCost / leads;
    const conversionRate = (customers / leads) * 100;
    const revenuePerCustomer = revenue / customers;
    const profitMargin = revenue - totalCost;
    const profitPercent = (profitMargin / revenue) * 100;
    const cacToClvRatio = clv > 0 ? clv / cac : 0;
    const paybackPeriod = clv > 0 ? cac / (clv / (lifespan * 12)) : 0;
    const lifetimeROI = clv > 0 ? ((clv * customers - totalCost) / totalCost) * 100 : 0;
    const breakevenCustomers = totalCost / revenuePerCustomer;
    
    // Display results
    document.getElementById('mkt-results-section').style.display = 'block';
    
    const resultsHTML = `
        <div class="result-card ${roi > 0 ? 'positive' : 'negative'}">
            <div class="result-label">Marketing ROI</div>
            <div class="result-value">${formatNumber(roi)}%</div>
        </div>
        <div class="result-card">
            <div class="result-label">ROAS (Return on Ad Spend)</div>
            <div class="result-value">${formatNumber(roas, 2)}:1</div>
        </div>
        <div class="result-card">
            <div class="result-label">Customer Acquisition Cost</div>
            <div class="result-value">${formatINR(cac)}</div>
        </div>
        <div class="result-card">
            <div class="result-label">Cost Per Lead</div>
            <div class="result-value">${formatINR(cpl)}</div>
        </div>
        <div class="result-card">
            <div class="result-label">Lead to Customer Conv Rate</div>
            <div class="result-value">${formatNumber(conversionRate)}%</div>
        </div>
        <div class="result-card">
            <div class="result-label">Revenue Per Customer</div>
            <div class="result-value">${formatINR(revenuePerCustomer)}</div>
        </div>
        <div class="result-card ${profitMargin > 0 ? 'positive' : 'negative'}">
            <div class="result-label">Profit Margin</div>
            <div class="result-value">${formatINR(profitMargin)}</div>
        </div>
        <div class="result-card">
            <div class="result-label">Profit %</div>
            <div class="result-value">${formatNumber(profitPercent)}%</div>
        </div>
        ${clv > 0 ? `
        <div class="result-card">
            <div class="result-label">Customer Lifetime Value</div>
            <div class="result-value">${formatINR(clv)}</div>
        </div>
        <div class="result-card ${cacToClvRatio >= 3 ? 'positive' : cacToClvRatio >= 2 ? '' : 'negative'}">
            <div class="result-label">CAC to CLV Ratio</div>
            <div class="result-value">1:${formatNumber(cacToClvRatio, 1)}</div>
        </div>
        <div class="result-card">
            <div class="result-label">Payback Period</div>
            <div class="result-value">${formatNumber(paybackPeriod, 1)} months</div>
        </div>
        <div class="result-card positive">
            <div class="result-label">Lifetime ROI</div>
            <div class="result-value">${formatNumber(lifetimeROI)}%</div>
        </div>
        ` : ''}
        <div class="result-card">
            <div class="result-label">Break-even Customers Needed</div>
            <div class="result-value">${formatNumber(breakevenCustomers, 0)}</div>
        </div>
    `;
    
    document.getElementById('mkt-roi-results').innerHTML = resultsHTML;
    
    // Recommendations
    let recommendations = '';
    if (roi > 100) {
        recommendations = '<div class="alert alert-success"><strong>Excellent!</strong> This campaign is highly profitable. Consider increasing budget to scale.</div>';
    } else if (roi > 20) {
        recommendations = '<div class="alert alert-warning"><strong>Moderate returns.</strong> Try optimizing targeting or creative to improve performance.</div>';
    } else {
        recommendations = '<div class="alert alert-danger"><strong>Warning: Low returns.</strong> Review campaign strategy and targeting.</div>';
    }
    
    if (clv > 0 && cac > clv) {
        recommendations += '<div class="alert alert-danger" style="margin-top: 8px;"><strong>Critical:</strong> CAC exceeds CLV - You\'re losing money per customer!</div>';
    } else if (clv > 0 && cacToClvRatio >= 3) {
        recommendations += '<div class="alert alert-success" style="margin-top: 8px;"><strong>Excellent!</strong> Healthy CAC to CLV ratio. Sustainable growth.</div>';
    }
    
    document.getElementById('mkt-recommendations').innerHTML = recommendations;
    
    // Platform benchmarks
    if (platformBenchmarks[platform]) {
        const bench = platformBenchmarks[platform];
        let benchHTML = '<div class="table-container"><table><thead><tr><th>Metric</th><th>Your Value</th><th>Industry Benchmark</th><th>Status</th></tr></thead><tbody>';
        
        // CPL comparison
        const cplStatus = cpl < bench.cpl[0] ? 'Excellent' : cpl <= bench.cpl[1] ? 'Good' : 'High';
        const cplClass = cplStatus === 'Excellent' ? 'status-green' : cplStatus === 'Good' ? 'status-yellow' : 'status-red';
        benchHTML += `<tr><td>Cost Per Lead</td><td>${formatINR(cpl)}</td><td>${formatINR(bench.cpl[0])} - ${formatINR(bench.cpl[1])}</td><td><span class="status-badge ${cplClass}">${cplStatus}</span></td></tr>`;
        
        // Conversion rate comparison
        const convStatus = conversionRate > bench.convRate[1] ? 'Excellent' : conversionRate >= bench.convRate[0] ? 'Good' : 'Low';
        const convClass = convStatus === 'Excellent' ? 'status-green' : convStatus === 'Good' ? 'status-yellow' : 'status-red';
        benchHTML += `<tr><td>Conversion Rate</td><td>${formatNumber(conversionRate)}%</td><td>${bench.convRate[0]}% - ${bench.convRate[1]}%</td><td><span class="status-badge ${convClass}">${convStatus}</span></td></tr>`;
        
        // ROAS comparison
        const roasStatus = roas > bench.roas[1] ? 'Excellent' : roas >= bench.roas[0] ? 'Good' : 'Low';
        const roasClass = roasStatus === 'Excellent' ? 'status-green' : roasStatus === 'Good' ? 'status-yellow' : 'status-red';
        benchHTML += `<tr><td>ROAS</td><td>${formatNumber(roas, 1)}:1</td><td>${bench.roas[0]}:1 - ${bench.roas[1]}:1</td><td><span class="status-badge ${roasClass}">${roasStatus}</span></td></tr>`;
        
        benchHTML += '</tbody></table></div>';
        document.getElementById('mkt-benchmarks').innerHTML = benchHTML;
    }
    
    // Scroll to results
    document.getElementById('mkt-results-section').scrollIntoView({ behavior: 'smooth' });
}

function saveMarketingCampaign() {
    const campaignName = document.getElementById('mkt-campaign-name').value.trim();
    const platform = document.getElementById('mkt-platform').value;
    const adSpend = parseFloat(document.getElementById('mkt-ad-spend').value) || 0;
    const creativeCost = parseFloat(document.getElementById('mkt-creative-cost').value) || 0;
    const agencyFee = parseFloat(document.getElementById('mkt-agency-fee').value) || 0;
    const otherCosts = parseFloat(document.getElementById('mkt-other-costs').value) || 0;
    const revenue = parseFloat(document.getElementById('mkt-revenue-gen').value) || 0;
    const leads = parseFloat(document.getElementById('mkt-leads').value) || 0;
    const customers = parseFloat(document.getElementById('mkt-customers-acq').value) || 0;
    
    if (!campaignName || adSpend === 0) {
        alert('Please enter campaign name and costs');
        return;
    }
    
    const totalCost = adSpend + creativeCost + agencyFee + otherCosts;
    const roi = ((revenue - totalCost) / totalCost) * 100;
    const roas = revenue / totalCost;
    const cac = customers > 0 ? totalCost / customers : 0;
    const cpl = leads > 0 ? totalCost / leads : 0;
    const conversionRate = leads > 0 ? (customers / leads) * 100 : 0;
    
    const campaign = {
        id: Date.now(),
        name: campaignName,
        platform: platform,
        startDate: document.getElementById('mkt-start-date').value,
        endDate: document.getElementById('mkt-end-date').value,
        status: document.getElementById('mkt-status').value,
        cost: totalCost,
        revenue: revenue,
        leads: leads,
        customers: customers,
        roi: roi,
        roas: roas,
        cac: cac,
        cpl: cpl,
        conversionRate: conversionRate
    };
    
    marketingCampaigns.push(campaign);
    updateCampaignsTable();
    alert('Campaign saved successfully!');
}

function clearMarketingForm() {
    document.getElementById('mkt-campaign-name').value = '';
    document.getElementById('mkt-ad-spend').value = '';
    document.getElementById('mkt-creative-cost').value = '';
    document.getElementById('mkt-agency-fee').value = '';
    document.getElementById('mkt-other-costs').value = '';
    document.getElementById('mkt-revenue-gen').value = '';
    document.getElementById('mkt-leads').value = '';
    document.getElementById('mkt-customers-acq').value = '';
    document.getElementById('mkt-aov').value = '';
    document.getElementById('mkt-frequency').value = '';
    document.getElementById('mkt-lifespan').value = '';
    document.getElementById('mkt-margin').value = '';
    document.getElementById('mkt-results-section').style.display = 'none';
}

function updateCampaignsTable() {
    if (marketingCampaigns.length === 0) {
        document.getElementById('mkt-comparison-section').style.display = 'none';
        return;
    }
    
    document.getElementById('mkt-comparison-section').style.display = 'block';
    
    const tbody = document.getElementById('campaigns-tbody');
    tbody.innerHTML = '';
    
    const bestROI = Math.max(...marketingCampaigns.map(c => c.roi));
    
    marketingCampaigns.forEach(campaign => {
        const row = document.createElement('tr');
        if (campaign.roi === bestROI) {
            row.style.background = '#D1FAE5';
        }
        
        let statusClass = 'status-green';
        if (campaign.roi < 20) statusClass = 'status-red';
        else if (campaign.roi < 100) statusClass = 'status-yellow';
        
        row.innerHTML = `
            <td>${campaign.name}</td>
            <td>${campaign.platform}</td>
            <td>${formatINR(campaign.cost)}</td>
            <td>${formatINR(campaign.revenue)}</td>
            <td>${formatNumber(campaign.roi)}%</td>
            <td>${formatNumber(campaign.roas, 2)}:1</td>
            <td>${formatINR(campaign.cac)}</td>
            <td>${formatINR(campaign.cpl)}</td>
            <td>${formatNumber(campaign.conversionRate)}%</td>
            <td><span class="status-badge ${statusClass}">${campaign.roi > 100 ? 'Best' : campaign.roi > 20 ? 'Good' : 'Poor'}</span></td>
            <td><button class="btn btn-sm btn-danger" onclick="deleteCampaign(${campaign.id})">Delete</button></td>
        `;
        tbody.appendChild(row);
    });
}

function deleteCampaign(id) {
    if (confirm('Delete this campaign?')) {
        marketingCampaigns = marketingCampaigns.filter(c => c.id !== id);
        updateCampaignsTable();
    }
}

function clearAllCampaigns() {
    if (confirm('Clear all saved campaigns?')) {
        marketingCampaigns = [];
        updateCampaignsTable();
    }
}

function sortCampaigns(column) {
    marketingCampaigns.sort((a, b) => {
        if (a[column] < b[column]) return -1;
        if (a[column] > b[column]) return 1;
        return 0;
    });
    updateCampaignsTable();
}

// ============================================
// ROI CALCULATOR
// ============================================

function switchROITab(tabName) {
    document.querySelectorAll('.roi-tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    document.querySelectorAll('#roi-content .sub-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.getElementById('roi-' + tabName).style.display = 'block';
    event.target.classList.add('active');
}

function calculateGeneralROI() {
    const investment = parseFloat(document.getElementById('roi-investment').value) || 0;
    const returns = parseFloat(document.getElementById('roi-returns').value) || 0;
    const years = parseFloat(document.getElementById('roi-years').value) || 1;
    const additionalCosts = parseFloat(document.getElementById('roi-costs').value) || 0;
    
    if (investment === 0) return;
    
    const totalInvestment = investment + additionalCosts;
    const netProfit = returns - totalInvestment;
    const roi = (netProfit / totalInvestment) * 100;
    const annualizedROI = roi / years;
    const cagr = (Math.pow(returns / investment, 1 / years) - 1) * 100;
    const paybackPeriod = totalInvestment / (netProfit / years);
    const monthlyReturn = netProfit / (years * 12);
    
    const resultsHTML = `
        <div class="result-card ${roi > 0 ? 'positive' : 'negative'}">
            <div class="result-label">ROI %</div>
            <div class="result-value">${formatNumber(roi)}%</div>
        </div>
        <div class="result-card">
            <div class="result-label">Net Profit</div>
            <div class="result-value">${formatINR(netProfit)}</div>
        </div>
        <div class="result-card">
            <div class="result-label">Annualized ROI</div>
            <div class="result-value">${formatNumber(annualizedROI)}%</div>
        </div>
        <div class="result-card">
            <div class="result-label">CAGR</div>
            <div class="result-value">${formatNumber(cagr)}%</div>
        </div>
        <div class="result-card">
            <div class="result-label">Payback Period</div>
            <div class="result-value">${formatNumber(paybackPeriod, 1)} years</div>
        </div>
        <div class="result-card">
            <div class="result-label">Monthly Avg Return</div>
            <div class="result-value">${formatINR(monthlyReturn)}</div>
        </div>
    `;
    
    document.getElementById('roi-general-results').innerHTML = resultsHTML;
    drawROIChart(investment, returns, years);
}

function calculateMarketingROI() {
    const investment = parseFloat(document.getElementById('mkt-investment').value) || 0;
    const revenue = parseFloat(document.getElementById('mkt-revenue').value) || 0;
    const customers = parseFloat(document.getElementById('mkt-customers').value) || 0;
    const duration = parseFloat(document.getElementById('mkt-duration').value) || 1;
    
    if (investment === 0 || customers === 0) return;
    
    const marketingROI = ((revenue - investment) / investment) * 100;
    const cac = investment / customers;
    const revenuePerCustomer = revenue / customers;
    const roas = revenue / investment;
    const monthlyROI = marketingROI / duration;
    const breakevenCustomers = investment / revenuePerCustomer;
    
    const resultsHTML = `
        <div class="result-card ${marketingROI > 0 ? 'positive' : 'negative'}">
            <div class="result-label">Marketing ROI %</div>
            <div class="result-value">${formatNumber(marketingROI)}%</div>
        </div>
        <div class="result-card">
            <div class="result-label">Customer Acquisition Cost</div>
            <div class="result-value">${formatINR(cac)}</div>
        </div>
        <div class="result-card">
            <div class="result-label">Revenue Per Customer</div>
            <div class="result-value">${formatINR(revenuePerCustomer)}</div>
        </div>
        <div class="result-card">
            <div class="result-label">ROAS (Return on Ad Spend)</div>
            <div class="result-value">${formatNumber(roas)}x</div>
        </div>
        <div class="result-card">
            <div class="result-label">Monthly ROI</div>
            <div class="result-value">${formatNumber(monthlyROI)}%</div>
        </div>
        <div class="result-card">
            <div class="result-label">Break-even Customers</div>
            <div class="result-value">${formatNumber(breakevenCustomers, 0)}</div>
        </div>
    `;
    
    document.getElementById('mkt-results').innerHTML = resultsHTML;
}

function calculateEquipmentROI() {
    const initialCost = parseFloat(document.getElementById('equip-cost').value) || 0;
    const monthlyBenefit = parseFloat(document.getElementById('equip-benefit').value) || 0;
    const monthlyCost = parseFloat(document.getElementById('equip-monthly-cost').value) || 0;
    const years = parseFloat(document.getElementById('equip-years').value) || 1;
    
    if (initialCost === 0 || monthlyBenefit === 0) return;
    
    const totalInvestment = initialCost + (monthlyCost * 12 * years);
    const totalBenefits = monthlyBenefit * 12 * years;
    const netBenefit = totalBenefits - totalInvestment;
    const roi = (netBenefit / totalInvestment) * 100;
    const monthlyNetBenefit = monthlyBenefit - monthlyCost;
    const paybackMonths = monthlyNetBenefit > 0 ? initialCost / monthlyNetBenefit : 0;
    const annualNetBenefit = monthlyNetBenefit * 12;
    
    const resultsHTML = `
        <div class="result-card ${roi > 0 ? 'positive' : 'negative'}">
            <div class="result-label">ROI %</div>
            <div class="result-value">${formatNumber(roi)}%</div>
        </div>
        <div class="result-card">
            <div class="result-label">Total Investment</div>
            <div class="result-value">${formatINR(totalInvestment)}</div>
        </div>
        <div class="result-card">
            <div class="result-label">Total Benefits</div>
            <div class="result-value">${formatINR(totalBenefits)}</div>
        </div>
        <div class="result-card">
            <div class="result-label">Net Benefit</div>
            <div class="result-value">${formatINR(netBenefit)}</div>
        </div>
        <div class="result-card">
            <div class="result-label">Payback Period</div>
            <div class="result-value">${formatNumber(paybackMonths, 1)} months</div>
        </div>
        <div class="result-card">
            <div class="result-label">Monthly Net Benefit</div>
            <div class="result-value">${formatINR(monthlyNetBenefit)}</div>
        </div>
        <div class="result-card">
            <div class="result-label">Annual Net Benefit</div>
            <div class="result-value">${formatINR(annualNetBenefit)}</div>
        </div>
    `;
    
    document.getElementById('equip-results').innerHTML = resultsHTML;
}

function saveROICalculation(type = 'general') {
    let data = {};
    
    if (type === 'general') {
        const name = document.getElementById('roi-name').value || 'Investment';
        const investment = parseFloat(document.getElementById('roi-investment').value) || 0;
        const returns = parseFloat(document.getElementById('roi-returns').value) || 0;
        const years = parseFloat(document.getElementById('roi-years').value) || 1;
        const costs = parseFloat(document.getElementById('roi-costs').value) || 0;
        
        const totalInv = investment + costs;
        const netProfit = returns - totalInv;
        const roi = (netProfit / totalInv) * 100;
        const payback = totalInv / (netProfit / years);
        
        data = { name, type: 'General', totalInvestment: totalInv, roi, paybackPeriod: payback, netBenefit: netProfit };
    } else if (type === 'marketing') {
        const name = document.getElementById('mkt-name').value || 'Marketing Campaign';
        const investment = parseFloat(document.getElementById('mkt-investment').value) || 0;
        const revenue = parseFloat(document.getElementById('mkt-revenue').value) || 0;
        
        const roi = ((revenue - investment) / investment) * 100;
        const netBenefit = revenue - investment;
        
        data = { name, type: 'Marketing', totalInvestment: investment, roi, paybackPeriod: 0, netBenefit };
    } else if (type === 'equipment') {
        const investType = document.getElementById('equip-type').value;
        const cost = parseFloat(document.getElementById('equip-cost').value) || 0;
        const benefit = parseFloat(document.getElementById('equip-benefit').value) || 0;
        const monthlyCost = parseFloat(document.getElementById('equip-monthly-cost').value) || 0;
        const years = parseFloat(document.getElementById('equip-years').value) || 1;
        
        const totalInv = cost + (monthlyCost * 12 * years);
        const totalBen = benefit * 12 * years;
        const netBen = totalBen - totalInv;
        const roi = (netBen / totalInv) * 100;
        const monthlyNet = benefit - monthlyCost;
        const payback = monthlyNet > 0 ? cost / monthlyNet / 12 : 0;
        
        data = { name: investType, type: 'Equipment/Hire', totalInvestment: totalInv, roi, paybackPeriod: payback, netBenefit: netBen };
    }
    
    savedROICalculations.push(data);
    updateROIComparison();
    alert('Calculation saved successfully!');
}

function updateROIComparison() {
    if (savedROICalculations.length === 0) {
        document.getElementById('roi-comparison-section').style.display = 'none';
        return;
    }
    
    document.getElementById('roi-comparison-section').style.display = 'block';
    
    const tbody = document.getElementById('roi-comparison-tbody');
    tbody.innerHTML = '';
    
    const bestROI = Math.max(...savedROICalculations.map(c => c.roi));
    
    savedROICalculations.forEach((calc, index) => {
        const row = document.createElement('tr');
        if (calc.roi === bestROI) {
            row.classList.add('best');
        }
        row.innerHTML = `
            <td>${calc.name}</td>
            <td>${calc.type}</td>
            <td>${formatINR(calc.totalInvestment)}</td>
            <td>${formatNumber(calc.roi)}%</td>
            <td>${formatNumber(calc.paybackPeriod, 1)} years</td>
            <td>${formatINR(calc.netBenefit)}</td>
            <td><button class="btn btn-sm btn-danger" onclick="deleteROI(${index})">Delete</button></td>
        `;
        tbody.appendChild(row);
    });
}

function deleteROI(index) {
    savedROICalculations.splice(index, 1);
    updateROIComparison();
}

function clearAllROI() {
    if (confirm('Clear all saved calculations?')) {
        savedROICalculations = [];
        updateROIComparison();
    }
}

function drawROIChart(investment, returns, years) {
    const canvas = document.getElementById('roi-chart');
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const padding = 40;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    
    const maxValue = Math.max(investment, returns);
    const scale = chartHeight / maxValue;
    
    // Draw axes
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Draw bars
    const barWidth = 60;
    const spacing = 100;
    
    // Investment bar (red)
    ctx.fillStyle = '#DC2626';
    const invHeight = investment * scale;
    ctx.fillRect(padding + spacing, canvas.height - padding - invHeight, barWidth, invHeight);
    
    // Returns bar (green)
    ctx.fillStyle = '#16A34A';
    const retHeight = returns * scale;
    ctx.fillRect(padding + spacing + barWidth + 50, canvas.height - padding - retHeight, barWidth, retHeight);
    
    // Labels
    ctx.fillStyle = '#1E293B';
    ctx.font = '14px Roboto';
    ctx.textAlign = 'center';
    ctx.fillText('Investment', padding + spacing + barWidth/2, canvas.height - padding + 20);
    ctx.fillText('Returns', padding + spacing + barWidth + 50 + barWidth/2, canvas.height - padding + 20);
    
    // Values
    ctx.fillText(formatINR(investment), padding + spacing + barWidth/2, canvas.height - padding - invHeight - 10);
    ctx.fillText(formatINR(returns), padding + spacing + barWidth + 50 + barWidth/2, canvas.height - padding - retHeight - 10);
    
    // Title
    ctx.font = 'bold 16px Poppins';
    ctx.fillText('ROI Timeline (Investment vs Returns)', canvas.width / 2, 20);
}

// ============================================
// CASH FLOW FORECAST
// ============================================

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const incomeCategories = ['Sales Revenue', 'Service Income', 'Other Income'];
const fixedExpenses = ['Rent', 'Salaries', 'Utilities', 'Insurance', 'Loan EMI'];
const variableExpenses = ['Raw Materials', 'Marketing', 'Transportation', 'Miscellaneous'];

function initializeCashFlowTable() {
    const tbody = document.getElementById('cashflow-tbody');
    tbody.innerHTML = '';
    
    // Initialize data if empty
    if (!cashFlowData[currentCFScenario].initialized) {
        cashFlowData[currentCFScenario] = { initialized: true };
        
        [...incomeCategories, ...fixedExpenses, ...variableExpenses].forEach(category => {
            cashFlowData[currentCFScenario][category] = Array(12).fill(0);
        });
    }
    
    // Income rows
    incomeCategories.forEach(category => {
        const row = createCashFlowRow(category, 'income');
        tbody.appendChild(row);
    });
    
    // Total income row
    tbody.appendChild(createTotalRow('Total Income', 'income'));
    
    // Fixed expense rows
    fixedExpenses.forEach(category => {
        const row = createCashFlowRow(category, 'expense');
        tbody.appendChild(row);
    });
    
    // Total fixed row
    tbody.appendChild(createTotalRow('Total Fixed', 'fixed'));
    
    // Variable expense rows
    variableExpenses.forEach(category => {
        const row = createCashFlowRow(category, 'expense');
        tbody.appendChild(row);
    });
    
    // Total variable row
    tbody.appendChild(createTotalRow('Total Variable', 'variable'));
    
    // Total expenses row
    tbody.appendChild(createTotalRow('Total Expenses', 'allexpenses'));
    
    // Net cash flow row
    tbody.appendChild(createTotalRow('Net Cash Flow', 'netflow'));
    
    // Ending balance row
    tbody.appendChild(createTotalRow('Ending Cash Balance', 'balance'));
    
    updateCashFlow();
}

function createCashFlowRow(category, type) {
    const row = document.createElement('tr');
    const headerCell = document.createElement('th');
    headerCell.textContent = category;
    row.appendChild(headerCell);
    
    for (let i = 0; i < 12; i++) {
        const cell = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'form-input';
        input.style.width = '100px';
        input.style.padding = '4px';
        input.value = cashFlowData[currentCFScenario][category][i] || 0;
        input.oninput = () => {
            cashFlowData[currentCFScenario][category][i] = parseFloat(input.value) || 0;
            updateCashFlow();
        };
        cell.appendChild(input);
        row.appendChild(cell);
    }
    
    return row;
}

function createTotalRow(label, type) {
    const row = document.createElement('tr');
    row.style.fontWeight = 'bold';
    row.style.backgroundColor = '#F8FAFC';
    
    const headerCell = document.createElement('th');
    headerCell.textContent = label;
    row.appendChild(headerCell);
    
    for (let i = 0; i < 12; i++) {
        const cell = document.createElement('td');
        cell.id = `${type}-${i}`;
        cell.textContent = formatINR(0);
        row.appendChild(cell);
    }
    
    return row;
}

function updateCashFlow() {
    const startingBalance = parseFloat(document.getElementById('cf-starting-balance').value) || 0;
    let runningBalance = startingBalance;
    const negativeMonths = [];
    
    for (let i = 0; i < 12; i++) {
        // Calculate totals
        let totalIncome = 0;
        incomeCategories.forEach(cat => {
            totalIncome += cashFlowData[currentCFScenario][cat][i] || 0;
        });
        
        let totalFixed = 0;
        fixedExpenses.forEach(cat => {
            totalFixed += cashFlowData[currentCFScenario][cat][i] || 0;
        });
        
        let totalVariable = 0;
        variableExpenses.forEach(cat => {
            totalVariable += cashFlowData[currentCFScenario][cat][i] || 0;
        });
        
        const totalExpenses = totalFixed + totalVariable;
        const netFlow = totalIncome - totalExpenses;
        runningBalance += netFlow;
        
        // Update cells
        document.getElementById(`income-${i}`).textContent = formatINR(totalIncome);
        document.getElementById(`fixed-${i}`).textContent = formatINR(totalFixed);
        document.getElementById(`variable-${i}`).textContent = formatINR(totalVariable);
        document.getElementById(`allexpenses-${i}`).textContent = formatINR(totalExpenses);
        document.getElementById(`netflow-${i}`).textContent = formatINR(netFlow);
        document.getElementById(`balance-${i}`).textContent = formatINR(runningBalance);
        
        // Track negative months
        if (runningBalance < 0) {
            negativeMonths.push(i + 1);
            document.getElementById(`balance-${i}`).style.color = '#DC2626';
        } else {
            document.getElementById(`balance-${i}`).style.color = '#16A34A';
        }
    }
    
    // Show alerts
    if (negativeMonths.length > 0) {
        const alertDiv = document.getElementById('cf-alerts');
        alertDiv.style.display = 'flex';
        alertDiv.innerHTML = `⚠️ <strong>Warning:</strong> Negative cash flow detected in months: ${negativeMonths.join(', ')}`;
    } else {
        document.getElementById('cf-alerts').style.display = 'none';
    }
    
    drawCashFlowChart();
}

function switchCFScenario(scenario) {
    currentCFScenario = scenario;
    
    document.querySelectorAll('#cashflow-content .sub-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    initializeCashFlowTable();
}

function detectSeasonalPattern() {
    const monthlyIncome = [];
    
    for (let i = 0; i < 12; i++) {
        let total = 0;
        incomeCategories.forEach(cat => {
            total += cashFlowData[currentCFScenario][cat][i] || 0;
        });
        monthlyIncome.push({ month: i + 1, income: total });
    }
    
    const avgIncome = monthlyIncome.reduce((sum, m) => sum + m.income, 0) / 12;
    const peakMonths = monthlyIncome.filter(m => m.income > avgIncome * 1.2).map(m => m.month);
    const lowMonths = monthlyIncome.filter(m => m.income < avgIncome * 0.8).map(m => m.month);
    
    let message = 'Seasonal Pattern Analysis:\n';
    if (peakMonths.length > 0) {
        message += `Peak season detected in months: ${peakMonths.join(', ')}\n`;
    }
    if (lowMonths.length > 0) {
        message += `Low season detected in months: ${lowMonths.join(', ')}`;
    }
    if (peakMonths.length === 0 && lowMonths.length === 0) {
        message += 'No significant seasonal pattern detected';
    }
    
    alert(message);
}

function exportCashFlowCSV() {
    const business = document.getElementById('cf-business').value || 'Business';
    const startMonth = document.getElementById('cf-start-month').value;
    
    let csv = `Cash Flow Forecast - ${business} - ${currentCFScenario.toUpperCase()} Case\n\n`;
    csv += 'Category,';
    
    for (let i = 0; i < 12; i++) {
        csv += `Month ${i + 1},`;
    }
    csv += '\n';
    
    // Add all categories
    const allCategories = [...incomeCategories, ...fixedExpenses, ...variableExpenses];
    allCategories.forEach(cat => {
        csv += `${cat},`;
        for (let i = 0; i < 12; i++) {
            csv += `${cashFlowData[currentCFScenario][cat][i] || 0},`;
        }
        csv += '\n';
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CashFlow_Forecast_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
}

function toggleActualsMode() {
    actualsMode = !actualsMode;
    alert(actualsMode ? 'Actuals mode enabled - Add actuals input rows' : 'Actuals mode disabled');
}

function drawCashFlowChart() {
    const canvas = document.getElementById('cashflow-chart');
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const padding = 50;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    
    // Get balance data for all scenarios
    const scenarios = ['best', 'likely', 'worst'];
    const colors = { best: '#16A34A', likely: '#1E3A8A', worst: '#DC2626' };
    const startingBalance = parseFloat(document.getElementById('cf-starting-balance').value) || 0;
    
    let maxBalance = startingBalance;
    let minBalance = startingBalance;
    
    scenarios.forEach(scenario => {
        let balance = startingBalance;
        for (let i = 0; i < 12; i++) {
            if (!cashFlowData[scenario].initialized) continue;
            
            let income = 0;
            incomeCategories.forEach(cat => {
                income += cashFlowData[scenario][cat][i] || 0;
            });
            
            let expenses = 0;
            [...fixedExpenses, ...variableExpenses].forEach(cat => {
                expenses += cashFlowData[scenario][cat][i] || 0;
            });
            
            balance += (income - expenses);
            maxBalance = Math.max(maxBalance, balance);
            minBalance = Math.min(minBalance, balance);
        }
    });
    
    const valueRange = maxBalance - minBalance;
    const scale = chartHeight / (valueRange * 1.2);
    
    // Draw axes
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Draw zero line
    const zeroY = canvas.height - padding - ((0 - minBalance) * scale);
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding, zeroY);
    ctx.lineTo(canvas.width - padding, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw lines for each scenario
    scenarios.forEach(scenario => {
        if (!cashFlowData[scenario].initialized) return;
        
        ctx.strokeStyle = colors[scenario];
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        let balance = startingBalance;
        const xStep = chartWidth / 12;
        
        for (let i = 0; i <= 12; i++) {
            const x = padding + (i * xStep);
            const y = canvas.height - padding - ((balance - minBalance) * scale);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            if (i < 12) {
                let income = 0;
                incomeCategories.forEach(cat => {
                    income += cashFlowData[scenario][cat][i] || 0;
                });
                
                let expenses = 0;
                [...fixedExpenses, ...variableExpenses].forEach(cat => {
                    expenses += cashFlowData[scenario][cat][i] || 0;
                });
                
                balance += (income - expenses);
            }
        }
        
        ctx.stroke();
    });
    
    // Draw month labels
    ctx.fillStyle = '#1E293B';
    ctx.font = '12px Roboto';
    ctx.textAlign = 'center';
    for (let i = 0; i < 12; i++) {
        const x = padding + (i * chartWidth / 12) + (chartWidth / 24);
        ctx.fillText(`M${i + 1}`, x, canvas.height - padding + 20);
    }
    
    // Legend
    ctx.font = 'bold 14px Roboto';
    ctx.textAlign = 'left';
    let legendX = canvas.width - padding - 150;
    let legendY = padding + 20;
    
    scenarios.forEach(scenario => {
        ctx.fillStyle = colors[scenario];
        ctx.fillRect(legendX, legendY, 20, 10);
        ctx.fillStyle = '#1E293B';
        ctx.fillText(scenario.charAt(0).toUpperCase() + scenario.slice(1), legendX + 25, legendY + 10);
        legendY += 20;
    });
    
    // Title
    ctx.font = 'bold 16px Poppins';
    ctx.textAlign = 'center';
    ctx.fillText('12-Month Cash Flow Projection', canvas.width / 2, 20);
}

// ============================================
// INVENTORY CALCULATOR
// ============================================

function switchInventoryTab(tabName) {
    document.querySelectorAll('.inv-tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    document.querySelectorAll('#inventory-content .sub-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.getElementById('inv-' + tabName).style.display = 'block';
    event.target.classList.add('active');
}

function calculateInventory() {
    const dailySales = parseFloat(document.getElementById('inv-daily-sales').value) || 0;
    const leadTime = parseFloat(document.getElementById('inv-lead-time').value) || 0;
    const safetyDays = parseFloat(document.getElementById('inv-safety-days').value) || 0;
    const currentStock = parseFloat(document.getElementById('inv-current-stock').value) || 0;
    const unitCost = parseFloat(document.getElementById('inv-unit-cost').value) || 0;
    const orderCost = parseFloat(document.getElementById('inv-order-cost').value) || 0;
    const annualDemand = parseFloat(document.getElementById('inv-annual-demand').value) || 0;
    const holdingCost = parseFloat(document.getElementById('inv-holding-cost').value) || 0;
    const sellingPrice = parseFloat(document.getElementById('inv-selling-price').value) || 0;
    const seasonMultiplier = parseFloat(document.getElementById('inv-season-multiplier').value) || 1;
    
    if (dailySales === 0 || annualDemand === 0) return;
    
    const adjustedDailySales = dailySales * seasonMultiplier;
    const safetyStock = adjustedDailySales * safetyDays;
    const reorderPoint = (adjustedDailySales * leadTime) + safetyStock;
    const eoq = Math.sqrt((2 * annualDemand * orderCost) / (unitCost * (holdingCost / 100)));
    const minStock = reorderPoint - (adjustedDailySales * leadTime);
    const maxStock = reorderPoint + eoq;
    const avgInventory = (minStock + maxStock) / 2;
    const stockTurnover = annualDemand / avgInventory;
    const holdingCostAnnual = avgInventory * unitCost * (holdingCost / 100);
    const ordersPerYear = annualDemand / eoq;
    const daysBetweenOrders = 365 / ordersPerYear;
    
    const resultsHTML = `
        <div class="result-card ${currentStock > reorderPoint ? 'positive' : 'negative'}">
            <div class="result-label">Reorder Point</div>
            <div class="result-value">${formatNumber(reorderPoint, 0)} units</div>
        </div>
        <div class="result-card">
            <div class="result-label">Economic Order Quantity (EOQ)</div>
            <div class="result-value">${formatNumber(eoq, 0)} units</div>
        </div>
        <div class="result-card">
            <div class="result-label">Safety Stock</div>
            <div class="result-value">${formatNumber(safetyStock, 0)} units</div>
        </div>
        <div class="result-card">
            <div class="result-label">Minimum Stock Level</div>
            <div class="result-value">${formatNumber(minStock, 0)} units</div>
        </div>
        <div class="result-card">
            <div class="result-label">Maximum Stock Level</div>
            <div class="result-value">${formatNumber(maxStock, 0)} units</div>
        </div>
        <div class="result-card">
            <div class="result-label">Stock Turnover Ratio</div>
            <div class="result-value">${formatNumber(stockTurnover)}x/year</div>
        </div>
        <div class="result-card">
            <div class="result-label">Annual Holding Cost</div>
            <div class="result-value">${formatINR(holdingCostAnnual)}</div>
        </div>
        <div class="result-card">
            <div class="result-label">Orders Per Year</div>
            <div class="result-value">${formatNumber(ordersPerYear, 0)}</div>
        </div>
        <div class="result-card">
            <div class="result-label">Days Between Orders</div>
            <div class="result-value">${formatNumber(daysBetweenOrders, 0)} days</div>
        </div>
    `;
    
    document.getElementById('inv-results').innerHTML = resultsHTML;
    
    // Show reorder alert
    const alertDiv = document.getElementById('inv-reorder-alert');
    if (currentStock <= reorderPoint) {
        alertDiv.style.display = 'flex';
        alertDiv.className = 'alert alert-danger';
        alertDiv.innerHTML = '<strong>⚠️ REORDER NOW!</strong> Current stock is at or below reorder point';
    } else {
        alertDiv.style.display = 'none';
    }
}

function addToMultiTracker() {
    const productName = document.getElementById('inv-product-name').value || 'Product';
    const currentStock = parseFloat(document.getElementById('inv-current-stock').value) || 0;
    const dailySales = parseFloat(document.getElementById('inv-daily-sales').value) || 0;
    const leadTime = parseFloat(document.getElementById('inv-lead-time').value) || 0;
    const safetyDays = parseFloat(document.getElementById('inv-safety-days').value) || 0;
    const unitCost = parseFloat(document.getElementById('inv-unit-cost').value) || 0;
    const orderCost = parseFloat(document.getElementById('inv-order-cost').value) || 0;
    const annualDemand = parseFloat(document.getElementById('inv-annual-demand').value) || 0;
    const holdingCost = parseFloat(document.getElementById('inv-holding-cost').value) || 0;
    
    const safetyStock = dailySales * safetyDays;
    const reorderPoint = (dailySales * leadTime) + safetyStock;
    const eoq = Math.sqrt((2 * annualDemand * orderCost) / (unitCost * (holdingCost / 100)));
    
    multiInventory.push({
        name: productName,
        currentStock,
        reorderPoint,
        eoq,
        dailySales,
        unitCost
    });
    
    updateMultiInventoryTable();
    alert('Product added to tracker!');
}

function updateMultiInventoryTable() {
    const tbody = document.getElementById('multi-inv-tbody');
    tbody.innerHTML = '';
    
    let lowStockCount = 0;
    
    multiInventory.forEach((product, index) => {
        const row = document.createElement('tr');
        
        let status = 'Good';
        let statusClass = 'status-green';
        
        if (product.currentStock <= product.reorderPoint) {
            status = 'REORDER NOW';
            statusClass = 'status-red';
            lowStockCount++;
        } else if (product.currentStock <= product.reorderPoint * 1.2) {
            status = 'Low';
            statusClass = 'status-yellow';
        }
        
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${formatNumber(product.currentStock, 0)}</td>
            <td>${formatNumber(product.reorderPoint, 0)}</td>
            <td>${formatNumber(product.eoq, 0)}</td>
            <td><span class="status-badge ${statusClass}">${status}</span></td>
            <td><button class="btn btn-sm btn-danger" onclick="deleteInventoryProduct(${index})">Delete</button></td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Update low stock summary
    const summaryDiv = document.getElementById('inv-low-stock-summary');
    if (lowStockCount > 0) {
        summaryDiv.style.display = 'flex';
        summaryDiv.innerHTML = `<strong>⚠️ ${lowStockCount} product(s) need reordering!</strong>`;
    } else {
        summaryDiv.style.display = 'none';
    }
    
    drawInventoryChart();
}

function deleteInventoryProduct(index) {
    multiInventory.splice(index, 1);
    updateMultiInventoryTable();
}

function drawInventoryChart() {
    const canvas = document.getElementById('inventory-chart');
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (multiInventory.length === 0) {
        ctx.font = '16px Roboto';
        ctx.fillStyle = '#64748B';
        ctx.textAlign = 'center';
        ctx.fillText('Add products to see comparison chart', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    const padding = 60;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    
    const maxValue = Math.max(...multiInventory.map(p => Math.max(p.currentStock, p.reorderPoint)));
    const scale = chartHeight / (maxValue * 1.2);
    
    // Draw axes
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Draw bars
    const barWidth = chartWidth / (multiInventory.length * 2.5);
    const spacing = chartWidth / multiInventory.length;
    
    multiInventory.forEach((product, i) => {
        const x = padding + (i * spacing);
        
        // Current stock (blue)
        ctx.fillStyle = '#1E3A8A';
        const stockHeight = product.currentStock * scale;
        ctx.fillRect(x, canvas.height - padding - stockHeight, barWidth, stockHeight);
        
        // Reorder point (red line)
        ctx.strokeStyle = '#DC2626';
        ctx.lineWidth = 3;
        const reorderY = canvas.height - padding - (product.reorderPoint * scale);
        ctx.beginPath();
        ctx.moveTo(x - 5, reorderY);
        ctx.lineTo(x + barWidth + 5, reorderY);
        ctx.stroke();
        
        // Product name
        ctx.fillStyle = '#1E293B';
        ctx.font = '10px Roboto';
        ctx.textAlign = 'center';
        ctx.save();
        ctx.translate(x + barWidth / 2, canvas.height - padding + 15);
        ctx.rotate(-Math.PI / 4);
        ctx.fillText(product.name.substring(0, 10), 0, 0);
        ctx.restore();
    });
    
    // Legend
    ctx.fillStyle = '#1E3A8A';
    ctx.fillRect(canvas.width - padding - 150, padding, 20, 10);
    ctx.fillStyle = '#1E293B';
    ctx.font = '12px Roboto';
    ctx.textAlign = 'left';
    ctx.fillText('Current Stock', canvas.width - padding - 125, padding + 10);
    
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(canvas.width - padding - 150, padding + 25);
    ctx.lineTo(canvas.width - padding - 130, padding + 25);
    ctx.stroke();
    ctx.fillText('Reorder Point', canvas.width - padding - 125, padding + 30);
    
    // Title
    ctx.font = 'bold 16px Poppins';
    ctx.textAlign = 'center';
    ctx.fillText('Inventory Levels vs Reorder Points', canvas.width / 2, 20);
}

// ABC Analysis
function addABCProduct() {
    const name = document.getElementById('abc-product-name').value;
    const usageValue = parseFloat(document.getElementById('abc-usage-value').value) || 0;
    
    if (!name || usageValue === 0) {
        alert('Please enter product name and usage value');
        return;
    }
    
    abcProducts.push({ name, usageValue });
    updateABCProductsTable();
    
    document.getElementById('abc-product-name').value = '';
    document.getElementById('abc-usage-value').value = '';
}

function updateABCProductsTable() {
    const tbody = document.getElementById('abc-products-tbody');
    tbody.innerHTML = '';
    
    abcProducts.forEach((product, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${formatINR(product.usageValue)}</td>
            <td><button class="btn btn-sm btn-danger" onclick="deleteABCProduct(${index})">Delete</button></td>
        `;
        tbody.appendChild(row);
    });
}

function deleteABCProduct(index) {
    abcProducts.splice(index, 1);
    updateABCProductsTable();
}

function classifyABC() {
    if (abcProducts.length === 0) {
        alert('Please add products first');
        return;
    }
    
    // Sort by usage value descending
    const sorted = [...abcProducts].sort((a, b) => b.usageValue - a.usageValue);
    const totalValue = sorted.reduce((sum, p) => sum + p.usageValue, 0);
    
    let cumulativePercent = 0;
    const classified = sorted.map(product => {
        const percent = (product.usageValue / totalValue) * 100;
        cumulativePercent += percent;
        
        let category, priority, description;
        if (cumulativePercent <= 70) {
            category = 'A';
            priority = 'Critical';
            description = 'High value items requiring tight control';
        } else if (cumulativePercent <= 90) {
            category = 'B';
            priority = 'Important';
            description = 'Moderate value items requiring moderate control';
        } else {
            category = 'C';
            priority = 'Normal';
            description = 'Low value items requiring minimal control';
        }
        
        return { ...product, percent, cumulativePercent, category, priority, description };
    });
    
    // Display results
    const resultsDiv = document.getElementById('abc-results');
    let html = '<h3>ABC Classification Results</h3>';
    html += '<div class="table-container"><table>';
    html += '<thead><tr><th>Product</th><th>Usage Value</th><th>% of Total</th><th>Cumulative %</th><th>Category</th><th>Priority</th></tr></thead>';
    html += '<tbody>';
    
    classified.forEach(item => {
        let rowClass = '';
        if (item.category === 'A') rowClass = 'style="background: #D1FAE5"';
        else if (item.category === 'B') rowClass = 'style="background: #FEF3C7"';
        else rowClass = 'style="background: #FEE2E2"';
        
        html += `<tr ${rowClass}>`;
        html += `<td>${item.name}</td>`;
        html += `<td>${formatINR(item.usageValue)}</td>`;
        html += `<td>${formatNumber(item.percent)}%</td>`;
        html += `<td>${formatNumber(item.cumulativePercent)}%</td>`;
        html += `<td><strong>${item.category}</strong></td>`;
        html += `<td>${item.priority}</td>`;
        html += '</tr>';
    });
    
    html += '</tbody></table></div>';
    resultsDiv.innerHTML = html;
    
    // Draw pie chart
    drawABCChart(classified);
}

function drawABCChart(classified) {
    const canvas = document.getElementById('abc-chart');
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const categories = { A: 0, B: 0, C: 0 };
    classified.forEach(item => {
        categories[item.category] += item.usageValue;
    });
    
    const total = categories.A + categories.B + categories.C;
    const colors = { A: '#16A34A', B: '#F59E0B', C: '#DC2626' };
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 3;
    
    let startAngle = -Math.PI / 2;
    
    Object.keys(categories).forEach(category => {
        const value = categories[category];
        if (value === 0) return;
        
        const sliceAngle = (value / total) * 2 * Math.PI;
        
        // Draw slice
        ctx.fillStyle = colors[category];
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fill();
        
        // Draw label
        const labelAngle = startAngle + sliceAngle / 2;
        const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
        const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 18px Poppins';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(category, labelX, labelY);
        
        const percent = (value / total) * 100;
        ctx.font = '14px Roboto';
        ctx.fillText(`${percent.toFixed(1)}%`, labelX, labelY + 20);
        
        startAngle += sliceAngle;
    });
    
    // Title
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 16px Poppins';
    ctx.textAlign = 'center';
    ctx.fillText('ABC Classification Distribution', canvas.width / 2, 20);
}

// ============================================
// SALARY CALCULATOR
// ============================================

function switchSalaryTab(tabName) {
    document.querySelectorAll('.sal-tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    document.querySelectorAll('#salary-content .sub-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.getElementById('sal-' + tabName).style.display = 'block';
    event.target.classList.add('active');
}

function calculateGrossNet() {
    const basic = parseFloat(document.getElementById('sal-basic').value) || 0;
    const hraPercent = parseFloat(document.getElementById('sal-hra-percent').value) || 40;
    const allowances = parseFloat(document.getElementById('sal-allowances').value) || 0;
    const pfPercent = parseFloat(document.getElementById('sal-pf-percent').value) || 12;
    const pt = parseFloat(document.getElementById('sal-pt').value) || 200;
    const tds = parseFloat(document.getElementById('sal-tds').value) || 0;
    
    if (basic === 0) return;
    
    const hra = (basic * hraPercent) / 100;
    const grossSalary = basic + hra + allowances;
    const pfDeduction = (Math.min(basic, 15000) * pfPercent) / 100;
    const totalDeductions = pfDeduction + pt + tds;
    const netTakeHome = grossSalary - totalDeductions;
    const annualGross = grossSalary * 12;
    const annualNet = netTakeHome * 12;
    
    const resultsHTML = `
        <div class="result-card">
            <div class="result-label">Gross Salary (Monthly)</div>
            <div class="result-value">${formatINR(grossSalary)}</div>
        </div>
        <div class="result-card">
            <div class="result-label">HRA</div>
            <div class="result-value">${formatINR(hra)}</div>
        </div>
        <div class="result-card">
            <div class="result-label">Total Deductions</div>
            <div class="result-value">${formatINR(totalDeductions)}</div>
        </div>
        <div class="result-card positive">
            <div class="result-label">Net Take-Home (Monthly)</div>
            <div class="result-value">${formatINR(netTakeHome)}</div>
        </div>
        <div class="result-card">
            <div class="result-label">Annual Gross</div>
            <div class="result-value">${formatINR(annualGross)}</div>
        </div>
        <div class="result-card positive">
            <div class="result-label">Annual Net</div>
            <div class="result-value">${formatINR(annualNet)}</div>
        </div>
    `;
    
    document.getElementById('gross-net-results').innerHTML = resultsHTML;
}

function calculateCTC() {
    const basic = parseFloat(document.getElementById('ctc-basic').value) || 0;
    const hraPercent = parseFloat(document.getElementById('ctc-hra').value) || 40;
    const allowances = parseFloat(document.getElementById('ctc-allowances').value) || 0;
    const includeEPF = document.getElementById('ctc-include-epf').checked;
    const includeESI = document.getElementById('ctc-include-esi').checked;
    const includeGratuity = document.getElementById('ctc-include-gratuity').checked;
    const bonusMonths = parseFloat(document.getElementById('ctc-bonus-months').value) || 0;
    
    if (basic === 0) return;
    
    const hra = (basic * hraPercent) / 100;
    const grossSalary = basic + hra + allowances;
    const annualGross = grossSalary * 12;
    
    let employerPF = 0;
    if (includeEPF) {
        employerPF = (Math.min(basic, 15000) * 12) / 100 * 12;
    }
    
    let esi = 0;
    if (includeESI && grossSalary < 21000) {
        esi = (grossSalary * 3.25) / 100 * 12;
    }
    
    let gratuity = 0;
    if (includeGratuity) {
        gratuity = (basic * 12 * 4.81) / 100;
    }
    
    const bonus = basic * bonusMonths;
    const totalCTC = annualGross + employerPF + esi + gratuity + bonus;
    const monthlyCTC = totalCTC / 12;
    
    const resultsHTML = `
        <div class="result-card positive">
            <div class="result-label">Total CTC (Annual)</div>
            <div class="result-value">${formatINR(totalCTC)}</div>
        </div>
        <div class="result-card">
            <div class="result-label">Monthly CTC</div>
            <div class="result-value">${formatINR(monthlyCTC)}</div>
        </div>
        <div class="result-card">
            <div class="result-label">Annual Gross Salary</div>
            <div class="result-value">${formatINR(annualGross)}</div>
        </div>
        <div class="result-card">
            <div class="result-label">Employer PF Contribution</div>
            <div class="result-value">${formatINR(employerPF)}</div>
        </div>
        <div class="result-card">
            <div class="result-label">ESI Contribution</div>
            <div class="result-value">${formatINR(esi)}</div>
        </div>
        <div class="result-card">
            <div class="result-label">Gratuity (Annual)</div>
            <div class="result-value">${formatINR(gratuity)}</div>
        </div>
        <div class="result-card">
            <div class="result-label">Bonus</div>
            <div class="result-value">${formatINR(bonus)}</div>
        </div>
    `;
    
    document.getElementById('ctc-results').innerHTML = resultsHTML;
    drawCTCChart(annualGross, employerPF, esi, gratuity, bonus);
}

function drawCTCChart(gross, pf, esi, gratuity, bonus) {
    const canvas = document.getElementById('ctc-chart');
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const components = [
        { label: 'Gross Salary', value: gross, color: '#1E3A8A' },
        { label: 'Employer PF', value: pf, color: '#16A34A' },
        { label: 'ESI', value: esi, color: '#F59E0B' },
        { label: 'Gratuity', value: gratuity, color: '#DC2626' },
        { label: 'Bonus', value: bonus, color: '#8B5CF6' }
    ].filter(c => c.value > 0);
    
    const total = components.reduce((sum, c) => sum + c.value, 0);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 3;
    
    let startAngle = -Math.PI / 2;
    
    components.forEach(component => {
        const sliceAngle = (component.value / total) * 2 * Math.PI;
        
        ctx.fillStyle = component.color;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        ctx.closePath();
        ctx.fill();
        
        startAngle += sliceAngle;
    });
    
    // Legend
    let legendY = 40;
    components.forEach(component => {
        const percent = (component.value / total) * 100;
        ctx.fillStyle = component.color;
        ctx.fillRect(20, legendY, 15, 15);
        ctx.fillStyle = '#1E293B';
        ctx.font = '12px Roboto';
        ctx.textAlign = 'left';
        ctx.fillText(`${component.label} (${percent.toFixed(1)}%)`, 40, legendY + 12);
        legendY += 25;
    });
    
    // Title
    ctx.font = 'bold 14px Poppins';
    ctx.textAlign = 'center';
    ctx.fillText('CTC Breakdown', canvas.width / 2, 20);
}

function calculateIncrement() {
    const currentCTC = parseFloat(document.getElementById('inc-current-ctc').value) || 0;
    const incrementPercent = parseFloat(document.getElementById('inc-percent').value) || 0;
    const numEmployees = parseFloat(document.getElementById('inc-num-employees').value) || 1;
    
    if (currentCTC === 0) return;
    
    const newCTC = currentCTC * (1 + incrementPercent / 100);
    const perEmployeeIncrease = newCTC - currentCTC;
    const totalIncrease = perEmployeeIncrease * numEmployees;
    const monthlyIncrease = totalIncrease / 12;
    
    const resultsHTML = `
        <div class="result-card">
            <div class="result-label">New CTC (Annual)</div>
            <div class="result-value">${formatINR(newCTC)}</div>
        </div>
        <div class="result-card">
            <div class="result-label">Per Employee Increase</div>
            <div class="result-value">${formatINR(perEmployeeIncrease)}</div>
        </div>
        <div class="result-card positive">
            <div class="result-label">Total Annual Cost Increase</div>
            <div class="result-value">${formatINR(totalIncrease)}</div>
        </div>
        <div class="result-card">
            <div class="result-label">Monthly Cost Increase</div>
            <div class="result-value">${formatINR(monthlyIncrease)}</div>
        </div>
    `;
    
    document.getElementById('increment-results').innerHTML = resultsHTML;
    
    // Update comparison table
    const tbody = document.getElementById('increment-comparison-tbody');
    tbody.innerHTML = `
        <tr>
            <td>Annual CTC</td>
            <td>${formatINR(currentCTC)}</td>
            <td>${formatINR(newCTC)}</td>
            <td>${formatINR(perEmployeeIncrease)}</td>
        </tr>
        <tr>
            <td>Monthly Cost</td>
            <td>${formatINR(currentCTC / 12)}</td>
            <td>${formatINR(newCTC / 12)}</td>
            <td>${formatINR(perEmployeeIncrease / 12)}</td>
        </tr>
        <tr>
            <td>Total Cost (${numEmployees} employees)</td>
            <td>${formatINR(currentCTC * numEmployees)}</td>
            <td>${formatINR(newCTC * numEmployees)}</td>
            <td>${formatINR(totalIncrease)}</td>
        </tr>
    `;
}

function calculateHiringCost() {
    const ctc = parseFloat(document.getElementById('hire-ctc').value) || 0;
    const recruitment = parseFloat(document.getElementById('hire-recruitment').value) || 10000;
    const training = parseFloat(document.getElementById('hire-training').value) || 20000;
    const equipment = parseFloat(document.getElementById('hire-equipment').value) || 30000;
    const rampupMonths = parseFloat(document.getElementById('hire-rampup').value) || 3;
    
    if (ctc === 0) return;
    
    const totalFirstYear = ctc + recruitment + training + equipment;
    const costPerMonth = totalFirstYear / 12;
    const rampupCost = (ctc / 12) * rampupMonths + recruitment + training + equipment;
    
    const resultsHTML = `
        <div class="result-card positive">
            <div class="result-label">Total First Year Cost</div>
            <div class="result-value">${formatINR(totalFirstYear)}</div>
        </div>
        <div class="result-card">
            <div class="result-label">Cost Per Month (Average)</div>
            <div class="result-value">${formatINR(costPerMonth)}</div>
        </div>
        <div class="result-card">
            <div class="result-label">Effective Cost During Ramp-up</div>
            <div class="result-value">${formatINR(rampupCost)}</div>
        </div>
        <div class="result-card">
            <div class="result-label">Annual CTC</div>
            <div class="result-value">${formatINR(ctc)}</div>
        </div>
        <div class="result-card">
            <div class="result-label">One-time Costs</div>
            <div class="result-value">${formatINR(recruitment + training + equipment)}</div>
        </div>
        <div class="result-card">
            <div class="result-label">Ramp-up Period</div>
            <div class="result-value">${rampupMonths} months</div>
        </div>
    `;
    
    document.getElementById('hiring-results').innerHTML = resultsHTML;
}

function calculateHourlyCost() {
    const monthlyCTC = parseFloat(document.getElementById('hourly-ctc').value) || 0;
    const workingDays = parseFloat(document.getElementById('hourly-days').value) || 22;
    const hoursPerDay = parseFloat(document.getElementById('hourly-hours').value) || 8;
    const utilization = parseFloat(document.getElementById('hourly-utilization').value) || 70;
    
    if (monthlyCTC === 0) return;
    
    const totalMonthlyHours = workingDays * hoursPerDay;
    const billableHours = (totalMonthlyHours * utilization) / 100;
    const costPerHour = monthlyCTC / totalMonthlyHours;
    const billableRate = costPerHour / (utilization / 100);
    const dailyCost = monthlyCTC / workingDays;
    
    const resultsHTML = `
        <div class="result-card">
            <div class="result-label">Total Monthly Hours</div>
            <div class="result-value">${formatNumber(totalMonthlyHours, 0)} hours</div>
        </div>
        <div class="result-card">
            <div class="result-label">Billable Hours (${utilization}%)</div>
            <div class="result-value">${formatNumber(billableHours, 0)} hours</div>
        </div>
        <div class="result-card positive">
            <div class="result-label">Cost Per Hour</div>
            <div class="result-value">${formatINR(costPerHour)}</div>
        </div>
        <div class="result-card positive">
            <div class="result-label">Billable Rate Needed</div>
            <div class="result-value">${formatINR(billableRate)}</div>
        </div>
        <div class="result-card">
            <div class="result-label">Daily Cost</div>
            <div class="result-value">${formatINR(dailyCost)}</div>
        </div>
    `;
    
    document.getElementById('hourly-results').innerHTML = resultsHTML;
}

function calculateComparison() {
    const freelancerRate = parseFloat(document.getElementById('comp-freelancer-rate').value) || 0;
    const freelancerHours = parseFloat(document.getElementById('comp-freelancer-hours').value) || 0;
    const freelancerDuration = parseFloat(document.getElementById('comp-freelancer-duration').value) || 1;
    const fulltimeCTC = parseFloat(document.getElementById('comp-fulltime-ctc').value) || 0;
    const fulltimeDuration = parseFloat(document.getElementById('comp-fulltime-duration').value) || 1;
    
    if (freelancerRate === 0 || fulltimeCTC === 0) return;
    
    const totalFreelancer = freelancerRate * freelancerHours * freelancerDuration;
    const totalFulltime = fulltimeCTC * fulltimeDuration;
    const difference = totalFreelancer - totalFulltime;
    const breakevenHours = totalFulltime / (freelancerRate * freelancerDuration);
    
    let recommendation = '';
    if (totalFreelancer < totalFulltime) {
        recommendation = 'Freelancer is more cost-effective for this duration';
    } else {
        recommendation = 'Full-time employee is more cost-effective';
    }
    
    const resultsHTML = `
        <div class="result-card">
            <div class="result-label">Total Freelancer Cost</div>
            <div class="result-value">${formatINR(totalFreelancer)}</div>
        </div>
        <div class="result-card">
            <div class="result-label">Total Full-Time Cost</div>
            <div class="result-value">${formatINR(totalFulltime)}</div>
        </div>
        <div class="result-card ${difference > 0 ? 'negative' : 'positive'}">
            <div class="result-label">Cost Difference</div>
            <div class="result-value">${formatINR(Math.abs(difference))}</div>
        </div>
        <div class="result-card">
            <div class="result-label">Break-even Hours</div>
            <div class="result-value">${formatNumber(breakevenHours, 0)} hours</div>
        </div>
    `;
    
    document.getElementById('comparison-results').innerHTML = resultsHTML + 
        `<div class="alert alert-success" style="margin-top: 16px;"><strong>Recommendation:</strong> ${recommendation}</div>`;
    
    drawComparisonChart(totalFreelancer, totalFulltime);
}

function drawComparisonChart(freelancer, fulltime) {
    const canvas = document.getElementById('comparison-chart');
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const padding = 60;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    
    const maxValue = Math.max(freelancer, fulltime);
    const scale = chartHeight / (maxValue * 1.2);
    
    // Draw axes
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Draw bars
    const barWidth = 80;
    const spacing = chartWidth / 3;
    
    // Freelancer bar
    ctx.fillStyle = '#F59E0B';
    const freelancerHeight = freelancer * scale;
    ctx.fillRect(padding + spacing - barWidth/2, canvas.height - padding - freelancerHeight, barWidth, freelancerHeight);
    
    // Full-time bar
    ctx.fillStyle = '#1E3A8A';
    const fulltimeHeight = fulltime * scale;
    ctx.fillRect(padding + spacing * 2 - barWidth/2, canvas.height - padding - fulltimeHeight, barWidth, fulltimeHeight);
    
    // Labels
    ctx.fillStyle = '#1E293B';
    ctx.font = '14px Roboto';
    ctx.textAlign = 'center';
    ctx.fillText('Freelancer', padding + spacing, canvas.height - padding + 20);
    ctx.fillText('Full-Time', padding + spacing * 2, canvas.height - padding + 20);
    
    // Values
    ctx.fillText(formatINR(freelancer), padding + spacing, canvas.height - padding - freelancerHeight - 10);
    ctx.fillText(formatINR(fulltime), padding + spacing * 2, canvas.height - padding - fulltimeHeight - 10);
    
    // Title
    ctx.font = 'bold 16px Poppins';
    ctx.fillText('Cost Comparison', canvas.width / 2, 30);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Business Tools Suite initialized');
    
    // Set today's date as default for last contact
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('crm-last-contact').value = today;
    
    // Set today's date for purchase date
    document.getElementById('purchase-date').value = today;
    
    // Load sample data
    loadSampleData();
    
    // Initialize CRM view
    updateCustomersTable();
    updateCRMStats();
});

function loadSampleData() {
    // Add 3 sample customers
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    customers = [
        {
            id: 1001,
            name: 'Rajesh Kumar',
            company: 'Kumar Traders',
            email: 'rajesh@kumartraders.com',
            phone: '9876543210',
            whatsapp: '9876543210',
            address: 'Shop No. 45, MG Road, Mumbai',
            category: 'A',
            birthday: '1985-03-15',
            anniversary: '',
            tags: 'VIP, Wholesale',
            lastContact: yesterday.toISOString().split('T')[0],
            nextFollowup: nextWeek.toISOString().split('T')[0],
            notes: 'Preferred supplier for electronics. Always pays on time.',
            purchases: [
                {
                    id: 10001,
                    date: '2024-01-15',
                    product: 'Electronics Package',
                    amount: 75000,
                    payment: 'Bank Transfer',
                    invoice: 'INV-2024-001'
                },
                {
                    id: 10002,
                    date: '2024-06-20',
                    product: 'Bulk Order - Accessories',
                    amount: 50000,
                    payment: 'UPI',
                    invoice: 'INV-2024-056'
                }
            ],
            createdDate: '2023-11-10'
        },
        {
            id: 1002,
            name: 'Priya Sharma',
            company: 'Sharma Enterprises',
            email: 'priya@sharma.com',
            phone: '9876543211',
            whatsapp: '9876543211',
            address: 'B-23, Industrial Area, Delhi',
            category: 'B',
            birthday: '1990-07-22',
            anniversary: '2015-12-10',
            tags: 'Regular, Retail',
            lastContact: today.toISOString().split('T')[0],
            nextFollowup: '',
            notes: 'Interested in new product launches.',
            purchases: [
                {
                    id: 10003,
                    date: '2024-03-10',
                    product: 'Office Supplies',
                    amount: 25000,
                    payment: 'Card',
                    invoice: 'INV-2024-023'
                },
                {
                    id: 10004,
                    date: '2024-08-15',
                    product: 'Stationery Items',
                    amount: 20000,
                    payment: 'UPI',
                    invoice: 'INV-2024-089'
                }
            ],
            createdDate: '2024-01-05'
        },
        {
            id: 1003,
            name: 'Amit Patel',
            company: 'Patel & Co',
            email: 'amit@patelco.com',
            phone: '9876543212',
            whatsapp: '9876543212',
            address: '12, Commercial Street, Ahmedabad',
            category: 'A',
            birthday: '',
            anniversary: '',
            tags: 'Corporate, VIP',
            lastContact: '2024-09-15',
            nextFollowup: today.toISOString().split('T')[0],
            notes: 'High-value corporate client. Quarterly contracts.',
            purchases: [
                {
                    id: 10005,
                    date: '2024-02-20',
                    product: 'Corporate Package Q1',
                    amount: 98000,
                    payment: 'Bank Transfer',
                    invoice: 'INV-2024-015'
                }
            ],
            createdDate: '2023-12-01'
        }
    ];
    
    // Add 2 sample marketing campaigns
    marketingCampaigns = [
        {
            id: 2001,
            name: 'Diwali Sale Campaign',
            platform: 'Facebook Ads',
            startDate: '2024-10-01',
            endDate: '2024-10-31',
            status: 'Completed',
            cost: 50000,
            revenue: 250000,
            leads: 250,
            customers: 50,
            roi: 400,
            roas: 5,
            cac: 1000,
            cpl: 200,
            conversionRate: 20
        },
        {
            id: 2002,
            name: 'Summer Product Launch',
            platform: 'Google Ads',
            startDate: '2024-06-01',
            endDate: '2024-06-30',
            status: 'Completed',
            cost: 75000,
            revenue: 180000,
            leads: 150,
            customers: 30,
            roi: 140,
            roas: 2.4,
            cac: 2500,
            cpl: 500,
            conversionRate: 20
        }
    ];
}
