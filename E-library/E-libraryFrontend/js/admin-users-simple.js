// Simple Users Manager - admin-users-simple.js
console.log('🔄 admin-users-simple.js loaded');

class SimpleUsersManager {
    constructor() {
        console.log('👥 SimpleUsersManager created');
        this.users = [];
        this.init();
    }

    async init() {
        console.log('👥 Starting initialization...');
        await this.loadUsers();
        this.renderUsers();
        this.updateStats();
        console.log('👥 Initialization complete');
    }

    async loadUsers() {
        try {
            console.log('📡 Fetching users from API...');
            const response = await fetch('http://localhost:5000/api/users');
            const result = await response.json();
            console.log('📡 API response:', result);
            
            if (result.success) {
                this.users = result.data;
                console.log(`✅ Loaded ${this.users.length} users`);
            }
        } catch (error) {
            console.error('❌ Error loading users:', error);
        }
    }

    renderUsers() {
        const tableBody = document.getElementById('usersTableBody');
        console.log('🔄 Rendering users table, tableBody exists:', !!tableBody);
        
        if (!tableBody) {
            console.error('❌ usersTableBody element not found!');
            return;
        }

        if (this.users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7">No users found</td></tr>';
            return;
        }

        tableBody.innerHTML = this.users.map(user => `
            <tr>
                <td>
                    <div class="user-cell">
                        <div class="user-avatar-small">${user.name.charAt(0)}</div>
                        <div class="user-info">
                            <div class="user-name">${user.name}</div>
                            <div class="user-email">${user.email}</div>
                        </div>
                    </div>
                </td>
                <td>${user.email}</td>
                <td><span class="role-badge ${user.role}">${user.role}</span></td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>0</td>
                <td><span class="status-badge ${user.isActive ? 'active' : 'inactive'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline">👁️</button>
                        <button class="btn btn-sm btn-primary">✏️</button>
                        <button class="btn btn-sm btn-danger">🗑️</button>
                    </div>
                </td>
            </tr>
        `).join('');

        console.log('✅ Users table rendered');
    }

    updateStats() {
        console.log('📊 Updating stats...');
        const totalUsers = this.users.length;
        const activeUsers = this.users.filter(user => user.isActive).length;
        const adminUsers = this.users.filter(user => user.role === 'admin').length;

        document.getElementById('totalUsersCount').textContent = totalUsers;
        document.getElementById('activeUsersCount').textContent = activeUsers;
        document.getElementById('inactiveUsersCount').textContent = totalUsers - activeUsers;
        document.getElementById('adminUsersCount').textContent = adminUsers;

        console.log('✅ Stats updated');
    }

    // Public methods for HTML buttons
    refreshUsers() {
        console.log('🔄 Refreshing users...');
        this.init();
    }

    clearFilters() {
        console.log('🗑️ Clearing filters...');
        document.getElementById('searchUsers').value = '';
        document.getElementById('roleFilter').value = '';
        document.getElementById('statusFilter').value = '';
        this.renderUsers();
    }

    exportUsers() {
        console.log('📥 Exporting users...');
        alert('Export functionality would be implemented here');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM Content Loaded - initializing SimpleUsersManager');
    window.usersManager = new SimpleUsersManager();
});