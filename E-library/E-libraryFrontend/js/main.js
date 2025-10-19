// js/main.js - UPDATED VERSION
class MainApp {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        console.log('🚀 MainApp initialized');
        
        // Wait for auth system to be ready
        if (window.authSystem) {
            this.currentUser = authSystem.getCurrentUser();
        }
        
        this.setupGlobalEventListeners();
        this.setupSmoothScrolling();
        this.setupAnimations();
        this.updateNavigation();
    }

    updateNavigation() {
        // Delegate to authSystem for navigation updates
        if (window.authSystem) {
            authSystem.updateNavigation();
        } else {
            this.fallbackNavigationUpdate();
        }
    }

    fallbackNavigationUpdate() {
        const userMenu = document.getElementById('userMenu');
        if (!userMenu) return;

        const userData = localStorage.getItem('user') || localStorage.getItem('currentUser');
        
        if (userData) {
            try {
                const user = JSON.parse(userData);
                const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
                const dashboardPath = user.role === 'admin' ? './admin/dashboard.html' : './user/dashboard.html';
                
                userMenu.innerHTML = `
                    <div class="user-info">
                        <div class="avatar">${initials}</div>
                        <span>${user.name}</span>
                    </div>
                    <a href="${dashboardPath}" class="btn btn-primary">
                        Dashboard
                    </a>
                    <button class="btn btn-danger" onclick="mainApp.logout()">Logout</button>
                `;
            } catch (error) {
                console.error('Error updating navigation:', error);
            }
        }
    }

    setupGlobalEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action]')) {
                this.handleGlobalAction(e.target);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Listen for auth state changes
        document.addEventListener('authStateChange', (e) => {
            console.log('🔄 MainApp detected auth state change');
            this.currentUser = e.detail.user;
            this.updateNavigation();
        });
    }

    handleGlobalAction(element) {
        const action = element.dataset.action;
        const target = element.dataset.target;

        switch (action) {
            case 'logout':
                this.logout();
                break;
            case 'toggle-theme':
                this.toggleTheme();
                break;
            case 'show-modal':
                this.showModal(target);
                break;
            case 'close-modal':
                this.closeModal(target);
                break;
        }
    }

    logout() {
        // Use authSystem logout if available, otherwise fallback
        if (window.authSystem) {
            authSystem.logout();
        } else {
            this.fallbackLogout();
        }
    }

    fallbackLogout() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('user');
        
        this.showNotification('Logged out successfully! Redirecting...', 'success');
        
        setTimeout(() => {
            const currentPath = window.location.pathname;
            let redirectPath = '';
            
            if (currentPath.includes('/admin/') || currentPath.includes('/user/')) {
                redirectPath = '../index.html';
            } else {
                redirectPath = './index.html';
            }
            
            window.location.replace(redirectPath);
        }, 1500);
    }

    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    setupAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.card, .stat-card, .book-card').forEach(el => {
            el.classList.add('animate-on-scroll');
            observer.observe(el);
        });
    }

    showNotification(message, type = 'info', title = '') {
        const container = document.getElementById('notificationContainer');
        if (!container) {
            console.log('Notification:', message);
            return;
        }

        const existingNotifications = container.querySelectorAll('.notification');
        if (existingNotifications.length > 2) {
            existingNotifications[0].remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-icon">${this.getNotificationIcon(type)}</div>
            <div class="notification-content">
                ${title ? `<div class="notification-title">${title}</div>` : ''}
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;

        container.appendChild(notification);
        notification.style.animation = 'slideInLeft 0.3s ease';

        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutLeft 0.3s ease';
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
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

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        this.showNotification(`Switched to ${newTheme} theme`, 'info');
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        });
    }

    formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize main app
window.mainApp = new MainApp();

// Global authentication protection
document.addEventListener('DOMContentLoaded', function() {
    const protectedPages = [
        'dashboard.html',
        'profile.html',
        'library.html',
        'reading.html',
        'users.html',
        'books.html',
        'add-book.html'
    ];
    
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage)) {
        // Use authSystem for protection
        if (window.authSystem) {
            let requiredRole = null;
            
            // Admin-only pages
            if (['users.html', 'books.html', 'add-book.html'].includes(currentPage)) {
                requiredRole = 'admin';
            }
            
            if (!authSystem.requireAuth(requiredRole)) {
                return;
            }
        } else {
            // Fallback protection
            const userData = localStorage.getItem('user') || localStorage.getItem('currentUser');
            if (!userData) {
                alert('Please log in to access this page');
                window.location.href = './index.html';
                return;
            }
        }
        
        // Update navigation
        if (window.mainApp) {
            mainApp.updateNavigation();
        }
    }
});

// Global functions
window.logout = function() {
    if (window.authSystem) {
        authSystem.logout();
    } else if (window.mainApp) {
        mainApp.logout();
    }
};

window.getSessionInfo = function() {
    if (window.authSystem) {
        return authSystem.getSessionInfo();
    }
    return {
        isAuthenticated: !!localStorage.getItem('user'),
        user: JSON.parse(localStorage.getItem('user') || 'null'),
        token: localStorage.getItem('token') ? '***' + localStorage.getItem('token').slice(-8) : null
    };
};





