/**
 * Export Manager Module
 * Handles PDF and Excel export functionality
 */

const ExportManager = {
    
    // --- Helper: Get Company Header Info ---
    getCompanyHeader() {
        const profile = DataManager.getCompanyProfile();
        return {
            name: profile.name || 'Nama Perusahaan',
            address: profile.address || '',
            phone: profile.phone ? `Telp: ${profile.phone}` : '',
            email: profile.email ? `Email: ${profile.email}` : ''
        };
    },

    // --- Generic PDF Export ---
    exportToPDF(title, tableId, fileName, orientation = 'portrait') {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF(orientation, 'mm', 'a4');
        const header = this.getCompanyHeader();

        // 1. Add Company Header
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(header.name, 14, 15);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        let yPos = 22;
        
        if (header.address) {
            doc.text(header.address, 14, yPos);
            yPos += 5;
        }
        if (header.phone || header.email) {
            const contact = [header.phone, header.email].filter(Boolean).join(' | ');
            doc.text(contact, 14, yPos);
            yPos += 8;
        } else {
            yPos += 3;
        }

        // 2. Add Report Title & Date
        doc.setLineWidth(0.5);
        doc.line(14, yPos, 196, yPos); // Horizontal Line
        yPos += 10;

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(title.toUpperCase(), 14, yPos);
        yPos += 6;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, yPos);
        yPos += 5;

        // 3. Render Table
        // Parse HTML Table
        const tableElement = document.getElementById(tableId);
        if (!tableElement) {
            alert(`Table not found: ${tableId}`);
            return;
        }

        doc.autoTable({
            html: `#${tableId}`,
            startY: yPos + 5,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] }, // Bootstrap Primary Color
            styles: { fontSize: 8, cellPadding: 2 },
            footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
        });

        // 4. Save
        doc.save(`${fileName}.pdf`);
    },

    // --- Generic Excel Export ---
    exportToExcel(title, tableId, fileName) {
        const header = this.getCompanyHeader();
        const wb = XLSX.utils.book_new();
        
        // 1. Create Header Rows manually
        const wsData = [
            [header.name],
            [header.address],
            [[header.phone, header.email].filter(Boolean).join(' | ')],
            [], // Empty row
            [title.toUpperCase()],
            [`Dicetak pada: ${new Date().toLocaleString('id-ID')}`],
            [] // Empty row
        ];

        // 2. Get Table Data
        const table = document.getElementById(tableId);
        if (!table) {
            alert(`Table not found: ${tableId}`);
            return;
        }
        
        // Use sheet_add_aoa to add headers first
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // Append Table Data starting from row 8 (index 7)
        XLSX.utils.sheet_add_dom(ws, table, { origin: "A8" });

        // Merge Cells for Header (Visual only, usually helpful)
        // A1:E1, A2:E2, etc. assuming table width
        if (!ws['!merges']) ws['!merges'] = [];
        ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }); // Company Name
        ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }); // Address
        ws['!merges'].push({ s: { r: 4, c: 0 }, e: { r: 4, c: 4 } }); // Title

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, "Laporan");

        // 3. Save
        XLSX.writeFile(wb, `${fileName}.xlsx`);
    },

    // --- Specific Export Handlers ---

    // 1. Transaction Report
    exportTransactionReport(type) {
        const title = 'Laporan Transaksi';
        const tableId = 'transaction-report-table'; // Need to add ID to table in HTML
        const fileName = `Laporan_Transaksi_${new Date().toISOString().slice(0,10)}`;
        
        if (type === 'pdf') this.exportToPDF(title, tableId, fileName);
        else this.exportToExcel(title, tableId, fileName);
    },

    // 2. General Ledger
    exportGeneralLedger(type) {
        const accName = document.getElementById('gl-account-select').options[document.getElementById('gl-account-select').selectedIndex].text;
        const title = `Buku Besar - ${accName}`;
        const tableId = 'gl-table'; // Need to add ID to table in HTML
        const fileName = `Buku_Besar_${new Date().toISOString().slice(0,10)}`;

        if (type === 'pdf') this.exportToPDF(title, tableId, fileName);
        else this.exportToExcel(title, tableId, fileName);
    },

    // 3. Yearly Journal
    exportYearlyJournal(type) {
        const year = document.getElementById('journal-year-filter').value || 'Semua Tahun';
        const title = `Jurnal Umum Tahunan - ${year}`;
        const tableId = 'journal-table'; // Need to add ID to table in HTML
        const fileName = `Jurnal_Tahunan_${year}`;

        if (type === 'pdf') this.exportToPDF(title, tableId, fileName);
        else this.exportToExcel(title, tableId, fileName);
    },

    // 4. Trial Balance
    exportTrialBalance(type) {
        const title = 'Neraca Saldo (Trial Balance)';
        const tableId = 'trial-balance-table'; // Need to add ID to table in HTML
        const fileName = `Neraca_Saldo_${new Date().toISOString().slice(0,10)}`;

        if (type === 'pdf') this.exportToPDF(title, tableId, fileName);
        else this.exportToExcel(title, tableId, fileName);
    },

    // 5. Income Statement
    exportIncomeStatement(type) {
        const title = 'Laporan Laba Rugi';
        const tableId = 'income-statement-table'; // Need to add ID to table in HTML
        const fileName = `Laba_Rugi_${new Date().toISOString().slice(0,10)}`;

        if (type === 'pdf') this.exportToPDF(title, tableId, fileName);
        else this.exportToExcel(title, tableId, fileName);
    },

    // 6. Balance Sheet
    exportBalanceSheet(type) {
        const title = 'Laporan Posisi Keuangan (Neraca)';
        const tableId = 'balance-sheet-table'; // Need to add ID to table in HTML
        const fileName = `Neraca_${new Date().toISOString().slice(0,10)}`;

        if (type === 'pdf') this.exportToPDF(title, tableId, fileName);
        else this.exportToExcel(title, tableId, fileName);
    },

    // 7. Closing History
    exportClosingHistory(type) {
        const title = 'Riwayat Tutup Buku';
        const tableId = 'closing-history-table';
        const fileName = `Riwayat_Closing_${new Date().toISOString().slice(0,10)}`;

        if (type === 'pdf') this.exportToPDF(title, tableId, fileName);
        else this.exportToExcel(title, tableId, fileName);
    }
};
