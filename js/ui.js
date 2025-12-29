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

    // Fix for Tab overlap issue
    initReportTabs() {
        const tabs = document.querySelectorAll('button[data-bs-toggle="tab"]');
        tabs.forEach(tab => {
            tab.addEventListener('show.bs.tab', (e) => {
                // Ensure all other panes are hidden before showing the new one
                const targetId = e.target.getAttribute('data-bs-target');
                const panes = document.querySelectorAll('.tab-pane');
                panes.forEach(pane => {
                    if ('#' + pane.id !== targetId) {
                        pane.classList.remove('show', 'active');
                    }
                });
            });
        });
    },

    // Transaction Form Management
    pendingTransaction: null,

    initTransactionForm() {
        // Initialize Tabs Fix
        this.initReportTabs();

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
            const selected = DataManager.getTransactionTypes().find(t => t.id === typeSelect.value);
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
        DataManager.getTransactionTypes().forEach(type => {
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

        const trxType = DataManager.getTransactionTypes().find(t => t.id === typeId);
        
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
        
        const accounts = DataManager.getData().accounts;

        transaction.entries.forEach((entry, index) => {
            const tr = document.createElement('tr');
            
            // Create Account Select Options
            let optionsHtml = '';
            accounts.forEach(acc => {
                const selected = acc.code === entry.accountCode ? 'selected' : '';
                optionsHtml += `<option value="${acc.code}" ${selected}>${acc.code} - ${acc.name}</option>`;
            });

            tr.innerHTML = `
                <td>
                    <select class="form-select form-select-sm preview-account-select" data-entry-index="${index}">
                        ${optionsHtml}
                    </select>
                </td>
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

        // Capture edited account codes from preview
        const selects = document.querySelectorAll('.preview-account-select');
        selects.forEach(select => {
            const index = parseInt(select.dataset.entryIndex);
            if (this.pendingTransaction.entries[index]) {
                this.pendingTransaction.entries[index].accountCode = select.value;
            }
        });

        DataManager.addTransaction(this.pendingTransaction);
        alert('Transaksi berhasil disimpan!\nJurnal otomatis terbentuk.');
        
        // Reset form and UI
        document.getElementById('transaction-form').reset();
        document.getElementById('trx-date').valueAsDate = new Date();
        document.getElementById('journal-preview').style.display = 'none';
        this.pendingTransaction = null;
        
        // Refresh Current Month Journal Table IMMEDIATELY
        this.renderJournalCurrentMonth();
        
        // Refresh Reports if visible
        // (Optional: Implement if reports section is active)
    },

    // Render Journal Table
    renderJournal() {
        // Render Year Filter Options
        const yearFilter = document.getElementById('journal-year-filter');
        const transactions = DataManager.getPostedTransactions();
        
        if (yearFilter) {
            // Logic Update: Always show range of years (Current - 5 to Current + 1) + any transaction years
            const transactionYears = transactions.map(t => new Date(t.date).getFullYear());
            const currentYear = new Date().getFullYear();
            
            // Default range: 5 years back from current
            const defaultYears = [];
            for (let y = currentYear; y >= currentYear - 5; y--) {
                defaultYears.push(y);
            }

            // Merge and Unique
            const years = [...new Set([...transactionYears, ...defaultYears])];
            years.sort((a, b) => b - a); // Descending

            // Save current selection or default to first (latest) year
            const currentVal = yearFilter.value;

            yearFilter.innerHTML = '<option value="">Semua Tahun</option>';
            years.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearFilter.appendChild(option);
            });
            
            // Restore selection if still valid, otherwise select latest year if exists
            if (currentVal && years.includes(parseInt(currentVal))) {
                yearFilter.value = currentVal;
            } else if (!currentVal && years.length > 0) {
                 // Default to latest year ONLY if no selection was made (first load)
                 // But wait, if user explicitly selected "Semua Tahun" (value=""), we should keep it.
                 // Actually, on first load value is "", so we might want to default to current year?
                 // Let's stick to: if value is empty, default to latest year.
                 yearFilter.value = years[0];
            }

            // Event Listener for Filter
            yearFilter.onchange = () => this.renderYearlyJournal();
        }

        const tbody = document.getElementById('journal-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        // Filter Transactions based on Selection
        let filteredTransactions = transactions;
        if (yearFilter && yearFilter.value) {
            const selectedYear = parseInt(yearFilter.value);
            filteredTransactions = transactions.filter(t => new Date(t.date).getFullYear() === selectedYear);
        }

        // Sort by date desc
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        const entries = Accounting.getJournalEntries(filteredTransactions);

        if (entries.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Belum ada data transaksi yang di-closing untuk periode ini.</td></tr>';
            // Also render closing year select if needed, though usually for all years
             this.renderClosingYearSelect();
            return;
        }

        entries.forEach(entry => {
            const tr = document.createElement('tr');
             // Highlight Closing Entries
            if (entry.description.includes('[Closing Tahunan]')) {
                tr.classList.add('table-warning');
            }
            
            tr.innerHTML = `
                <td>${entry.date}</td>
                <td>${entry.description}</td>
                <td>${entry.accountCode} - ${entry.accountName}</td>
                <td class="amount-col">${entry.debit > 0 ? this.formatCurrency(entry.debit) : '-'}</td>
                <td class="amount-col">${entry.credit > 0 ? this.formatCurrency(entry.credit) : '-'}</td>
            `;
            tbody.appendChild(tr);
        });
        
        // Render Year Select for Closing (Keep this updated too)
        this.renderClosingYearSelect();
    },

    // Render Current Month Journal (Unclosed)
    renderJournalCurrentMonth() {
        const tbody = document.getElementById('current-journal-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        // Show ONLY transactions that are NOT in closed months
        const transactions = DataManager.getCurrentMonthTransactions();
        
        // If DataManager.getCurrentMonthTransactions() already filters correctly, we can use it.
        // But to be safe and consistent with "unposted" definition:
        // Unposted = Transactions where the month is NOT in closedMonths list.
        
        const entries = Accounting.getJournalEntries(transactions);

        if (entries.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Tidak ada transaksi baru bulan ini (atau sudah di-closing).</td></tr>';
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
        // Hanya bulan yang sudah di-closing masuk laporan
        // const transactions = DataManager.getPostedTransactions(); // Old Logic

        // NEW LOGIC: Use ALL transactions (Posted + Current Unposted) for Trial Balance monitoring
        // BUT for Financial Statements (Income Statement/Balance Sheet), usually we want valid periods.
        // However, for "Realtime Monitoring", users usually want to see everything.
        // Let's use ALL transactions for now as it's a "System Akuntansi" usually providing realtime view.
        const allTransactions = DataManager.getData().transactions;
        const postedTransactions = DataManager.getPostedTransactions();
        
        // 1. Determine Report Period (Default to Current System Month)
        const currentMonthKey = DataManager.getCurrentMonthKey();

        // 2. Trial Balance (Detailed: Start, Movement, End)
        // We use ALL transactions to show current movement (even if not closed)
        const tbData = Accounting.getDetailedTrialBalance(allTransactions, currentMonthKey);
        
        const tbBody = document.getElementById('trial-balance-body');
        tbBody.innerHTML = '';
        
        let totalStartDebit = 0, totalStartCredit = 0;
        let totalMoveDebit = 0, totalMoveCredit = 0;
        let totalEndDebit = 0, totalEndCredit = 0;

        tbData.forEach(item => {
            totalStartDebit += item.viewStartDebit;
            totalStartCredit += item.viewStartCredit;
            totalMoveDebit += item.movementDebit;
            totalMoveCredit += item.movementCredit;
            totalEndDebit += item.viewEndDebit;
            totalEndCredit += item.viewEndCredit;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.code} - ${item.name}</td>
                <td class="amount-col text-secondary">${item.viewStartDebit > 0 ? this.formatCurrency(item.viewStartDebit) : '-'}</td>
                <td class="amount-col text-secondary">${item.viewStartCredit > 0 ? this.formatCurrency(item.viewStartCredit) : '-'}</td>
                <td class="amount-col text-primary">${item.movementDebit > 0 ? this.formatCurrency(item.movementDebit) : '-'}</td>
                <td class="amount-col text-primary">${item.movementCredit > 0 ? this.formatCurrency(item.movementCredit) : '-'}</td>
                <td class="amount-col fw-bold">${item.viewEndDebit > 0 ? this.formatCurrency(item.viewEndDebit) : '-'}</td>
                <td class="amount-col fw-bold">${item.viewEndCredit > 0 ? this.formatCurrency(item.viewEndCredit) : '-'}</td>
            `;
            tbBody.appendChild(tr);
        });
        
        document.getElementById('tb-start-debit').textContent = this.formatCurrency(totalStartDebit);
        document.getElementById('tb-start-credit').textContent = this.formatCurrency(totalStartCredit);
        document.getElementById('tb-move-debit').textContent = this.formatCurrency(totalMoveDebit);
        document.getElementById('tb-move-credit').textContent = this.formatCurrency(totalMoveCredit);
        document.getElementById('tb-end-debit').textContent = this.formatCurrency(totalEndDebit);
        document.getElementById('tb-end-credit').textContent = this.formatCurrency(totalEndCredit);

        // 2. Income Statement (Laba Rugi)
        const isData = Accounting.getIncomeStatement(allTransactions, currentMonthKey);
        const isBody = document.getElementById('income-statement-body');
        
        if (isBody) {
            // Robust Clearing
            while (isBody.firstChild) {
                isBody.removeChild(isBody.firstChild);
            }
            
            // Helper Row Renderer
            const renderRow = (name, start, move, end, isBold = false, isHeader = false) => {
                const tr = document.createElement('tr');
                if (isHeader) {
                    tr.className = 'table-light fw-bold';
                    tr.innerHTML = `<td colspan="4" class="text-uppercase">${name}</td>`;
                } else {
                    const format = (val) => val !== 0 ? this.formatCurrency(val) : '-';
                    tr.className = isBold ? 'fw-bold table-light' : '';
                    tr.innerHTML = `
                        <td>${name}</td>
                        <td class="amount-col text-secondary">${format(start)}</td>
                        <td class="amount-col text-primary">${format(move)}</td>
                        <td class="amount-col fw-bold">${format(end)}</td>
                    `;
                }
                return tr;
            };

            // Revenues
            if (isData.details.revenues.length > 0) {
                isBody.appendChild(renderRow('PENDAPATAN', 0, 0, 0, true, true));
                isData.details.revenues.forEach(item => {
                    isBody.appendChild(renderRow(item.name, item.start, item.move, item.end));
                });
                isBody.appendChild(renderRow('Total Pendapatan', isData.totals.revenue.start, isData.totals.revenue.move, isData.totals.revenue.end, true));
            }

            // Spacer
            const spacer = document.createElement('tr');
            spacer.innerHTML = '<td colspan="4" style="height: 20px;"></td>';
            isBody.appendChild(spacer);

            // Expenses
            if (isData.details.expenses.length > 0) {
                isBody.appendChild(renderRow('BEBAN', 0, 0, 0, true, true));
                isData.details.expenses.forEach(item => {
                    isBody.appendChild(renderRow(item.name, item.start, item.move, item.end));
                });
                isBody.appendChild(renderRow('Total Beban', isData.totals.expense.start, isData.totals.expense.move, isData.totals.expense.end, true));
            }

            // Net Income
            const spacer2 = document.createElement('tr');
            spacer2.innerHTML = '<td colspan="4" style="height: 20px;"></td>';
            isBody.appendChild(spacer2);
            
            const netTr = renderRow('LABA BERSIH (RUGI)', isData.netIncome.start, isData.netIncome.move, isData.netIncome.end, true);
            netTr.classList.add('table-success', 'border-top', 'border-3');
            isBody.appendChild(netTr);
        }


        // 3. Balance Sheet
        const bsData = Accounting.getBalanceSheet(allTransactions, currentMonthKey, isData.netIncome);
        const bsBody = document.getElementById('balance-sheet-body');
        bsBody.innerHTML = '';

        // Assets
        bsBody.innerHTML += `<tr class="table-primary"><td colspan="4"><strong>ASET</strong></td></tr>`;
        bsData.assets.forEach(item => {
            bsBody.innerHTML += `<tr>
                <td>${item.name}</td>
                <td class="amount-col text-secondary">${item.start !== 0 ? this.formatCurrency(item.start) : '-'}</td>
                <td class="amount-col text-primary">${item.move !== 0 ? this.formatCurrency(item.move) : '-'}</td>
                <td class="amount-col fw-bold">${item.end !== 0 ? this.formatCurrency(item.end) : '-'}</td>
            </tr>`;
        });
        bsBody.innerHTML += `<tr class="fw-bold table-active">
            <td>TOTAL ASET</td>
            <td class="amount-col">${this.formatCurrency(bsData.totals.assets.start)}</td>
            <td class="amount-col">${this.formatCurrency(bsData.totals.assets.move)}</td>
            <td class="amount-col">${this.formatCurrency(bsData.totals.assets.end)}</td>
        </tr>`;

        // Liabilities
        bsBody.innerHTML += `<tr class="table-warning"><td colspan="4"><strong>KEWAJIBAN</strong></td></tr>`;
        bsData.liabilities.forEach(item => {
            bsBody.innerHTML += `<tr>
                <td>${item.name}</td>
                <td class="amount-col text-secondary">${item.start !== 0 ? this.formatCurrency(item.start) : '-'}</td>
                <td class="amount-col text-primary">${item.move !== 0 ? this.formatCurrency(item.move) : '-'}</td>
                <td class="amount-col fw-bold">${item.end !== 0 ? this.formatCurrency(item.end) : '-'}</td>
            </tr>`;
        });
        bsBody.innerHTML += `<tr class="fw-bold">
            <td>Total Kewajiban</td>
            <td class="amount-col">${this.formatCurrency(bsData.totals.liabilities.start)}</td>
            <td class="amount-col">${this.formatCurrency(bsData.totals.liabilities.move)}</td>
            <td class="amount-col">${this.formatCurrency(bsData.totals.liabilities.end)}</td>
        </tr>`;

        // Equity
        bsBody.innerHTML += `<tr class="table-success"><td colspan="4"><strong>EKUITAS</strong></td></tr>`;
        bsData.equity.forEach(item => {
            bsBody.innerHTML += `<tr>
                <td>${item.name}</td>
                <td class="amount-col text-secondary">${item.start !== 0 ? this.formatCurrency(item.start) : '-'}</td>
                <td class="amount-col text-primary">${item.move !== 0 ? this.formatCurrency(item.move) : '-'}</td>
                <td class="amount-col fw-bold">${item.end !== 0 ? this.formatCurrency(item.end) : '-'}</td>
            </tr>`;
        });
        bsBody.innerHTML += `<tr class="fw-bold">
            <td>Total Ekuitas</td>
            <td class="amount-col">${this.formatCurrency(bsData.totals.equity.start)}</td>
            <td class="amount-col">${this.formatCurrency(bsData.totals.equity.move)}</td>
            <td class="amount-col">${this.formatCurrency(bsData.totals.equity.end)}</td>
        </tr>`;

        // Liabilities + Equity
        bsBody.innerHTML += `<tr class="fw-bold table-active">
            <td>TOTAL KEWAJIBAN & EKUITAS</td>
            <td class="amount-col">${this.formatCurrency(bsData.totals.liabilities.start + bsData.totals.equity.start)}</td>
            <td class="amount-col">${this.formatCurrency(bsData.totals.liabilities.move + bsData.totals.equity.move)}</td>
            <td class="amount-col">${this.formatCurrency(bsData.totals.liabilities.end + bsData.totals.equity.end)}</td>
        </tr>`;
    },

    // Render Transaction Report
    renderTransactionReport() {
        const startDateInput = document.getElementById('report-start-date');
        const endDateInput = document.getElementById('report-end-date');
        const tbody = document.getElementById('transaction-report-body');
        
        // Initial Load Handling
        if (!startDateInput.value || !endDateInput.value) {
             const now = new Date();
             // First day of current month
             const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
             // Last day of current month
             const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
             
             // Format YYYY-MM-DD manually to avoid timezone issues
             const toLocDate = (d) => {
                 const year = d.getFullYear();
                 const month = String(d.getMonth() + 1).padStart(2, '0');
                 const day = String(d.getDate()).padStart(2, '0');
                 return `${year}-${month}-${day}`;
             };
             
             if (!startDateInput.value) startDateInput.value = toLocDate(firstDay);
             if (!endDateInput.value) endDateInput.value = toLocDate(lastDay);
        }

        const start = startDateInput.value;
        const end = endDateInput.value;

        const transactions = DataManager.getData().transactions;
        
        // Filter by Date Range (Inclusive)
        const filteredTransactions = transactions.filter(t => {
            return t.date >= start && t.date <= end;
        });
        
        // Sort by date desc
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Use Transactions Directly (not Journal Entries)
        tbody.innerHTML = '';
        
        let totalAmount = 0;

        if (filteredTransactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center">Tidak ada transaksi pada periode ini.</td></tr>';
        } else {
            filteredTransactions.forEach(trx => {
                // Calculate Transaction Amount (Sum of Debits)
                // Assuming standard balanced transaction, sum of debits = sum of credits = transaction amount
                const trxAmount = trx.entries
                    .filter(e => e.type === 'debit')
                    .reduce((sum, e) => sum + e.amount, 0);

                totalAmount += trxAmount;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${trx.date}</td>
                    <td>${trx.description}</td>
                    <td class="amount-col">${this.formatCurrency(trxAmount)}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-danger py-0" onclick="UI.handleReverseTransaction('${trx.id}')" title="Buat Jurnal Balik">
                            <i class="bi bi-arrow-counterclockwise"></i> Balik
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
        
        const tdTotal = document.getElementById('report-total-amount');
        if (tdTotal) tdTotal.textContent = this.formatCurrency(totalAmount);
    },

    handleReverseTransaction(id) {
        if (!confirm('Apakah Anda yakin ingin membalik transaksi ini? \n(Akan dibuat jurnal pembalik baru)')) {
            return;
        }

        const data = DataManager.getData();
        const originalTrx = data.transactions.find(t => t.id === id);

        if (!originalTrx) {
            alert('Transaksi tidak ditemukan!');
            return;
        }

        // Create Reversal Transaction
        const reversalEntries = originalTrx.entries.map(e => ({
            accountCode: e.accountCode,
            type: e.type === 'debit' ? 'credit' : 'debit', // Swap type
            amount: e.amount
        }));

        // Format Today's Date YYYY-MM-DD
        const today = new Date();
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const d = String(today.getDate()).padStart(2, '0');

        const reversalTrx = {
            id: `rev-${Date.now()}`,
            date: `${y}-${m}-${d}`,
            description: `[Jurnal Balik] ${originalTrx.description}`,
            entries: reversalEntries
        };

        DataManager.addTransaction(reversalTrx);
        
        // Refresh Report
        this.renderTransactionReport();
        
        alert('Jurnal balik berhasil dibuat!');
    },

    renderGeneralLedger() {
        const select = document.getElementById('gl-account-select');
        const tbody = document.getElementById('gl-table-body');
        const toggleUnposted = document.getElementById('gl-show-unposted');
        
        if (!select || !tbody) return;
        
        // Determine Data Source
        const showUnposted = toggleUnposted ? toggleUnposted.checked : false;
        const transactions = showUnposted ? DataManager.getData().transactions : DataManager.getPostedTransactions();
        
        const ledger = Accounting.getGeneralLedger(transactions);
        const hasOptions = select.dataset.loaded === '1';
        
        if (!hasOptions) {
            select.innerHTML = '<option value="">Semua Akun</option>';
            ledger.forEach(acc => {
                const opt = document.createElement('option');
                opt.value = acc.code;
                opt.textContent = `${acc.code} - ${acc.name}`;
                select.appendChild(opt);
            });
            select.dataset.loaded = '1';
            
            // Event Listeners
            select.addEventListener('change', () => this.renderGeneralLedger());
            if (toggleUnposted) {
                toggleUnposted.addEventListener('change', () => this.renderGeneralLedger());
            }
        }
        
        const selected = select.value || '';
        tbody.innerHTML = '';
        
        ledger.forEach(acc => {
            if (selected && acc.code !== selected) return;
            
            acc.entries.forEach(e => {
                const tr = document.createElement('tr');
                const bal = e.balance;
                const balStr = bal >= 0 ? this.formatCurrency(bal) : '-' + this.formatCurrency(Math.abs(bal));
                
                // Highlight unposted rows if mixed
                // We don't have isPosted flag on 'e' directly from Accounting.getGeneralLedger logic easily 
                // unless we pass it through. 
                // But for now, just render.
                
                tr.innerHTML = `
                    <td>${e.date}</td>
                    <td>${e.description}</td>
                    <td>${acc.code} - ${acc.name}</td>
                    <td class="text-end">${e.debit > 0 ? this.formatCurrency(e.debit) : '-'}</td>
                    <td class="text-end">${e.credit > 0 ? this.formatCurrency(e.credit) : '-'}</td>
                    <td class="text-end fw-bold">${balStr}</td>
                `;
                tbody.appendChild(tr);
            });
        });
        
        if (!tbody.hasChildNodes()) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Data tidak tersedia</td></tr>';
        }
    },

    // Dashboard Analytics
    renderDashboardAnalytics() {
        const container = document.getElementById('dashboard-analytics');
        if (!container) return;

        const transactions = DataManager.getData().transactions;
        // Use current year dynamically
        const year = new Date().getFullYear(); 


        // 1. Prepare Data for Charts (Monthly Aggregation)
        const monthlyData = Array(12).fill(0).map(() => ({ revenue: 0, expense: 0, profit: 0 }));
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
                    }
                    if (entry.type === 'credit') {
                        monthlyData[monthIndex].expense -= entry.amount;
                    }
                }
            });
        });

        // Calculate Net Profit per Month
        monthlyData.forEach(m => m.profit = m.revenue - m.expense);

        // --- RENDER CARDS (Year-to-Date / Total 2025) ---
        // Calculate totals for the entire year
        let totalRevenue = 0;
        let totalExpense = 0;
        let totalProfit = 0;
        
        monthlyData.forEach(m => {
            totalRevenue += m.revenue;
            totalExpense += m.expense;
            totalProfit += m.profit;
        });

        // Count total transactions for the year
        const totalTrxCount = transactions.filter(t => {
            const d = new Date(t.date);
            return d.getFullYear() === year;
        }).length;

        container.innerHTML = `
            <div class="col-md-3 mb-3">
                <div class="card text-white bg-primary h-100">
                    <div class="card-body">
                        <h5 class="card-title"><i class="bi bi-wallet2"></i> Pendapatan</h5>
                        <p class="card-text fs-4 fw-bold">${this.formatCurrency(totalRevenue)}</p>
                        <small>Total Tahun ${year}</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card text-white bg-danger h-100">
                    <div class="card-body">
                        <h5 class="card-title"><i class="bi bi-cart"></i> Beban</h5>
                        <p class="card-text fs-4 fw-bold">${this.formatCurrency(totalExpense)}</p>
                        <small>Total Tahun ${year}</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card text-white bg-success h-100">
                    <div class="card-body">
                        <h5 class="card-title"><i class="bi bi-graph-up-arrow"></i> Laba Bersih</h5>
                        <p class="card-text fs-4 fw-bold">${this.formatCurrency(totalProfit)}</p>
                        <small>Total Tahun ${year}</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-3">
                <div class="card text-white bg-info h-100">
                    <div class="card-body">
                        <h5 class="card-title"><i class="bi bi-list-check"></i> Transaksi</h5>
                        <p class="card-text fs-4 fw-bold">${totalTrxCount}</p>
                        <small>Total Transaksi ${year}</small>
                    </div>
                </div>
            </div>
        `;

        // --- RENDER CHARTS ---
        this.renderCharts(monthlyData, revenueComposition);
    },

    getMonthName(index) {
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return months[index];
    },

    renderYearlyJournal() {
        // Render Year Filter Options
        const yearFilter = document.getElementById('journal-year-filter');
        const transactions = DataManager.getPostedTransactions();
        
        if (yearFilter) {
            // Logic Update: Always show range of years (Current - 5 to Current + 1) + any transaction years
            const transactionYears = transactions.map(t => new Date(t.date).getFullYear());
            const currentYear = new Date().getFullYear();
            
            // Default range: 5 years back from current
            const defaultYears = [];
            for (let y = currentYear; y >= currentYear - 5; y--) {
                defaultYears.push(y);
            }

            // Merge and Unique
            const years = [...new Set([...transactionYears, ...defaultYears])];
            years.sort((a, b) => b - a); // Descending

            // Save current selection or default to first (latest) year
            const currentVal = yearFilter.value;

            yearFilter.innerHTML = '<option value="">Semua Tahun</option>';
            years.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearFilter.appendChild(option);
            });
            
            // Restore selection if still valid, otherwise select latest year if exists
            if (currentVal && years.includes(parseInt(currentVal))) {
                yearFilter.value = currentVal;
            } else if (!currentVal && years.length > 0) {
                 // Default to latest year ONLY if no selection was made (first load)
                 yearFilter.value = years[0];
            }

            // Event Listener for Filter
            yearFilter.onchange = () => this.renderYearlyJournal();
        }

        // Fix: Target the correct ID from index.html
        const tbodyEl = document.getElementById('journal-table-body');
        if (!tbodyEl) return;
        
        // Filter Transactions based on Selection
        let filteredTransactions = transactions;
        if (yearFilter && yearFilter.value) {
            const selectedYear = parseInt(yearFilter.value);
            filteredTransactions = transactions.filter(t => new Date(t.date).getFullYear() === selectedYear);
        }
        
        // Sort by date desc
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        const entries = Accounting.getJournalEntries(filteredTransactions);
        
        tbodyEl.innerHTML = '';
        
        if (entries.length === 0) {
            tbodyEl.innerHTML = '<tr><td colspan="5" class="text-center">Belum ada transaksi yang di-posting untuk periode ini.</td></tr>';
        } else {
            entries.forEach(entry => {
                const tr = document.createElement('tr');
                // Highlight Closing Entries
                if (entry.description.includes('[Closing Tahunan]')) {
                    tr.classList.add('table-warning');
                }
                
                tr.innerHTML = `
                    <td>${entry.date}</td>
                    <td>${entry.description}</td>
                    <td>${entry.accountCode} - ${entry.accountName}</td>
                    <td class="amount-col">${entry.debit > 0 ? this.formatCurrency(entry.debit) : '-'}</td>
                    <td class="amount-col">${entry.credit > 0 ? this.formatCurrency(entry.credit) : '-'}</td>
                `;
                tbodyEl.appendChild(tr);
            });
        }

        // Render Year Select for Closing
        this.renderClosingYearSelect();
    },

    renderClosingPage() {
        this.renderClosingYearSelect();
    },

    renderClosingYearSelect() {
        const select = document.getElementById('closing-year-select');
        if (!select) return;

        // Dynamic Year Detection from Data
        const transactions = DataManager.getData().transactions || [];
        const years = new Set();
        
        // Always include current year
        years.add(new Date().getFullYear());

        transactions.forEach(t => {
            if (t.date) {
                const y = new Date(t.date).getFullYear();
                if (!isNaN(y)) years.add(y);
            }
        });

        // Convert to array and sort descending
        const sortedYears = Array.from(years).sort((a, b) => b - a);
        
        // Clear existing options
        select.innerHTML = '';
        
        sortedYears.forEach(y => {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = `Tahun ${y}`;
            select.appendChild(opt);
        });

        // Select first option by default
        if (sortedYears.length > 0) {
            select.value = sortedYears[0];
        }
    },

    handleYearEndClosing() {
        const select = document.getElementById('closing-year-select');
        if (!select) return;
        
        const year = parseInt(select.value);
        if (!year) return;

        // Relaxed Validation: Warning instead of hard block
        if (!confirm(`KONFIRMASI TUTUP BUKU TAHUN ${year}\n\nApakah Anda yakin ingin melakukan Tutup Buku sekarang?\n\nSistem akan membuat Jurnal Penutup untuk mengenolkan Pendapatan & Beban.\nSebaiknya pastikan semua transaksi tahun ${year} sudah tercatat.`)) {
            return;
        }

        const result = Accounting.generateYearEndClosing(year);
        
        if (result.success) {
            alert(`Tutup Buku Tahun ${year} BERHASIL!\n\nLaba/Rugi: ${this.formatCurrency(result.netIncome)}\nJurnal penutup telah dibuat.`);
            // Refresh UI
            this.renderYearlyJournal();
            this.renderDashboardAnalytics();
            this.renderGeneralLedger();
        } else {
            alert(`Gagal Tutup Buku: ${result.message}`);
        }
    },

    renderCharts(monthlyData, revenueComposition) {
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
    },

    // --- SETTINGS PAGE LOGIC ---

    renderSettings() {
        this.renderCompanyProfile();
        this.renderSettingsTrxTypes();
        
        // Setup Form Listener if not already attached
        const profileForm = document.getElementById('company-profile-form');
        if (profileForm && !profileForm.dataset.listening) {
            profileForm.addEventListener('submit', (e) => this.handleProfileSave(e));
            profileForm.dataset.listening = 'true';
        }
    },

    renderCompanyProfile() {
        const profile = DataManager.getCompanyProfile();
        if (profile) {
            document.getElementById('setting-company-name').value = profile.name || '';
            document.getElementById('setting-company-address').value = profile.address || '';
            document.getElementById('setting-company-phone').value = profile.phone || '';
            document.getElementById('setting-company-email').value = profile.email || '';
        }
    },

    handleProfileSave(e) {
        e.preventDefault();
        const profile = {
            name: document.getElementById('setting-company-name').value,
            address: document.getElementById('setting-company-address').value,
            phone: document.getElementById('setting-company-phone').value,
            email: document.getElementById('setting-company-email').value
        };
        DataManager.updateCompanyProfile(profile);
        alert('Profil perusahaan berhasil disimpan!');
    },

    renderSettingsTrxTypes() {
        const tbody = document.getElementById('settings-trx-types-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        const types = DataManager.getTransactionTypes();
        
        types.forEach(type => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <strong>${type.name}</strong><br>
                    <small class="text-muted">${type.desc_template}</small>
                </td>
                <td><span class="badge bg-primary">${type.debit}</span></td>
                <td><span class="badge bg-success">${type.credit}</span></td>
                <td class="text-center">
                    <button class="btn btn-sm btn-warning me-1" onclick="UI.editTransactionType('${type.id}')"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="UI.deleteTransactionType('${type.id}')"><i class="bi bi-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    showAddTransactionTypeModal() {
        document.getElementById('trx-type-form').reset();
        document.getElementById('trx-type-id').value = '';
        document.getElementById('trxTypeModalLabel').textContent = 'Tambah Jenis Transaksi';
        
        // Populate Selects
        const debitSelect = document.getElementById('trx-type-debit');
        const creditSelect = document.getElementById('trx-type-credit');
        this.renderAccountOptions(debitSelect);
        this.renderAccountOptions(creditSelect);
        
        const modal = new bootstrap.Modal(document.getElementById('trxTypeModal'));
        modal.show();
    },

    editTransactionType(id) {
        const type = DataManager.getTransactionTypes().find(t => t.id === id);
        if (!type) return;

        document.getElementById('trx-type-id').value = type.id;
        document.getElementById('trx-type-name').value = type.name;
        document.getElementById('trx-type-desc').value = type.desc_template;
        document.getElementById('trxTypeModalLabel').textContent = 'Edit Jenis Transaksi';
        
        const debitSelect = document.getElementById('trx-type-debit');
        const creditSelect = document.getElementById('trx-type-credit');
        this.renderAccountOptions(debitSelect);
        this.renderAccountOptions(creditSelect);
        
        debitSelect.value = type.debit;
        creditSelect.value = type.credit;
        
        const modal = new bootstrap.Modal(document.getElementById('trxTypeModal'));
        modal.show();
    },

    saveTransactionType() {
        const id = document.getElementById('trx-type-id').value;
        const name = document.getElementById('trx-type-name').value;
        const debit = document.getElementById('trx-type-debit').value;
        const credit = document.getElementById('trx-type-credit').value;
        const desc = document.getElementById('trx-type-desc').value;
        
        if (!name || !debit || !credit) {
            alert('Mohon lengkapi data wajib!');
            return;
        }

        const typeData = {
            id: id || `CUST_${Date.now()}`,
            name,
            debit,
            credit,
            desc_template: desc
        };

        if (id) {
            DataManager.updateTransactionType(id, typeData);
        } else {
            DataManager.addTransactionType(typeData);
        }

        // Hide Modal
        const modalEl = document.getElementById('trxTypeModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();

        // Refresh UI
        this.renderSettingsTrxTypes();
        // Refresh Input Form Dropdown if element exists
        const trxTypeSelect = document.getElementById('trx-type');
        if (trxTypeSelect) {
            this.renderTransactionTypes(trxTypeSelect);
        }
        
        alert('Jenis Transaksi berhasil disimpan!');
    },

    deleteTransactionType(id) {
        if (confirm('Yakin ingin menghapus jenis transaksi ini?')) {
            DataManager.deleteTransactionType(id);
            this.renderSettingsTrxTypes();
            const trxTypeSelect = document.getElementById('trx-type');
            if (trxTypeSelect) {
                this.renderTransactionTypes(trxTypeSelect);
            }
        }
    }
};
