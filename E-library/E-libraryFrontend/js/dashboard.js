// dashboard.js - User Dashboard with Real Data
console.log('📊 dashboard.js loaded successfully!');

class DashboardManager {
    constructor() {
        this.API_BASE_URL = 'http://localhost:5000/api';
        this.token = localStorage.getItem('authToken');
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        this.init();
    }

    async init() {
        if (!this.token || !this.currentUser) {
            window.location.href = 'login.html';
            return;
        }

        await this.loadDashboardData();
        this.updateUserMenu();
        this.setupEventListeners();
    }

    async loadDashboardData() {
        try {
            console.log('📊 Loading dashboard data...');
            
            // Load user stats, recent books, and featured books in parallel
            const [statsResponse, recentBooksResponse, featuredBooksResponse] = await Promise.all([
                fetch(`${this.API_BASE_URL}/users/stats/personal`, {
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                }),
                fetch(`${this.API_BASE_URL}/books?limit=8&sort=newest`, {
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                }),
                fetch(`${this.API_BASE_URL}/books?featured=true&limit=8`, {
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                })
            ]);

            // Process user stats
            if (statsResponse.ok) {
                const statsResult = await statsResponse.json();
                if (statsResult.success) {
                    this.updateUserStats(statsResult.stats);
                }
            }

            // Process recent books
            if (recentBooksResponse.ok) {
                const recentResult = await recentBooksResponse.json();
                if (recentResult.success) {
                    this.displayBooks(recentResult.books || recentResult.data, 'recentBooksGrid');
                }
            }

            // Process featured books
            if (featuredBooksResponse.ok) {
                const featuredResult = await featuredBooksResponse.json();
                if (featuredResult.success) {
                    this.displayBooks(featuredResult.books || featuredResult.data, 'featuredBooksGrid');
                }
            }

            // Update user name in welcome section
            this.updateWelcomeSection();

        } catch (error) {
            console.error('❌ Error loading dashboard data:', error);
            this.showNotification('Error loading dashboard data', 'error');
            this.showLoadingStates();
        }
    }

    updateUserStats(stats) {
        console.log('📈 Updating user stats:', stats);
        
        // Update books read
        document.getElementById('totalBooksRead').textContent = stats.totalBooksRead || 0;
        
        // Update reading time (convert minutes to hours)
        const readingHours = Math.floor((stats.totalReadingTime || 0) / 60);
        document.getElementById('readingTime').textContent = `${readingHours}h`;
        
        // Update currently reading count
        document.getElementById('currentReads').textContent = stats.currentlyReading?.length || 0;
        
        // Update favorites count
        document.getElementById('favorites').textContent = stats.favorites?.length || 0;
    }

    updateWelcomeSection() {
        const userNameElement = document.getElementById('userName');
        if (userNameElement && this.currentUser) {
            userNameElement.textContent = this.currentUser.name || 'User';
        }
    }

    displayBooks(books, containerId) {
        const container = document.getElementById(containerId);
        if (!container || !books) return;

        if (books.length === 0) {
            container.innerHTML = this.getEmptyStateHTML('No books available');
            return;
        }

        container.innerHTML = books.map(book => `
            <div class="book-card" data-book-id="${book._id}">
                <div class="book-cover-container">
                    ${book.coverImage ? 
                        `<img src="http://localhost:5000${book.coverImage}" alt="${this.escapeHtml(book.title)}" class="book-cover"
                              onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
                        ''
                    }
                    <div class="default-cover" ${book.coverImage ? 'style="display:none"' : ''}>📚</div>
                    ${book.accessLevel === 'premium' ? '<span class="premium-badge">Premium</span>' : ''}
                </div>
                <h3 class="book-title">${this.escapeHtml(book.title)}</h3>
                <p class="book-author">by ${this.escapeHtml(book.author)}</p>
                <div class="book-actions">
                    <button class="btn btn-sm btn-primary" onclick="dashboardManager.viewBook('${book._id}')">
                        View
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="dashboardManager.addToReadingList('${book._id}')">
                        Save
                    </button>
                </div>
            </div>
        `).join('');
    }

    getEmptyStateHTML(message) {
        return `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-icon">📚</div>
                <h3>${message}</h3>
                <p>Check back later for new additions</p>
            </div>
        `;
    }

    showLoadingStates() {
        // Show loading skeletons for books
        const loadingHTML = `
            <div class="book-card loading-skeleton">
                <div class="skeleton-cover"></div>
                <div class="skeleton-text short"></div>
                <div class="skeleton-text medium"></div>
            </div>
        `.repeat(4);

        document.getElementById('recentBooksGrid').innerHTML = loadingHTML;
        document.getElementById('featuredBooksGrid').innerHTML = loadingHTML;
    }

    async viewBook(bookId) {
        // Redirect to library page with book ID
        window.location.href = `library.html?book=${bookId}`;
    }

    async addToReadingList(bookId) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/users/reading-list`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ bookId })
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Added to reading list!', 'success');
            } else {
                throw new Error(result.message || 'Failed to add to reading list');
            }
        } catch (error) {
            console.error('Error adding to reading list:', error);
            this.showNotification('Error adding to reading list', 'error');
        }
    }

    updateUserMenu() {
        const userMenu = document.getElementById('userMenu');
        if (userMenu && this.currentUser) {
            userMenu.innerHTML = `
                <div class="user-info">
                    <span class="user-name">${this.currentUser.name}</span>
                    <span class="user-role">${this.formatRole(this.currentUser.role)}</span>
                </div>
                <div class="dropdown">
                    <button class="dropdown-toggle">▼</button>
                    <div class="dropdown-menu">
                        <a href="profile.html" class="dropdown-item">👤 Profile</a>
                        <a href="dashboard.html" class="dropdown-item">📊 Dashboard</a>
                        <div class="dropdown-divider"></div>
                        <a href="#" class="dropdown-item" onclick="dashboardManager.logout()">🚪 Logout</a>
                    </div>
                </div>
            `;
        }
    }

    formatRole(role) {
        const roleMap = {
            'admin': 'Administrator',
            'moderator': 'Moderator',
            'premium': 'Premium User',
            'user': 'Standard User'
        };
        return roleMap[role] || role;
    }

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.href = '../index.html';
    }

    setupEventListeners() {
        // Refresh dashboard data every 5 minutes
        setInterval(() => {
            this.loadDashboardData();
        }, 5 * 60 * 1000);
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
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM fully loaded - initializing DashboardManager');
    window.dashboardManager = new DashboardManager();
});
