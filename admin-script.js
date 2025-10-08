// Admin Dashboard JavaScript
class AdminDashboard {
    // Credit Agent Modal Logic
    setupCreditAgentModal() {
        const creditBtn = document.getElementById('creditAgentBtn');
        if (creditBtn) {
            creditBtn.addEventListener('click', () => {
                this.openCreditAgentModal();
            });
        }
        const creditForm = document.getElementById('creditAgentForm');
        if (creditForm) {
            creditForm.addEventListener('submit', (e) => this.handleCreditAgent(e));
        }
    }

    async openCreditAgentModal() {
        const modal = document.getElementById('creditAgentModal');
        const agentSelect = document.getElementById('agentSelect');
        if (modal && agentSelect) {
            // Fetch agents from backend
            agentSelect.innerHTML = '<option value="">Loading...</option>';
            try {
                const API_BASE_URL = 'https://cribzconnect-backend.onrender.com';
                const res = await fetch(`${API_BASE_URL}/api/users`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                });
                const users = res.ok ? await res.json() : [];
                if (users.length) {
                    agentSelect.innerHTML = '<option value="">Select a user</option>' + users.map(u => {
                        let name = '';
                        if (u.fullName && u.fullName.trim()) {
                            name = u.fullName;
                        } else if (u.username && u.username.trim()) {
                            name = u.username;
                        } else if (u.email && u.email.trim()) {
                            name = u.email;
                        }
                        return `<option value="${u._id}">${name}</option>`;
                    }).join('');
                } else {
                    agentSelect.innerHTML = '<option value="">No users found</option>';
                }
            } catch {
                agentSelect.innerHTML = '<option value="">Error loading agents</option>';
            }
            modal.style.display = 'block';
            modal.style.zIndex = 1002;
        }
        // Setup close and cancel buttons
        const closeBtn = document.getElementById('closeCreditModal');
        const cancelBtn = document.getElementById('cancelCreditModal');
        if (closeBtn && modal) {
            closeBtn.onclick = () => { modal.style.display = 'none'; };
        }
        if (cancelBtn && modal) {
            cancelBtn.onclick = () => { modal.style.display = 'none'; };
        }
    }

    async handleCreditAgent(e) {
        e.preventDefault();
        const agentId = document.getElementById('agentSelect').value;
        const amount = Number(document.getElementById('creditAmount').value);
        if (!agentId || !amount || amount <= 0) {
            this.showMessage('error', 'Please select an agent and enter a valid amount.');
            return;
        }
        const API_BASE_URL = 'https://cribzconnect-backend.onrender.com';
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`${API_BASE_URL}/api/users/credit`, {
                method: 'POST',
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ agentId, amount })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to credit agent');
            this.showMessage('success', `Agent credited successfully! New balance: ${data.newBalance} XAF`);
            this.closeModal('creditAgentModal');
            // Optionally refresh agent data
            await this.fetchDashboardData();
            this.populateAgentsTable();
        } catch (err) {
            this.showMessage('error', 'Could not credit agent: ' + err.message);
        }
    }

    // Fetch and populate withdrawal requests
    async populateWithdrawalRequestsTable() {
        const tbody = document.getElementById('withdrawalRequestsBody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="7">Loading...</td></tr>';
        const API_BASE_URL = 'https://cribzconnect-backend.onrender.com';
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(`${API_BASE_URL}/api/admin/withdrawals`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            if (!res.ok) throw new Error('Failed to fetch withdrawal requests');
            const requests = await res.json();
            if (!requests.length) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#888;">No withdrawal requests found.</td></tr>';
                return;
            }
            tbody.innerHTML = requests.map(req => `
                <tr>
                    <td><strong>${req._id || req.id}</strong></td>
                    <td>${req.user?.fullName || req.user?.username || req.user?.email || 'Unknown'}</td>
                    <td><strong>XAF ${req.amount?.toLocaleString() || '0'}</strong></td>
                    <td>${req.payoutDetails ? req.payoutDetails : 'N/A'}</td>
                    <td>${this.formatDate(req.createdAt)}</td>
                    <td><span class="status-badge ${req.status}">${req.status.charAt(0).toUpperCase() + req.status.slice(1)}</span></td>
                    <td>
                        <div class="table-actions">
                            <button class="action-btn-sm btn-edit" onclick="adminDashboard.reviewWithdrawal('${req._id || req.id}')">Review</button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan='7'>Error loading withdrawal requests</td></tr>`;
        }
    }
    // Removed fetchAllPropertiesAndUsers. Use dashboard data instead.
    async populatePropertiesTable() {
        const tbody = document.getElementById('propertiesTableBody');
        if (!tbody) return;

        // Use already fetched dashboard data
        // Normalize hotel objects to match listing format
        const hotels = this.data.properties.filter(p => p.type === 'hotel' || p.type === 'Hotel');
        const listings = this.data.properties.filter(p => p.type !== 'hotel' && p.type !== 'Hotel');

        const allProperties = [...listings, ...hotels].map(property => ({
            _id: property.id,
            title: property.title,
            agentName: property.agent,
            price: typeof property.price === 'string' ? Number(property.price.replace(/[^\d.]/g, '')) : property.price,
            status: 'published',
            createdAt: property.dateList,
            isHotel: property.type === 'hotel' || property.type === 'Hotel'
        }));

        tbody.innerHTML = allProperties.length === 0
            ? `<tr><td colspan=\"6\" style=\"text-align:center; color:#888;\">No properties found.</td></tr>`
            : allProperties.map(property => `
            <tr>
                <td><strong>${property.title}</strong></td>
                <td>${property.agentName}</td>
                <td><strong>$${property.price ? Number(property.price).toLocaleString() : '0'}</strong></td>
                <td><span class=\"status-badge published\">${property.status.charAt(0).toUpperCase() + property.status.slice(1)}</span></td>
                <td>${this.formatDate(property.createdAt)}</td>
                <td>
                    <button class=\"action-btn-sm btn-delete\" onclick=\"adminDashboard.deleteProperty('${property._id}', '${property.isHotel ? 'hotel' : 'listing'}')\">Delete</button>
                </td>
            </tr>
        `).join('');
    }
    async deleteProperty(propertyId, propertyType) {
        const API_BASE_URL = 'https://cribzconnect-backend.onrender.com';
        if (!confirm('Are you sure you want to delete this property?')) return;
        try {
            const token = localStorage.getItem('authToken');
            let url = '';
            if (propertyType === 'hotel' || propertyType === 'Hotel') {
                url = `${API_BASE_URL}/api/hotels/${propertyId}`;
            } else {
                url = `${API_BASE_URL}/api/listings/${propertyId}`;
            }
            const res = await fetch(url, {
                method: 'DELETE',
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    'Content-Type': 'application/json'
                }
            });
            const respBody = await res.text().catch(() => null);
            console.log('[deleteProperty] response status=', res.status);
            console.log('[deleteProperty] response body=', respBody);
            if (!res.ok) throw new Error('Failed to delete property: ' + respBody);
            // Remove from local data
            this.data.properties = this.data.properties.filter(p => p.id !== propertyId && p._id !== propertyId);
            this.showMessage('success', 'Property deleted successfully!');
            await this.populatePropertiesTable();
            // Refresh other frontend pages if needed
            if (window.listingsPage && typeof window.listingsPage.refreshListings === 'function') {
                window.listingsPage.refreshListings();
            }
            if (typeof this.populatePendingApprovals === 'function') {
                this.populatePendingApprovals();
            }
        } catch (err) {
            this.showMessage('error', 'Could not delete property: ' + err.message);
        }
    }
    constructor() {
        this.currentTab = 'dashboard';
        this.currentUser = JSON.parse(localStorage.getItem('adminUser')) || null;
        this.charts = {};
        this.data = {
            stats: {},
            agents: [],
            clients: [],
            properties: [],
            transactions: [],
            disputes: []
        };
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupMobileMenu();
        await this.fetchDashboardData();
        this.initializeCharts();
        this.populateInitialData();
        this.startRealTimeUpdates();
    this.setupCreditAgentModal();
    }

    // Fetch live dashboard data from backend
    async fetchDashboardData() {
        const API_BASE_URL = 'https://cribzconnect-backend.onrender.com';
        try {
            // Fetch all listings, hotels, and users
            const [listingsRes, hotelsRes, usersRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/listings`),
                fetch(`${API_BASE_URL}/api/hotels`),
                fetch(`${API_BASE_URL}/api/users`)
            ]);
            const listings = await listingsRes.json();
            const hotels = await hotelsRes.json();
            const users = await usersRes.json();

            // Stats
            this.data.stats.totalProperties = listings.length + hotels.length;
            this.data.stats.totalUsers = users.length;
            this.data.stats.totalRevenue = [...listings, ...hotels].reduce((sum, p) => sum + (p.price || 0), 0);
            this.data.stats.verifiedAgents = users.filter(u => u.role === 'agent' && u.verified).length;

            // Map all users (agents and clients) with their listing count
            this.data.agents = users.map(u => ({
                id: u._id,
                name: (u.fullName && u.fullName.trim()) ? u.fullName : (u.username && u.username.trim()) ? u.username : (u.email && u.email.trim()) ? u.email : '',
                email: u.email,
                phone: u.phone || '',
                status: u.verified ? 'verified' : (u.role === 'client' ? 'active' : 'pending'),
                listings: listings.filter(p => p.userId === u._id).length + hotels.filter(h => h.userId === u._id).length,
                joinDate: u.createdAt,
                initials: (u.fullName && u.fullName.trim()) ? u.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : ((u.username && u.username.trim()) ? u.username.charAt(0).toUpperCase() : ((u.email && u.email.trim()) ? u.email.charAt(0).toUpperCase() : ''))
            }));

            // Properties: merge listings and hotels, normalize fields
            const normalizedListings = listings.map(p => ({
                id: p._id,
                title: p.title,
                agent: (() => {
                    const u = users.find(u => u._id === p.userId);
                    if (u) {
                        if (u.fullName && u.fullName.trim()) return u.fullName;
                        if (u.username && u.username.trim()) return u.username;
                        if (u.email && u.email.trim()) return u.email;
                    }
                    return 'Unknown';
                })(),
                price: p.price,
                status: p.status,
                dateList: p.createdAt,
                location: p.location || '',
                type: p.type || 'listing'
            }));
            const normalizedHotels = hotels.map(h => ({
                id: h._id,
                title: h.name,
                agent: (() => {
                    const u = users.find(u => u._id === h.userId);
                    if (u) {
                        if (u.fullName && u.fullName.trim()) return u.fullName;
                        if (u.username && u.username.trim()) return u.username;
                        if (u.email && u.email.trim()) return u.email;
                    }
                    return 'Unknown';
                })(),
                price: h.price,
                status: h.status,
                dateList: h.createdAt,
                location: h.address || '',
                type: 'hotel'
            }));
                this.data.properties = [...normalizedListings, ...normalizedHotels];

            // Transactions & Disputes: You can fetch and process these if you have endpoints
            this.data.transactions = [];
            this.data.disputes = [];
        } catch (err) {
            console.error('Dashboard data fetch error:', err);
        }
    }

    setupEventListeners() {
        // Sidebar navigation
        document.addEventListener('click', (e) => {
            // Menu item clicks
            if (e.target.closest('.menu-item')) {
                const menuItem = e.target.closest('.menu-item');
                const tab = menuItem.dataset.tab;
                
                if (tab) {
                    this.switchTab(tab);
                }
                
                // Handle submenu expansion
                if (menuItem.querySelector('.submenu')) {
                    menuItem.classList.toggle('expanded');
                }
            }
            
            // Submenu item clicks
            if (e.target.classList.contains('submenu-item')) {
                const tab = e.target.dataset.tab;
                if (tab) {
                    this.switchTab(tab);
                }
            }
        });

        // Filter change events
        document.addEventListener('change', (e) => {
            if (e.target.id.includes('Filter')) {
                this.applyFilters();
            }
        });

        // Search functionality
        const searchInput = document.querySelector('.search-container input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.performSearch(e.target.value);
            });
        }

        // Window resize handling
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    switchTab(tabName) {
        // Update current tab
        this.currentTab = tabName;
        
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab
        const targetTab = document.getElementById(tabName);
        if (targetTab) {
            targetTab.classList.add('active');
        }
        
        // Update sidebar active states
        document.querySelectorAll('.menu-item, .submenu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Find and activate the correct menu item
        const menuItem = document.querySelector(`[data-tab="${tabName}"]`);
        if (menuItem) {
            menuItem.classList.add('active');
            
            // If it's a submenu item, also expand the parent
            const parentMenu = menuItem.closest('.menu-item');
            if (parentMenu && parentMenu !== menuItem) {
                parentMenu.classList.add('expanded');
            }
        }
        
        // Load tab-specific data
        this.loadTabData(tabName);
    }

    loadTabData(tabName) {
        switch(tabName) {
            case 'dashboard':
                this.updateDashboardStats();
                this.updateLeaderboard();
                break;
            case 'agents':
                this.populateAgentsTable();
                break;
            case 'all-properties':
                this.populatePropertiesTable();
                break;
            case 'pending-approvals':
                this.populatePendingApprovals();
                break;
            case 'transaction-history':
                this.populateTransactionsTable();
                break;
            case 'open-disputes':
                this.populateDisputes();
                break;
        }
    }

    initializeCharts() {
        // Rentals per Month Chart
        const rentalsCtx = document.getElementById('rentalsChart');
        if (rentalsCtx) {
            this.charts.rentals = new Chart(rentalsCtx, {
                type: 'bar',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
                    datasets: [{
                        label: 'Rentals',
                        data: [65, 89, 123, 145, 167, 189, 201, 234],
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 2,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }

        // Property Type Breakdown Chart
        const propertyTypeCtx = document.getElementById('propertyTypeChart');
        if (propertyTypeCtx) {
            this.charts.propertyType = new Chart(propertyTypeCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Apartments', 'Houses', 'Studios', 'Condos'],
                    datasets: [{
                        data: [45, 25, 20, 10],
                        backgroundColor: [
                            '#3b82f6',
                            '#10b981',
                            '#f59e0b',
                            '#ef4444'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        }
                    }
                }
            });
        }
    }

    populateInitialData() {
        this.updateDashboardStats();
        this.populateAgentsTable();
        this.populateClientsTable();
        this.populatePropertiesTable();
        this.populateTransactionsTable();
        this.populatePendingApprovals();
        this.populateDisputes();
        this.updateLeaderboard();
    }

    async updateDashboardStats() {
        // Fetch stats from backend
        const API_BASE_URL = 'https://cribzconnect-backend.onrender.com';
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/stats`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
            });
            if (!res.ok) throw new Error('Failed to fetch stats');
            const stats = await res.json();
            // Update stat cards (dashboard overview)
            document.getElementById('totalProperties').textContent = stats.totalProperties?.toLocaleString() || '0';
            document.getElementById('totalUsers').textContent = stats.totalUsers?.toLocaleString() || '0';
            document.getElementById('dashboardRevenue').textContent = `$${stats.totalRevenue?.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}) || '0.00'}`;
            document.getElementById('totalBalance').textContent = `$${stats.totalBalance?.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2}) || '0.00'}`;
            document.getElementById('verifiedAgents').textContent = stats.verifiedAgents?.toLocaleString() || '0';
            if (stats.totalPropertiesChange) document.getElementById('totalPropertiesChange').textContent = stats.totalPropertiesChange;
            if (stats.totalUsersChange) document.getElementById('totalUsersChange').textContent = stats.totalUsersChange;
            if (stats.dashboardRevenueChange) document.getElementById('dashboardRevenueChange').textContent = stats.dashboardRevenueChange;
            if (stats.verifiedAgentsChange) document.getElementById('verifiedAgentsChange').textContent = stats.verifiedAgentsChange;

            // Revenue reports section (existing IDs)
            document.getElementById('totalRevenue').textContent = `XAF ${stats.totalRevenue?.toLocaleString() || '0'}`;
            document.getElementById('platformCommission').textContent = `XAF ${stats.platformCommission?.toLocaleString() || '0'}`;
            document.getElementById('agentEarnings').textContent = `XAF ${stats.agentEarnings?.toLocaleString() || '0'}`;
            document.getElementById('serviceFees').textContent = `XAF ${stats.serviceFees?.toLocaleString() || '0'}`;
            if (stats.totalRevenueChange) document.getElementById('totalRevenueChange').textContent = stats.totalRevenueChange;
            if (stats.platformCommissionChange) document.getElementById('platformCommissionChange').textContent = stats.platformCommissionChange;
            if (stats.agentEarningsChange) document.getElementById('agentEarningsChange').textContent = stats.agentEarningsChange;
            if (stats.serviceFeesChange) document.getElementById('serviceFeesChange').textContent = stats.serviceFeesChange;
        } catch (err) {
            document.getElementById('totalProperties').textContent = 'Error';
            document.getElementById('totalUsers').textContent = 'Error';
            document.getElementById('dashboardRevenue').textContent = 'Error';
            document.getElementById('verifiedAgents').textContent = 'Error';
            document.getElementById('totalRevenue').textContent = 'Error';
            document.getElementById('platformCommission').textContent = 'Error';
            document.getElementById('agentEarnings').textContent = 'Error';
            document.getElementById('serviceFees').textContent = 'Error';
        }
    }

    updateLeaderboard() {
        const leaderboardContainer = document.querySelector('.leaderboard-list');
        if (!leaderboardContainer) return;

        // Sort agents by number of properties listed, take top 10
        const topAgents = [...this.data.agents]
            .sort((a, b) => b.listings - a.listings)
            .slice(0, 10);

        leaderboardContainer.innerHTML = topAgents.map(agent => `
            <div class="leaderboard-item">
                <div class="agent-info">
                    <div class="profile-avatar" data-name="${agent.name}">${agent.initials}</div>
                    <div>
                        <h4>${agent.name}</h4>
                        <p>${agent.status === 'verified' ? 'Verified Agent' : 'Pending Verification'}</p>
                    </div>
                </div>
                <div class="agent-stats">
                    <span class="listings">${agent.listings} Properties</span>
                    <span class="revenue">XAF ${(agent.listings * 15000).toLocaleString()}</span>
                </div>
            </div>
        `).join('');
    }

    populateAgentsTable() {
        const tbody = document.getElementById('agentsTableBody');
        if (!tbody) return;

        // Show all users with their listing count
        tbody.innerHTML = this.data.agents.map(user => `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div class="profile-avatar" data-name="${user.name}" style="width: 35px; height: 35px; font-size: 0.8rem;">${user.initials || ''}</div>
                        <div>
                            <strong>${user.name}</strong>
                        </div>
                    </div>
                </td>
                <td>${user.email}</td>
                <td><strong>${user.listings}</strong> listing(s)</td>
                <td>
                    <span class="status-badge ${user.status}">
                        ${user.status === 'verified' ? 'Verified' : user.status === 'active' ? 'Active' : 'Pending'}
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn-sm btn-edit" onclick="adminDashboard.editAgent('${user.id}')">Edit</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    populateClientsTable() {
        const tbody = document.getElementById('clientsTableBody');
        if (!tbody) return;

        tbody.innerHTML = this.data.clients.map(client => `
            <tr>
                <td>
                    <div>
                        <strong>${client.name}</strong>
                        <br><small style="color: var(--gray-500);">Client ID: #${client.id}</small>
                    </div>
                </td>
                <td>${client.email}</td>
                <td><strong>${client.bookings}</strong> bookings</td>
                <td>
                    ${client.disputes > 0 ? 
                        `<span style="color: var(--danger-color); font-weight: 500;">${client.disputes} disputes</span>` :
                        `<span style="color: var(--success-color);">No disputes</span>`
                    }
                </td>
                <td>
                    <span class="status-badge ${client.status}">
                        ${client.status === 'active' ? 'Active' : 'Suspended'}
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        ${client.status === 'active' ?
                            `<button class="action-btn-sm btn-suspend" onclick="adminDashboard.suspendClient(${client.id})">Suspend</button>` :
                            `<button class="action-btn-sm btn-approve" onclick="adminDashboard.activateClient(${client.id})">Activate</button>`
                        }
                        <button class="action-btn-sm btn-edit" onclick="adminDashboard.editClient(${client.id})">Edit</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    populatePropertiesTable() {
        const tbody = document.getElementById('propertiesTableBody');
        if (!tbody) return;

        let filteredProperties = this.applyPropertyFilters();

        tbody.innerHTML = filteredProperties.map(property => `
            <tr>
                <td>
                    <div>
                        <strong>${property.title}</strong>
                        <br><small style="color: var(--gray-500);">${property.location.charAt(0).toUpperCase() + property.location.slice(1)} • ${property.type}</small>
                    </div>
                </td>
                <td>${property.agent}</td>
                <td><strong>$${property.price ? Number(property.price).toLocaleString() : '0'}</strong></td>
                <td>
                    <span class="status-badge ${property.status}">
                        ${property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                    </span>
                </td>
                <td>${this.formatDate(property.dateList)}</td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn-sm btn-delete" onclick="adminDashboard.deleteProperty('${property.id}', '${property.type === 'hotel' ? 'hotel' : 'listing'}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async populatePendingApprovals() {
        const container = document.getElementById('pendingPropertiesGrid');
        if (!container) return;
        // Fetch latest pending items from backend for accuracy
        try {
            const API_BASE_URL = 'https://cribzconnect-backend.onrender.com';
            const [pendingListingsRes, pendingHotelsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/listings?status=pending`),
                fetch(`${API_BASE_URL}/api/hotels?status=pending`)
            ]);
                const pendingListings = pendingListingsRes.ok ? await pendingListingsRes.json() : [];
                const pendingHotels = pendingHotelsRes.ok ? await pendingHotelsRes.json() : [];

                const pendingNormalized = [
                    ...pendingListings.map(p => ({
                        id: p._id,
                        title: p.title,
                        price: p.price,
                        agentId: p.userId,
                        agent: (this.data.agents.find(a => String(a.id) === String(p.userId))?.name) || p.userId,
                        type: 'listing',
                        image: (p.images && p.images.length) ? p.images[0] : 'https://via.placeholder.com/350x200'
                    })),
                    ...pendingHotels.map(h => ({
                        id: h._id,
                        title: h.name,
                        price: h.price,
                        agentId: h.userId,
                        agent: (this.data.agents.find(a => String(a.id) === String(h.userId))?.name) || h.userId,
                        type: 'hotel',
                        image: (h.images && h.images.length) ? h.images[0] : 'https://via.placeholder.com/350x200'
                    }))
                ];

                container.innerHTML = pendingNormalized.length === 0
                    ? `<div class="empty-state"><p>No pending items at the moment.</p></div>`
                    : pendingNormalized.map(property => `
                        <div class="pending-property-card">
                            <div class="property-image" style="background-image: url('${property.image}')"></div>
                            <div class="property-details">
                                <h4>${property.title}</h4>
                                <p>${property.type === 'hotel' ? 'Hotel listing' : 'Property listing'}</p>
                                <div class="property-meta">
                                    <div class="property-price">$${property.price ? Number(property.price).toLocaleString() : '0'}</div>
                                    <div class="property-agent">by ${property.agent}</div>
                                </div>
                                <div class="property-actions">
                                    <button class="action-btn-sm btn-approve" onclick="adminDashboard.approveProperty('${property.id}')">
                                        <i class="fas fa-check"></i> Approve
                                    </button>
                                    <button class="action-btn-sm btn-reject" onclick="adminDashboard.rejectProperty('${property.id}')">
                                        <i class="fas fa-times"></i> Reject
                                    </button>
                                    <button class="action-btn-sm btn-edit" onclick="adminDashboard.viewPropertyDetails('${property.id}')">
                                        <i class="fas fa-eye"></i> Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('');
        } catch (err) {
            console.error('Failed to fetch pending items:', err);
            container.innerHTML = `<div class="empty-state"><p>Unable to load pending items.</p></div>`;
        }
    }

    async populateTransactionsTable() {
        const tbody = document.getElementById('transactionsTableBody');
        if (!tbody) return;
        // Fetch transactions from backend
        try {
            const API_BASE_URL = 'https://cribzconnect-backend.onrender.com';
            const res = await fetch(`${API_BASE_URL}/api/admin/transactions`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
            });
            if (!res.ok) throw new Error('Failed to fetch transactions');
            const transactions = await res.json();
            tbody.innerHTML = transactions.map(transaction => `
                <tr>
                    <td><strong>${transaction.id}</strong></td>
                    <td>${transaction.tenant}</td>
                    <td>${transaction.agent}</td>
                    <td>${transaction.property}</td>
                    <td><strong>XAF ${transaction.amount.toLocaleString()}</strong></td>
                    <td>${this.formatDate(transaction.date)}</td>
                    <td>
                        <span class="status-badge ${transaction.status}">
                            ${transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                    </td>
                    <td>
                        <div class="table-actions">
                            <button class="action-btn-sm btn-edit" onclick="adminDashboard.viewTransaction('${transaction.id}')">
                                <i class="fas fa-eye"></i> View
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            tbody.innerHTML = '<tr><td colspan="8">Error loading transactions</td></tr>';
        }
    }

    populateDisputes() {
        const container = document.getElementById('disputesContainer');
        if (!container) return;

        const openDisputes = this.data.disputes.filter(d => d.status === 'open');

        container.innerHTML = openDisputes.map(dispute => `
            <div class="dispute-card">
                <div class="dispute-header">
                    <div class="dispute-info">
                        <h4>${dispute.title}</h4>
                        <p><strong>Tenant:</strong> ${dispute.tenant} vs <strong>Agent:</strong> ${dispute.agent}</p>
                        <p><strong>Property:</strong> ${dispute.property}</p>
                        <p><strong>Date:</strong> ${this.formatDate(dispute.date)}</p>
                    </div>
                    <span class="dispute-priority priority-${dispute.priority}">
                        ${dispute.priority.toUpperCase()} PRIORITY
                    </span>
                </div>
                <div class="dispute-description">
                    ${dispute.description}
                </div>
                <div class="dispute-actions">
                    <button class="action-btn-sm btn-approve" onclick="adminDashboard.resolveDispute(${dispute.id}, 'resolved')">
                        <i class="fas fa-check"></i> Mark Resolved
                    </button>
                    <button class="action-btn-sm btn-edit" onclick="adminDashboard.investigateDispute(${dispute.id})">
                        <i class="fas fa-search"></i> Investigate
                    </button>
                    <button class="action-btn-sm btn-reject" onclick="adminDashboard.escalateDispute(${dispute.id})">
                        <i class="fas fa-exclamation-triangle"></i> Escalate
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Filter Functions
    applyPropertyFilters() {
        let filtered = [...this.data.properties];

        const locationFilter = document.getElementById('propertyLocationFilter')?.value;
        const typeFilter = document.getElementById('propertyTypeFilter')?.value;
        const statusFilter = document.getElementById('propertyStatusFilter')?.value;

        if (locationFilter && locationFilter !== 'all') {
            filtered = filtered.filter(p => p.location === locationFilter);
        }

        if (typeFilter && typeFilter !== 'all') {
            filtered = filtered.filter(p => p.type === typeFilter);
        }

        if (statusFilter && statusFilter !== 'all') {
            filtered = filtered.filter(p => p.status === statusFilter);
        }

        return filtered;
    }

    applyFilters() {
        // Re-populate tables with filtered data
        if (this.currentTab === 'all-properties') {
            this.populatePropertiesTable();
        }
    }

    // Action Functions
    approveAgent(agentId) {
        const agent = this.data.agents.find(a => a.id === agentId);
        if (agent) {
            agent.status = 'verified';
            this.populateAgentsTable();
            this.showMessage('success', `Agent ${agent.name} has been approved and verified.`);
        }
    }

    suspendAgent(agentId) {
        const agent = this.data.agents.find(a => a.id === agentId);
        if (agent && confirm(`Are you sure you want to suspend ${agent.name}?`)) {
            agent.status = 'suspended';
            this.populateAgentsTable();
            this.showMessage('success', `Agent ${agent.name} has been suspended.`);
        }
    }

    editAgent(agentId) {
        this.showMessage('info', 'Agent edit functionality would open a detailed form here.');
    }

    async approveProperty(propertyId) {
        const property = this.data.properties.find(p => p.id === propertyId);
        if (!property) return;
        const API_BASE_URL = 'https://cribzconnect-backend.onrender.com';
        let url = '';
        if (property.type === 'hotel' || property.type === 'Hotel') {
            url = `${API_BASE_URL}/api/hotels/${propertyId}/approve`;
        } else {
            url = `${API_BASE_URL}/api/listings/${propertyId}/approve`;
        }
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(url, {
                method: 'PATCH',
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    'Content-Type': 'application/json'
                }
            });
            console.log('[approveProperty] response status=', res.status);
            const respBody = await res.text().catch(() => null);
            console.log('[approveProperty] response body=', respBody);
            if (!res.ok) throw new Error('Failed to approve property');
            // Refetch all properties and hotels to update status everywhere
            await this.fetchDashboardData();
            this.populatePropertiesTable();
            this.populatePendingApprovals();
            // Optionally, trigger a refresh in My Listings and public pages if needed
            if (window.listingsPage && typeof window.listingsPage.refreshListings === 'function') {
                window.listingsPage.refreshListings();
            }
            this.showMessage('success', `Property "${property.title}" has been approved and published.`);
        } catch (err) {
            this.showMessage('error', 'Could not approve property: ' + err.message);
        }
    }

    async rejectProperty(propertyId) {
        const property = this.data.properties.find(p => p.id === propertyId);
        if (!property) return;
        const API_BASE_URL = 'https://cribzconnect-backend.onrender.com';
        let url = '';
        if (property.type === 'hotel' || property.type === 'Hotel') {
            url = `${API_BASE_URL}/api/hotels/${propertyId}/approve`;
        } else {
            url = `${API_BASE_URL}/api/listings/${propertyId}/approve`;
        }
        const reason = prompt('Please provide a reason for rejection:');
        if (!reason) return;
        try {
            const token = localStorage.getItem('authToken');
            const res = await fetch(url, {
                method: 'PATCH',
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'draft', rejectionReason: reason })
            });
            console.log('[rejectProperty] response status=', res.status);
            const respBody = await res.text().catch(() => null);
            console.log('[rejectProperty] response body=', respBody);
            if (!res.ok) throw new Error('Failed to reject property');
            property.status = 'draft';
            property.rejectionReason = reason;
            this.showMessage('success', `Property "${property.title}" has been rejected and moved to draft.`);
            await this.fetchDashboardData();
            this.populatePropertiesTable();
            this.populatePendingApprovals();
        } catch (err) {
            this.showMessage('error', 'Could not reject property: ' + err.message);
        }
    }

    resolveDispute(disputeId, resolution) {
        const dispute = this.data.disputes.find(d => d.id === disputeId);
        if (dispute) {
            dispute.status = resolution;
            dispute.resolvedDate = new Date().toISOString().split('T')[0];
            this.populateDisputes();
            this.showMessage('success', `Dispute "${dispute.title}" has been marked as ${resolution}.`);
        }
    }

    // Modal Functions
    showAnnouncementModal() {
        const modal = document.getElementById('announcementModal');
        if (modal) {
            modal.classList.add('show');
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
        }
    }

    sendAnnouncement() {
        const subject = document.getElementById('announcementSubject')?.value;
        const message = document.getElementById('announcementMessage')?.value;
        const recipients = Array.from(document.querySelectorAll('#announcementModal input[type="checkbox"]:checked'))
            .map(cb => cb.value);

        if (subject && message && recipients.length > 0) {
            // Simulate sending announcement
            this.showMessage('success', `Announcement sent to ${recipients.join(', ')}.`);
            this.closeModal('announcementModal');
            
            // Clear form
            document.getElementById('announcementSubject').value = '';
            document.getElementById('announcementMessage').value = '';
            document.querySelectorAll('#announcementModal input[type="checkbox"]').forEach(cb => cb.checked = false);
        } else {
            this.showMessage('error', 'Please fill in all fields and select recipients.');
        }
    }

    saveSettings() {
        const siteName = document.getElementById('siteName')?.value;
        const currency = document.getElementById('defaultCurrency')?.value;
        const timezone = document.getElementById('timezone')?.value;
        const commission = document.getElementById('platformCommission')?.value;
        const minPayout = document.getElementById('minPayout')?.value;

        // Simulate saving settings
        this.showMessage('success', 'Settings saved successfully!');
    }

    // Utility Functions
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    showMessage(type, message) {
        // Create and show message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${message}
        `;

        // Insert at top of main content
        const mainContent = document.querySelector('.main-content');
        const contentHeader = document.querySelector('.content-header');
        if (mainContent && contentHeader && contentHeader.parentNode === mainContent) {
            mainContent.insertBefore(messageDiv, contentHeader.nextSibling);
        } else if (mainContent) {
            mainContent.appendChild(messageDiv);
        }

        // Remove after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    performSearch(query) {
        // Implement global search functionality
        console.log('Searching for:', query);
    }

    // Mobile Menu Functions
    setupMobileMenu() {
        const hamburgerMenu = document.getElementById('hamburgerMenu');
        const sidebar = document.getElementById('sidebar');
        const mobileOverlay = document.getElementById('mobileMenuOverlay');
        
        if (hamburgerMenu && sidebar && mobileOverlay) {
            // Hamburger menu click handler
            hamburgerMenu.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
            
            // Overlay click handler - close menu
            mobileOverlay.addEventListener('click', () => {
                this.closeMobileMenu();
            });
            
            // Close mobile menu when clicking on menu items
            document.addEventListener('click', (e) => {
                if (e.target.closest('.menu-item') || e.target.closest('.submenu-item')) {
                    if (window.innerWidth <= 768) {
                        this.closeMobileMenu();
                    }
                }
            });
        }
    }
    
    toggleMobileMenu() {
        const hamburgerMenu = document.getElementById('hamburgerMenu');
        const sidebar = document.getElementById('sidebar');
        const mobileOverlay = document.getElementById('mobileMenuOverlay');
        
        if (hamburgerMenu && sidebar && mobileOverlay) {
            const isOpen = sidebar.classList.contains('mobile-open');
            
            if (isOpen) {
                this.closeMobileMenu();
            } else {
                this.openMobileMenu();
            }
        }
    }
    
    openMobileMenu() {
        const hamburgerMenu = document.getElementById('hamburgerMenu');
        const sidebar = document.getElementById('sidebar');
        const mobileOverlay = document.getElementById('mobileMenuOverlay');
        
        if (hamburgerMenu && sidebar && mobileOverlay) {
            hamburgerMenu.classList.add('active');
            sidebar.classList.add('mobile-open');
            mobileOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    }
    
    closeMobileMenu() {
        const hamburgerMenu = document.getElementById('hamburgerMenu');
        const sidebar = document.getElementById('sidebar');
        const mobileOverlay = document.getElementById('mobileMenuOverlay');
        
        if (hamburgerMenu && sidebar && mobileOverlay) {
            hamburgerMenu.classList.remove('active');
            sidebar.classList.remove('mobile-open');
            mobileOverlay.classList.remove('active');
            document.body.style.overflow = ''; // Restore scrolling
        }
    }

    handleResize() {
        // Handle responsive behavior
        if (window.innerWidth <= 768) {
            // Mobile specific adjustments
        } else {
            // Close mobile menu when switching to desktop
            this.closeMobileMenu();
        }
    }

    startRealTimeUpdates() {
        // Simulate real-time updates
        setInterval(() => {
            // Update stats occasionally
            if (Math.random() < 0.1) { // 10% chance per interval
                this.data.stats.totalUsers += Math.floor(Math.random() * 5);
                this.data.stats.totalRevenue += Math.floor(Math.random() * 10000);
                this.updateDashboardStats();
            }
        }, 30000); // Every 30 seconds
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('adminUser');
            window.location.href = 'admin_login.html';
        }
    }
}

// Global functions for onclick handlers
function switchTab(tabName) {
    if (window.adminDashboard) {
        window.adminDashboard.switchTab(tabName);
    }
}

function showAnnouncementModal() {
    if (window.adminDashboard) {
        window.adminDashboard.showAnnouncementModal();
    }
}

function closeModal(modalId) {
    if (window.adminDashboard) {
        window.adminDashboard.closeModal(modalId);
    }
}

function sendAnnouncement() {
    if (window.adminDashboard) {
        window.adminDashboard.sendAnnouncement();
    }
}

function saveSettings() {
    if (window.adminDashboard) {
        window.adminDashboard.saveSettings();
    }
}

function logout() {
    if (window.adminDashboard) {
        window.adminDashboard.logout();
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    window.adminDashboard = new AdminDashboard();
});

// Close modals when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
});

// Handle escape key to close modals
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.show').forEach(modal => {
            modal.classList.remove('show');
        });
    }
});