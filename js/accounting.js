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
        const balances = {};
        const accounts = DataManager.defaultAccounts;

        // Initialize balances
        accounts.forEach(acc => {
            balances[acc.code] = {
                code: acc.code,
                name: acc.name,
                debit: 0,
                credit: 0
            };
        });

        // Sum up
        transactions.forEach(trx => {
            trx.entries.forEach(entry => {
                if (!balances[entry.accountCode]) return; // Skip unknown accounts

                if (entry.type === 'debit') {
                    balances[entry.accountCode].debit += Number(entry.amount);
                } else {
                    balances[entry.accountCode].credit += Number(entry.amount);
                }
            });
        });

        return Object.values(balances).filter(b => b.debit > 0 || b.credit > 0);
    },

    // Calculate Income Statement (Laba Rugi)
    getIncomeStatement(transactions) {
        let revenue = 0;
        let expenses = 0;
        const details = {
            revenues: [],
            expenses: []
        };

        const balances = this.getAccountBalances(transactions);

        balances.forEach(acc => {
            const type = this.getAccountType(acc.code);
            // Normal balance for Revenue is Credit
            // Normal balance for Expense is Debit
            
            if (type === 'revenue') {
                const amount = acc.credit - acc.debit;
                if (amount !== 0) {
                    revenue += amount;
                    details.revenues.push({ name: acc.name, amount: amount });
                }
            } else if (type === 'expense') {
                const amount = acc.debit - acc.credit;
                if (amount !== 0) {
                    expenses += amount;
                    details.expenses.push({ name: acc.name, amount: amount });
                }
            }
        });

        return {
            revenue,
            expenses,
            netIncome: revenue - expenses,
            details
        };
    },

    // Calculate Balance Sheet (Neraca)
    getBalanceSheet(transactions, netIncome) {
        const assets = [];
        const liabilities = [];
        const equity = [];
        
        let totalAssets = 0;
        let totalLiabilities = 0;
        let totalEquity = 0;

        const balances = this.getAccountBalances(transactions);

        balances.forEach(acc => {
            const type = this.getAccountType(acc.code);
            
            if (type === 'asset') {
                const amount = acc.debit - acc.credit;
                if (amount !== 0) {
                    assets.push({ name: acc.name, amount: amount });
                    totalAssets += amount;
                }
            } else if (type === 'liability') {
                const amount = acc.credit - acc.debit;
                if (amount !== 0) {
                    liabilities.push({ name: acc.name, amount: amount });
                    totalLiabilities += amount;
                }
            } else if (type === 'equity') {
                let amount = acc.credit - acc.debit;
                // Special case for Prive (Drawings) - it's a contra equity account (normal debit)
                // But in our simple logic, we just take credit - debit.
                // If Prive has debit balance, it will be negative here, which is correct for addition to equity.
                // Wait, standard: Assets = Liabilities + Equity + (Revenue - Expenses)
                // Retained Earnings usually absorbs Net Income.
                
                if (amount !== 0) {
                    equity.push({ name: acc.name, amount: amount });
                    totalEquity += amount;
                }
            }
        });

        // Add Net Income to Equity section (usually Retained Earnings)
        equity.push({ name: 'Laba/Rugi Periode Berjalan', amount: netIncome });
        totalEquity += netIncome;

        return {
            assets,
            liabilities,
            equity,
            totalAssets,
            totalLiabilities,
            totalEquity,
            checkBalance: totalAssets - (totalLiabilities + totalEquity) // Should be 0
        };
    },

    // Helper: Get final balance per account
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

    getAccountType(code) {
        const acc = DataManager.defaultAccounts.find(a => a.code === code);
        return acc ? acc.type : 'unknown';
    }
};
