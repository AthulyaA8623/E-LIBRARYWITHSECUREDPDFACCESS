// user.js - User Dashboard Functionality with Error Handling

class UserDashboard {
    constructor() {
        this.API_BASE_URL = 'http://localhost:5000/api';
        this.token = localStorage.getItem('authToken');
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        this.initialize();
    }

    initialize() {
        if (!this.token || !this.currentUser) {
            window.location.href = 'login.html';
            return;
        }

        this.loadUserData();
        this.updateUserMenu();
        
        // Only load dashboard-specific data if we're on the dashboard page
        if (this.isDashboardPage()) {
            this.loadDashboardData();
        }
    }

    isDashboardPage() {
        return window.location.pathname.includes('dashboard.html');
    }

    async loadUserData() {
        try {
            // Update user name in welcome section (if element exists)
            const userNameElement = document.getElementById('userName');
            if (userNameElement && this.currentUser) {
                userNameElement.textContent = this.currentUser.name || 'User';
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    async loadDashboardData() {
        try {
            await this.loadRecentBooks();
            await this.loadFeaturedBooks();
            await this.updateUserStats();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    }

    async loadRecentBooks() {
        try {
            // Only run if we're on dashboard page and element exists
            if (!this.isDashboardPage()) return;
            
            const response = await fetch(`${this.API_BASE_URL}/books?limit=6&sort=newest`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.displayBooks(result.books || result.data, 'recentBooksGrid');
                }
            }
        } catch (error) {
            console.error('Error loading recent books:', error);
        }
    }

    async loadFeaturedBooks() {
        try {
            // Only run if we're on dashboard page and element exists
            if (!this.isDashboardPage()) return;
            
            const response = await fetch(`${this.API_BASE_URL}/books?featured=true&limit=6`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.displayBooks(result.books || result.data, 'featuredBooksGrid');
                }
            }
        } catch (error) {
            console.error('Error loading featured books:', error);
        }
    }

    async updateUserStats() {
        try {
            // Only run if we're on dashboard page
            if (!this.isDashboardPage()) return;

            const response = await fetch(`${this.API_BASE_URL}/users/stats/personal`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.safeUpdateStats(result.stats);
                }
            }
        } catch (error) {
            console.error('Error updating stats:', error);
            // Set default values if API fails
            this.setDefaultStats();
        }
    }

    safeUpdateStats(stats) {
        // Safely update each stat element only if it exists
        this.safeUpdateElement('totalBooksRead', stats.totalBooksRead || 0);
        this.safeUpdateElement('readingTime', this.formatReadingTime(stats.totalReadingTime || 0));
        this.safeUpdateElement('currentReads', stats.currentlyReading?.length || 0);
        this.safeUpdateElement('favorites', stats.favorites?.length || 0);
    }

    setDefaultStats() {
        // Set default values for dashboard stats
        this.safeUpdateElement('totalBooksRead', '0');
        this.safeUpdateElement('readingTime', '0h');
        this.safeUpdateElement('currentReads', '0');
        this.safeUpdateElement('favorites', '0');
    }

    safeUpdateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    displayBooks(books, containerId) {
        const container = document.getElementById(containerId);
        if (!container || !books) return;

        if (books.length === 0) {
            container.innerHTML = '<p>No books available.</p>';
            return;
        }

        container.innerHTML = books.map(book => `
            <div class="book-card" data-book-id="${book._id}">
                <div class="book-cover-container">
                    ${book.coverImage ? 
                        `<img src="http://localhost:5000${book.coverImage}" alt="${book.title}" class="book-cover" 
                              onerror="this.style.display='none'; this.nextElementSibling.style.display='block'">` : 
                        ''
                    }
                    <div class="default-cover" ${book.coverImage ? 'style="display:none"' : ''}>📚</div>
                </div>
                <h4 class="book-title">${this.escapeHtml(book.title)}</h4>
                <p class="book-author">by ${this.escapeHtml(book.author)}</p>
                <div class="book-actions">
                    <button class="btn btn-sm btn-primary" onclick="userDashboard.viewBook('${book._id}')">View</button>
                    ${book.accessLevel === 'premium' ? '<span class="premium-badge">Premium</span>' : ''}
                </div>
            </div>
        `).join('');
    }

    viewBook(bookId) {
        // Redirect to library page or open book details
        window.location.href = `library.html?book=${bookId}`;
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
                        <a href="#" class="dropdown-item" onclick="userDashboard.logout()">🚪 Logout</a>
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

    formatReadingTime(minutes) {
        if (minutes < 60) {
            return `${minutes}m`;
        } else {
            const hours = Math.floor(minutes / 60);
            return `${hours}h`;
        }
    }

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.href = '../index.html';
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
        // Simple notification system that works across all pages
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
    window.userDashboard = new UserDashboard();
});


