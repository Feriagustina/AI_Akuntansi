/**
 * Accounting Logic Module
 * Handles Journal generation and Report calculations
 */

const Accounting = {
    // Generate Journal Entries from Transactions
    // In this model, transactions ALREADY contain the journal entries structure,
    // so we mostly just need to flatten them for the Journal View.
    getJournalEntries(transactions) {
        let journalEntries = [];
        
        // Sort transactions by date
        const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

        sortedTransactions.forEach(trx => {
            trx.entries.forEach(entry => {
                journalEntries.push({
                    date: trx.date,
                    description: trx.description,
                    accountCode: entry.accountCode,
                    accountName: DataManager.getAccountName(entry.accountCode),
                    debit: entry.type === 'debit' ? entry.amount : 0,
                    credit: entry.type === 'credit' ? entry.amount : 0
                });
            });
        });

        return journalEntries;
    },

    // Calculate Trial Balance
    getTrialBalance(transactions) {
        // ... (Keep existing for backward compatibility if needed, but we might replace it)
        // Actually, let's implement the detailed one separately or enhance this one.
        // For now, let's add a new method to avoid breaking other things unexpectedly.
        return this.getDetailedTrialBalance(transactions, DataManager.getCurrentMonthKey());
    },

    // Helper: Get Period Balances for all accounts
    getPeriodBalancesMap(allTransactions, currentMonthKey) {
        const balances = {};
        const accounts = DataManager.defaultAccounts;
        const closedMonths = DataManager.getData().closedMonths || [];

        // Initialize Balances
        accounts.forEach(acc => {
            balances[acc.code] = {
                code: acc.code,
                name: acc.name,
                type: acc.type,
                startDebit: 0,
                startCredit: 0,
                movementDebit: 0,
                movementCredit: 0,
                endDebit: 0,
                endCredit: 0
            };
        });

        allTransactions.forEach(trx => {
            const trxMonthKey = DataManager.getMonthKey(trx.date);
            
            // LOGIC REVISED for "Apapun tanggal transaksi... tetap disimpan dulu di jurnal bulanan":
            
            // Saldo Awal (Bulan Lalu) = POSTED Transactions
            // Pergerakan (Bulan Ini) = UNPOSTED Transactions
            
            // Note: If 'isPosted' is undefined, we fallback to 'closedMonths' check.
            let isPosted = trx.isPosted;
            if (typeof isPosted === 'undefined') {
                isPosted = closedMonths.includes(trxMonthKey);
            }
            
            const isOpening = isPosted === true;
            
            trx.entries.forEach(entry => {
                if (!balances[entry.accountCode]) return;

                const amount = Number(entry.amount);
                
                if (isOpening) {
                    if (entry.type === 'debit') balances[entry.accountCode].startDebit += amount;
                    else balances[entry.accountCode].startCredit += amount;
                } else {
                    if (entry.type === 'debit') balances[entry.accountCode].movementDebit += amount;
                    else balances[entry.accountCode].movementCredit += amount;
                }
            });
        });
        
        // Compute Ends
        Object.values(balances).forEach(b => {
            b.endDebit = b.startDebit + b.movementDebit;
            b.endCredit = b.startCredit + b.movementCredit;
        });

        return balances;
    },

    // --- YEAR END CLOSING LOGIC ---
    generateYearEndClosing(year) {
        // 1. Get All Posted Transactions for the Year
        // Closing entries should be based on FINAL state of the year.
        const allTransactions = DataManager.getPostedTransactions();
        
        // Filter by Year
        const yearlyTransactions = allTransactions.filter(t => {
            const d = new Date(t.date);
            return d.getFullYear() === year;
        });

        if (yearlyTransactions.length === 0) {
            return { success: false, message: 'Tidak ada transaksi terposting pada tahun ' + year };
        }

        // Check if already closed? 
        // We can check if there's already a closing transaction for this year.
        const alreadyClosed = yearlyTransactions.some(t => t.description.includes('[Closing Tahunan]'));
        if (alreadyClosed) {
            return { success: false, message: 'Tutup buku tahun ' + year + ' sudah pernah dilakukan.' };
        }

        // 2. Calculate Revenue and Expense Totals
        const accounts = DataManager.defaultAccounts;
        let revenueTotal = 0;
        let expenseTotal = 0;
        
        // We need detailed balance per account to close them
        const accountBalances = {};

        // Init Nominal Accounts
        accounts.forEach(acc => {
            if (acc.type === 'revenue' || acc.type === 'expense') {
                accountBalances[acc.code] = { code: acc.code, type: acc.type, balance: 0 };
            }
        });

        yearlyTransactions.forEach(trx => {
            trx.entries.forEach(e => {
                if (accountBalances[e.accountCode]) {
                    // Normal Balance:
                    // Revenue: Credit (+), Debit (-)
                    // Expense: Debit (+), Credit (-)
                    // But for closing, we just need net position.
                    // Let's use simple Debit/Credit sums first.
                    if (e.type === 'debit') accountBalances[e.accountCode].balance += e.amount;
                    else accountBalances[e.accountCode].balance -= e.amount;
                }
            });
        });

        // 3. Create Closing Entries
        // Revenue (Credit Balance) -> Debit to Close
        // Expense (Debit Balance) -> Credit to Close
        const closingEntries = [];
        let netIncome = 0; // Credit positive (Profit), Debit negative (Loss)

        Object.values(accountBalances).forEach(acc => {
            // acc.balance is (Debit - Credit)
            // Revenue: usually Negative (Credit > Debit)
            // Expense: usually Positive (Debit > Credit)
            
            const bal = acc.balance;
            if (bal === 0) return;

            // To Close: We need to do the OPPOSITE
            if (bal > 0) {
                // Net Debit Balance (Expense usually) -> Credit to Close
                closingEntries.push({
                    accountCode: acc.code,
                    type: 'credit',
                    amount: bal
                });
            } else {
                // Net Credit Balance (Revenue usually) -> Debit to Close
                closingEntries.push({
                    accountCode: acc.code,
                    type: 'debit',
                    amount: Math.abs(bal)
                });
            }
            
            // Accumulate Net Income (Revenue - Expense)
            // Revenue (Credit) adds to Equity, Expense (Debit) subtracts.
            // In our balance calc: Debit (+), Credit (-).
            // So NetIncome contribution is -bal.
            // Example: Revenue Credit 100 -> bal -100 -> contribution +100.
            // Example: Expense Debit 80 -> bal +80 -> contribution -80.
            netIncome += (-bal);
        });

        if (closingEntries.length === 0) {
            return { success: false, message: 'Saldo pendapatan dan beban nihil. Tidak ada yang perlu ditutup.' };
        }

        // 4. Close Net Income to Retained Earnings (303)
        // If Net Income > 0 (Profit): Credit 303
        // If Net Income < 0 (Loss): Debit 303
        
        if (netIncome !== 0) {
            const retainedEarningsCode = '303';
            if (netIncome > 0) {
                closingEntries.push({
                    accountCode: retainedEarningsCode,
                    type: 'credit',
                    amount: netIncome
                });
            } else {
                closingEntries.push({
                    accountCode: retainedEarningsCode,
                    type: 'debit',
                    amount: Math.abs(netIncome)
                });
            }
        }

        // 5. Create Transaction Object
        const closingTrx = {
            id: `close-${year}-${Date.now()}`,
            date: `${year}-12-31`,
            description: `[Closing Tahunan] Tutup Buku Tahun ${year}`,
            entries: closingEntries,
            isPosted: true, // Auto posted
            type: 'closing' // Special flag
        };

        // 6. Save
        DataManager.addTransaction(closingTrx);

        return { success: true, netIncome: netIncome };
    },

    getDetailedTrialBalance(allTransactions, currentMonthKey) {
        const balancesMap = this.getPeriodBalancesMap(allTransactions, currentMonthKey);
        
        const result = Object.values(balancesMap).map(b => {
            const netStart = b.startDebit - b.startCredit;
            b.viewStartDebit = netStart > 0 ? netStart : 0;
            b.viewStartCredit = netStart < 0 ? Math.abs(netStart) : 0;

            const netEnd = b.endDebit - b.endCredit;
            b.viewEndDebit = netEnd > 0 ? netEnd : 0;
            b.viewEndCredit = netEnd < 0 ? Math.abs(netEnd) : 0;
            
            return b;
        });

        return result.filter(b => 
            b.startDebit !== 0 || b.startCredit !== 0 || 
            b.movementDebit !== 0 || b.movementCredit !== 0
        );
    },

    // Calculate Income Statement (Laba Rugi) - Detailed
    getIncomeStatement(allTransactions, currentMonthKey) {
        // FILTER OUT CLOSING TRANSACTIONS for Income Statement
        // Because Income Statement should show performance BEFORE closing reset.
        const nonClosingTransactions = allTransactions.filter(t => t.type !== 'closing');
        
        // Use period balances
        const balancesMap = this.getPeriodBalancesMap(nonClosingTransactions, currentMonthKey);
        const details = {
            revenues: [],
            expenses: []
        };
        
        let totals = {
            revenue: { start: 0, move: 0, end: 0 },
            expense: { start: 0, move: 0, end: 0 }
        };

        Object.values(balancesMap).forEach(acc => {
            // Calculate Net Values for each period
            // Revenue (Credit Normal): Credit - Debit
            // Expense (Debit Normal): Debit - Credit
            
            const startVal = (acc.type === 'revenue') ? (acc.startCredit - acc.startDebit) : (acc.startDebit - acc.startCredit);
            const moveVal = (acc.type === 'revenue') ? (acc.movementCredit - acc.movementDebit) : (acc.movementDebit - acc.movementCredit);
            const endVal = (acc.type === 'revenue') ? (acc.endCredit - acc.endDebit) : (acc.endDebit - acc.endCredit);

            // Skip if no activity at all
            if (startVal === 0 && moveVal === 0 && endVal === 0) return;

            const item = { 
                name: acc.name, 
                start: startVal, 
                move: moveVal, 
                end: endVal 
            };

            if (acc.type === 'revenue') {
                details.revenues.push(item);
                totals.revenue.start += startVal;
                totals.revenue.move += moveVal;
                totals.revenue.end += endVal;
            } else if (acc.type === 'expense') {
                details.expenses.push(item);
                totals.expense.start += startVal;
                totals.expense.move += moveVal;
                totals.expense.end += endVal;
            }
        });

        return {
            details,
            totals,
            netIncome: {
                start: totals.revenue.start - totals.expense.start,
                move: totals.revenue.move - totals.expense.move,
                end: totals.revenue.end - totals.expense.end
            }
        };
    },

    // Calculate Balance Sheet (Neraca) - Detailed
    getBalanceSheet(allTransactions, currentMonthKey, netIncomeObj) {
        const balancesMap = this.getPeriodBalancesMap(allTransactions, currentMonthKey);
        
        const assets = [];
        const liabilities = [];
        const equity = [];
        
        let totals = {
            assets: { start: 0, move: 0, end: 0 },
            liabilities: { start: 0, move: 0, end: 0 },
            equity: { start: 0, move: 0, end: 0 }
        };

        Object.values(balancesMap).forEach(acc => {
            // Asset (Debit Normal)
            // Liability, Equity (Credit Normal)
            
            let startVal, moveVal, endVal;
            
            if (acc.type === 'asset') {
                startVal = acc.startDebit - acc.startCredit;
                moveVal = acc.movementDebit - acc.movementCredit;
                endVal = acc.endDebit - acc.endCredit;
            } else { // Liability & Equity
                startVal = acc.startCredit - acc.startDebit;
                moveVal = acc.movementCredit - acc.movementDebit;
                endVal = acc.endCredit - acc.endDebit;
            }

            if (startVal === 0 && moveVal === 0 && endVal === 0) return;

            const item = { 
                name: acc.name, 
                start: startVal, 
                move: moveVal, 
                end: endVal 
            };

            if (acc.type === 'asset') {
                assets.push(item);
                totals.assets.start += startVal;
                totals.assets.move += moveVal;
                totals.assets.end += endVal;
            } else if (acc.type === 'liability') {
                liabilities.push(item);
                totals.liabilities.start += startVal;
                totals.liabilities.move += moveVal;
                totals.liabilities.end += endVal;
            } else if (acc.type === 'equity') {
                equity.push(item);
                totals.equity.start += startVal;
                totals.equity.move += moveVal;
                totals.equity.end += endVal;
            }
        });

        // Add Net Income to Equity
        if (netIncomeObj) {
            equity.push({ 
                name: 'Laba/Rugi Periode Berjalan', 
                start: netIncomeObj.start, 
                move: netIncomeObj.move, 
                end: netIncomeObj.end 
            });
            totals.equity.start += netIncomeObj.start;
            totals.equity.move += netIncomeObj.move;
            totals.equity.end += netIncomeObj.end;
        }

        return {
            assets,
            liabilities,
            equity,
            totals
        };
    },

    // Helper: Get final balance per account (Legacy Support if needed)
    getAccountBalances(transactions) {
        const balances = {};
        DataManager.defaultAccounts.forEach(acc => {
            balances[acc.code] = { ...acc, debit: 0, credit: 0 };
        });

        transactions.forEach(trx => {
            trx.entries.forEach(entry => {
                if (balances[entry.accountCode]) {
                    if (entry.type === 'debit') balances[entry.accountCode].debit += Number(entry.amount);
                    else balances[entry.accountCode].credit += Number(entry.amount);
                }
            });
        });

        return Object.values(balances);
    },

    getGeneralLedger(transactions) {
        const map = {};
        DataManager.defaultAccounts.forEach(acc => {
            map[acc.code] = { code: acc.code, name: acc.name, type: acc.type, entries: [], balance: 0 };
        });
        const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
        sorted.forEach(trx => {
            trx.entries.forEach(e => {
                const acc = map[e.accountCode];
                if (!acc) return;
                const debit = e.type === 'debit' ? Number(e.amount) : 0;
                const credit = e.type === 'credit' ? Number(e.amount) : 0;
                let delta = 0;
                if (acc.type === 'asset' || acc.type === 'expense') {
                    delta = debit - credit;
                } else {
                    delta = credit - debit;
                }
                acc.balance += delta;
                acc.entries.push({
                    date: trx.date,
                    description: trx.description,
                    debit,
                    credit,
                    balance: acc.balance
                });
            });
        });
        return Object.values(map).filter(a => a.entries.length > 0);
    },

    getAccountType(code) {
        const acc = DataManager.defaultAccounts.find(a => a.code === code);
        return acc ? acc.type : 'unknown';
    }
};
