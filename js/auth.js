/**
 * Authentication Module
 * Handles Login, Logout, and Session Management
 */

const AuthManager = {
    STORAGE_KEY: 'poc_accounting_auth_v2',
    
    // Default Users
    users: [
        { username: 'admin', password: '123', role: 'admin', name: 'Administrator' },
        { username: 'user', password: '123', role: 'user', name: 'Staff Akuntansi' },
        { username: 'direktur', password: '123', role: 'direktur', name: 'Bapak Direktur' }
    ],

    // Role Permissions (Allowed Section IDs)
    permissions: {
        admin: ['all'], // Access to everything
        user: ['journal-monthly', 'transaction-report', 'general-ledger'],
        direktur: ['transaction-report', 'reports']
    },

    // Navigation Items Definition
    // format: { id, label, icon, target }
    navItems: [
        { role: 'admin', label: 'Dashboard Admin', icon: 'bi-speedometer2', target: 'landing-page' },
        { role: 'admin', label: 'Setting', icon: 'bi-gear', target: 'settings' },
        
        { role: ['admin', 'user'], label: 'Input Transaksi', icon: 'bi-pencil-square', target: 'journal-monthly' },
        { role: ['admin', 'user', 'direktur'], label: 'Laporan Transaksi', icon: 'bi-table', target: 'transaction-report' },
        { role: ['admin', 'user'], label: 'Buku Besar', icon: 'bi-book', target: 'general-ledger' },
        { role: ['admin'], label: 'Jurnal Tahunan', icon: 'bi-journal-bookmark', target: 'journal-yearly' },
        { role: ['admin', 'direktur'], label: 'Laporan Keuangan', icon: 'bi-graph-up', target: 'reports' },
        { role: ['admin'], label: 'Tutup Buku', icon: 'bi-check-circle', target: 'closing' }
    ],

    init() {
        // Check if user is logged in
        const session = this.getSession();
        if (session) {
            this.setupApp(session);
        } else {
            this.showLogin();
        }
    },

    login(username, password) {
        const user = this.users.find(u => u.username === username && u.password === password);
        if (user) {
            const session = {
                username: user.username,
                role: user.role,
                name: user.name,
                loginTime: new Date().toISOString()
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
            this.setupApp(session);
            return true;
        }
        return false;
    },

    logout() {
        localStorage.removeItem(this.STORAGE_KEY);
        window.location.reload();
    },

    getSession() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    },

    showLogin() {
        document.getElementById('login-page').style.display = 'block';
        document.getElementById('main-app').style.display = 'none';
    },

    setupApp(session) {
        const loginPage = document.getElementById('login-page');
        const mainApp = document.getElementById('main-app');
        
        if (loginPage) loginPage.style.setProperty('display', 'none', 'important');
        if (mainApp) mainApp.style.display = 'block';
        
        this.renderSidebar(session.role);
        
        // Ensure navigation happens after UI update
        setTimeout(() => {
            this.redirectBasedOnRole(session.role);
        }, 50);
    },

    renderSidebar(role) {
        const navContainer = document.querySelector('.navbar-nav');
        if (!navContainer) return;

        navContainer.innerHTML = '';
        
        // Filter Nav Items
        const allowedItems = this.navItems.filter(item => {
            if (Array.isArray(item.role)) {
                return item.role.includes(role);
            }
            return item.role === role || item.role === 'all';
        });

        // Generate HTML
        allowedItems.forEach(item => {
            const li = document.createElement('li');
            li.className = 'nav-item';
            li.innerHTML = `
                <a class="nav-link" href="#${item.target}">
                    <i class="bi ${item.icon}"></i> ${item.label}
                </a>
            `;
            navContainer.appendChild(li);
        });

        // Add Logout Button
        const logoutLi = document.createElement('li');
        logoutLi.className = 'nav-item ms-lg-3 border-start-lg ps-lg-3';
        logoutLi.innerHTML = `
            <a class="nav-link text-danger fw-bold" href="#" onclick="AuthManager.logout()">
                <i class="bi bi-box-arrow-right"></i> Logout
            </a>
        `;
        navContainer.appendChild(logoutLi);
    },

    redirectBasedOnRole(role) {
        // If current hash is valid for role, stay there. Else go to default.
        const currentHash = window.location.hash.substring(1);
        if (currentHash && this.canAccess(role, currentHash)) {
            // Trigger navigation manually to ensure UI updates
            if (typeof navigateTo === 'function') navigateTo(currentHash);
            return;
        }

        // Defaults
        if (role === 'admin') navigateTo('landing-page');
        else if (role === 'user') navigateTo('journal-monthly');
        else if (role === 'direktur') navigateTo('transaction-report');
    },

    canAccess(role, sectionId) {
        if (!sectionId) return false;
        if (role === 'admin') return true;
        
        const allowed = this.permissions[role];
        return allowed.includes(sectionId);
    }
};
