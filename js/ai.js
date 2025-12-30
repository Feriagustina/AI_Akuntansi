/**
 * AI Financial Analyst Agent (Heuristic/Rule-Based)
 * Provides insights based on accounting data without external API calls (for now).
 */

const AIAgent = {
    // Configuration
    config: {
        agentName: "AI Financial Analyst",
        version: "1.0.0"
    },

    /**
     * Main entry point to generate analysis
     * @returns {Object} Analysis result containing summary, alerts, and detailed insights
     */
    analyze() {
        // Get data from DataManager and Accounting
        const data = DataManager.getData();
        const transactions = data.transactions;
        const currentMonthKey = DataManager.getCurrentMonthKey(); // e.g., "2024-12"
        
        // Use Accounting helper to get balances
        // We focus on "Movement" (Pergerakan Bulan Ini) for monthly analysis
        const balances = Accounting.getPeriodBalancesMap(transactions, currentMonthKey);
        
        // 1. Calculate Financial Key Performance Indicators (KPIs)
        const kpi = this.calculateKPI(balances);

        // 2. Generate Narrative Insights
        const insights = this.generateInsights(kpi);

        return {
            kpi,
            insights
        };
    },

    /**
     * Calculate financial metrics from balances
     */
    calculateKPI(balances) {
        let revenue = 0;
        let expenses = 0;
        let expenseDetails = [];

        Object.values(balances).forEach(acc => {
            // Calculate Net Movement for this month
            // Debit adds to Assets/Expenses, Credit adds to Liabilities/Equity/Revenue
            
            // Revenue (Type: revenue, usually 4xx)
            if (acc.type === 'revenue') {
                const netCredit = acc.movementCredit - acc.movementDebit;
                revenue += netCredit;
            }

            // Expenses (Type: expense, usually 5xx)
            if (acc.type === 'expense') {
                const netDebit = acc.movementDebit - acc.movementCredit;
                expenses += netDebit;
                if (netDebit > 0) {
                    expenseDetails.push({
                        name: acc.name,
                        amount: netDebit
                    });
                }
            }
        });

        // Sort expenses to find top contributors
        expenseDetails.sort((a, b) => b.amount - a.amount);

        return {
            revenue,
            expenses,
            netProfit: revenue - expenses,
            topExpenses: expenseDetails.slice(0, 3), // Top 3
            profitMargin: revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0
        };
    },

    /**
     * Generate text-based insights from KPIs
     */
    generateInsights(kpi) {
        const insights = [];
        const formatMoney = (val) => UI.formatCurrency(val);

        // 1. Profitability Insight
        if (kpi.revenue === 0 && kpi.expenses === 0) {
            insights.push({
                type: 'info',
                title: 'Data Belum Tersedia',
                message: "Belum ada transaksi bulan ini. Silakan input transaksi pendapatan atau pengeluaran untuk mendapatkan analisa."
            });
            return insights;
        }

        if (kpi.netProfit > 0) {
            insights.push({
                type: 'success',
                title: 'Profitabilitas Positif',
                message: `Bagus! Perusahaan mencetak laba bersih sebesar <strong>${formatMoney(kpi.netProfit)}</strong> bulan ini. Margin keuntungan Anda adalah ${kpi.profitMargin.toFixed(1)}%.`
            });
        } else if (kpi.netProfit < 0) {
            insights.push({
                type: 'warning',
                title: 'Perhatian: Rugi Bersih',
                message: `Bulan ini pengeluaran melebihi pendapatan sebesar <strong>${formatMoney(Math.abs(kpi.netProfit))}</strong>. Perlu strategi untuk meningkatkan omzet atau efisiensi biaya.`
            });
        } else {
            insights.push({
                type: 'neutral',
                title: 'Break Even Point',
                message: "Pendapatan sama persis dengan pengeluaran (Impas). Tidak ada laba maupun rugi."
            });
        }

        // 2. Revenue Insight
        if (kpi.revenue > 0) {
             // Simple heuristic: usually good to acknowledge revenue
             // In v2, compare with last month
             insights.push({
                type: 'info',
                title: 'Performa Pendapatan',
                message: `Total pendapatan tercatat <strong>${formatMoney(kpi.revenue)}</strong>.`
            });
        } else {
             insights.push({
                type: 'danger',
                title: 'Tidak Ada Pendapatan',
                message: "Belum ada pemasukan yang tercatat bulan ini. Pastikan seluruh penjualan telah diinput."
            });
        }

        // 3. Expense Analysis
        if (kpi.topExpenses.length > 0) {
            const topExpName = kpi.topExpenses[0].name;
            const topExpAmount = kpi.topExpenses[0].amount;
            const topExpPercent = kpi.expenses > 0 ? (topExpAmount / kpi.expenses) * 100 : 0;

            insights.push({
                type: 'warning',
                title: 'Pos Pengeluaran Terbesar',
                message: `Biaya terbesar bulan ini adalah <strong>${topExpName}</strong> (${formatMoney(topExpAmount)}), yang menyumbang ${topExpPercent.toFixed(1)}% dari total beban. Cek apakah efisiensi bisa dilakukan di sini.`
            });
        }

        return insights;
    },

    /**
     * Render the AI Widget to a DOM element
     * @param {string} containerId ID of the container element
     */
    renderWidget(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const analysis = this.analyze();
        
        let html = `
            <div class="card shadow-sm border-0 mb-4">
                <div class="card-header bg-gradient-primary text-white d-flex align-items-center">
                    <i class="bi bi-robot me-2 fs-4"></i>
                    <h5 class="mb-0">AI Financial Analyst</h5>
                    <span class="badge bg-light text-primary ms-auto">Beta</span>
                </div>
                <div class="card-body">
                    <div class="row">
        `;

        // Render Insights
        if (analysis.insights.length > 0) {
            html += `<div class="col-md-12"><div class="list-group list-group-flush">`;
            
            analysis.insights.forEach(item => {
                let icon = 'bi-info-circle';
                let colorClass = 'text-primary';
                let bgClass = 'bg-primary-subtle';

                if (item.type === 'success') { icon = 'bi-graph-up-arrow'; colorClass = 'text-success'; bgClass = 'bg-success-subtle'; }
                if (item.type === 'warning') { icon = 'bi-exclamation-triangle'; colorClass = 'text-warning'; bgClass = 'bg-warning-subtle'; }
                if (item.type === 'danger') { icon = 'bi-exclamation-octagon'; colorClass = 'text-danger'; bgClass = 'bg-danger-subtle'; }

                html += `
                    <div class="list-group-item border-0 d-flex align-items-start p-3 mb-2 rounded ${bgClass}">
                        <div class="me-3 mt-1 ${colorClass}">
                            <i class="bi ${icon} fs-4"></i>
                        </div>
                        <div>
                            <h6 class="mb-1 fw-bold ${colorClass}">${item.title}</h6>
                            <p class="mb-0 text-muted small">${item.message}</p>
                        </div>
                    </div>
                `;
            });

            html += `</div></div>`;
        }

        html += `
                    </div>
                    <div class="mt-3 text-end">
                        <small class="text-muted fst-italic">Analisa dibuat otomatis berdasarkan data transaksi bulan ini.</small>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }
};
