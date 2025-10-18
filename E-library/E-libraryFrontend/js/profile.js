// profile.js - User Profile Management

class ProfileManager {
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

        this.loadUserProfile();
        this.setupEventListeners();
    }

    async loadUserProfile() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.displayUserProfile(result.user);
                    this.loadUserStats();
                }
            } else {
                throw new Error('Failed to load profile');
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            this.showNotification('Error loading profile', 'error');
        }
    }
async loadUserStats() {
    try {
        // CHANGE THIS LINE:
        const response = await fetch(`${this.API_BASE_URL}/reading-list/stats`, {
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                this.displayUserStats(result.stats);
                this.displayRecentActivity(result.stats);
                this.updateMembershipStatus();
                this.updatePreferences();
                this.updateUserMenu();
                this.updateAvatar();
                this.updateRoleBadge();
            }
        }
    } catch (error) {
        console.error('Error loading user stats:', error);
    }
}
//     async loadUserStats() {
//         try {
//             const response = await fetch(`${this.API_BASE_URL}/users/reading-list/stats`, {
//                 headers: {
//                     'Authorization': `Bearer ${this.token}`,
//                     'Content-Type': 'application/json'
//                 }
//             });

//             if (response.ok) {
//                 const result = await response.json();
//                 if (result.success) {
//                     this.displayUserStats(result.stats);
//                 this.displayRecentActivity(result.stats);
//                 this.updateMembershipStatus();
//                 this.updatePreferences();
//                 this.updateUserMenu();
//                 this.updateAvatar();
//                 this.updateRoleBadge();
//             }
//             }
//         } catch (error) {
//             console.error('Error loading user stats:', error);
//         }
//     }

    displayUserProfile(user) {
        // Update form fields
        document.getElementById('userName').value = user.name || '';
        document.getElementById('userEmail').value = user.email || '';
        document.getElementById('userRoleDisplay').value = this.formatRole(user.role);
        
        // Update header
        document.getElementById('userProfileName').textContent = user.name || 'User';
        document.getElementById('userEmail').textContent = user.email || '';
    }

    displayUserStats(stats) {
        document.getElementById('booksReadCount').textContent = stats.totalBooksRead || 0;
        document.getElementById('readingTimeCount').textContent = this.formatReadingTime(stats.totalReadingTime || 0);
        document.getElementById('downloadsCount').textContent = stats.downloadedBooksCount || 0;
        document.getElementById('favoritesCount').textContent = stats.favorites?.length || 0;
    }

    displayRecentActivity(stats) {
        const activityContainer = document.getElementById('recentActivity');
        if (!activityContainer) return;

        const activities = [];
        
        // Add currently reading books
        if (stats.currentlyReading && stats.currentlyReading.length > 0) {
            stats.currentlyReading.slice(0, 3).forEach(item => {
                activities.push({
                    icon: '📖',
                    title: `Reading "${item.book?.title}"`,
                    time: 'Currently reading',
                    type: 'reading'
                });
            });
        }
        
        // Add recent favorites
        if (stats.favorites && stats.favorites.length > 0) {
            stats.favorites.slice(0, 2).forEach(book => {
                activities.push({
                    icon: '⭐',
                    title: `Added "${book.title}" to favorites`,
                    time: 'Recently',
                    type: 'favorite'
                });
            });
        }
        
        // Add download activity
        if (stats.downloadedBooksCount > 0) {
            activities.push({
                icon: '📥',
                title: `Downloaded ${stats.downloadedBooksCount} books`,
                time: 'Total downloads',
                type: 'download'
            });
        }
        
        // Add reading list activity
        if (stats.readingListCount > 0) {
            activities.push({
                icon: '📚',
                title: `${stats.readingListCount} books in reading list`,
                time: 'Active collection',
                type: 'reading_list'
            });
        }
        
        // If no activities, show message
        if (activities.length === 0) {
            activities.push({
                icon: '📖',
                title: 'Start reading to see your activity here',
                time: 'No activity yet',
                type: 'empty'
            });
        }
        
        activityContainer.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">${activity.icon}</div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-time">${activity.time}</div>
                </div>
            </div>
        `).join('');
    }

    updateMembershipStatus() {
        const membershipElement = document.getElementById('membershipStatus');
        if (membershipElement) {
            const isPremium = this.currentUser.role === 'premium' || 
                            this.currentUser.role === 'admin' || 
                            this.currentUser.role === 'moderator';
            
            if (isPremium) {
                membershipElement.textContent = 'Premium Membership';
                membershipElement.style.color = '#ffeb3b';
            } else {
                membershipElement.textContent = 'Free Membership';
            }
        }
    }

    updatePreferences() {
        const user = this.currentUser;
        if (user.preferences) {
            const notificationsToggle = document.getElementById('notificationsToggle');
            const themeToggle = document.getElementById('themeToggle');
            
            if (notificationsToggle) {
                notificationsToggle.checked = user.preferences.notifications !== false;
            }
            
            if (themeToggle) {
                themeToggle.checked = user.preferences.theme === 'dark';
                themeToggle.addEventListener('change', (e) => {
                    this.updateThemePreference(e.target.checked);
                });
            }
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
                        <a href="#" class="dropdown-item" onclick="profileManager.logout()">🚪 Logout</a>
                    </div>
                </div>
            `;
        }
    }

    updateAvatar() {
        const avatarElement = document.getElementById('userAvatar');
        if (avatarElement && this.currentUser) {
            if (this.currentUser.avatar) {
                avatarElement.innerHTML = `<img src="${this.currentUser.avatar}" alt="${this.currentUser.name}">`;
            } else {
                // Use first letter of name or default icon
                const firstLetter = this.currentUser.name ? this.currentUser.name.charAt(0).toUpperCase() : '👤';
                avatarElement.textContent = firstLetter;
            }
        }
    }

    updateRoleBadge() {
        const roleElement = document.getElementById('userRole');
        if (roleElement && this.currentUser) {
            roleElement.textContent = this.formatRole(this.currentUser.role);
            roleElement.className = `role-badge role-${this.currentUser.role}`;
        }
    }

    setupEventListeners() {
        // Profile form submission
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateProfile();
            });
        }

        // Notifications toggle
        const notificationsToggle = document.getElementById('notificationsToggle');
        if (notificationsToggle) {
            notificationsToggle.addEventListener('change', (e) => {
                this.updateNotificationPreference(e.target.checked);
            });
        }
    }

    async updateProfile() {
        try {
            const formData = {
                name: document.getElementById('userName').value
            };

            const response = await fetch(`${this.API_BASE_URL}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // Update local storage
                    this.currentUser = { ...this.currentUser, ...result.user };
                    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                    
                    this.showNotification('Profile updated successfully!', 'success');
                    this.updateUserMenu();
                    this.updateAvatar();
                    this.updateRoleBadge();
                }
            } else {
                throw new Error('Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showNotification('Error updating profile', 'error');
        }
    }

    async updateNotificationPreference(enabled) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    preferences: {
                        notifications: enabled
                    }
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.currentUser = { ...this.currentUser, ...result.user };
                    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                    this.showNotification('Preferences updated', 'success');
                }
            }
        } catch (error) {
            console.error('Error updating preferences:', error);
        }
    }

    async updateThemePreference(isDark) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    preferences: {
                        theme: isDark ? 'dark' : 'light'
                    }
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.currentUser = { ...this.currentUser, ...result.user };
                    localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                    this.applyTheme(isDark);
                    this.showNotification('Theme updated', 'success');
                }
            }
        } catch (error) {
            console.error('Error updating theme:', error);
        }
    }

    applyTheme(isDark) {
        if (isDark) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }

    async changePassword() {
        try {
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (!currentPassword || !newPassword || !confirmPassword) {
                this.showNotification('Please fill in all password fields', 'warning');
                return;
            }

            if (newPassword !== confirmPassword) {
                this.showNotification('New passwords do not match', 'error');
                return;
            }

            if (newPassword.length < 6) {
                this.showNotification('Password must be at least 6 characters', 'warning');
                return;
            }

            const response = await fetch(`${this.API_BASE_URL}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Password changed successfully!', 'success');
                // Clear password fields
                document.getElementById('currentPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';
            } else {
                throw new Error(result.message || 'Failed to change password');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            this.showNotification(`Error: ${error.message}`, 'error');
        }
    }

    upgradeMembership() {
        this.showNotification('Premium upgrade feature coming soon!', 'info');
        // In a real application, this would integrate with a payment system
    }

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.href = '../index.html';
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

    showNotification(message, type = 'info') {
        if (window.userDashboard && window.userDashboard.showNotification) {
            window.userDashboard.showNotification(message, type);
        } else {
            console.log(`Notification [${type}]:`, message);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.profileManager = new ProfileManager();
});













