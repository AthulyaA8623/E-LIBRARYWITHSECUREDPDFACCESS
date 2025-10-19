// reading.js - Reading List Management (With Backend)
class ReadingManager {
    constructor() {
      //  this.API_BASE_URL = 'http://localhost:5000/api';
      this.API_BASE_URL = 'http://localhost:5000/api';  
      this.token = localStorage.getItem('authToken');
        this.currentUser = this.getCurrentUser();
        this.readingList = [];
        this.currentBookId = null;
        
        this.initialize();
    }

    getCurrentUser() {
        try {
            const user = localStorage.getItem('currentUser');
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    }

    initialize() {
        if (!this.token || !this.currentUser) {
            window.location.href = 'login.html';
            return;
        }

        this.setupEventListeners();
        this.loadReadingList();
    }

    setupEventListeners() {
        // Modal events
        const closeModalBtn = document.querySelector('.close-modal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.closeNotesModal());
        }

        const saveNotesBtn = document.getElementById('saveNotesBtn');
        if (saveNotesBtn) {
            saveNotesBtn.addEventListener('click', () => this.saveNotes());
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshReadingList');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadReadingList());
        }

        // Search functionality
        const searchInput = document.getElementById('searchReadingList');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.filterReadingList();
            }, 300));
        }
    }

async loadReadingList() {
    try {
        this.showLoadingState();
        
        console.log('🔄 Loading reading list for user:', this.currentUser?.id);
        
        // FIX: Add the API_BASE_URL to the fetch URL
        const response = await fetch(`${this.API_BASE_URL}/reading-list`, {
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Response status:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('Reading list data received:', result);
            if (result.success) {
                this.readingList = result.readingList || [];
                this.displayReadingList();
                this.updateStats();
                this.showNotification(`Loaded ${this.readingList.length} books`, 'success');
            }
        } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to load reading list: ${response.status}`);
        }
    } catch (error) {
        console.error('Error loading reading list:', error);
        this.showNotification('Error loading reading list: ' + error.message, 'error');
        this.showEmptyState();
    } finally {
        this.hideLoadingState();
    }
}

    displayReadingList() {
        const container = document.getElementById('readingListContent');
        if (!container) {
            console.error('Reading list container not found');
            return;
        }

        if (this.readingList.length === 0) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();

        container.innerHTML = this.readingList.map(item => {
            const book = item.book;
            const progress = item.progress || 0;
            const status = this.getReadingStatus(progress);
            
            return `
                <div class="reading-list-item" data-book-id="${book._id}">
                    <div class="book-cover-small">
                        ${book.coverImage ? 
                            `<img src="http://localhost:5000${book.coverImage}" alt="${book.title}"
                                  onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
                            ''
                        }
                        <div class="default-cover-small" ${book.coverImage ? 'style="display:none"' : ''}>📚</div>
                    </div>
                    
                    <div class="book-details">
                        <div class="book-title">
                            ${this.escapeHtml(book.title)}
                            <span class="reading-status status-${status}">${this.formatStatus(status)}</span>
                            ${item.isFavorite ? '<span class="favorite-badge">⭐ Favorite</span>' : ''}
                        </div>
                        <div class="book-author">by ${this.escapeHtml(book.author)}</div>
                        
                        <div class="book-meta">
                            <span>${book.pages || 'N/A'} pages</span>
                            <span>${book.category || 'General'}</span>
                            <span>Added ${this.formatDate(item.addedAt)}</span>
                        </div>
                        
                        ${progress > 0 ? `
                            <div class="progress-section">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${progress}%"></div>
                                </div>
                                <div class="progress-text">
                                    ${progress}% completed
                                </div>
                            </div>
                        ` : ''}
                        
                        ${item.notes ? `
                            <div class="notes-display">
                                <strong>Your notes:</strong> ${this.escapeHtml(item.notes)}
                            </div>
                        ` : ''}
                        
                        <div class="book-actions">
                            <button class="btn btn-sm btn-primary" onclick="readingManager.readBook('${book._id}')">
                                📖 Read Now
                            </button>
                            <button class="btn btn-sm btn-outline" onclick="readingManager.editNotes('${book._id}')">
                                📝 ${item.notes ? 'Edit Notes' : 'Add Notes'}
                            </button>
                            <button class="btn btn-sm ${item.isFavorite ? 'btn-warning' : 'btn-outline'}" 
                                    onclick="readingManager.toggleFavorite('${book._id}')">
                                ⭐ ${item.isFavorite ? 'Favorited' : 'Favorite'}
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="readingManager.removeFromReadingList('${book._id}')">
                                🗑️ Remove
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Add to reading list method
    async addToReadingList(bookId) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/reading-list`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ bookId })
            });

            if (response.ok) {
                this.showNotification('Added to reading list!', 'success');
                return true;
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add to reading list');
            }
        } catch (error) {
            console.error('Error adding to reading list:', error);
            this.showNotification(error.message || 'Error adding to reading list', 'error');
            return false;
        }
    }

    // Remove from reading list
    async removeFromReadingList(bookId) {
        if (!confirm('Are you sure you want to remove this book from your reading list?')) {
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE_URL}/reading-list/${bookId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.showNotification('Book removed from reading list', 'success');
                this.loadReadingList();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to remove from reading list');
            }
        } catch (error) {
            console.error('Error removing from reading list:', error);
            this.showNotification('Error removing book', 'error');
        }
    }

    // Toggle favorite
    async toggleFavorite(bookId) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/reading-list/${bookId}/favorite`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.showNotification(result.message, 'success');
                this.loadReadingList();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update favorite status');
            }
        } catch (error) {
            console.error('Error updating favorite:', error);
            this.showNotification('Error updating favorite status', 'error');
        }
    }

    // Save notes
    async saveNotes() {
        if (!this.currentBookId) return;

        try {
            const notes = document.getElementById('notesText').value;
            
            const response = await fetch(`${this.API_BASE_URL}/reading-list/${this.currentBookId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ notes })
            });

            if (response.ok) {
                this.showNotification('Notes updated successfully!', 'success');
                this.closeNotesModal();
                this.loadReadingList();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update notes');
            }
        } catch (error) {
            console.error('Error saving notes:', error);
            this.showNotification('Error saving notes', 'error');
        }
    }

    // Edit notes
    editNotes(bookId) {
        const item = this.readingList.find(item => item.book._id === bookId);
        if (!item) return;

        this.currentBookId = bookId;
        
        const modal = document.getElementById('notesModal');
        const bookInfo = document.getElementById('notesBookInfo');
        const notesText = document.getElementById('notesText');
        
        if (modal && bookInfo && notesText) {
            bookInfo.innerHTML = `
                <div style="margin-bottom: 15px;">
                    <strong>${this.escapeHtml(item.book.title)}</strong><br>
                    <span style="color: #718096;">by ${this.escapeHtml(item.book.author)}</span>
                </div>
            `;
            notesText.value = item.notes || '';
            modal.style.display = 'block';
        }
    }

    // Close notes modal
    closeNotesModal() {
        const modal = document.getElementById('notesModal');
        if (modal) {
            modal.style.display = 'none';
            this.currentBookId = null;
        }
    }

    // Read book
    async readBook(bookId) {
        try {
            const item = this.readingList.find(item => item.book._id === bookId);
            if (!item) {
                this.showNotification('Book not found in reading list', 'error');
                return;
            }

            const book = item.book;
            
            this.showNotification('Opening book...', 'info');
            
            setTimeout(() => {
                this.downloadBook(bookId);
            }, 1000);

        } catch (error) {
            console.error('Error reading book:', error);
            this.showNotification('Error opening book', 'error');
        }
    }

    // Download book
    async downloadBook(bookId) {
        try {
            const item = this.readingList.find(item => item.book._id === bookId);
            if (!item) return;

            const book = item.book;

            if (!book.pdfFile) {
                this.showNotification('Book PDF not available', 'error');
                return;
            }

            const downloadUrl = `http://localhost:5000${book.pdfFile}`;
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `${book.title}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            this.showNotification('Download started!', 'success');

        } catch (error) {
            console.error('Error downloading book:', error);
            this.showNotification('Error downloading book', 'error');
        }
    }

    // Filter reading list
    filterReadingList() {
        const searchTerm = (document.getElementById('searchReadingList')?.value || '').toLowerCase();
        
        const filteredBooks = this.readingList.filter(item => {
            const book = item.book;
            return !searchTerm || 
                book.title.toLowerCase().includes(searchTerm) ||
                book.author.toLowerCase().includes(searchTerm) ||
                book.category.toLowerCase().includes(searchTerm);
        });

        this.displayFilteredBooks(filteredBooks);
    }

    displayFilteredBooks(filteredBooks) {
        const container = document.getElementById('readingListContent');
        if (!container) return;

        if (filteredBooks.length === 0) {
            container.innerHTML = '<div class="empty-state">No books match your search</div>';
            return;
        }

        // Reuse the display logic but with filtered books
        const originalReadingList = this.readingList;
        this.readingList = filteredBooks;
        this.displayReadingList();
        this.readingList = originalReadingList;
    }

    // UI State Management
    showLoadingState() {
        const loadingEl = document.getElementById('loadingReadingList');
        const contentEl = document.getElementById('readingListContent');
        const emptyEl = document.getElementById('emptyReadingList');
        
        if (loadingEl) loadingEl.style.display = 'block';
        if (contentEl) contentEl.style.display = 'none';
        if (emptyEl) emptyEl.style.display = 'none';
    }

    hideLoadingState() {
        const loadingEl = document.getElementById('loadingReadingList');
        if (loadingEl) loadingEl.style.display = 'none';
    }

    showEmptyState() {
        const loadingEl = document.getElementById('loadingReadingList');
        const contentEl = document.getElementById('readingListContent');
        const emptyEl = document.getElementById('emptyReadingList');
        
        if (loadingEl) loadingEl.style.display = 'none';
        if (contentEl) contentEl.style.display = 'none';
        if (emptyEl) emptyEl.style.display = 'block';
    }

    hideEmptyState() {
        const emptyEl = document.getElementById('emptyReadingList');
        const contentEl = document.getElementById('readingListContent');
        
        if (emptyEl) emptyEl.style.display = 'none';
        if (contentEl) contentEl.style.display = 'block';
    }

    // Update stats
    updateStats() {
        const totalBooks = this.readingList.length;
        const readingNow = this.readingList.filter(item => {
            const status = this.getReadingStatus(item.progress || 0);
            return status === 'reading';
        }).length;
        const completed = this.readingList.filter(item => {
            const status = this.getReadingStatus(item.progress || 0);
            return status === 'completed';
        }).length;
        const favorites = this.readingList.filter(item => item.isFavorite).length;

        const totalBooksEl = document.getElementById('totalBooks');
        const readingNowEl = document.getElementById('readingNow');
        const completedEl = document.getElementById('completed');
        const favoritesEl = document.getElementById('favorites');

        if (totalBooksEl) totalBooksEl.textContent = totalBooks;
        if (readingNowEl) readingNowEl.textContent = readingNow;
        if (completedEl) completedEl.textContent = completed;
        if (favoritesEl) favoritesEl.textContent = favorites;
    }

    // Utility Methods
    getReadingStatus(progress) {
        if (progress === 0) return 'not-started';
        if (progress < 100) return 'reading';
        return 'completed';
    }

    formatStatus(status) {
        const statusMap = {
            'not-started': 'Not Started',
            'reading': 'Reading',
            'completed': 'Completed'
        };
        return statusMap[status] || status;
    }

    formatDate(dateString) {
        if (!dateString) return 'recently';
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'recently';
        
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return date.toLocaleDateString();
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

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    showNotification(message, type = 'info') {
        if (window.userDashboard && window.userDashboard.showNotification) {
            window.userDashboard.showNotification(message, type);
        } else {
            console.log(`Notification [${type}]:`, message);
            // Fallback notification
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
                color: white;
                border-radius: 8px;
                z-index: 1000;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                max-width: 300px;
            `;
            notification.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>${message}</span>
                    <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; margin-left: 10px;">×</button>
                </div>
            `;
            document.body.appendChild(notification);
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 5000);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.readingManager = new ReadingManager();
});




