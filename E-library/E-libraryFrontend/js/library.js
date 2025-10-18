



// library.js - Library Management for Users

class LibraryManager {
    constructor() {
        this.API_BASE_URL = 'http://localhost:5000/api';
        this.token = localStorage.getItem('authToken');
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        this.books = [];
        this.currentBookId = null;
        
        this.initialize();
    }

    initialize() {
        if (!this.token || !this.currentUser) {
            window.location.href = 'login.html';
            return;
        }

        this.setupEventListeners();
        this.loadBooks();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchLibrary');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.filterBooks();
            }, 300));
        }

        // Filter functionality
        const categoryFilter = document.getElementById('categoryFilter');
        const accessFilter = document.getElementById('accessFilter');
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.filterBooks());
        }
        if (accessFilter) {
            accessFilter.addEventListener('change', () => this.filterBooks());
        }

        // Modal events
        this.setupModalEvents();
    }

    setupModalEvents() {
        // Close modal when clicking X
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal();
            });
        });

        // Close modal when clicking outside
        const modal = document.getElementById('bookDetailsModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
    }

    async loadBooks() {
        try {
            this.showLoadingState();
            
            const response = await fetch(`${this.API_BASE_URL}/books`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    this.books = result.books || result.data || [];
                    this.displayBooks(this.books);
                }
            } else {
                throw new Error('Failed to load books');
            }
        } catch (error) {
            console.error('Error loading books:', error);
            this.showNotification('Error loading books', 'error');
            this.showEmptyState();
        } finally {
            this.hideLoadingState();
        }
    }

    displayBooks(books) {
        const grid = document.getElementById('booksGrid');
        if (!grid) return;

        if (!books || books.length === 0) {
            this.showEmptyState();
            return;
        }

        this.hideEmptyState();

        grid.innerHTML = books.map(book => `
            <div class="book-card" data-book-id="${book._id}">
                <div class="book-cover-container">
                    ${book.coverImage ? 
                        `<img src="http://localhost:5000${book.coverImage}" alt="${book.title}" class="book-cover"
                              onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
                        ''
                    }
                    <div class="default-cover" ${book.coverImage ? 'style="display:none"' : ''}>📚</div>
                </div>
                
                <div class="book-info">
                    <h3 class="book-title">${this.escapeHtml(book.title)}</h3>
                    <p class="book-author">by ${this.escapeHtml(book.author)}</p>
                    
                    <div class="book-meta">
                        <span>${book.pages || 'N/A'} pages</span>
                        <span>${book.category || 'General'}</span>
                    </div>
                    
                    <div class="book-access">
                        ${book.accessLevel === 'premium' ? 
                            '<span class="premium-badge">Premium</span>' : 
                            '<span class="access-badge">Public</span>'
                        }
                        ${book.isFeatured ? '<span class="premium-badge">Featured</span>' : ''}
                    </div>
                </div>
                
                <div class="book-actions">
                    <button class="btn btn-sm btn-primary" onclick="libraryManager.viewBookDetails('${book._id}')">
                        View Details
                    </button>
<button class="btn btn-sm btn-outline" onclick="libraryManager.addToReadingList('${book._id}')" 
         id="readingListBtn-${book._id}">
    📖 Save
</button>
                </div>
            </div>
        `).join('');
    }

    async viewBookDetails(bookId) {
        try {
            const book = this.books.find(b => b._id === bookId);
            if (!book) {
                this.showNotification('Book not found', 'error');
                return;
            }

            this.currentBookId = bookId;
            this.showBookDetailsModal(book);
        } catch (error) {
            console.error('Error viewing book details:', error);
            this.showNotification('Error loading book details', 'error');
        }
    }

    showBookDetailsModal(book) {
        const modal = document.getElementById('bookDetailsModal');
        const content = document.getElementById('bookDetailsContent');
        
        if (!modal || !content) return;

        content.innerHTML = `
            <div class="book-details-layout">
                <div class="book-cover-section">
                    <div class="book-cover-large">
                        ${book.coverImage ? 
                            `<img src="http://localhost:5000${book.coverImage}" alt="${this.escapeHtml(book.title)}">` : 
                            `<div class="default-cover-large">📚</div>`
                        }
                    </div>
                </div>
                
                <div class="book-info-section">
                    <h2>${this.escapeHtml(book.title)}</h2>
                    <p class="book-author">by ${this.escapeHtml(book.author)}</p>
                    
                    <div class="book-meta-grid">
                        <div class="meta-item">
                            <strong>Category:</strong>
                            <span>${this.escapeHtml(book.category || 'Not specified')}</span>
                        </div>
                        <div class="meta-item">
                            <strong>Pages:</strong>
                            <span>${book.pages || 'N/A'}</span>
                        </div>
                        <div class="meta-item">
                            <strong>Publisher:</strong>
                            <span>${this.escapeHtml(book.publisher || 'Not specified')}</span>
                        </div>
                        <div class="meta-item">
                            <strong>Language:</strong>
                            <span>${this.escapeHtml(book.language || 'Not specified')}</span>
                        </div>
                        <div class="meta-item">
                            <strong>Access Level:</strong>
                            <span class="access-${book.accessLevel}">${book.accessLevel || 'public'}</span>
                        </div>
                    </div>
                    
                    <div class="book-description">
                        <h4>Description</h4>
                        <p>${this.escapeHtml(book.description || 'No description available.')}</p>
                    </div>
                </div>
            </div>
        `;

        // Setup download button
        const downloadBtn = document.getElementById('downloadBookBtn');
        if (downloadBtn) {
            downloadBtn.onclick = () => this.downloadBook(book._id);
            
            // Disable download if user doesn't have access
            if (book.accessLevel === 'premium' && this.currentUser.role !== 'premium') {
                downloadBtn.disabled = true;
                downloadBtn.innerHTML = '🔒 Premium Required';
            }
        }

        // Setup reading list button
        const readingListBtn = document.getElementById('addToReadingListBtn');
        if (readingListBtn) {
            readingListBtn.onclick = () => this.addToReadingList(book._id);
        }

        modal.style.display = 'block';
    }

    async downloadBook(bookId) {
        try {
            const book = this.books.find(b => b._id === bookId);
            if (!book || !book.pdfFile) {
                this.showNotification('Book PDF not available', 'error');
                return;
            }

            // Check access rights
            if (book.accessLevel === 'premium' && this.currentUser.role !== 'premium') {
                this.showNotification('Premium subscription required to download this book', 'warning');
                return;
            }

            this.showNotification('Preparing download...', 'info');

            // Create download link
            const downloadUrl = `http://localhost:5000${book.pdfFile}`;
            
            // Create temporary anchor element for download
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `${book.title}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Track download in backend (optional)
            await this.trackDownload(bookId);

            this.showNotification('Download started!', 'success');

        } catch (error) {
            console.error('Error downloading book:', error);
            this.showNotification('Error downloading book', 'error');
        }
    }

    async trackDownload(bookId) {
        try {
            await fetch(`${this.API_BASE_URL}/books/${bookId}/download`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Error tracking download:', error);
        }
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

            if (response.ok) {
                this.showNotification('Added to reading list!', 'success');
            } else {
                throw new Error('Failed to add to reading list');
            }
        } catch (error) {
            console.error('Error adding to reading list:', error);
            this.showNotification('Error adding to reading list', 'error');
        }
    }

    filterBooks() {
        const searchTerm = (document.getElementById('searchLibrary')?.value || '').toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter')?.value || '';
        const accessFilter = document.getElementById('accessFilter')?.value || '';

        const filteredBooks = this.books.filter(book => {
            const matchesSearch = !searchTerm || 
                book.title.toLowerCase().includes(searchTerm) ||
                book.author.toLowerCase().includes(searchTerm) ||
                book.category.toLowerCase().includes(searchTerm);

            const matchesCategory = !categoryFilter || book.category === categoryFilter;
            const matchesAccess = !accessFilter || book.accessLevel === accessFilter;

            return matchesSearch && matchesCategory && matchesAccess;
        });

        this.displayBooks(filteredBooks);
    }

    clearFilters() {
        document.getElementById('searchLibrary').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('accessFilter').value = '';
        this.filterBooks();
    }

    closeModal() {
        const modal = document.getElementById('bookDetailsModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showLoadingState() {
        document.getElementById('loadingState').style.display = 'block';
        document.getElementById('booksGrid').style.display = 'none';
        document.getElementById('emptyState').style.display = 'none';
    }

    hideLoadingState() {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('booksGrid').style.display = 'grid';
    }

    showEmptyState() {
        document.getElementById('emptyState').style.display = 'block';
        document.getElementById('booksGrid').style.display = 'none';
        document.getElementById('loadingState').style.display = 'none';
    }

    hideEmptyState() {
        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('booksGrid').style.display = 'grid';
    }

    showNotification(message, type = 'info') {
        // Use the same notification system as admin
        if (window.userDashboard && window.userDashboard.showNotification) {
            window.userDashboard.showNotification(message, type);
        } else {
            console.log(`Notification [${type}]:`, message);
        }
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

    escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return unsafe;
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.libraryManager = new LibraryManager();
});









