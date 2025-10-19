// js/admin-auth.js
class AdminAuth {
    static checkAdminAccess() {
        const userData = localStorage.getItem('user');
        
        if (!userData) {
            console.log('❌ No user data found');
            this.redirectToLogin();
            return false;
        }

        try {
            const user = JSON.parse(userData);
            console.log('🔍 User role:', user.role);
            
            if (user.role !== 'admin') {
                console.log('❌ User is not admin:', user.role);
                this.redirectToLogin();
                return false;
            }
            
            console.log('✅ Admin access granted');
            return true;
            
        } catch (error) {
            console.error('❌ Error parsing user data:', error);
            this.redirectToLogin();
            return false;
        }
    }

    static redirectToLogin() {
        alert('Access denied. Please login as admin.');
        window.location.href = '../index.html';
    }

    static getAdminToken() {
        return localStorage.getItem('adminToken') || localStorage.getItem('token');
    }
}