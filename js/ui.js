/**
 * UI Logic Module
 * Handles DOM manipulation and rendering
 */

const UI = {
    // Format Currency (IDR)
    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    },

    // Render Account Select Options
    renderAccountOptions(selectElement) {
        const accounts = DataManager.defaultAccounts;
        selectElement.innerHTML = '<option value="">Pilih Akun...</option>';
        accounts.forEach(acc => {
            const option = document.createElement('option');
            option.value = acc.code;
            option.textContent = `${acc.code} - ${acc.name}`;
            selectElement.appendChild(option);
        });
    },

    // Transaction Form Management
    pendingTransaction: null,

    initTransactionForm() {
        const typeSelect = document.getElementById('trx-type');
        const transactionForm = document.getElementById('transaction-form');
        const confirmBtn = document.getElementById('btn-confirm-save');

        // Render Transaction Types
        this.renderTransactionTypes(typeSelect);

        transactionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTransactionProcess();
        });

        confirmBtn.addEventListener('click', () => {
            this.handleTransactionConfirm();
        });

        // Auto-fill description based on type
        typeSelect.addEventListener('change', () => {
            const selected = DataManager.transactionTypes.find(t => t.id === typeSelect.value);
            const descInput = document.getElementById('trx-desc');
            
            // Hide preview if type changes
            document.getElementById('journal-preview').style.display = 'none';
            
            if (selected) {
                descInput.value = selected.desc_template;
            } else {
                descInput.value = '';
            }
        });
    },

    renderTransactionTypes(selectElement) {
        selectElement.innerHTML = '<option value="">-- Pilih Jenis Transaksi --</option>';
        DataManager.transactionTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.id;
            option.textContent = type.name;
            selectElement.appendChild(option);
        });
    },

    handleTransactionProcess() {
        const date = document.getElementById('trx-date').value;
        const typeId = document.getElementById('trx-type').value;
        const description = document.getElementById('trx-desc').value;
        const amount = Number(document.getElementById('trx-amount').value);

        if (!typeId) {
            alert('Pilih jenis transaksi!');
            return;
        }

        if (amount <= 0) {
            alert('Nominal harus lebih dari 0');
            return;
        }

        const trxType = DataManager.transactionTypes.find(t => t.id === typeId);
        
        // Auto-Generate Journal Entries (Double Entry)
        const entries = [
            {
                accountCode: trxType.debit,
                type: 'debit',
                amount: amount
            },
            {
                accountCode: trxType.credit,
                type: 'credit',
                amount: amount
            }
        ];

        this.pendingTransaction = {
            id: 'trx-' + Date.now(),
            date,
            description,
            entries
        };

        this.renderPreview(this.pendingTransaction);
    },

    renderPreview(transaction) {
        const previewContainer = document.getElementById('journal-preview');
        const tbody = document.getElementById('preview-table-body');
        tbody.innerHTML = '';

        transaction.entries.forEach(entry => {
            const accountName = DataManager.getAccountName(entry.accountCode);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${entry.accountCode} - ${accountName}</td>
                <td class="text-end">${entry.type === 'debit' ? this.formatCurrency(entry.amount) : '-'}</td>
                <td class="text-end">${entry.type === 'credit' ? this.formatCurrency(entry.amount) : '-'}</td>
            `;
            tbody.appendChild(tr);
        });

        previewContainer.style.display = 'block';
        // Scroll to preview
        previewContainer.scrollIntoView({ behavior: 'smooth' });
    },

    handleTransactionConfirm() {
        if (!this.pendingTransaction) return;

        DataManager.addTransaction(this.pendingTransaction);
        alert('Transaksi berhasil disimpan!\nJurnal otomatis terbentuk.');
        
        // Reset form and UI
        document.getElementById('transaction-form').reset();
        document.getElementById('trx-date').valueAsDate = new Date();
        document.getElementById('journal-preview').style.display = 'none';
        this.pendingTransaction = null;
        
        // Refresh Reports if visible
        // (Optional: Implement if reports section is active)
    },

    // Render Journal Table
    renderJournal() {
        const tbody = document.getElementById('journal-table-body');
        tbody.innerHTML = '';
        
        const transactions = DataManager.getData().transactions;
        const entries = Accounting.getJournalEntries(transactions);

        if (entries.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Belum ada data transaksi</td></tr>';
            return;
        }

        entries.forEach(entry => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${entry.date}</td>
                <td>${entry.description}</td>
                <td>${entry.accountCode} - ${entry.accountName}</td>
                <td class="amount-col">${entry.debit > 0 ? this.formatCurrency(entry.debit) : '-'}</td>
                <td class="amount-col">${entry.credit > 0 ? this.formatCurrency(entry.credit) : '-'}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    // Render Reports
    renderReports() {
        const transactions = DataManager.getData().transactions;
        
        // 1. Trial Balance
        const tbData = Accounting.getTrialBalance(transactions);
        const tbBody = document.getElementById('trial-balance-body');
        tbBody.innerHTML = '';
        let tbDebit = 0, tbCredit = 0;

        tbData.forEach(item => {
            tbDebit += item.debit;
            tbCredit += item.credit;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.code} - ${item.name}</td>
                <td class="amount-col">${item.debit > 0 ? this.formatCurrency(item.debit) : '-'}</td>
                <td class="amount-col">${item.credit > 0 ? this.formatCurrency(item.credit) : '-'}</td>
            `;
            tbBody.appendChild(tr);
        });
        
        document.getElementById('tb-total-debit').textContent = this.formatCurrency(tbDebit);
        document.getElementById('tb-total-credit').textContent = this.formatCurrency(tbCredit);

        // 2. Income Statement
        const isData = Accounting.getIncomeStatement(transactions);
        const isBody = document.getElementById('income-statement-body');
        isBody.innerHTML = '';
        
        // Revenues
        isBody.innerHTML += `<tr class="table-light"><td colspan="2"><strong>PENDAPATAN</strong></td></tr>`;
        isData.details.revenues.forEach(item => {
            isBody.innerHTML += `<tr><td>${item.name}</td><td class="amount-col">${this.formatCurrency(item.amount)}</td></tr>`;
        });
        isBody.innerHTML += `<tr class="fw-bold"><td>Total Pendapatan</td><td class="amount-col">${this.formatCurrency(isData.revenue)}</td></tr>`;

        // Expenses
        isBody.innerHTML += `<tr class="table-light"><td colspan="2"><strong>BEBAN</strong></td></tr>`;
        isData.details.expenses.forEach(item => {
            isBody.innerHTML += `<tr><td>${item.name}</td><td class="amount-col">${this.formatCurrency(item.amount)}</td></tr>`;
        });
        isBody.innerHTML += `<tr class="fw-bold"><td>Total Beban</td><td class="amount-col">(${this.formatCurrency(isData.expenses)})</td></tr>`;

        // Net Income
        const netColor = isData.netIncome >= 0 ? 'text-success' : 'text-danger';
        isBody.innerHTML += `<tr class="table-active fw-bold ${netColor}"><td class="fs-5">LABA/RUGI BERSIH</td><td class="amount-col fs-5">${this.formatCurrency(isData.netIncome)}</td></tr>`;


        // 3. Balance Sheet
        const bsData = Accounting.getBalanceSheet(transactions, isData.netIncome);
        const bsBody = document.getElementById('balance-sheet-body');
        bsBody.innerHTML = '';

        // Assets
        bsBody.innerHTML += `<tr class="table-primary"><td colspan="2"><strong>ASET</strong></td></tr>`;
        bsData.assets.forEach(item => {
            bsBody.innerHTML += `<tr><td>${item.name}</td><td class="amount-col">${this.formatCurrency(item.amount)}</td></tr>`;
        });
        bsBody.innerHTML += `<tr class="fw-bold table-active"><td>TOTAL ASET</td><td class="amount-col">${this.formatCurrency(bsData.totalAssets)}</td></tr>`;

        // Liabilities
        bsBody.innerHTML += `<tr class="table-warning"><td colspan="2"><strong>KEWAJIBAN</strong></td></tr>`;
        bsData.liabilities.forEach(item => {
            bsBody.innerHTML += `<tr><td>${item.name}</td><td class="amount-col">${this.formatCurrency(item.amount)}</td></tr>`;
        });
        bsBody.innerHTML += `<tr class="fw-bold"><td>Total Kewajiban</td><td class="amount-col">${this.formatCurrency(bsData.totalLiabilities)}</td></tr>`;

        // Equity
        bsBody.innerHTML += `<tr class="table-success"><td colspan="2"><strong>EKUITAS</strong></td></tr>`;
        bsData.equity.forEach(item => {
            bsBody.innerHTML += `<tr><td>${item.name}</td><td class="amount-col">${this.formatCurrency(item.amount)}</td></tr>`;
        });
        bsBody.innerHTML += `<tr class="fw-bold"><td>Total Ekuitas</td><td class="amount-col">${this.formatCurrency(bsData.totalEquity)}</td></tr>`;

        // Liabilities + Equity
        bsBody.innerHTML += `<tr class="fw-bold table-active"><td>TOTAL KEWAJIBAN & EKUITAS</td><td class="amount-col">${this.formatCurrency(bsData.totalLiabilities + bsData.totalEquity)}</td></tr>`;
    },

    // Dashboard Analytics
    renderDashboardAnalytics() {
        const container = document.getElementById('dashboard-analytics');
        if (!container) return;

        const transactions = DataManager.getData().transactions;
        const year = 2025; // Target Year

        // 1. Prepare Data for Charts (Monthly Aggregation)
        const monthlyData = Array(12).fill(0).map(() => ({ revenue: 0, expense: 0, profit: 0 }));
        const expenseComposition = {};
        const revenueComposition = {};

        transactions.forEach(trx => {
            const tDate = new Date(trx.date);
            if (tDate.getFullYear() !== year) return;

            const monthIndex = tDate.getMonth();
            
            trx.entries.forEach(entry => {
                const code = entry.accountCode.toString();
                
                // Revenue Calculation
                if (code.startsWith('4')) {
                    if (entry.type === 'credit') {
                        monthlyData[monthIndex].revenue += entry.amount;
                        
                        // Revenue Composition Logic
                        const accName = DataManager.getAccountName(code);
                        if (!revenueComposition[accName]) revenueComposition[accName] = 0;
                        revenueComposition[accName] += entry.amount;
                    }
                    if (entry.type === 'debit') monthlyData[monthIndex].revenue -= entry.amount;
                }

                // Expense Calculation
                if (code.startsWith('5')) {
                    if (entry.type === 'debit') {
                        monthlyData[monthIndex].expense += entry.amount;
                        
                        // Expense Composition Logic
                        const accName = DataManager.getAccountName(code);
                        if (!expenseComposition[accName]) expenseComposition[accName] = 0;
                        expenseComposition[accName] += entry.amount;
                    }
                    if (entry.type === 'credit') {
                        monthlyData[monthIndex].expense -= entry.amount;
                        // Subtract from composition if needed (simplified here)
                    }
                }
            });
        });

        // Calculate Net Profit per Month
        monthlyData.forEach(m => m.profit = m.revenue - m.expense);

        // --- RENDER CARDS (Current Month / Last Data Month) ---
        // Find last month with data or default to Jan
        const currentMonthIndex = new Date().getMonth(); // Real-time check or simulate?
        // Let's use the current month if in 2025, otherwise December 2025 for demo view
        const targetMonthIndex = (new Date().getFullYear() === year) ? new Date().getMonth() : 11;
        
        const currentStats = monthlyData[targetMonthIndex];
        const trxCount = transactions.filter(t => {
            const d = new Date(t.date);
            return d.getFullYear() === year && d.getMonth() === targetMonthIndex;
        }).length;

        container.innerHTML = `
            <div class="col-md-3 mb-3">
                <div class="card text-white bg-primary h-100">
                    <div class="card-body">
                        <h5 class="card-title"><i class="bi bi-wallet2"></i> Pendapatan</h5>
                        <p class="card-text fs-4 fw-bold">${this.formatCurrency(currentStats.revenue)}</p>
                        <small>Bulan ${this.getMonthName(targetMonthIndex)} ${year}</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card text-white bg-danger h-100">
                    <div class="card-body">
                        <h5 class="card-title"><i class="bi bi-cart"></i> Beban</h5>
                        <p class="card-text fs-4 fw-bold">${this.formatCurrency(currentStats.expense)}</p>
                        <small>Bulan ${this.getMonthName(targetMonthIndex)} ${year}</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card text-white bg-success h-100">
                    <div class="card-body">
                        <h5 class="card-title"><i class="bi bi-graph-up-arrow"></i> Laba Bersih</h5>
                        <p class="card-text fs-4 fw-bold">${this.formatCurrency(currentStats.profit)}</p>
                        <small>Bulan ${this.getMonthName(targetMonthIndex)} ${year}</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card text-white bg-info h-100">
                    <div class="card-body">
                        <h5 class="card-title"><i class="bi bi-list-check"></i> Transaksi</h5>
                        <p class="card-text fs-4 fw-bold">${trxCount}</p>
                        <small>Jumlah Transaksi</small>
                    </div>
                </div>
            </div>
        `;

        // --- RENDER CHARTS ---
        this.renderCharts(monthlyData, expenseComposition, revenueComposition);
    },

    getMonthName(index) {
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return months[index];
    },

    renderCharts(monthlyData, expenseComposition, revenueComposition) {
        // 1. Finance Trend Chart (Line)
        const ctxFinance = document.getElementById('financeChart');
        if (ctxFinance) {
            // Destroy existing chart if any
            if (this.financeChartInstance) this.financeChartInstance.destroy();

            this.financeChartInstance = new Chart(ctxFinance, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
                    datasets: [
                        {
                            label: 'Pendapatan',
                            data: monthlyData.map(d => d.revenue),
                            borderColor: '#0d6efd',
                            tension: 0.3,
                            fill: false
                        },
                        {
                            label: 'Beban',
                            data: monthlyData.map(d => d.expense),
                            borderColor: '#dc3545',
                            tension: 0.3,
                            fill: false
                        },
                        {
                            label: 'Laba Bersih',
                            data: monthlyData.map(d => d.profit),
                            borderColor: '#198754',
                            backgroundColor: 'rgba(25, 135, 84, 0.1)',
                            tension: 0.3,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false, // Allow height control
                    plugins: {
                        legend: { position: 'bottom' }
                    },
                    scales: {
                        y: { beginAtZero: true }
                    }
                }
            });
        }

        // 2. Revenue Composition Chart (Doughnut)
        const ctxRevenue = document.getElementById('revenueChart');
        if (ctxRevenue) {
            if (this.revenueChartInstance) this.revenueChartInstance.destroy();

            // Prepare Data
            const sortedRevenue = Object.entries(revenueComposition).sort(([,a], [,b]) => b - a);
            const revLabels = [];
            const revData = [];
            
            sortedRevenue.forEach((item) => {
                revLabels.push(item[0]);
                revData.push(item[1]);
            });

            this.revenueChartInstance = new Chart(ctxRevenue, {
                type: 'doughnut',
                data: {
                    labels: revLabels,
                    datasets: [{
                        data: revData,
                        backgroundColor: ['#0d6efd', '#6610f2', '#6f42c1', '#d63384', '#fd7e14', '#ffc107']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { position: 'bottom' } }
                }
            });
        }

        // 3. Expense Composition Chart (Doughnut)
        const ctxExpense = document.getElementById('expenseChart');
        if (ctxExpense) {
            // Destroy existing chart if any
            if (this.expenseChartInstance) this.expenseChartInstance.destroy();

            // Prepare Data (Top 5 Expenses + Others)
            const sortedExpenses = Object.entries(expenseComposition)
                .sort(([,a], [,b]) => b - a);
            
            const topLabels = [];
            const topData = [];
            let otherTotal = 0;

            sortedExpenses.forEach((item, index) => {
                if (index < 5) {
                    topLabels.push(item[0]);
                    topData.push(item[1]);
                } else {
                    otherTotal += item[1];
                }
            });

            if (otherTotal > 0) {
                topLabels.push('Lain-lain');
                topData.push(otherTotal);
            }

            this.expenseChartInstance = new Chart(ctxExpense, {
                type: 'doughnut',
                data: {
                    labels: topLabels,
                    datasets: [{
                        data: topData,
                        backgroundColor: [
                            '#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff', '#c9cbcf'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }
    }
};
