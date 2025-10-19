// Admin Users Management for users.html
// Admin Users Management for users.html
console.log('🔄 admin-users.js script loaded');


class UsersManager {
    constructor() {
        this.users = [];
        this.filteredUsers = [];
        this.currentPage = 1;
        this.usersPerPage = 10;
        this.searchTerm = '';
        this.filters = {
            role: '',
            status: ''
        };
        this.init();
    }

    async init() {
        console.log('👥 UsersManager initialized');
        await this.loadUsers();
        this.setupEventListeners();
        this.renderUsers();
        this.updateUserStats();
    }

    async loadUsers() {
        try {
            console.log('📡 Loading users from MongoDB...');
            
            const response = await fetch('http://localhost:5000/api/users', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const result = await response.json();
                console.log('API Response:', result);
                
                if (result.success && result.data) {
                    this.users = result.data.map(user => ({
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        status: user.isActive ? 'active' : 'inactive',
                        joinDate: user.createdAt,
                        booksRead: 0,
                        bio: '',
                        interests: '',
                        lastLogin: user.lastLogin || 'Never',
                        avatar: user.avatar
                    }));
                    console.log('✅ Users loaded from MongoDB:', this.users.length);
                }
            } else {
                throw new Error('Failed to fetch users');
            }
        } catch (error) {
            console.error('❌ Error loading users from MongoDB:', error);
            this.showNotification('Failed to load users from database', 'error');
        }
        
        this.applyFilters();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchUsers');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.applyFilters();
            });
        }

        // Filter functionality
        const roleFilter = document.getElementById('roleFilter');
        const statusFilter = document.getElementById('statusFilter');
        
        if (roleFilter) {
            roleFilter.addEventListener('change', (e) => {
                this.filters.role = e.target.value;
                this.applyFilters();
            });
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.applyFilters();
            });
        }

        // Modal close events
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });
    }

    applyFilters() {
        let filtered = this.users;

        // Apply search filter
        if (this.searchTerm) {
            filtered = filtered.filter(user => 
                user.name.toLowerCase().includes(this.searchTerm) ||
                user.email.toLowerCase().includes(this.searchTerm)
            );
        }

        // Apply role filter
        if (this.filters.role) {
            filtered = filtered.filter(user => user.role === this.filters.role);
        }

        // Apply status filter
        if (this.filters.status) {
            filtered = filtered.filter(user => user.status === this.filters.status);
        }

        this.filteredUsers = filtered;
        this.currentPage = 1;
        this.renderUsers();
        this.updateUserStats();
    }

    renderUsers() {
        const tableBody = document.getElementById('usersTableBody');
        if (!tableBody) return;

        const startIndex = (this.currentPage - 1) * this.usersPerPage;
        const endIndex = startIndex + this.usersPerPage;
        const usersToShow = this.filteredUsers.slice(startIndex, endIndex);

        if (usersToShow.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data">
                        <div class="no-data-icon">👥</div>
                        <h3>No users found</h3>
                        <p>Try adjusting your search or filters</p>
                    </td>
                </tr>
            `;
        } else {
            tableBody.innerHTML = usersToShow.map(user => `
                <tr>
                    <td>
                        <div class="user-cell">
                            <div class="user-avatar-small">${this.getUserInitials(user.name)}</div>
                            <div class="user-info">
                                <div class="user-name">${user.name}</div>
                                <div class="user-email">${user.email}</div>
                            </div>
                        </div>
                    </td>
                    <td>${user.email}</td>
                    <td>
                        <span class="role-badge ${user.role}">${user.role}</span>
                    </td>
                    <td>${this.formatDate(user.joinDate)}</td>
                    <td>${user.booksRead}</td>
                    <td>
                        <span class="status-badge ${user.status}">${user.status}</span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-outline" onclick="usersManager.viewUser('${user.id}')" title="View Details">
                                👁️
                            </button>
                            <button class="btn btn-sm btn-primary" onclick="usersManager.editUser('${user.id}')" title="Edit User">
                                ✏️
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="usersManager.deleteUser('${user.id}')" title="Delete User">
                                🗑️
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        this.renderPagination();
        this.updateTableInfo();
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredUsers.length / this.usersPerPage);
        const pagination = document.getElementById('usersPagination');
        
        if (!pagination) return;

        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHtml = '';

        // Previous button
        paginationHtml += `
            <button class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
                    onclick="usersManager.changePage(${this.currentPage - 1})" 
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                ← Previous
            </button>
        `;

        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                        onclick="usersManager.changePage(${i})">
                    ${i}
                </button>
            `;
        }

        // Next button
        paginationHtml += `
            <button class="pagination-btn ${this.currentPage === totalPages ? 'disabled' : ''}" 
                    onclick="usersManager.changePage(${this.currentPage + 1})" 
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                Next →
            </button>
        `;

        pagination.innerHTML = paginationHtml;
    }

    changePage(page) {
        this.currentPage = page;
        this.renderUsers();
    }

    updateUserStats() {
        const totalUsers = this.users.length;
        const activeUsers = this.users.filter(user => user.status === 'active').length;
        const inactiveUsers = this.users.filter(user => user.status === 'inactive').length;
        const adminUsers = this.users.filter(user => user.role === 'admin').length;

        document.getElementById('totalUsersCount').textContent = totalUsers;
        document.getElementById('activeUsersCount').textContent = activeUsers;
        document.getElementById('inactiveUsersCount').textContent = inactiveUsers;
        document.getElementById('adminUsersCount').textContent = adminUsers;
    }

    updateTableInfo() {
        const tableInfo = document.getElementById('usersTableInfo');
        if (!tableInfo) return;

        const startIndex = (this.currentPage - 1) * this.usersPerPage + 1;
        const endIndex = Math.min(startIndex + this.usersPerPage - 1, this.filteredUsers.length);
        const total = this.filteredUsers.length;

        tableInfo.textContent = `Showing ${startIndex}-${endIndex} of ${total} users${this.searchTerm ? ' (filtered)' : ''}`;
    }

    // User Actions
    viewUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const modal = document.getElementById('userDetailsModal');
        const content = document.getElementById('userDetailsContent');

        if (!modal || !content) return;

        content.innerHTML = `
            <div class="user-profile">
                <div class="user-header">
                    <div class="user-avatar-large">${this.getUserInitials(user.name)}</div>
                    <div class="user-main-info">
                        <h4>${user.name}</h4>
                        <p>${user.email}</p>
                        <div class="user-tags">
                            <span class="role-badge ${user.role}">${user.role}</span>
                            <span class="status-badge ${user.status}">${user.status}</span>
                        </div>
                    </div>
                </div>
                <div class="user-details-grid">
                    <div class="detail-item">
                        <label>Joined Date:</label>
                        <span>${this.formatDate(user.joinDate)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Last Login:</label>
                        <span>${user.lastLogin}</span>
                    </div>
                    <div class="detail-item">
                        <label>Books Read:</label>
                        <span>${user.booksRead}</span>
                    </div>
                    <div class="detail-item">
                        <label>Role:</label>
                        <span>${user.role}</span>
                    </div>
                    <div class="detail-item">
                        <label>Status:</label>
                        <span class="status-badge ${user.status}">${user.status}</span>
                    </div>
                </div>
            </div>
        `;

        modal.style.display = 'block';
    }

    editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        // Populate edit form
        document.getElementById('editUserName').value = user.name;
        document.getElementById('editUserEmail').value = user.email;
        document.getElementById('editUserRole').value = user.role;
        document.getElementById('editUserStatus').value = user.status;
        document.getElementById('editUserBio').value = user.bio || '';
        document.getElementById('editUserInterests').value = user.interests || '';

        // Store current editing user ID
        this.editingUserId = userId;

        const modal = document.getElementById('editUserModal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    async updateUser() {
        if (!this.editingUserId) return;

        const name = document.getElementById('editUserName').value;
        const email = document.getElementById('editUserEmail').value;
        const role = document.getElementById('editUserRole').value;
        const status = document.getElementById('editUserStatus').value;
        const bio = document.getElementById('editUserBio').value;
        const interests = document.getElementById('editUserInterests').value;

        try {
            const response = await fetch(`http://localhost:5000/api/users/${this.editingUserId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({ 
                    name, 
                    email, 
                    role, 
                    isActive: status === 'active',
                    bio, 
                    interests 
                })
            });

            if (response.ok) {
                await this.loadUsers();
                this.closeEditModal();
                this.showNotification('User updated successfully!', 'success');
            } else {
                throw new Error('Failed to update user');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            this.showNotification('Failed to update user', 'error');
        }
    }

    async deleteUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        if (confirm(`Are you sure you want to delete user: ${user.name}? This action cannot be undone.`)) {
            try {
                const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.getAuthToken()}`
                    }
                });

                if (response.ok) {
                    await this.loadUsers();
                    this.showNotification('User deleted successfully!', 'success');
                } else {
                    throw new Error('Failed to delete user');
                }
            } catch (error) {
                console.error('Error deleting user:', error);
                this.showNotification('Failed to delete user', 'error');
            }
        }
    }

    // Utility Methods
    getUserInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    getAuthToken() {
        return localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
    }

    // Modal Management
    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }

    closeUserModal() {
        const modal = document.getElementById('userDetailsModal');
        if (modal) modal.style.display = 'none';
    }

    closeEditModal() {
        const modal = document.getElementById('editUserModal');
        if (modal) modal.style.display = 'none';
    }

    // Public methods for HTML onclick handlers
    refreshUsers() {
        this.loadUsers();
        this.showNotification('Users list refreshed!', 'info');
    }

    clearFilters() {
        const searchInput = document.getElementById('searchUsers');
        const roleFilter = document.getElementById('roleFilter');
        const statusFilter = document.getElementById('statusFilter');
        
        if (searchInput) searchInput.value = '';
        if (roleFilter) roleFilter.value = '';
        if (statusFilter) statusFilter.value = '';
        
        this.searchTerm = '';
        this.filters = {
            role: '',
            status: ''
        };
        
        this.applyFilters();
    }

    exportUsers() {
        // Simple export to JSON
        const dataStr = JSON.stringify(this.users, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'users-export.json';
        link.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Users exported successfully!', 'success');
    }

    showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        const container = document.getElementById('notificationContainer') || document.body;
        container.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }
}

// Initialize users manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.usersManager = new UsersManager();
});