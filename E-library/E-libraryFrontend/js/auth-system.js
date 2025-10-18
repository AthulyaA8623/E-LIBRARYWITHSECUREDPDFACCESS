// js/auth-system.js
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.token = null;
        this.init();
    }

    init() {
        console.log('🔐 AuthSystem initialized');
        this.loadStoredAuth();
        this.setupGlobalAuthHandlers();
    }

    loadStoredAuth() {
        // Try multiple possible token storage locations
        this.token = localStorage.getItem('token') || 
                    localStorage.getItem('authToken') || 
                    localStorage.getItem('adminToken');
        
        const userData = localStorage.getItem('user') || 
                        localStorage.getItem('currentUser');
        
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                console.log('👤 Loaded user:', this.currentUser);
            } catch (error) {
                console.error('❌ Error parsing user data:', error);
                this.clearAuth();
            }
        }
    }

    setupGlobalAuthHandlers() {
        // Global auth state change listeners
        document.addEventListener('authStateChange', (e) => {
            this.handleAuthStateChange(e.detail);
        });
    }

    async login(email, password) {
        try {
            console.log('🔐 Attempting login for:', email);
            
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            if (data.success) {
                this.setAuth(data.token, data.user);
                this.showNotification('Login successful!', 'success');
                return data;
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            this.showNotification(error.message, 'error');
            throw error;
        }
    }
    // ✅ FIXED CODE - Save only after backend success
async register(userData) {
    try {
        console.log('🔄 Starting registration...');
        
        // 1. Call backend FIRST - don't save anything yet
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const result = await response.json();
        
        // 2. ONLY save if backend says success
        if (result.success && result.user) {
            localStorage.setItem('user', JSON.stringify(result.user));
            localStorage.setItem('token', result.token);
            console.log('✅ Registration successful - data saved');
            return result;
        } else {
            // Backend failed - DON'T save anything
            console.log('❌ Registration failed:', result.message);
            throw new Error(result.message);
        }
        
    } catch (error) {
        console.error('❌ Registration error:', error);
        // Don't save ANYTHING on error
        throw error;
    }
}

    setAuth(token, user) {
        // Store in multiple formats for compatibility
        localStorage.setItem('token', token);
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        // Store admin token separately if user is admin
        if (user.role === 'admin') {
            localStorage.setItem('adminToken', token);
        }

        this.token = token;
        this.currentUser = user;

        // Dispatch auth state change event
        document.dispatchEvent(new CustomEvent('authStateChange', {
            detail: { user, isAuthenticated: true }
        }));

        console.log('✅ Auth set for user:', user.email);
    }

    logout() {
        console.log('🚪 Logging out user:', this.currentUser?.email);
        
        // Clear all auth-related storage
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('user');
        localStorage.removeItem('currentUser');
        
        this.token = null;
        this.currentUser = null;

        // Dispatch auth state change event
        document.dispatchEvent(new CustomEvent('authStateChange', {
            detail: { user: null, isAuthenticated: false }
        }));

        this.showNotification('Logged out successfully!', 'success');
        
        // Redirect to home page
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

    isAuthenticated() {
        return !!this.currentUser && !!this.token;
    }

    isAdmin() {
        return this.isAuthenticated() && this.currentUser.role === 'admin';
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getToken() {
        return this.token;
    }

    getLoginPath() {
        return './index.html';
    }

    handleAuthStateChange(detail) {
        console.log('🔄 Auth state changed:', detail);
        this.updateNavigation();
    }

    updateNavigation() {
        const userMenu = document.getElementById('userMenu');
        if (!userMenu) return;

        if (this.isAuthenticated()) {
            const initials = this.currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
            const dashboardPath = this.isAdmin() ? './admin/dashboard.html' : './user/dashboard.html';
            
            userMenu.innerHTML = `
                <div class="user-info">
                    <div class="avatar">${initials}</div>
                    <span>${this.currentUser.name}</span>
                </div>
                <a href="${dashboardPath}" class="btn btn-primary">
                    Dashboard
                </a>
                <button class="btn btn-danger" onclick="authSystem.logout()">Logout</button>
            `;
        } else {
            userMenu.innerHTML = `
                <a href="./index.html#login" class="btn btn-outline">Login</a>
                <a href="./index.html#register" class="btn btn-primary">Sign Up</a>
            `;
        }
    }

    requireAuth(requiredRole = null) {
        if (!this.isAuthenticated()) {
            this.showNotification('Please log in to access this page', 'warning');
            setTimeout(() => {
                window.location.href = this.getLoginPath();
            }, 1500);
            return false;
        }

        if (requiredRole && this.currentUser.role !== requiredRole) {
            this.showNotification('Access denied. Insufficient permissions.', 'error');
            setTimeout(() => {
                window.location.href = this.isAdmin() ? './admin/dashboard.html' : '../index.html';
            }, 1500);
            return false;
        }

        return true;
    }

    async verifyToken() {
        if (!this.token) return false;

        try {
            const response = await fetch('http://localhost:5000/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data.success;
            }
            return false;
        } catch (error) {
            console.error('Token verification failed:', error);
            return false;
        }
    }

    showNotification(message, type = 'info') {
        // Use MainApp's notification system if available, otherwise fallback
        if (window.mainApp && typeof window.mainApp.showNotification === 'function') {
            window.mainApp.showNotification(message, type);
        } else {
            // Fallback notification
            console.log(`${type.toUpperCase()}: ${message}`);
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }

    getSessionInfo() {
        return {
            isAuthenticated: this.isAuthenticated(),
            user: this.currentUser,
            token: this.token ? '***' + this.token.slice(-8) : null,
            isAdmin: this.isAdmin()
        };
    }

    clearAuth() {
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('user');
        localStorage.removeItem('currentUser');
        this.token = null;
        this.currentUser = null;
    }
}

// Initialize auth system globally
window.authSystem = new AuthSystem();