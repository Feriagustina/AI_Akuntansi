
const DataManager = {
    // Mock generateDummyData2025 from data.js
    generateDummyData2025() {
        const transactions = [];
        const year = 2025;
        
        // 1. Initial Capital (Jan 1)
        transactions.push({
            id: 'trx-init-capital',
            date: `${year}-01-01`,
            description: 'Setoran Modal Awal Tahun',
            entries: []
        });

        // 2. Buy Assets (Jan 2)
        transactions.push({
            id: 'trx-init-asset-1',
            date: `${year}-01-02`,
            description: 'Beli Kendaraan Operasional',
            entries: []
        });
        transactions.push({
            id: 'trx-init-asset-2',
            date: `${year}-01-03`,
            description: 'Beli Laptop & Furniture Kantor',
            entries: []
        });

        // Monthly Routine Generator
        // Generate only Jan - Nov (0 - 10), leave Dec (11) empty for manual input
        for (let month = 0; month < 11; month++) {
            const m = String(month + 1).padStart(2, '0');
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const randomDay = () => String(Math.floor(Math.random() * (daysInMonth - 1)) + 1).padStart(2, '0');

            // Just adding one dummy transaction per month to verify dates
            transactions.push({
                id: `trx-${month}-test`,
                date: `${year}-${m}-${randomDay()}`,
                description: `Test Transaction Month ${m}`,
                entries: []
            });
        }
        return transactions;
    }
};

const data = DataManager.generateDummyData2025();
const months = new Set(data.map(t => t.date.substring(0, 7)));
console.log('Generated Months:', Array.from(months).sort());

// Check if Dec is present
if (months.has('2025-12')) {
    console.log('FAIL: December data found!');
} else {
    console.log('PASS: No December data.');
}
