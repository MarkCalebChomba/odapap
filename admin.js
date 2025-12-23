import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, getDoc, doc, updateDoc, orderBy, limit, startAfter, Timestamp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { app } from './js/firebase.js';
import { showNotification } from './notifications.js';

const auth = getAuth(app);
const db = getFirestore(app);

class AdminDashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.charts = {};
        this.orders = [];
        this.users = [];
        this.products = [];
        
        this.initializeAuth();
        this.setupEventListeners();
    }

    async initializeAuth() {
        onAuthStateChanged(auth, async (user) => {
            if (!user) {
                window.location.href = 'login.html';
                return;
            }

            // Check if user is admin
            const isAdmin = await this.checkAdminStatus(user.uid);
            if (!isAdmin) {
                showNotification('Access denied. Admin privileges required.');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                return;
            }

            this.currentUser = user;
            await this.loadAdminProfile();
            await this.loadDashboardData();
        });
    }

    async checkAdminStatus(uid) {
        try {
            const adminDoc = await getDoc(doc(db, "Admins", uid));
            return adminDoc.exists() && adminDoc.data().role === 'admin';
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    }

    async loadAdminProfile() {
        try {
            const userDoc = await getDoc(doc(db, "Users", this.currentUser.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                document.getElementById('adminName').textContent = userData.name || 'Admin';
            }
        } catch (error) {
            console.error('Error loading admin profile:', error);
        }
    }

    setupEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.switchSection(section);
            });
        });

        // Menu toggle
        document.getElementById('menuToggle').addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('collapsed');
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', async () => {
            if (confirm('Are you sure you want to logout?')) {
                await signOut(auth);
                window.location.href = 'login.html';
            }
        });

        // Order filters
        document.getElementById('orderStatusFilter')?.addEventListener('change', () => {
            this.filterOrders();
        });

        document.getElementById('orderSearch')?.addEventListener('input', (e) => {
            this.searchOrders(e.target.value);
        });

        // Close modal
        document.querySelector('.close-modal')?.addEventListener('click', () => {
            document.getElementById('orderDetailModal').style.display = 'none';
        });
    }

    switchSection(section) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Hide all sections
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
        });

        // Show selected section
        document.getElementById(`${section}-section`).classList.add('active');
        document.getElementById('pageTitle').textContent = this.getSectionTitle(section);

        this.currentSection = section;

        // Load section data
        switch(section) {
            case 'orders':
                this.loadOrders();
                break;
            case 'products':
                this.loadProducts();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'transactions':
                this.loadTransactions();
                break;
            case 'verifications':
                this.loadVerifications();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
        }
    }

    getSectionTitle(section) {
        const titles = {
            dashboard: 'Dashboard',
            orders: 'Order Management',
            products: 'Product Listings',
            users: 'User Management',
            transactions: 'Transactions',
            verifications: 'Payment Verifications',
            analytics: 'Analytics & Reports',
            settings: 'Settings'
        };
        return titles[section] || 'Dashboard';
    }

    async loadDashboardData() {
        try {
            // Load all statistics
            await Promise.all([
                this.loadOrderStats(),
                this.loadUserStats(),
                this.loadProductStats(),
                this.loadRevenueStats(),
                this.loadRecentOrders()
            ]);

            // Initialize charts
            this.initializeCharts();
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    }

    async loadOrderStats() {
        try {
            const ordersSnapshot = await getDocs(collection(db, "Orders"));
            const orders = [];
            let pendingCount = 0;
            let todayCount = 0;
            const today = new Date().setHours(0, 0, 0, 0);

            ordersSnapshot.forEach(doc => {
                const order = doc.data();
                orders.push(order);

                if (order.orderStatus === 'pending') pendingCount++;
                
                const orderDate = order.orderDate?.toDate ? order.orderDate.toDate() : new Date(order.orderDate);
                if (orderDate >= today) todayCount++;
            });

            this.orders = orders;
            document.getElementById('totalOrders').textContent = orders.length;
            document.getElementById('pendingOrders').textContent = pendingCount;
            document.getElementById('todayOrders').textContent = todayCount;
            document.getElementById('pendingOrdersBadge').textContent = pendingCount;
        } catch (error) {
            console.error('Error loading order stats:', error);
        }
    }

    async loadUserStats() {
        try {
            const usersSnapshot = await getDocs(collection(db, "Users"));
            document.getElementById('totalUsers').textContent = usersSnapshot.size;
            this.users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error loading user stats:', error);
        }
    }

    async loadProductStats() {
        try {
            const listingsSnapshot = await getDocs(collection(db, "Listings"));
            document.getElementById('totalListings').textContent = listingsSnapshot.size;
            this.products = listingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error loading product stats:', error);
        }
    }

    async loadRevenueStats() {
        try {
            let totalRevenue = 0;
            this.orders.forEach(order => {
                if (order.paymentStatus === 'completed') {
                    totalRevenue += order.totalAmount;
                }
            });
            document.getElementById('totalRevenue').textContent = `KES ${totalRevenue.toLocaleString()}`;
        } catch (error) {
            console.error('Error loading revenue stats:', error);
        }
    }

    async loadRecentOrders() {
        const recentOrders = this.orders
            .sort((a, b) => {
                const dateA = a.orderDate?.toDate ? a.orderDate.toDate() : new Date(a.orderDate);
                const dateB = b.orderDate?.toDate ? b.orderDate.toDate() : new Date(b.orderDate);
                return dateB - dateA;
            })
            .slice(0, 5);

        const listEl = document.getElementById('recentOrdersList');
        listEl.innerHTML = '';

        if (recentOrders.length === 0) {
            listEl.innerHTML = '<p style="text-align: center; color: #999;">No orders yet</p>';
            return;
        }

        recentOrders.forEach(order => {
            const orderDate = order.orderDate?.toDate ? order.orderDate.toDate() : new Date(order.orderDate);
            const item = document.createElement('div');
            item.className = 'recent-item';
            item.innerHTML = `
                <div>
                    <strong>${order.orderId}</strong>
                    <p>${order.buyerDetails?.name || 'Unknown'}</p>
                </div>
                <div>
                    <span class="status-badge ${order.orderStatus}">${order.orderStatus}</span>
                    <p class="text-small">${orderDate.toLocaleDateString()}</p>
                </div>
                <div>
                    <strong>KES ${order.totalAmount.toLocaleString()}</strong>
                </div>
            `;
            item.addEventListener('click', () => this.viewOrderDetails(order));
            listEl.appendChild(item);
        });
    }

    async loadOrders() {
        try {
            const ordersSnapshot = await getDocs(collection(db, "Orders"));
            this.orders = [];
            
            ordersSnapshot.forEach(doc => {
                this.orders.push({ id: doc.id, ...doc.data() });
            });

            this.displayOrders();
        } catch (error) {
            console.error('Error loading orders:', error);
        }
    }

    displayOrders(ordersToDisplay = this.orders) {
        const tbody = document.getElementById('ordersTableBody');
        tbody.innerHTML = '';

        if (ordersToDisplay.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No orders found</td></tr>';
            return;
        }

        ordersToDisplay.forEach(order => {
            const orderDate = order.orderDate?.toDate ? order.orderDate.toDate() : new Date(order.orderDate);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${order.orderId}</strong></td>
                <td>${order.buyerDetails?.name || 'N/A'}</td>
                <td>${order.items?.length || 0} items</td>
                <td>KES ${order.totalAmount.toLocaleString()}</td>
                <td><span class="badge ${order.paymentMethod}">${order.paymentMethod}</span></td>
                <td>
                    <select class="status-select" data-order-id="${order.id}" data-current-status="${order.orderStatus}">
                        <option value="pending" ${order.orderStatus === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="confirmed" ${order.orderStatus === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                        <option value="out_for_delivery" ${order.orderStatus === 'out_for_delivery' ? 'selected' : ''}>Out for Delivery</option>
                        <option value="delivered" ${order.orderStatus === 'delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="cancelled" ${order.orderStatus === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
                <td>${orderDate.toLocaleDateString()}</td>
                <td>
                    <button class="btn-icon" onclick="adminDashboard.viewOrderDetails(${JSON.stringify(order).replace(/"/g, '&quot;')})">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Add change listeners to status selects
        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', (e) => {
                this.updateOrderStatus(e.target.dataset.orderId, e.target.value, e.target.dataset.currentStatus);
            });
        });
    }

    async updateOrderStatus(orderId, newStatus, oldStatus) {
        try {
            if (confirm(`Update order status to "${newStatus}"?`)) {
                await updateDoc(doc(db, "Orders", orderId), {
                    orderStatus: newStatus,
                    updatedAt: Timestamp.now()
                });
                showNotification('Order status updated successfully');
                await this.loadOrders();
                await this.loadOrderStats();
            } else {
                // Revert select to old status
                const select = document.querySelector(`[data-order-id="${orderId}"]`);
                if (select) select.value = oldStatus;
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            showNotification('Error updating order status');
        }
    }

    viewOrderDetails(order) {
        const modal = document.getElementById('orderDetailModal');
        const content = document.getElementById('orderDetailContent');
        
        const orderDate = order.orderDate?.toDate ? order.orderDate.toDate() : new Date(order.orderDate);
        
        let itemsHTML = '<div class="order-items-list">';
        order.items.forEach(item => {
            itemsHTML += `
                <div class="order-item-detail">
                    <div>
                        <strong>${item.productName}</strong>
                        ${item.selectedVariation ? `<p class="text-small">${item.selectedVariation.title}: ${item.selectedVariation.attr_name}</p>` : ''}
                    </div>
                    <div>
                        <p>Qty: ${item.quantity}</p>
                        <p>KES ${item.pricePerUnit.toLocaleString()} × ${item.quantity}</p>
                        <strong>KES ${item.totalPrice.toLocaleString()}</strong>
                    </div>
                </div>
            `;
        });
        itemsHTML += '</div>';

        content.innerHTML = `
            <div class="order-detail-header">
                <h2>Order Details</h2>
                <span class="status-badge large ${order.orderStatus}">${order.orderStatus}</span>
            </div>
            <div class="order-detail-grid">
                <div class="detail-section">
                    <h3><i class="fas fa-info-circle"></i> Order Information</h3>
                    <p><strong>Order ID:</strong> ${order.orderId}</p>
                    <p><strong>Date:</strong> ${orderDate.toLocaleString()}</p>
                    <p><strong>Source:</strong> ${order.orderSource || 'cart'}</p>
                </div>
                <div class="detail-section">
                    <h3><i class="fas fa-user"></i> Customer Details</h3>
                    <p><strong>Name:</strong> ${order.buyerDetails?.name || 'N/A'}</p>
                    <p><strong>Phone:</strong> ${order.buyerDetails?.phone || 'N/A'}</p>
                    <p><strong>Location:</strong> ${order.buyerDetails?.location || 'N/A'}</p>
                    <p><strong>Delivery Address:</strong> ${order.buyerDetails?.deliveryAddress || 'N/A'}</p>
                </div>
                <div class="detail-section">
                    <h3><i class="fas fa-credit-card"></i> Payment Information</h3>
                    <p><strong>Method:</strong> ${order.paymentMethod}</p>
                    <p><strong>Status:</strong> <span class="badge ${order.paymentStatus}">${order.paymentStatus}</span></p>
                    ${order.mpesaTransactionId ? `<p><strong>M-Pesa Code:</strong> ${order.mpesaTransactionId}</p>` : ''}
                </div>
            </div>
            <div class="detail-section">
                <h3><i class="fas fa-shopping-bag"></i> Order Items</h3>
                ${itemsHTML}
            </div>
            <div class="detail-section">
                <h3><i class="fas fa-calculator"></i> Order Summary</h3>
                <div class="order-summary-detail">
                    <p><span>Subtotal:</span> <span>KES ${order.subtotal.toLocaleString()}</span></p>
                    <p><span>Shipping Fee:</span> <span>KES ${order.shippingFee.toLocaleString()}</span></p>
                    ${order.discount > 0 ? `<p><span>Discount:</span> <span>- KES ${order.discount.toLocaleString()}</span></p>` : ''}
                    <p class="total-row"><span><strong>Total Amount:</strong></span> <span><strong>KES ${order.totalAmount.toLocaleString()}</strong></span></p>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
    }

    filterOrders() {
        const status = document.getElementById('orderStatusFilter').value;
        let filtered = this.orders;

        if (status !== 'all') {
            filtered = this.orders.filter(order => order.orderStatus === status);
        }

        this.displayOrders(filtered);
    }

    searchOrders(searchTerm) {
        const filtered = this.orders.filter(order => 
            order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.buyerDetails?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.buyerDetails?.phone?.includes(searchTerm)
        );
        this.displayOrders(filtered);
    }

    async loadProducts() {
        const grid = document.getElementById('productsGrid');
        grid.innerHTML = '';

        if (this.products.length === 0) {
            grid.innerHTML = '<p style="text-align: center; color: #999; grid-column: 1/-1;">No products found</p>';
            return;
        }

        this.products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card-admin';
            card.innerHTML = `
                <img src="${product.photoTraceUrl || product.imageUrls?.[0] || 'images/placeholder.png'}" alt="${product.name}">
                <div class="product-info-admin">
                    <h4>${product.name}</h4>
                    <p class="product-brand">${product.brand || 'N/A'}</p>
                    <p class="product-price">KES ${product.price.toLocaleString()}</p>
                    <p class="product-stock">Stock: ${product.totalStock || 0}</p>
                    <p class="text-small">Category: ${product.category}</p>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    async loadUsers() {
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';

        if (this.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No users found</td></tr>';
            return;
        }

        for (const user of this.users) {
            // Get user's listing count
            const listingsQuery = query(collection(db, "Listings"), where("uploaderId", "==", user.id));
            const listingsSnapshot = await getDocs(listingsQuery);
            
            // Get user's order count
            const ordersQuery = query(collection(db, "Orders"), where("userId", "==", user.id));
            const ordersSnapshot = await getDocs(ordersQuery);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="text-small">${user.id.slice(0, 8)}...</td>
                <td>${user.name || 'N/A'}</td>
                <td>${user.email || 'N/A'}</td>
                <td>${user.phoneNumber || 'N/A'}</td>
                <td>${user.county || 'N/A'}, ${user.ward || 'N/A'}</td>
                <td>${listingsSnapshot.size}</td>
                <td>${ordersSnapshot.size}</td>
                <td class="text-small">${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
            `;
            tbody.appendChild(row);
        }
    }

    async loadTransactions() {
        try {
            const transactionsSnapshot = await getDocs(collection(db, "Transactions"));
            const tbody = document.getElementById('transactionsTableBody');
            tbody.innerHTML = '';

            if (transactionsSnapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No transactions found</td></tr>';
                return;
            }

            transactionsSnapshot.forEach(doc => {
                const transaction = doc.data();
                const date = transaction.createdAt?.toDate() || new Date();
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${transaction.mpesaTransactionId || doc.id}</td>
                    <td>${transaction.userId?.slice(0, 8)}...</td>
                    <td>${transaction.phoneNumber || 'N/A'}</td>
                    <td>KES ${transaction.amount?.toLocaleString()}</td>
                    <td><span class="badge ${transaction.status}">${transaction.status}</span></td>
                    <td>${date.toLocaleString()}</td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading transactions:', error);
        }
    }

    async loadVerifications() {
        try {
            const verificationsSnapshot = await getDocs(
                query(collection(db, "ManualVerifications"), where("status", "==", "pending"))
            );
            
            const container = document.getElementById('verificationsContainer');
            container.innerHTML = '';

            document.getElementById('verificationsBadge').textContent = verificationsSnapshot.size;

            if (verificationsSnapshot.empty) {
                container.innerHTML = '<p style="text-align: center; color: #999;">No pending verifications</p>';
                return;
            }

            verificationsSnapshot.forEach(doc => {
                const verification = doc.data();
                const card = document.createElement('div');
                card.className = 'verification-card';
                card.innerHTML = `
                    <div class="verification-header">
                        <h4>Manual Verification Request</h4>
                        <span class="badge pending">Pending</span>
                    </div>
                    <div class="verification-body">
                        <p><strong>Transaction Code:</strong> ${verification.transactionCode}</p>
                        <p><strong>Amount:</strong> KES ${verification.amount?.toLocaleString()}</p>
                        <p><strong>Phone:</strong> ${verification.phoneNumber}</p>
                        <p><strong>Date:</strong> ${verification.createdAt?.toDate().toLocaleString()}</p>
                    </div>
                    <div class="verification-actions">
                        <button class="btn-success" onclick="adminDashboard.approveVerification('${doc.id}')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn-danger" onclick="adminDashboard.rejectVerification('${doc.id}')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    </div>
                `;
                container.appendChild(card);
            });
        } catch (error) {
            console.error('Error loading verifications:', error);
        }
    }

    async approveVerification(verificationId) {
        try {
            if (confirm('Approve this payment verification?')) {
                await updateDoc(doc(db, "ManualVerifications", verificationId), {
                    status: 'approved',
                    approvedAt: Timestamp.now(),
                    approvedBy: this.currentUser.uid
                });
                showNotification('Verification approved');
                await this.loadVerifications();
            }
        } catch (error) {
            console.error('Error approving verification:', error);
            showNotification('Error approving verification');
        }
    }

    async rejectVerification(verificationId) {
        try {
            if (confirm('Reject this payment verification?')) {
                await updateDoc(doc(db, "ManualVerifications", verificationId), {
                    status: 'rejected',
                    rejectedAt: Timestamp.now(),
                    rejectedBy: this.currentUser.uid
                });
                showNotification('Verification rejected');
                await this.loadVerifications();
            }
        } catch (error) {
            console.error('Error rejecting verification:', error);
            showNotification('Error rejecting verification');
        }
    }

    initializeCharts() {
        // Order Status Chart
        this.createOrderStatusChart();
    }

    createOrderStatusChart() {
        const ctx = document.getElementById('orderStatusChart');
        if (!ctx) return;

        const statusCounts = {
            pending: 0,
            confirmed: 0,
            out_for_delivery: 0,
            delivered: 0,
            cancelled: 0
        };

        this.orders.forEach(order => {
            if (statusCounts.hasOwnProperty(order.orderStatus)) {
                statusCounts[order.orderStatus]++;
            }
        });

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Pending', 'Confirmed', 'Out for Delivery', 'Delivered', 'Cancelled'],
                datasets: [{
                    data: Object.values(statusCounts),
                    backgroundColor: ['#ff5722', '#2196F3', '#FFC107', '#4CAF50', '#9E9E9E']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true
            }
        });
    }

    async loadAnalytics() {
        // Placeholder for analytics charts
        showNotification('Analytics section - Charts will be implemented here');
    }
}

// Initialize admin dashboard
const adminDashboard = new AdminDashboard();
window.adminDashboard = adminDashboard; // Make it globally accessible for onclick handlers