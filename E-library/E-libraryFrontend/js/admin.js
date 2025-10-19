// admin.js - Admin functionality for E-Library
class AdminManager {
    constructor() {
        this.currentUser = null;
        this.users = [];
        this.books = [];
        this.init();
    }
// Add this temporary method to test MongoDB connection
async testMongoDBConnection() {
    try {
        const response = await fetch('http://localhost:5000/api/health');
        const result = await response.json();
        console.log('MongoDB Users:', result);
    } catch (error) {
        console.error('MongoDB Connection Failed:', error);
    }
}

// Call it in your init method
async init() {
    this.checkAuth();
    await this.testMongoDBConnection(); // Add this line temporarily
    await this.loadData();
    this.setupEventListeners();
    this.updateUserMenu();
}


    checkAuth() {
        // Check if user is authenticated and has admin role
        if (typeof authSystem !== 'undefined') {
            const user = authSystem.getCurrentUser();
            if (!user || !['admin', 'moderator'].includes(user.role)) {
                authSystem.showNotification('Access denied. Admin or moderator role required.', 'error');
                setTimeout(() => window.location.href = '../index.html', 2000);
                return;
            }
            this.currentUser = user;
            console.log('🔧 Admin panel loaded for:', user.name);
        } else {
            console.error('Auth system not loaded');
        }
    }

   
async loadData() {
    await this.loadUsers(); // Add await here
    this.loadBooks();
}

async loadUsers() {
    try {
        console.log('📡 Loading users from MongoDB...');
        
        const token = this.getAuthToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Make sure current user is admin
        if (!this.currentUser || !['admin', 'moderator'].includes(this.currentUser.role)) {
            this.showNotification('Access denied. Admin privileges required.', 'error');
            return;
        }

        const response = await fetch('http://localhost:5000/api/users', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Response status:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('API Response:', result);
            
            if (result.success && result.users) {
                this.users = result.users.map(user => ({
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    status: user.isActive ? 'active' : 'inactive',
                    joinDate: user.createdAt,
                    booksRead: user.readingStats?.totalBooksRead || 0,
                    bio: user.bio || '',
                    interests: user.interests || '',
                    lastLogin: user.lastLogin || 'Never',
                    avatar: user.avatar
                }));
                console.log('✅ Users loaded from MongoDB:', this.users.length);
            } else {
                throw new Error(result.message || 'Invalid response format');
            }
        } else if (response.status === 401) {
            this.showNotification('Session expired. Please login again.', 'error');
            this.logout();
            return;
        } else if (response.status === 403) {
            this.showNotification('Access denied. Admin privileges required.', 'error');
            return;
        } else {
            console.error('HTTP Error:', response.status, response.statusText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('❌ Error loading users from MongoDB:', error);
        this.showNotification('Failed to load users from database: ' + error.message, 'error');
        
        // Fallback to localStorage
        this.loadUsersFromLocalStorage();
    }
    
    // Update user stats and table based on current page
    if (document.getElementById('usersTableBody')) {
        this.displayUsersTable(this.users);
        this.updateUserStats();
    }
}  


loadUsersFromLocalStorage() {
    const storedUsers = localStorage.getItem('libraryUsers');
    if (storedUsers) {
        this.users = JSON.parse(storedUsers);
        console.log('📁 Loaded users from localStorage:', this.users.length);
    } else {
        this.users = this.getSampleUsers();
        this.saveUsers();
        console.log('📝 Using sample users data');
    }
    
    // Update UI if we're on the users page
    if (document.getElementById('usersTableBody')) {
        this.displayUsersTable(this.users);
        this.updateUserStats();
    }
}   


getAuthToken() {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
}

    loadBooks() {
        // Load books from localStorage
        const storedBooks = localStorage.getItem('libraryBooks');
        if (storedBooks) {
            this.books = JSON.parse(storedBooks);
        }
        
        // Update book stats and table based on current page
        if (document.getElementById('booksTableBody')) {
            this.displayBooksTable(this.books);
            this.updateBookStats();
        }
    }

    getSampleUsers() {
        const currentDate = new Date().toISOString().split('T')[0];
        return [
            {
                id: '1',
                name: 'Admin User',
                email: 'admin@elibrary.com',
                password: 'admin123',
                role: 'admin',
                status: 'active',
                joinDate: '2024-01-15',
                booksRead: 45,
                bio: 'System Administrator',
                interests: 'Technology, Management, Leadership',
                lastLogin: currentDate
            },
            {
                id: '2',
                name: 'John Doe',
                email: 'john@example.com',
                password: 'user123',
                role: 'user',
                status: 'active',
                joinDate: '2024-02-20',
                booksRead: 12,
                bio: 'Book enthusiast and avid reader',
                interests: 'Fiction, Science, History',
                lastLogin: currentDate
            },
            {
                id: '3',
                name: 'Jane Smith',
                email: 'jane@example.com',
                password: 'user123',
                role: 'user',
                status: 'active',
                joinDate: '2024-03-10',
                booksRead: 8,
                bio: 'Love reading mystery novels',
                interests: 'Mystery, Thriller, Romance',
                lastLogin: '2024-03-25'
            },
            {
                id: '4',
                name: 'Mike Johnson',
                email: 'mike@example.com',
                password: 'user123',
                role: 'user',
                status: 'inactive',
                joinDate: '2024-01-05',
                booksRead: 3,
                bio: 'Casual reader',
                interests: 'Business, Self-help',
                lastLogin: '2024-02-15'
            },
            {
                id: '5',
                name: 'Sarah Wilson',
                email: 'sarah@example.com',
                password: 'user123',
                role: 'moderator',
                status: 'active',
                joinDate: '2024-02-28',
                booksRead: 25,
                bio: 'Content moderator and book reviewer',
                interests: 'All genres, Reviewing',
                lastLogin: currentDate
            }
        ];
    }

    saveUsers() {
        localStorage.setItem('libraryUsers', JSON.stringify(this.users));
    }

    updateUserMenu() {
        const userMenu = document.getElementById('userMenu');
        if (userMenu && this.currentUser) {
            userMenu.innerHTML = `
                <div class="user-dropdown">
                    <button class="user-btn">
                        <div class="user-avatar">${this.getUserInitials(this.currentUser.name)}</div>
                        <span>${this.currentUser.name}</span>
                        <span class="dropdown-arrow">▼</span>
                    </button>
                    <div class="dropdown-menu">
                        <div class="user-info">
                            <div class="user-avatar-large">${this.getUserInitials(this.currentUser.name)}</div>
                            <div class="user-details">
                                <strong>${this.currentUser.name}</strong>
                                <span>${this.currentUser.email}</span>
                                <span class="user-role ${this.currentUser.role}">${this.currentUser.role}</span>
                            </div>
                        </div>
                        <div class="dropdown-divider"></div>
                        <a href="dashboard.html" class="dropdown-item">📊 Dashboard</a>
                        <a href="profile.html" class="dropdown-item">👤 My Profile</a>
                        <div class="dropdown-divider"></div>
                        <a href="#" class="dropdown-item" onclick="adminManager.logout()">🚪 Logout</a>
                    </div>
                </div>
            `;

            // Add dropdown functionality
            this.setupUserDropdown();
        }
    }

    getUserInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    setupUserDropdown() {
        const userBtn = document.querySelector('.user-btn');
        const dropdownMenu = document.querySelector('.dropdown-menu');

        if (userBtn && dropdownMenu) {
            userBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownMenu.classList.toggle('show');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                dropdownMenu.classList.remove('show');
            });
        }
    }

    setupEventListeners() {
        // Search functionality for users page
        const searchUsers = document.getElementById('searchUsers');
        if (searchUsers) {
            searchUsers.addEventListener('input', (e) => {
                this.filterUsers(e.target.value);
            });
        }

        // Search functionality for books page
        const searchBooks = document.getElementById('searchBooks');
        if (searchBooks) {
            searchBooks.addEventListener('input', (e) => {
                this.filterBooks(e.target.value);
            });
        }

        // Filter functionality for users page
        const roleFilter = document.getElementById('roleFilter');
        const statusFilter = document.getElementById('statusFilter');
        
        if (roleFilter) {
            roleFilter.addEventListener('change', () => this.applyUserFilters());
        }
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.applyUserFilters());
        }

        // Filter functionality for books page
        const categoryFilter = document.getElementById('categoryFilter');
        const bookStatusFilter = document.getElementById('statusFilter');
        const sortBy = document.getElementById('sortBy');
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.applyBookFilters());
        }
        if (bookStatusFilter) {
            bookStatusFilter.addEventListener('change', () => this.applyBookFilters());
        }
        if (sortBy) {
            sortBy.addEventListener('change', () => this.applyBookFilters());
        }

        // Modal close functionality
        this.setupModalClose();
    }

    setupModalClose() {
        // Close modals when clicking close button or outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-modal') || e.target.classList.contains('modal')) {
                this.closeAllModals();
            }
        });

        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }
displayUsersTable(users) {
    const tableBody = document.getElementById('usersTableBody');
    if (!tableBody) return;

    if (users.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="no-data">
                    <div class="no-data-icon">👥</div>
                    <h3>No users found</h3>
                    <p>Try adjusting your search or filters</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = users.map(user => `
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
            <td>${user.booksRead || 0}</td>
            <td>
                <span class="status-badge ${user.status}">${user.status}</span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-outline" onclick="adminManager.viewUser('${user.id}')" title="View Details">
                        👁️
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="adminManager.editUser('${user.id}')" title="Edit User">
                        ✏️
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminManager.deleteUser('${user.id}')" title="Delete User">
                        🗑️
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    this.updateTableInfo('usersTableInfo', users.length);
}
  
updateUserStats() {
    const totalUsers = this.users.length;
    const activeUsers = this.users.filter(user => user.status === 'active').length;
    const inactiveUsers = this.users.filter(user => user.status === 'inactive').length;
    const adminUsers = this.users.filter(user => user.role === 'admin').length;

    const totalUsersCount = document.getElementById('totalUsersCount');
    const activeUsersCount = document.getElementById('activeUsersCount');
    const inactiveUsersCount = document.getElementById('inactiveUsersCount');
    const adminUsersCount = document.getElementById('adminUsersCount');

    if (totalUsersCount) totalUsersCount.textContent = totalUsers;
    if (activeUsersCount) activeUsersCount.textContent = activeUsers;
    if (inactiveUsersCount) inactiveUsersCount.textContent = inactiveUsers;
    if (adminUsersCount) adminUsersCount.textContent = adminUsers;
}

    filterUsers(searchTerm) {
        const filteredUsers = this.users.filter(user => 
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.displayUsersTable(filteredUsers);
    }

    applyUserFilters() {
        const roleFilter = document.getElementById('roleFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        
        let filteredUsers = this.users;

        if (roleFilter) {
            filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
        }

        if (statusFilter) {
            filteredUsers = filteredUsers.filter(user => user.status === statusFilter);
        }

        this.displayUsersTable(filteredUsers);
    }

    viewUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const modal = document.getElementById('userDetailsModal');
        const content = document.getElementById('userDetailsContent');
        
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
                        <span>${this.formatDate(user.lastLogin)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Books Read:</label>
                        <span>${user.booksRead || 0}</span>
                    </div>
                    <div class="detail-item">
                        <label>Bio:</label>
                        <span>${user.bio || 'No bio provided'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Interests:</label>
                        <span>${user.interests || 'No interests specified'}</span>
                    </div>
                </div>
            </div>
        `;

        modal.style.display = 'block';
    }

    editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        document.getElementById('editUserName').value = user.name;
        document.getElementById('editUserEmail').value = user.email;
        document.getElementById('editUserRole').value = user.role;
        document.getElementById('editUserStatus').value = user.status;
        document.getElementById('editUserBio').value = user.bio || '';
        document.getElementById('editUserInterests').value = user.interests || '';

        // Store current editing user ID
        this.editingUserId = userId;

        const modal = document.getElementById('editUserModal');
        modal.style.display = 'block';
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
        const token = this.getAuthToken();
        const response = await fetch(`http://localhost:5000/api/users/${this.editingUserId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                name, 
                role, 
                isActive: status === 'active' 
            })
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                // Reload users from MongoDB to get updated data
                await this.loadUsers();
                this.closeAllModals();
                this.showNotification('User updated successfully!', 'success');
            } else {
                throw new Error(result.message || 'Failed to update user');
            }
        } else if (response.status === 403) {
            this.showNotification('Access denied. Admin privileges required.', 'error');
        } else {
            throw new Error('Failed to update user');
        }
    } catch (error) {
        console.error('Error updating user:', error);
        this.showNotification('Failed to update user: ' + error.message, 'error');
    }

}
async deleteUser(userId) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;

    if (confirm(`Are you sure you want to delete user: ${user.name}?`)) {
        try {
            const token = this.getAuthToken();
            const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // Reload users from MongoDB
                    await this.loadUsers();
                    this.showNotification('User deleted successfully!', 'success');
                } else {
                    throw new Error(result.message || 'Failed to delete user');
                }
            } else if (response.status === 403) {
                this.showNotification('Access denied. Admin privileges required.', 'error');
            } else {
                throw new Error('Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showNotification('Failed to delete user: ' + error.message, 'error');
        }
    }
}
showNotification(message, type = 'info') {
    if (typeof authSystem !== 'undefined') {
        authSystem.showNotification(message, type);
    } else {
        // Fallback notification
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

    // Book Management Methods (for books.html)
    displayBooksTable(books) {
        const tableBody = document.getElementById('booksTableBody');
        if (!tableBody) return;

        if (books.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="no-data">
                        <div class="no-data-icon">📚</div>
                        <p>No books found</p>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = books.map(book => `
            <tr>
                <td>
                    <input type="checkbox" class="book-checkbox" value="${book.id}">
                </td>
                <td>
                    <div class="book-cell">
                        <div class="book-cover-small">
                            ${book.coverUrl ? 
                                `<img src="${book.coverUrl}" alt="${book.title}">` : 
                                '📚'
                            }
                        </div>
                        <div class="book-info">
                            <div class="book-title">${book.title}</div>
                            <div class="book-isbn">${book.isbn || 'No ISBN'}</div>
                        </div>
                    </div>
                </td>
                <td>${book.author}</td>
                <td>
                    <span class="category-badge">${book.category}</span>
                </td>
                <td>${book.downloads || 0}</td>
                <td>
                    <div class="rating">
                        <span class="rating-stars">${this.getStarRating(book.rating || 0)}</span>
                       <span class="rating-value">${(Number(book.rating) || 0).toFixed(1)}</span>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${book.status || 'active'}">${book.status || 'active'}</span>
                </td>
                <td>${this.formatDate(book.addedDate)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-outline" onclick="adminManager.viewBook('${book.id}')" title="View Details">
                            👁️
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="adminManager.editBook('${book.id}')" title="Edit Book">
                            ✏️
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminManager.deleteBook('${book.id}')" title="Delete Book">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        this.updateTableInfo('tableInfo', books.length);
    }

    updateBookStats() {
        const totalBooks = this.books.length;
        const activeBooks = this.books.filter(book => book.status === 'active').length;
        const featuredBooks = this.books.filter(book => book.featured).length;
        const totalDownloads = this.books.reduce((sum, book) => sum + (book.downloads || 0), 0);

        if (document.getElementById('totalBooksCount')) {
            document.getElementById('totalBooksCount').textContent = totalBooks;
            document.getElementById('activeBooksCount').textContent = activeBooks;
            document.getElementById('featuredBooksCount').textContent = featuredBooks;
            document.getElementById('totalDownloads').textContent = totalDownloads;
        }
    }

    filterBooks(searchTerm) {
        const filteredBooks = this.books.filter(book => 
            book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (book.isbn && book.isbn.includes(searchTerm))
        );
        this.displayBooksTable(filteredBooks);
    }

    applyBookFilters() {
        const categoryFilter = document.getElementById('categoryFilter')?.value || '';
        const statusFilter = document.getElementById('statusFilter')?.value || '';
        const sortBy = document.getElementById('sortBy')?.value || 'newest';
        
        let filteredBooks = [...this.books];

        if (categoryFilter) {
            filteredBooks = filteredBooks.filter(book => book.category === categoryFilter);
        }

        if (statusFilter) {
            filteredBooks = filteredBooks.filter(book => book.status === statusFilter);
        }

        // Sort books
        filteredBooks.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.addedDate) - new Date(a.addedDate);
                case 'oldest':
                    return new Date(a.addedDate) - new Date(b.addedDate);
                case 'popular':
                    return (b.downloads || 0) - (a.downloads || 0);
                case 'title':
                    return a.title.localeCompare(b.title);
                default:
                    return 0;
            }
        });

        this.displayBooksTable(filteredBooks);
    }

    // Utility Methods
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    getStarRating(rating) {
        const fullStars = '⭐'.repeat(Math.floor(rating));
        const halfStar = rating % 1 >= 0.5 ? '⭐' : '';
        const emptyStars = '☆'.repeat(5 - Math.ceil(rating));
        return fullStars + halfStar + emptyStars;
    }

    updateTableInfo(elementId, count) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = `Showing ${count} ${count === 1 ? 'item' : 'items'}`;
        }
    }

    logout() {
        if (typeof authSystem !== 'undefined') {
            authSystem.logout();
        } else {
            window.location.href = '../index.html';
        }
    }
}

// Initialize Admin Manager
const adminManager = new AdminManager();

// Export functionality for booksManager and usersManager (for your existing HTML onclick handlers)
const booksManager = {
    clearFilters: () => adminManager.applyBookFilters(),
    exportBooks: () => alert('Export books functionality would be implemented here'),
    bulkDelete: () => alert('Bulk delete functionality would be implemented here'),
    toggleSelectAll: (checkbox) => {
        const bookCheckboxes = document.querySelectorAll('.book-checkbox');
        bookCheckboxes.forEach(cb => cb.checked = checkbox.checked);
    },
    closeEditModal: () => adminManager.closeAllModals(),
    closeDeleteModal: () => adminManager.closeAllModals(),
    closeBulkDeleteModal: () => adminManager.closeAllModals(),
    closeDetailsModal: () => adminManager.closeAllModals(),
    updateBook: () => alert('Update book functionality would be implemented here'),
    editBookFromDetails: () => alert('Edit book from details functionality would be implemented here'),
    confirmBulkDelete: () => alert('Confirm bulk delete functionality would be implemented here')
};

const usersManager = {
    clearFilters: () => adminManager.applyUserFilters(),
    exportUsers: () => alert('Export users functionality would be implemented here'),
    refreshUsers: () => adminManager.loadUsers(),
    closeUserModal: () => adminManager.closeAllModals(),
    closeEditModal: () => adminManager.closeAllModals(),
    editUser: () => {
        if (adminManager.editingUserId) {
            adminManager.updateUser();
        }
    },
    updateUser: () => {
        if (adminManager.editingUserId) {
            adminManager.updateUser();
        }
    }
};

// Make functions global for HTML onclick handlers
window.booksManager = booksManager;
window.usersManager = usersManager;
window.adminManager = adminManager;