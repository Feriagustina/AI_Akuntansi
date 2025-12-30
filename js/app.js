/**
 * Main Application Controller
 */

// Global Error Handler
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Global Error:', msg, 'at', lineNo);
    // Don't alert global errors to user to avoid spamming, just console
    return false;
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');

    // 1. Initialize Modules
    try {
        // Auth Init
        if (typeof AuthManager !== 'undefined') {
            AuthManager.init();
            
            const loginForm = document.getElementById('login-form');
            if (loginForm) {
                loginForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const u = document.getElementById('login-username').value;
                    const p = document.getElementById('login-password').value;
                    if (!AuthManager.login(u, p)) {
                        alert('Username atau Password salah!');
                    }
                });
            }
        }

        // Auto Load Demo Data if Empty
        /*
        if (typeof DataManager !== 'undefined') {
            const data = DataManager.getData();
            if (!data.transactions || data.transactions.length === 0) {
                console.log('No data found. Loading demo data automatically...');
                DataManager.loadDemoData();
            }
        }
        */

        if (typeof UI !== 'undefined' && UI.initTransactionForm) {
            UI.initTransactionForm();
            // Render Analytics if on dashboard
            if (typeof UI.renderDashboardAnalytics === 'function') {
                UI.renderDashboardAnalytics();
                // Render AI Insight
                if (typeof AIAgent !== 'undefined') AIAgent.renderWidget('ai-insight-card');
            }
            console.log('UI Initialized');
        } else {
            console.error('UI Module missing or incomplete');
        }
        
        // Setup Date
        const dateInput = document.getElementById('trx-date');
        if (dateInput) dateInput.valueAsDate = new Date();

    } catch (e) {
        console.error('Initialization Error:', e);
        alert('App Init Failed: ' + e.message);
        if (targetId === 'journal-yearly' && typeof UI !== 'undefined' && typeof UI.renderYearlyJournal === 'function') {
            UI.renderYearlyJournal();
        }
    }
});

// Event Delegation for Navigation (More Robust)
document.addEventListener('click', function(e) {
    // 1. Handle Navigation Links
    const link = e.target.closest('a[href^="#"]');
    if (link) {
        e.preventDefault();
        
        const targetId = link.getAttribute('href').substring(1);
        console.log('Click detected on link. Target:', targetId);
        
        if (!targetId) return;

        navigateTo(targetId);
        
        // Update Active State
        document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));
        if (link.classList.contains('nav-link')) {
            link.classList.add('active');
        }

        // Render Analytics if navigating to dashboard
        if (targetId === 'landing-page' && typeof UI !== 'undefined' && UI.renderDashboardAnalytics) {
            UI.renderDashboardAnalytics();
            if (typeof AIAgent !== 'undefined') AIAgent.renderWidget('ai-insight-card');
        }
        
        // Close Mobile Menu
        const navbar = document.getElementById('navbarNav');
        if (navbar && navbar.classList.contains('show')) {
             try {
                 if (typeof bootstrap !== 'undefined') {
                     const bsCollapse = bootstrap.Collapse.getInstance(navbar);
                     if (bsCollapse) bsCollapse.hide();
                 } else {
                     navbar.classList.remove('show');
                 }
             } catch(err) {
                 navbar.classList.remove('show');
             }
        }
    }

    // 2. Handle Data Buttons (Delegation)
    if (e.target.closest('#btn-reset')) {
        if(confirm('Hapus semua data?')) {
            if (typeof DataManager !== 'undefined') {
                DataManager.resetData();
                location.reload();
            }
        }
    }

    // Closing Bulanan
    if (e.target.closest('#btn-closing-month')) {
        if (confirm('Closing bulan berjalan? Transaksi bulan ini akan dimasukkan ke laporan.')) {
            if (typeof DataManager !== 'undefined') {
                DataManager.closeCurrentMonth();
                if (typeof UI !== 'undefined') {
                    UI.renderJournalCurrentMonth(); // Clear current journal
                    UI.renderYearlyJournal(); // Update yearly journal immediately
                    UI.renderReports();
                }
                alert('Closing bulan berjalan berhasil.\nTransaksi telah dipindahkan ke Jurnal Tahunan.');
            }
        }
    }
});

function navigateTo(targetId) {
    // Permission Check
    if (typeof AuthManager !== 'undefined') {
        const session = AuthManager.getSession();
        if (session && !AuthManager.canAccess(session.role, targetId)) {
            console.warn('Access denied to', targetId);
            // Optional: redirect to allowed page or show error
            // For now, just return to prevent navigation
            return;
        }
    }

    const sections = document.querySelectorAll('.app-section');
    let found = false;

    sections.forEach(section => {
        // Use ID check
        if (section.id === targetId) {
            section.classList.add('active-section');
            found = true;
        } else {
            section.classList.remove('active-section');
        }
    });

    if (found) {
        window.scrollTo(0,0);
        
        // Sync Hash
        const newHash = '#' + targetId;
        if (window.location.hash !== newHash) {
            if (history.pushState) {
                history.pushState(null, null, newHash);
            } else {
                window.location.hash = targetId;
            }
        }

        // Trigger specific renders
        if (targetId === 'journal-monthly' && typeof UI !== 'undefined') {
            UI.renderJournalCurrentMonth();
        }
        if (targetId === 'closing' && typeof UI !== 'undefined' && typeof UI.renderClosingPage === 'function') {
            UI.renderClosingPage();
        }
        if (targetId === 'journal-yearly' && typeof UI !== 'undefined' && typeof UI.renderYearlyJournal === 'function') {
            UI.renderYearlyJournal(); // Yearly/Full
        }
        if (targetId === 'reports' && typeof UI !== 'undefined') UI.renderReports();
        if (targetId === 'general-ledger' && typeof UI !== 'undefined' && typeof UI.renderGeneralLedger === 'function') {
            UI.renderGeneralLedger();
        }
        if (targetId === 'transaction-report' && typeof UI !== 'undefined' && typeof UI.renderTransactionReport === 'function') {
            UI.renderTransactionReport();
        }
        if (targetId === 'settings' && typeof UI !== 'undefined' && typeof UI.renderSettings === 'function') {
            UI.renderSettings();
        }
    } else {
        console.error('Target section not found:', targetId);
    }
}

// Handle Browser Navigation (Back/Forward/Manual Hash Change)
window.addEventListener('hashchange', () => {
    const targetId = window.location.hash.substring(1);
    console.log('Hash change detected:', targetId);
    if (targetId) {
        navigateTo(targetId);
    }
});
