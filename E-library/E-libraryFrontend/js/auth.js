// Complete Authentication System
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.registeredUsers = [];
        this.init();
    }

init() {
    console.log('🔧 AuthSystem initialized');
    this.setupNotificationContainer();
   // this.loadRegisteredUsers();
   // this.setupDemoUsers();
    this.createAdminInBackend(); // ← Call the correct method
    this.clearFormsOnLoad();
    this.checkExistingSession();
    this.setupAuthForms();
}


    setupNotificationContainer() {
        if (!document.getElementById('notificationContainer')) {
            const container = document.createElement('div');
            container.className = 'notification-container';
            container.id = 'notificationContainer';
            document.body.appendChild(container);
        }
    }

    checkExistingSession() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        console.log('🔧 Current user from storage:', this.currentUser);
        
        if (this.currentUser) {
            console.log('🔧 User already logged in');
            this.updateNavigation();
            
            if (window.location.pathname.includes('login.html') || 
                window.location.pathname.includes('signup.html')) {
                console.log('🔧 Redirecting to dashboard from auth page');
                setTimeout(() => {
                    this.redirectToDashboard();
                }, 1000);
            }
        }
    }

    setupAuthForms() {
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSignup(e);
            });

            this.setupSignupValidation();
        }
    }

    setupSignupValidation() {
        const signupForm = document.getElementById('signupForm');
        if (!signupForm) return;

        const passwordInput = signupForm.querySelector('#password');
        const confirmInput = signupForm.querySelector('#confirmPassword');
        const emailInput = signupForm.querySelector('#email');

        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => {
                this.validatePasswordStrength(e.target.value);
                this.checkPasswordMatch();
            });
        }

        if (confirmInput) {
            confirmInput.addEventListener('input', this.checkPasswordMatch.bind(this));
        }
    }

    validatePasswordStrength(password) {
        const requirements = {
            length: password.length >= 6,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        const strength = Object.values(requirements).filter(Boolean).length;
        this.updatePasswordStrengthUI(strength, requirements);
        return strength >= 3;
    }

    updatePasswordStrengthUI(strength, requirements) {
        let strengthElement = document.getElementById('passwordStrength');
        if (!strengthElement) {
            strengthElement = document.createElement('div');
            strengthElement.id = 'passwordStrength';
            strengthElement.style.marginTop = '0.5rem';
            strengthElement.style.fontSize = '0.8rem';
            
            const passwordInput = document.querySelector('#password');
            if (passwordInput) {
                passwordInput.parentNode.appendChild(strengthElement);
            }
        }

        const strengthText = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength];
        const strengthColors = ['#e74c3c', '#e67e22', '#f39c12', '#f1c40f', '#2ecc71', '#27ae60'];
        
        strengthElement.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div style="width: 100px; height: 4px; background: #ecf0f1; border-radius: 2px; overflow: hidden;">
                    <div style="width: ${(strength / 5) * 100}%; height: 100%; background: ${strengthColors[strength]}; transition: all 0.3s;"></div>
                </div>
                <span style="color: ${strengthColors[strength]}; font-weight: 600;">${strengthText}</span>
            </div>
            <div style="margin-top: 0.25rem; font-size: 0.7rem; color: #7f8c8d;">
                ${!requirements.uppercase ? '⭕ Uppercase ' : '✅ Uppercase '}
                ${!requirements.lowercase ? '⭕ Lowercase ' : '✅ Lowercase '}
                ${!requirements.number ? '⭕ Number ' : '✅ Number '}
                ${!requirements.special ? '⭕ Special char ' : '✅ Special char '}
                ${!requirements.length ? '⭕ 6+ chars' : '✅ 6+ chars'}
            </div>
        `;
    }

    checkPasswordMatch() {
        const password = document.getElementById('password')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        const confirmInput = document.getElementById('confirmPassword');

        if (!confirmInput) return;

        if (confirmPassword && password !== confirmPassword) {
            confirmInput.style.borderColor = '#e74c3c';
            confirmInput.style.boxShadow = '0 0 0 2px rgba(231, 76, 60, 0.1)';
        } else if (confirmPassword) {
            confirmInput.style.borderColor = '#27ae60';
            confirmInput.style.boxShadow = '0 0 0 2px rgba(39, 174, 96, 0.1)';
        } else {
            confirmInput.style.borderColor = '';
            confirmInput.style.boxShadow = '';
        }
    }

    async handleLogin() {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const button = document.querySelector('#loginForm button');
console.log('🔍 Email (with quotes):', `"${email}"`);
console.log('🔍 Password (with quotes):', `"${password}"`);
console.log('🔍 Email length:', email.length);
console.log('🔍 Password length:', password.length);
        if (!email || !password) {
            this.showNotification('Please fill in all fields', 'error', 'Missing Information');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showNotification('Please enter a valid email address', 'error', 'Invalid Email');
            return;
        }

        this.setButtonLoading(button, true);

        try {
            const response = await fetch("http://localhost:5000/api/auth/login", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({                email: document.getElementById('email').value,
                password: document.getElementById('password').value}),
            });

        const data = await response.json();
console.log('📄 Full error response:', data);

 if (data.success) {
        console.log('🎯 LOGIN SUCCESS - Full response:', data);
        console.log('🎯 User role:', data.user.role);
        console.log('🎯 User data:', data.user);
        
        this.currentUser = data.user;
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        localStorage.setItem('authToken', data.token);
        
        // Debug: Check what's stored in localStorage
        console.log('💾 Stored in localStorage - currentUser:', localStorage.getItem('currentUser'));
        console.log('💾 Stored in localStorage - authToken:', localStorage.getItem('authToken'));
        
        this.showNotification(`Welcome back, ${data.user.name}!`, 'success', 'Login Successful');
        
        setTimeout(() => {
            console.log('🕒 Timeout finished, calling redirectToDashboard...');
            this.redirectToDashboard();
        }, 1500);
    }

             else {
                console.log('❌ EXACT ERROR:', data.message);
                console.log('❌ Error details:', data);
                this.showNotification('⚠️ ' + data.message, 'error', 'Login Failed');
            }
        } catch (error) {
            console.error("Login Error:", error);
            this.showNotification('Network error. Please try again.', 'error', 'Connection Error');
        } finally {
            this.setButtonLoading(button, false);
        }
    }

    async handleSignup(event) {
        event.preventDefault();
        
        console.log('🔄 handleSignup called');
        
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        const button = document.querySelector('#signupForm button');

        console.log('📝 Form data:', { name, email, password: '***' });

        if (!name || !email || !password) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return;
        }

        if (confirmPassword && password !== confirmPassword) {
            this.showNotification('Passwords do not match', 'error');
            return;
        }

        if (!this.validatePasswordStrength(password)) {
            this.showNotification('Password does not meet security requirements', 'error');
            return;
        }

        this.setButtonLoading(button, true);

        try {
            console.log('🌐 Sending request to backend...');
            
            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch("http://localhost:5000/api/auth/register", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({ name, email, password }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            console.log('📨 Response status:', response.status);
            
            const data = await response.json();
            console.log('📄 Response data:', data);

            if (data.success) {
                this.currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                localStorage.setItem('authToken', data.token);
                
                this.showNotification(`Account created successfully! Welcome to E-Library, ${data.user.name}!`, 'success', 'Registration Complete');
                
                setTimeout(() => {
                    this.redirectToDashboard();
                }, 1500);
            } else {
                this.showNotification('⚠️ ' + data.message, 'error', 'Registration Failed');
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.error('💥 Request timeout - backend not responding');
                this.showNotification('Backend is not responding. Check if server is running.', 'error');
            } else {
                console.error('💥 Registration error:', error);
                this.showNotification('Network error: ' + error.message, 'error');
            }
        } finally {
            this.setButtonLoading(button, false);
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    setButtonLoading(button, isLoading) {
        const text = button?.querySelector('.btn-text');
        const loading = button?.querySelector('.loading');
        
        if (button && text && loading) {
            if (isLoading) {
                text.style.display = 'none';
                loading.style.display = 'inline-block';
                button.disabled = true;
                button.style.opacity = '0.7';
            } else {
                text.style.display = 'inline-block';
                loading.style.display = 'none';
                button.disabled = false;
                button.style.opacity = '1';
            }
        }
    }
redirectToDashboard() {
    console.log('🔧 redirectToDashboard called');
    
    if (!this.currentUser) {
        console.error('🔧 No user found for redirection');
        this.showNotification('Authentication error. Please try logging in again.', 'error');
        return;
    }

    // Get current page location to determine correct path
    const currentPath = window.location.pathname;
    console.log('📍 Current path:', currentPath);
    
    let redirectPath = '';
    
    if (this.currentUser.role === 'admin') {
        // Smart path detection for admin
        if (currentPath.includes('/admin/')) {
            redirectPath = 'dashboard.html'; // Already in admin folder
        } else if (currentPath.includes('/user/')) {
            redirectPath = '../admin/dashboard.html'; // From user to admin
        } else {
            redirectPath = 'admin/dashboard.html'; // From root
        }
    } else {
        // Smart path detection for user
        if (currentPath.includes('/user/')) {
            redirectPath = 'dashboard.html'; // Already in user folder
        } else if (currentPath.includes('/admin/')) {
            redirectPath = '../user/dashboard.html'; // From admin to user
        } else {
            redirectPath = 'user/dashboard.html'; // From root
        }
    }

    console.log('🔧 Redirecting to:', redirectPath);
    
    // Use replace to prevent back button issues
    window.location.href = redirectPath;
}

updateNavigation() {
    const userMenu = document.getElementById('userMenu');
    if (userMenu && this.currentUser) {
        const initials = this.currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
        
        // Smart path detection for dashboard link
        const currentPath = window.location.pathname;
        let dashboardPath = '';
        
        if (this.currentUser.role === 'admin') {
            if (currentPath.includes('/admin/')) {
                dashboardPath = 'dashboard.html';
            } else {
                dashboardPath = 'admin/dashboard.html';
            }
        } else {
            if (currentPath.includes('/user/')) {
                dashboardPath = 'dashboard.html';
            } else {
                dashboardPath = 'user/dashboard.html';
            }
        }
        
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
    }
}

logout() {
    const userName = this.currentUser?.name || 'User';
    this.currentUser = null;
    
    // 🚨 CLEAR ALL POSSIBLE AUTH DATA
    localStorage.removeItem('currentUser');
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('registeredUsers');
    
    this.showNotification(`Goodbye, ${userName}! Come back soon!`, 'info', 'Logged Out');
    
    // Smart logout redirection
    const currentPath = window.location.pathname;
    let redirectPath = '';
    
    if (currentPath.includes('/admin/') || currentPath.includes('/user/')) {
        redirectPath = '../index.html';
    } else {
        redirectPath = 'index.html';
    }
    
    console.log('🔧 Logout redirect to:', redirectPath);
    console.log('✅ Cleared ALL auth data from localStorage');
    
    setTimeout(() => {
        window.location.href = redirectPath;
    }, 1500);
}
clearAllAuthData() {
    const authKeys = [
        'currentUser',
        'user', 
        'authToken',
        'token',
        'adminToken',
        'registeredUsers',
        'tempRegistration'
    ];
    
    authKeys.forEach(key => localStorage.removeItem(key));
    console.log('🧹 Cleared all authentication data');
}

// Then in logout:
logout() {
    const userName = this.currentUser?.name || 'User';
    this.currentUser = null;
    
    this.clearAllAuthData(); // This one line clears everything
    
    this.showNotification(`Goodbye, ${userName}!`, 'info', 'Logged Out');
    
    // ... rest of redirect logic
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

    getLoginPath() {
        const currentPath = window.location.pathname;
        
        if (currentPath.includes('/admin/') || currentPath.includes('/user/')) {
            return '../login.html';
        } else {
            return './login.html';
        }
    }

    clearFormsOnLoad() {
        if (window.location.pathname.includes('login.html') || 
            window.location.pathname.includes('signup.html')) {
            
            setTimeout(() => {
                const loginForm = document.getElementById('loginForm');
                const signupForm = document.getElementById('signupForm');
                
                if (loginForm) loginForm.reset();
                if (signupForm) signupForm.reset();
                
                console.log('🔧 Forms cleared on page load');
            }, 100);
        }
    }

    isAuthenticated() {
        return !!localStorage.getItem('currentUser');
    }

    getCurrentUser() {
        return JSON.parse(localStorage.getItem('currentUser'));
    }

    requireAuth() {
        if (!this.isAuthenticated()) {
            this.showNotification('Please log in to access this page', 'warning', 'Authentication Required');
            setTimeout(() => {
                window.location.href = this.getLoginPath();
            }, 2000);
            return false;
        }
        return true;
    }

    requireRole(requiredRole) {
        if (!this.requireAuth()) return false;

        const user = this.getCurrentUser();
        if (user.role !== requiredRole) {
            this.showNotification('You do not have permission to access this page', 'error', 'Access Denied');
            setTimeout(() => {
                window.location.href = 'user/dashboard.html';
            }, 2000);
            return false;
        }
        return true;
    }
    // Add this method to your AuthSystem class
getRelativePath(targetPath) {
    const currentPath = window.location.pathname;
    
    // If we're already in the target folder, use relative path
    if (currentPath.includes('/admin/') && targetPath.includes('admin/')) {
        return targetPath.replace('admin/', '');
    }
    if (currentPath.includes('/user/') && targetPath.includes('user/')) {
        return targetPath.replace('user/', '');
    }
    
    // Otherwise use the full path
    return targetPath;
}
// Add this method to your AuthSystem class - it won't affect your existing form
setupAdminUser() {
    console.log('🔧 Setting up admin user...');
    
    // Check if admin user already exists in registeredUsers
    const adminExists = this.registeredUsers.find(user => user.email === 'admin@elibrary.com');
    
    if (!adminExists) {
        const adminUser = {
            id: 'admin_system',
            name: 'System Administrator',
            email: 'admin@elibrary.com',
            password: 'Admin123!',
            role: 'admin',
            joinDate: new Date().toISOString().split('T')[0],
            bio: 'System Administrator Account',
            interests: ['System Management', 'User Administration'],
            createdAt: new Date().toISOString()
        };
        
        this.registeredUsers.push(adminUser);
        this.saveRegisteredUsers();
        console.log('✅ Admin user added to local storage');
    } else {
        console.log('✅ Admin user already exists');
    }
    
    // Also ensure admin exists in backend MongoDB
    this.createAdminInBackend();
}

// Add this method to create admin in backend
// Update this method in your AuthSystem class
async createAdminInBackend() {
    try {
        console.log('🔧 Checking backend admin user...');
        
        // First, try to login to check if admin exists and password works
        const loginResponse = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({
                email: 'admin@elibrary.com',
                password: 'Admin123!'
            }),
        });

        const loginData = await loginResponse.json();
        
        if (loginData.success) {
            console.log('✅ Admin user exists and password works in backend');
            return;
        }
        
        // If login fails, try to register (only if user doesn't exist)
        console.log('⚠️ Admin login failed, checking if user exists...');
        
        const registerResponse = await fetch("http://localhost:5000/api/auth/register", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({
                name: 'System Administrator',
                email: 'admin@elibrary.com',
                password: 'Admin123!',
                role: 'admin'
            }),
        });

        const registerData = await registerResponse.json();
        
        if (registerData.success) {
            console.log('✅ Admin user created in backend');
        } else if (registerData.message && registerData.message.includes('already exists')) {
            console.log('✅ Admin user exists but password needs reset');
            console.log('💡 Run the password reset script on backend');
        } else {
            console.log('⚠️ Backend admin issue:', registerData.message);
        }
    } catch (error) {
        console.log('🔧 Backend admin check completed');
    }
}
async loginUser(email, password) {
    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (data.success) {
            // Store the token properly
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // If user is admin, also store admin token
            if (data.user.role === 'admin') {
                localStorage.setItem('adminToken', data.token);
            }
            
            console.log('✅ Login successful, token stored');
            return data;
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}
// Handle registration cancellation

}
// In your auth.js - after successful login

// Initialize auth system
const authSystem = new AuthSystem();

// Global functions for HTML
function logout() {
    authSystem.logout();
}
function handleRegistrationCancel() {
    // 1. Clear the form
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.reset();
    }
    
    // 2. Remove any temporary registration data
    localStorage.removeItem('tempRegistration');
    localStorage.removeItem('incompleteRegistration');
    
    // 3. Close modal
    const modal = document.getElementById('registrationModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    console.log('✅ Registration cancelled - no data saved');
}
