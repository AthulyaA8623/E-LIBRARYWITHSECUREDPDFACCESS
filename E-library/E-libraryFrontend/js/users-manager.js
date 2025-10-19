
// users-manager.js - Complete Users Management System
console.log('🔄 users-manager.js loaded successfully!');

class UsersManager {
    constructor() {
        console.log('👥 UsersManager initialized');
        this.API_BASE_URL = 'http://localhost:5000/api';
        this.token = localStorage.getItem('authToken');
        this.users = [];
        this.filteredUsers = [];
        this.currentPage = 1;
        this.usersPerPage = 10;
        this.searchTerm = '';
        this.filters = {
            role: '',
            status: ''
        };
        this.editingUserId = null;
        this.userToDelete = null;
        
        this.init();
    }

    async init() {
        console.log('🚀 Starting users manager...');
        await this.loadUsers();
        this.setupEventListeners();
        this.setupModalEvents();
        this.renderUsers();
        this.updateUserStats();
        console.log('✅ Users manager ready!');
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

        // Refresh button
        const refreshBtn = document.getElementById('refreshUsersBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshUsers());
        }

        console.log('✅ Event listeners setup complete');
    }

    setupModalEvents() {
        // Close modals when clicking the X button
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                    if (modal.id === 'editUserModal') {
                        this.editingUserId = null;
                    }
                    if (modal.id === 'deleteUserModal') {
                        this.userToDelete = null;
                    }
                }
            });
        });

        // Close modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                    if (modal.id === 'editUserModal') {
                        this.editingUserId = null;
                    }
                    if (modal.id === 'deleteUserModal') {
                        this.userToDelete = null;
                    }
                }
            });
        });

        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.style.display = 'none';
                });
                this.editingUserId = null;
                this.userToDelete = null;
            }
        });

        // Edit form submission
        const editForm = document.getElementById('editUserForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateUser();
            });
        }

        console.log('✅ Modal events setup complete');
    }

    async loadUsers() {
        try {
            console.log('📡 Fetching users from API...');
            this.showLoadingState();
            
            if (!this.token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${this.API_BASE_URL}/users`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('📦 API Response received:', result);
            
            if (result.success) {
                this.users = result.users.map(user => this.formatUserData(user));
                console.log(`✅ Successfully loaded ${this.users.length} users from MongoDB`);
                this.applyFilters();
                this.showNotification('Users loaded successfully!', 'success');
            } else {
                throw new Error(result.message || 'Invalid response format');
            }
        } catch (error) {
            console.error('❌ Error loading users:', error);
            this.showNotification(`Failed to load users: ${error.message}`, 'error');
            this.showErrorState();
        }
    }

    formatUserData(user) {
        return {
            id: user._id,
            name: user.name || 'Unknown User',
            email: user.email,
            role: user.role || 'user',
            status: user.isActive ? 'active' : 'inactive',
            joinDate: user.createdAt,
            lastLogin: user.lastLogin || 'Never',
            avatar: user.avatar,
            preferences: user.preferences || {}
        };
    }

    showLoadingState() {
        const tableBody = document.getElementById('usersTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="loading-state">
                        <div class="loading-spinner">⏳</div>
                        <h3>Loading users...</h3>
                        <p>Fetching data from database</p>
                    </td>
                </tr>
            `;
        }
    }

    showErrorState() {
        const tableBody = document.getElementById('usersTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <div class="empty-icon">❌</div>
                        <h3>Failed to load users</h3>
                        <p>Please check your connection and try again</p>
                        <button class="btn btn-primary" onclick="window.usersManager.loadUsers()" style="margin-top: 1rem;">
                            Retry
                        </button>
                    </td>
                </tr>
            `;
        }
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
        if (!tableBody) {
            console.error('❌ usersTableBody element not found!');
            return;
        }

        const startIndex = (this.currentPage - 1) * this.usersPerPage;
        const endIndex = startIndex + this.usersPerPage;
        const usersToShow = this.filteredUsers.slice(startIndex, endIndex);

        if (usersToShow.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <div class="empty-icon">🔍</div>
                        <h3>No users found</h3>
                        <p>Try adjusting your search or filters</p>
                        <button class="btn btn-outline" onclick="window.usersManager.clearFilters()" style="margin-top: 1rem;">
                            Clear Filters
                        </button>
                    </td>
                </tr>
            `;
        } else {
            tableBody.innerHTML = usersToShow.map(user => `
                <tr data-user-id="${user.id}">
                    <td>
                        <div class="user-cell">
                            <div class="user-avatar-small">${this.getUserInitials(user.name)}</div>
                            <div class="user-info">
                                <div class="user-name">${this.escapeHtml(user.name)}</div>
                                <div class="user-email">${this.escapeHtml(user.email)}</div>
                            </div>
                        </div>
                    </td>
                    <td>${this.escapeHtml(user.email)}</td>
                    <td>
                        <span class="role-badge role-${user.role}">${user.role}</span>
                    </td>
                    <td>${this.formatDate(user.joinDate)}</td>
                    <td>${this.formatDate(user.lastLogin) || 'Never'}</td>
                    <td>
                        <span class="status-badge status-${user.status}">${user.status}</span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon btn-view" onclick="window.usersManager.viewUserDetails('${user.id}')" title="View Details">
                                👁️
                            </button>
                            <button class="btn-icon btn-edit" onclick="window.usersManager.editUser('${user.id}')" title="Edit User">
                                ✏️
                            </button>
                            <button class="btn-icon btn-delete" onclick="window.usersManager.deleteUser('${user.id}')" title="Delete User">
                                🗑️
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }

        this.renderPagination();
        this.updateTableInfo();
        console.log(`✅ Rendered ${usersToShow.length} users in table`);
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
                    onclick="window.usersManager.changePage(${this.currentPage - 1})" 
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                ← Previous
            </button>
        `;

        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (startPage > 1) {
            paginationHtml += `<button class="pagination-btn" onclick="window.usersManager.changePage(1)">1</button>`;
            if (startPage > 2) {
                paginationHtml += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                        onclick="window.usersManager.changePage(${i})">
                    ${i}
                </button>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHtml += `<span class="pagination-ellipsis">...</span>`;
            }
            paginationHtml += `<button class="pagination-btn" onclick="window.usersManager.changePage(${totalPages})">${totalPages}</button>`;
        }

        // Next button
        paginationHtml += `
            <button class="pagination-btn ${this.currentPage === totalPages ? 'disabled' : ''}" 
                    onclick="window.usersManager.changePage(${this.currentPage + 1})" 
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                Next →
            </button>
        `;

        pagination.innerHTML = paginationHtml;
    }

    changePage(page) {
        this.currentPage = page;
        this.renderUsers();
        console.log(`📄 Changed to page ${page}`);
    }

    updateUserStats() {
        const totalUsers = this.users.length;
        const activeUsers = this.users.filter(user => user.status === 'active').length;
        const inactiveUsers = this.users.filter(user => user.status === 'inactive').length;
        const adminUsers = this.users.filter(user => user.role === 'admin').length;

        this.safeUpdateElement('totalUsersCount', totalUsers);
        this.safeUpdateElement('activeUsersCount', activeUsers);
        this.safeUpdateElement('inactiveUsersCount', inactiveUsers);
        this.safeUpdateElement('adminUsersCount', adminUsers);

        console.log(`📊 Stats updated - Total: ${totalUsers}, Active: ${activeUsers}, Admins: ${adminUsers}`);
    }

    safeUpdateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
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
    async viewUserDetails(userId) {
        try {
            const user = this.users.find(u => u.id === userId);
            if (!user) {
                this.showNotification('User not found', 'error');
                return;
            }

            // Show user details in modal
            const modal = document.getElementById('userDetailsModal');
            const content = document.getElementById('userDetailsContent');
            
            if (modal && content) {
                content.innerHTML = `
                    <div class="user-details-layout">
                        <div class="user-avatar-section">
                            <div class="user-avatar-large">
                                ${this.getUserInitials(user.name)}
                            </div>
                            <div class="user-stats">
                                <div class="stat-item">
                                    <span class="stat-label">Role</span>
                                    <span class="stat-value role-${user.role}">${user.role}</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Status</span>
                                    <span class="stat-value status-${user.status}">${user.status}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="user-info-section">
                            <h2>${this.escapeHtml(user.name)}</h2>
                            <p class="user-email">${this.escapeHtml(user.email)}</p>
                            
                            <div class="user-meta-grid">
                                <div class="meta-item">
                                    <strong>📅 Join Date:</strong>
                                    <span>${this.formatDate(user.joinDate)}</span>
                                </div>
                                <div class="meta-item">
                                    <strong>🔐 Last Login:</strong>
                                    <span>${this.formatDate(user.lastLogin) || 'Never'}</span>
                                </div>
                                <div class="meta-item">
                                    <strong>👤 Account Type:</strong>
                                    <span class="role-${user.role}">${user.role}</span>
                                </div>
                                <div class="meta-item">
                                    <strong>📊 Status:</strong>
                                    <span class="status-${user.status}">${user.status}</span>
                                </div>
                            </div>
                            
                            ${user.preferences && Object.keys(user.preferences).length > 0 ? `
                            <div class="user-preferences">
                                <h4>Preferences</h4>
                                <div class="preferences-grid">
                                    ${Object.entries(user.preferences).map(([key, value]) => `
                                        <div class="preference-item">
                                            <strong>${key}:</strong>
                                            <span>${value}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                `;
                
                modal.style.display = 'block';
            }
        } catch (error) {
            console.error('Error viewing user details:', error);
            this.showNotification('Error loading user details', 'error');
        }
    }

    editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            this.showNotification('User not found', 'error');
            return;
        }

        console.log('✏️ Editing user:', user.name);

        // Populate the edit form with user data
        this.setFormValue('editUserName', user.name);
        this.setFormValue('editUserEmail', user.email);
        this.setFormValue('editUserRole', user.role);
        this.setFormValue('editUserStatus', user.status);

        // Store the user ID for update
        this.editingUserId = userId;

        // Show the edit modal
        const modal = document.getElementById('editUserModal');
        if (modal) {
            modal.style.display = 'block';
            console.log('✅ Edit modal opened');
        } else {
            console.error('❌ Edit modal not found');
        }
    }

    setFormValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.value = value || '';
        }
    }

    async updateUser() {
        if (!this.editingUserId) {
            this.showNotification('No user selected for editing', 'error');
            return;
        }

        const name = document.getElementById('editUserName').value;
        const email = document.getElementById('editUserEmail').value;
        const role = document.getElementById('editUserRole').value;
        const status = document.getElementById('editUserStatus').value;

        // Basic validation
        if (!name || !email) {
            this.showNotification('Name and email are required', 'error');
            return;
        }

        if (!name.trim() || !email.trim()) {
            this.showNotification('Name and email cannot be empty', 'error');
            return;
        }

        try {
            console.log('🔄 Updating user:', this.editingUserId);
            
            const response = await fetch(`${this.API_BASE_URL}/users/${this.editingUserId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim(),
                    role,
                    isActive: status === 'active'
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `HTTP error! status: ${response.status}`);
            }

            if (result.success) {
                console.log('✅ User updated successfully:', result);
                
                // Reload users to get updated data
                await this.loadUsers();
                this.closeEditModal();
                this.showNotification('User updated successfully!', 'success');
            } else {
                throw new Error(result.message || 'Failed to update user');
            }
        } catch (error) {
            console.error('❌ Error updating user:', error);
            this.showNotification(`Failed to update user: ${error.message}`, 'error');
        }
    }

    closeEditModal() {
        const modal = document.getElementById('editUserModal');
        if (modal) {
            modal.style.display = 'none';
            // Reset the editing state
            this.editingUserId = null;
            console.log('✅ Edit modal closed');
        }
    }

    deleteUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) {
            this.showNotification('User not found', 'error');
            return;
        }

        // Show the delete confirmation modal
        this.showDeleteModal(userId, user.name);
    }

    showDeleteModal(userId, userName) {
        const modal = document.getElementById('deleteUserModal');
        const userNameElement = document.getElementById('deleteUserName');
        const confirmButton = document.getElementById('confirmDeleteBtn');

        if (!modal || !userNameElement || !confirmButton) {
            console.error('Delete modal elements not found');
            return;
        }

        // Store the user to be deleted
        this.userToDelete = { id: userId, name: userName };

        // Set the user name in the modal
        userNameElement.textContent = userName;

        // Remove any existing event listeners and add new one
        const newConfirmButton = confirmButton.cloneNode(true);
        confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);

        // Add event listener to the new button
        newConfirmButton.addEventListener('click', () => {
            this.performDeleteUser();
        });

        // Show the modal
        modal.style.display = 'block';
    }

    async performDeleteUser() {
        if (!this.userToDelete) return;

        const { id, name } = this.userToDelete;

        try {
            console.log(`🗑️ Deleting user: ${name}`);
            
            const response = await fetch(`${this.API_BASE_URL}/users/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `HTTP error! status: ${response.status}`);
            }

            if (result.success) {
                // Remove from local array
                this.users = this.users.filter(u => u.id !== id);
                this.applyFilters();
                this.closeDeleteModal();
                this.showNotification(`User "${name}" deleted successfully!`, 'success');
            } else {
                throw new Error(result.message || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showNotification(`Failed to delete user: ${error.message}`, 'error');
        } finally {
            this.userToDelete = null;
        }
    }

    closeDeleteModal() {
        const modal = document.getElementById('deleteUserModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.userToDelete = null;
    }

    // Utility Methods
    getUserInitials(name) {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }

    formatDate(dateString) {
        if (!dateString || dateString === 'Never') return 'Never';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    }

    escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return unsafe;
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        if (!container) {
            console.log(`Notification [${type}]:`, message);
            return;
        }
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-message">${this.escapeHtml(message)}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        container.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    // Public methods for HTML buttons
    refreshUsers() {
        console.log('🔄 Manual refresh triggered');
        this.loadUsers();
        this.showNotification('Refreshing users...', 'info');
    }

    clearFilters() {
        console.log('🗑️ Clearing all filters');
        const searchInput = document.getElementById('searchUsers');
        const roleFilter = document.getElementById('roleFilter');
        const statusFilter = document.getElementById('statusFilter');
        
        if (searchInput) searchInput.value = '';
        if (roleFilter) roleFilter.value = '';
        if (statusFilter) statusFilter.value = '';
        
        this.searchTerm = '';
        this.filters = { role: '', status: '' };
        
        this.applyFilters();
        this.showNotification('Filters cleared', 'info');
    }

    exportUsers() {
        console.log('📥 Exporting users data');
        const dataStr = JSON.stringify(this.users, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `users-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.showNotification('Users exported successfully!', 'success');
    }

    closeDetailsModal() {
        const modal = document.getElementById('userDetailsModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM fully loaded - initializing UsersManager');
    
    // Check authentication first
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || !['admin', 'moderator'].includes(user.role)) {
        console.error('❌ Access denied. Admin or moderator role required.');
        return;
    }
    
    window.usersManager = new UsersManager();
});

console.log('✅ users-manager.js setup complete - waiting for DOM...');

















