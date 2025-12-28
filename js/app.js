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
        // Auto Load Demo Data if Empty
        if (typeof DataManager !== 'undefined') {
            const data = DataManager.getData();
            if (!data.transactions || data.transactions.length === 0) {
                console.log('No data found. Loading demo data automatically...');
                DataManager.loadDemoData();
            }
        }

        if (typeof UI !== 'undefined' && UI.initTransactionForm) {
            UI.initTransactionForm();
            // Render Analytics if on dashboard
            if (typeof UI.renderDashboardAnalytics === 'function') {
                UI.renderDashboardAnalytics();
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
});

function navigateTo(targetId) {
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
        // Trigger specific renders
        if (targetId === 'journal' && typeof UI !== 'undefined') UI.renderJournal();
        if (targetId === 'reports' && typeof UI !== 'undefined') UI.renderReports();
    } else {
        console.error('Target section not found:', targetId);
    }
}
