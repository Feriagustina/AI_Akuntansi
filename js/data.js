/**
 * Data Management Module
 * Handles localStorage operations and seed data
 */

const DataManager = {
    STORAGE_KEY: 'poc_accounting_data_v2',

    // Default Account Chart (CoA) for Demo
    defaultAccounts: [
        // Assets (Harta)
        { code: '101', name: 'Kas', type: 'asset' },
        { code: '102', name: 'Bank', type: 'asset' },
        { code: '103', name: 'Piutang Usaha', type: 'asset' },
        { code: '104', name: 'Perlengkapan', type: 'asset' },
        { code: '105', name: 'Sewa Dibayar Dimuka', type: 'asset' },
        { code: '106', name: 'Iklan Dibayar Dimuka', type: 'asset' },
        { code: '107', name: 'Asuransi Dibayar Dimuka', type: 'asset' },
        { code: '121', name: 'Peralatan Kantor', type: 'asset' },
        { code: '122', name: 'Akum. Peny. Peralatan', type: 'asset' }, // Contra Asset (handled as credit usually, or negative asset)
        { code: '131', name: 'Kendaraan', type: 'asset' },
        { code: '132', name: 'Akum. Peny. Kendaraan', type: 'asset' },
        { code: '141', name: 'Tanah & Bangunan', type: 'asset' },

        // Liabilities (Kewajiban)
        { code: '201', name: 'Utang Usaha', type: 'liability' },
        { code: '202', name: 'Utang Gaji', type: 'liability' },
        { code: '203', name: 'Utang Bank', type: 'liability' },
        { code: '204', name: 'Utang Pajak', type: 'liability' },
        { code: '205', name: 'Pendapatan Diterima Dimuka', type: 'liability' },
        
        // Equity (Modal)
        { code: '301', name: 'Modal Pemilik', type: 'equity' },
        { code: '302', name: 'Prive Pemilik', type: 'equity' },
        { code: '303', name: 'Laba Ditahan', type: 'equity' },
        
        // Revenue (Pendapatan)
        { code: '401', name: 'Pendapatan Jasa', type: 'revenue' },
        { code: '402', name: 'Pendapatan Penjualan', type: 'revenue' },
        { code: '403', name: 'Pendapatan Lain-lain', type: 'revenue' },
        { code: '404', name: 'Pendapatan Bunga', type: 'revenue' },
        { code: '405', name: 'Pendapatan Sewa', type: 'revenue' },
        { code: '406', name: 'Pendapatan Komisi', type: 'revenue' },
        
        // Expenses (Beban)
        { code: '501', name: 'Beban Gaji & Upah', type: 'expense' },
        { code: '502', name: 'Beban Sewa', type: 'expense' },
        { code: '503', name: 'Beban Listrik & Air', type: 'expense' },
        { code: '504', name: 'Beban Telepon & Internet', type: 'expense' },
        { code: '505', name: 'Beban Perlengkapan', type: 'expense' },
        { code: '506', name: 'Beban Iklan & Promosi', type: 'expense' },
        { code: '507', name: 'Beban Transportasi & Bensin', type: 'expense' },
        { code: '508', name: 'Beban Perbaikan & Pemeliharaan', type: 'expense' },
        { code: '509', name: 'Beban Konsumsi', type: 'expense' },
        { code: '510', name: 'Beban Asuransi', type: 'expense' },
        { code: '511', name: 'Beban Penyusutan Peralatan', type: 'expense' },
        { code: '512', name: 'Beban Penyusutan Kendaraan', type: 'expense' },
        { code: '513', name: 'Beban Bunga Bank', type: 'expense' },
        { code: '514', name: 'Beban Pajak', type: 'expense' },
        { code: '515', name: 'Beban Lain-lain', type: 'expense' }
    ],

    // Transaction Types Mapping (Templates)
    transactionTypes: [
        // --- KELOMPOK PEMASUKAN / PENDAPATAN ---
        { 
            id: 'IN_MODAL_CASH', 
            name: 'Pemasukan: Setoran Modal (Tunai)', 
            debit: '101', credit: '301', 
            desc_template: 'Setoran modal pemilik (Tunai)'
        },
        { 
            id: 'IN_MODAL_BANK', 
            name: 'Pemasukan: Setoran Modal (Transfer Bank)', 
            debit: '102', credit: '301', 
            desc_template: 'Setoran modal pemilik (Transfer)'
        },
        { 
            id: 'IN_REV_CASH', 
            name: 'Pemasukan: Pendapatan Jasa (Tunai)', 
            debit: '101', credit: '401', 
            desc_template: 'Terima pendapatan jasa (Tunai)'
        },
        { 
            id: 'IN_REV_BANK', 
            name: 'Pemasukan: Pendapatan Jasa (Transfer Bank)', 
            debit: '102', credit: '401', 
            desc_template: 'Terima pendapatan jasa (Transfer)'
        },
        { 
            id: 'IN_REV_CREDIT', 
            name: 'Pemasukan: Pendapatan Jasa (Kredit/Piutang)', 
            debit: '103', credit: '401', 
            desc_template: 'Faktur tagihan jasa (Belum lunas)'
        },
        { 
            id: 'IN_SALE_CASH', 
            name: 'Pemasukan: Penjualan Barang (Tunai)', 
            debit: '101', credit: '402', 
            desc_template: 'Penjualan barang dagang (Tunai)'
        },
        { 
            id: 'IN_RENT', 
            name: 'Pemasukan: Pendapatan Sewa', 
            debit: '101', credit: '405', 
            desc_template: 'Pendapatan sewa alat/tempat'
        },
        { 
            id: 'IN_COMMISSION', 
            name: 'Pemasukan: Pendapatan Komisi', 
            debit: '101', credit: '406', 
            desc_template: 'Pendapatan komisi perantara'
        },
        { 
            id: 'IN_REV_OTHER', 
            name: 'Pemasukan: Pendapatan Lain-lain', 
            debit: '101', credit: '403', 
            desc_template: 'Penerimaan pendapatan lain-lain (Limbah/Sewa/dll)'
        },
        { 
            id: 'IN_INTEREST', 
            name: 'Pemasukan: Pendapatan Bunga Bank', 
            debit: '102', credit: '404', 
            desc_template: 'Pendapatan bunga tabungan'
        },
        { 
            id: 'IN_LOAN', 
            name: 'Pemasukan: Pencairan Pinjaman Bank', 
            debit: '102', credit: '203', 
            desc_template: 'Pencairan pinjaman modal kerja'
        },
        { 
            id: 'IN_AR_PAYMENT_CASH', 
            name: 'Pemasukan: Pelunasan Piutang (Tunai)', 
            debit: '101', credit: '103', 
            desc_template: 'Terima pelunasan piutang pelanggan'
        },
        { 
            id: 'IN_AR_PAYMENT_BANK', 
            name: 'Pemasukan: Pelunasan Piutang (Transfer)', 
            debit: '102', credit: '103', 
            desc_template: 'Terima pelunasan piutang via transfer'
        },

        // --- KELOMPOK PENGELUARAN OPS (TUNAI/KAS) ---
        { 
            id: 'OUT_OPS_LISTRIK', 
            name: 'Pengeluaran: Bayar Listrik & Air', 
            debit: '503', credit: '101', 
            desc_template: 'Bayar tagihan listrik & air'
        },
        { 
            id: 'OUT_OPS_INTERNET', 
            name: 'Pengeluaran: Bayar Telepon & Internet', 
            debit: '504', credit: '101', 
            desc_template: 'Bayar tagihan internet/wifi'
        },
        { 
            id: 'OUT_OPS_BENSIN', 
            name: 'Pengeluaran: Bayar Bensin/Transport', 
            debit: '507', credit: '101', 
            desc_template: 'Uang bensin operasional'
        },
        { 
            id: 'OUT_OPS_KONSUMSI', 
            name: 'Pengeluaran: Bayar Konsumsi/Makan', 
            debit: '509', credit: '101', 
            desc_template: 'Biaya konsumsi rapat/tamu'
        },
        { 
            id: 'OUT_OPS_MAINTENANCE', 
            name: 'Pengeluaran: Biaya Perbaikan/Service', 
            debit: '508', credit: '101', 
            desc_template: 'Biaya service peralatan'
        },
        { 
            id: 'OUT_OPS_IKLAN', 
            name: 'Pengeluaran: Biaya Iklan/Promosi', 
            debit: '506', credit: '101', 
            desc_template: 'Biaya cetak brosur/iklan sosmed'
        },
        { 
            id: 'OUT_OPS_OTHER', 
            name: 'Pengeluaran: Biaya Lain-lain', 
            debit: '515', credit: '101', 
            desc_template: 'Biaya operasional/administrasi lain-lain'
        },

        // --- KELOMPOK PENGELUARAN BESAR / TRANSFER ---
        { 
            id: 'OUT_PAY_GAJI', 
            name: 'Pengeluaran: Bayar Gaji Karyawan', 
            debit: '501', credit: '102', // Asumsi transfer
            desc_template: 'Pembayaran gaji karyawan periode ini'
        },
        { 
            id: 'OUT_PAY_SEWA', 
            name: 'Pengeluaran: Bayar Sewa Kantor', 
            debit: '502', credit: '102', 
            desc_template: 'Bayar sewa kantor tahunan/bulanan'
        },
        { 
            id: 'OUT_PAY_TAX', 
            name: 'Pengeluaran: Bayar Pajak', 
            debit: '514', credit: '102', 
            desc_template: 'Setoran pajak masa'
        },

        // --- KELOMPOK PEMBELIAN ASET & PERLENGKAPAN ---
        { 
            id: 'BUY_SUPPLIES_CASH', 
            name: 'Beli: Perlengkapan (Tunai)', 
            debit: '104', credit: '101', 
            desc_template: 'Beli ATK/Perlengkapan habis pakai'
        },
        { 
            id: 'BUY_ASSET_CASH', 
            name: 'Beli: Peralatan Kantor (Tunai)', 
            debit: '121', credit: '101', 
            desc_template: 'Beli laptop/printer/meja'
        },
        { 
            id: 'BUY_ASSET_CREDIT', 
            name: 'Beli: Peralatan Kantor (Kredit/Utang)', 
            debit: '121', credit: '201', 
            desc_template: 'Beli aset secara kredit'
        },
        
        // --- KELOMPOK UTANG & PRIVE ---
        { 
            id: 'PAY_DEBT_CASH', 
            name: 'Bayar Utang Usaha (Tunai)', 
            debit: '201', credit: '101', 
            desc_template: 'Cicilan/Pelunasan utang supplier'
        },
        { 
            id: 'PAY_DEBT_BANK', 
            name: 'Bayar Utang Usaha (Transfer)', 
            debit: '201', credit: '102', 
            desc_template: 'Cicilan/Pelunasan utang via bank'
        },
        { 
            id: 'PAY_BANK_LOAN', 
            name: 'Bayar Cicilan Utang Bank (Pokok)', 
            debit: '203', credit: '102', 
            desc_template: 'Angsuran pokok pinjaman bank'
        },
        { 
            id: 'PAY_BANK_INTEREST', 
            name: 'Bayar Bunga Pinjaman Bank', 
            debit: '513', credit: '102', 
            desc_template: 'Bayar bunga pinjaman'
        },
        { 
            id: 'OUT_PRIVE', 
            name: 'Prive: Pemilik Ambil Uang', 
            debit: '302', credit: '101', 
            desc_template: 'Pengambilan pribadi pemilik'
        },

        // --- PENYESUAIAN (ADVANCED) ---
        { 
            id: 'ADJ_DEPR_EQUIP', 
            name: 'Penyesuaian: Penyusutan Peralatan', 
            debit: '511', credit: '122', 
            desc_template: 'Beban penyusutan peralatan bulan ini'
        },
        { 
            id: 'ADJ_DEPR_VEHICLE', 
            name: 'Penyesuaian: Penyusutan Kendaraan', 
            debit: '512', credit: '132', 
            desc_template: 'Beban penyusutan kendaraan bulan ini'
        }
    ],

    // Demo Data Generator for 2025
    generateDummyData2025() {
        const transactions = [];
        const year = 2025;
        
        // 1. Initial Capital (Jan 1)
        transactions.push({
            id: 'trx-init-capital',
            date: `${year}-01-01`,
            description: 'Setoran Modal Awal Tahun',
            entries: [
                { accountCode: '102', type: 'debit', amount: 1000000000 }, // Bank 1M
                { accountCode: '301', type: 'credit', amount: 1000000000 } // Modal
            ]
        });

        // 2. Buy Assets (Jan 2)
        transactions.push({
            id: 'trx-init-asset-1',
            date: `${year}-01-02`,
            description: 'Beli Kendaraan Operasional',
            entries: [
                { accountCode: '131', type: 'debit', amount: 250000000 },
                { accountCode: '102', type: 'credit', amount: 250000000 }
            ]
        });
        transactions.push({
            id: 'trx-init-asset-2',
            date: `${year}-01-03`,
            description: 'Beli Laptop & Furniture Kantor',
            entries: [
                { accountCode: '121', type: 'debit', amount: 50000000 },
                { accountCode: '102', type: 'credit', amount: 50000000 }
            ]
        });

        // Monthly Routine Generator
        for (let month = 0; month < 12; month++) {
            const m = String(month + 1).padStart(2, '0');
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const randomDay = () => String(Math.floor(Math.random() * (daysInMonth - 1)) + 1).padStart(2, '0');

            // --- REVENUE STREAM DIVERSIFICATION ---
            
            // 1. Service Revenue (Jasa) - Frequent (5-10x)
            const serviceCount = Math.floor(Math.random() * 6) + 5;
            for (let i = 0; i < serviceCount; i++) {
                const amount = (Math.floor(Math.random() * 50) + 10) * 100000;
                transactions.push({
                    id: `trx-${month}-srv-${i}`,
                    date: `${year}-${m}-${randomDay()}`,
                    description: `Pendapatan Jasa Konsultasi Client #${month}${i}`,
                    entries: [
                        { accountCode: '102', type: 'debit', amount: amount },
                        { accountCode: '401', type: 'credit', amount: amount }
                    ]
                });
            }

            // 2. Sales Revenue (Penjualan Barang) - Moderate (3-5x)
            const salesCount = Math.floor(Math.random() * 3) + 3;
            for (let i = 0; i < salesCount; i++) {
                const amount = (Math.floor(Math.random() * 30) + 5) * 100000;
                transactions.push({
                    id: `trx-${month}-sale-${i}`,
                    date: `${year}-${m}-${randomDay()}`,
                    description: `Penjualan Merchandise/Produk #${month}${i}`,
                    entries: [
                        { accountCode: '101', type: 'debit', amount: amount }, // Cash
                        { accountCode: '402', type: 'credit', amount: amount }
                    ]
                });
            }

            // 3. Rent Income (Sewa) - Once a month (e.g., sublet space)
            transactions.push({
                id: `trx-${month}-rent-in`,
                date: `${year}-${m}-05`,
                description: 'Pendapatan Sewa Lahan Parkir',
                entries: [
                    { accountCode: '101', type: 'debit', amount: 2000000 },
                    { accountCode: '405', type: 'credit', amount: 2000000 }
                ]
            });

            // 4. Commission Income (Komisi) - Occasional (0-2x)
            if (Math.random() > 0.3) {
                const amount = (Math.floor(Math.random() * 15) + 5) * 100000;
                transactions.push({
                    id: `trx-${month}-comm`,
                    date: `${year}-${m}-${randomDay()}`,
                    description: 'Pendapatan Komisi Referal',
                    entries: [
                        { accountCode: '102', type: 'debit', amount: amount },
                        { accountCode: '406', type: 'credit', amount: amount }
                    ]
                });
            }

            // 5. Other Income (Lain-lain) - Rare
            if (Math.random() > 0.7) {
                transactions.push({
                    id: `trx-${month}-other`,
                    date: `${year}-${m}-${randomDay()}`,
                    description: 'Penjualan Kardus Bekas',
                    entries: [
                        { accountCode: '101', type: 'debit', amount: 150000 },
                        { accountCode: '403', type: 'credit', amount: 150000 }
                    ]
                });
            }

            // 6. Interest Income (Bunga) - Monthly
            transactions.push({
                id: `trx-${month}-interest`,
                date: `${year}-${m}-${daysInMonth}`,
                description: 'Pendapatan Bunga Bank',
                entries: [
                    { accountCode: '102', type: 'debit', amount: 350000 },
                    { accountCode: '404', type: 'credit', amount: 350000 }
                ]
            });


            // --- EXPENSE STREAM ---

            // Fixed Expenses
            // Salary
            transactions.push({
                id: `trx-${month}-salary`,
                date: `${year}-${m}-25`,
                description: 'Gaji Karyawan & Staff',
                entries: [
                    { accountCode: '501', type: 'debit', amount: 25000000 },
                    { accountCode: '102', type: 'credit', amount: 25000000 }
                ]
            });
            // Rent Office
            transactions.push({
                id: `trx-${month}-rent-out`,
                date: `${year}-${m}-02`,
                description: 'Sewa Kantor Bulanan',
                entries: [
                    { accountCode: '502', type: 'debit', amount: 7500000 },
                    { accountCode: '102', type: 'credit', amount: 7500000 }
                ]
            });
            // Internet
            transactions.push({
                id: `trx-${month}-inet`,
                date: `${year}-${m}-10`,
                description: 'Tagihan Internet & Telepon',
                entries: [
                    { accountCode: '504', type: 'debit', amount: 850000 },
                    { accountCode: '102', type: 'credit', amount: 850000 }
                ]
            });

            // Variable Expenses
            // Electricity (Fluctuating)
            const elecAmount = (Math.floor(Math.random() * 5) + 15) * 100000;
            transactions.push({
                id: `trx-${month}-elec`,
                date: `${year}-${m}-12`,
                description: 'Tagihan Listrik & Air',
                entries: [
                    { accountCode: '503', type: 'debit', amount: elecAmount },
                    { accountCode: '102', type: 'credit', amount: elecAmount }
                ]
            });

            // Supplies (Perlengkapan)
            transactions.push({
                id: `trx-${month}-supp`,
                date: `${year}-${m}-15`,
                description: 'Beli ATK & Perlengkapan',
                entries: [
                    { accountCode: '505', type: 'debit', amount: 1200000 },
                    { accountCode: '101', type: 'credit', amount: 1200000 }
                ]
            });

            // Transport & Bensin
            transactions.push({
                id: `trx-${month}-gas`,
                date: `${year}-${m}-20`,
                description: 'Reimburse Bensin & Transport',
                entries: [
                    { accountCode: '507', type: 'debit', amount: 2500000 },
                    { accountCode: '101', type: 'credit', amount: 2500000 }
                ]
            });

            // Consumption
            transactions.push({
                id: `trx-${month}-food`,
                date: `${year}-${m}-22`,
                description: 'Konsumsi Meeting & Tamu',
                entries: [
                    { accountCode: '509', type: 'debit', amount: 1500000 },
                    { accountCode: '101', type: 'credit', amount: 1500000 }
                ]
            });

            // Occasional Expenses
            // Advertising (Quarterly-ish)
            if (month % 3 === 0) {
                transactions.push({
                    id: `trx-${month}-ads`,
                    date: `${year}-${m}-05`,
                    description: 'Iklan Social Media Campaign',
                    entries: [
                        { accountCode: '506', type: 'debit', amount: 5000000 },
                        { accountCode: '102', type: 'credit', amount: 5000000 }
                    ]
                });
            }

            // Maintenance (Every few months)
            if (month % 4 === 0) {
                transactions.push({
                    id: `trx-${month}-maint`,
                    date: `${year}-${m}-18`,
                    description: 'Service AC & Komputer',
                    entries: [
                        { accountCode: '508', type: 'debit', amount: 1800000 },
                        { accountCode: '102', type: 'credit', amount: 1800000 }
                    ]
                });
            }

            // Insurance (Monthly)
            transactions.push({
                id: `trx-${month}-ins`,
                date: `${year}-${m}-28`,
                description: 'Premi Asuransi Aset',
                entries: [
                    { accountCode: '510', type: 'debit', amount: 1000000 },
                    { accountCode: '102', type: 'credit', amount: 1000000 }
                ]
            });
            
            // Tax (Monthly estimate)
            transactions.push({
                id: `trx-${month}-tax`,
                date: `${year}-${m}-15`,
                description: 'Setoran PPh Final UMKM',
                entries: [
                    { accountCode: '514', type: 'debit', amount: 750000 },
                    { accountCode: '102', type: 'credit', amount: 750000 }
                ]
            });

            // Misc Expense
            if (Math.random() > 0.5) {
                transactions.push({
                    id: `trx-${month}-misc`,
                    date: `${year}-${m}-${randomDay()}`,
                    description: 'Biaya Lain-lain (Materai/Parkir)',
                    entries: [
                        { accountCode: '515', type: 'debit', amount: 250000 },
                        { accountCode: '101', type: 'credit', amount: 250000 }
                    ]
                });
            }

            // Prive (Owner Drawings)
            if (month === 5 || month === 11) { // June and Dec
                transactions.push({
                    id: `trx-${month}-prive`,
                    date: `${year}-${m}-30`,
                    description: 'Prive Pemilik',
                    entries: [
                        { accountCode: '302', type: 'debit', amount: 10000000 },
                        { accountCode: '102', type: 'credit', amount: 10000000 }
                    ]
                });
            }
        }

        // Adjustments (End of Year)
        // Depreciation
        transactions.push({
            id: 'adj-depr-equip',
            date: `${year}-12-31`,
            description: 'Penyusutan Peralatan Kantor (Tahunan)',
            entries: [
                { accountCode: '511', type: 'debit', amount: 12500000 }, // 25% of 50M
                { accountCode: '122', type: 'credit', amount: 12500000 }
            ]
        });
        transactions.push({
            id: 'adj-depr-vehicle',
            date: `${year}-12-31`,
            description: 'Penyusutan Kendaraan (Tahunan)',
            entries: [
                { accountCode: '512', type: 'debit', amount: 25000000 }, // 10% of 250M
                { accountCode: '132', type: 'credit', amount: 25000000 }
            ]
        });

        return transactions;
    },

    getData() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        if (data) {
            return JSON.parse(data);
        }
        return this.getEmptyData();
    },

    getEmptyData() {
        return {
            transactions: [],
            accounts: this.defaultAccounts
        };
    },

    saveData(data) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    },

    resetData() {
        localStorage.removeItem(this.STORAGE_KEY);
    },

    loadDemoData() {
        const dummyTransactions = this.generateDummyData2025();
        const data = {
            transactions: dummyTransactions,
            accounts: this.defaultAccounts
        };
        this.saveData(data);
        return data;
    },

    addTransaction(transaction) {
        const data = this.getData();
        data.transactions.push(transaction);
        this.saveData(data);
    },

    getAccountName(code) {
        const account = this.defaultAccounts.find(a => a.code === code);
        return account ? account.name : 'Unknown Account';
    }
};
