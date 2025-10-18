
class BooksManager {

    constructor() {
        this.API_BASE_URL = 'http://localhost:5000/api';
        this.token = localStorage.getItem('authToken');
        this.currentBooks = [];
        this.selectedBooks = new Set();
        
        console.log('🔧 BooksManager constructor called');
        
        // Wait for DOM to be completely ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('📄 DOM fully loaded - initializing now');
                this.initializeAfterDOMReady();
            });
        } else {
            console.log('📄 DOM already loaded - initializing now');
            // Small delay to ensure all elements are ready
            setTimeout(() => {
                this.initializeAfterDOMReady();
            }, 100);
        }
    }

    initializeAfterDOMReady() {
        console.log('🚀 Initializing Books Manager after DOM ready');
        
        // Debug: Check if sortBy element exists now
        const sortByElement = document.getElementById('sortBy');
        console.log('🔍 sortBy element found:', !!sortByElement);
        console.log('🔍 All elements in filter-group:', document.querySelectorAll('.filter-group select'));
        
        this.initializeEventListeners();
        this.loadBooks();
    }

    initializeEventListeners() {
        console.log('🔧 Initializing event listeners...');
        
        // Safe event listener helper
        const safeAddEventListener = (elementId, event, handler) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.addEventListener(event, handler);
                console.log(`✅ Added event listener to: ${elementId}`);
                return true;
            } else {
                console.warn(`⚠️ Element not found: ${elementId}`);
                return false;
            }
        };

        // Search and filter functionality
        safeAddEventListener('searchBooks', 'input', (e) => {
            this.debounce(() => this.filterBooks(), 300);
        });

        safeAddEventListener('categoryFilter', 'change', () => this.filterBooks());
        safeAddEventListener('statusFilter', 'change', () => this.filterBooks());
        safeAddEventListener('sortBy', 'change', () => this.filterBooks());

        // Modal close events
        this.initializeModalEvents();
        
        console.log('✅ All event listeners initialized');
    }

    initializeModalEvents() {
        // Close modals when clicking X or outside
        document.querySelectorAll('.close-modal').forEach(btn => {
            if (btn) {
                btn.addEventListener('click', (e) => {
                    const modal = e.target.closest('.modal');
                    if (modal) {
                        modal.style.display = 'none';
                    }
                });
            }
        });

        // Close modals when clicking outside
        document.querySelectorAll('.modal').forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.style.display = 'none';
                    }
                });
            }
        });

        // Delete modal specific events
        const deleteModal = document.getElementById('deleteBookModal');
        if (deleteModal) {
            const cancelBtn = document.getElementById('cancelDeleteBookBtn');
            const confirmBtn = document.getElementById('confirmDeleteBookBtn');
            
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => this.closeDeleteModal());
            }
            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => {
                    const bookId = confirmBtn.getAttribute('data-book-id');
                    if (bookId) {
                        this.confirmDeleteBook(bookId);
                    }
                });
            }
        }
    }

    async loadBooks() {
        try {
            console.log('📚 Loading books from API...');
            
            if (!this.token) {
                this.showNotification('Please login first', 'error');
                return;
            }

            const response = await fetch(`${this.API_BASE_URL}/books`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('📦 Books API response:', result);

            if (result.success && result.books) {
                this.currentBooks = result.books;
                this.displayBooks(this.currentBooks);
                this.updateStats();
            } else if (result.success && result.data) {
                // Handle different response format
                this.currentBooks = result.data;
                this.displayBooks(this.currentBooks);
                this.updateStats();
            } else {
                throw new Error(result.message || 'Failed to load books');
            }
        } catch (error) {
            console.error('❌ Error loading books:', error);
            this.showNotification(`Error loading books: ${error.message}`, 'error');
            
            // Show empty state
            this.displayBooks([]);
        }
    }

    displayBooks(books) {
        const tbody = document.getElementById('booksTableBody');
        if (!tbody) {
            console.error('❌ booksTableBody element not found');
            return;
        }
        
        if (!books || books.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="no-data">
                        <div class="empty-state">
                            <div class="empty-icon">📚</div>
                            <h3>No Books Found</h3>
                            <p>No books available in the library. Add your first book to get started.</p>
                            <a href="add-book.html" class="btn btn-primary">Add New Book</a>
                        </div>
                    </td>
                </tr>
            `;
            this.updateTableInfo(0);
            return;
        }

        tbody.innerHTML = books.map(book => `
            <tr data-book-id="${book._id}">
                <td>
                    <input type="checkbox" class="book-checkbox" value="${book._id}" 
                           onchange="window.booksManager.toggleBookSelection('${book._id}')">
                </td>
                <td>
                    <div class="book-info-cell">
                        <div class="book-cover-small">
                            ${book.coverImage ? 
                                `<img src="http://localhost:5000${book.coverImage}" alt="${book.title}" 
                                      onerror="this.style.display='none'; this.nextElementSibling.style.display='block'">` : 
                                '<div class="default-cover">📚</div>'
                            }
                            ${book.coverImage ? '<div class="default-cover" style="display:none">📚</div>' : ''}
                        </div>
                        <div class="book-details">
                            <div class="book-title">${this.escapeHtml(book.title || 'Untitled')}</div>
                            <div class="book-meta">
                                ${book.isbn ? `<span class="meta-item">ISBN: ${this.escapeHtml(book.isbn)}</span>` : ''}
                                ${book.pages ? `<span class="meta-item">${book.pages} pages</span>` : ''}
                            </div>
                        </div>
                    </div>
                </td>
                <td>${this.escapeHtml(book.author || 'Unknown')}</td>
                <td>
                    <span class="category-tag category-${(book.category?.toLowerCase() || 'other').replace(/\s+/g, '-')}">
                        ${this.escapeHtml(book.category || 'Other')}
                    </span>
                </td>
                <td>
                    <div class="download-stats">
                        <span class="stat-number">${book.downloadCount || 0}</span>
                        <span class="stat-trend">📥</span>
                    </div>
                </td>
                <td>
                    <div class="rating-display">
                        <span class="rating-stars">★★★★★</span>
                        <span class="rating-value">${(book.averageRating || 0).toFixed(1)}</span>
                    </div>
                </td>
                <td>
                    <span class="status-badge status-${book.isActive ? 'active' : 'inactive'}">
                        ${book.isActive ? 'Active' : 'Inactive'}
                    </span>
                    ${book.isFeatured ? '<span class="featured-badge">⭐ Featured</span>' : ''}
                </td>
                <td>${book.createdAt ? new Date(book.createdAt).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-view" onclick="window.booksManager.viewBookDetails('${book._id}')" 
                                title="View Details">👁️</button>
                        <button class="btn-icon btn-edit" onclick="window.booksManager.editBook('${book._id}')" 
                                title="Edit Book">✏️</button>
                                <button class="btn-icon btn-delete" onclick="window.booksManager.deleteBook('${book._id}', '${this.escapeHtml(book.title).replace(/'/g, "\\'")}')" 
        title="Delete Book">🗑️</button>
                       
                    </div>
                </td>
            </tr>
        `).join('');

        this.updateTableInfo(books.length);
    }

    updateStats() {
        const totalBooks = this.currentBooks.length;
        const activeBooks = this.currentBooks.filter(book => book.isActive).length;
        const featuredBooks = this.currentBooks.filter(book => book.isFeatured).length;
        const totalDownloads = this.currentBooks.reduce((sum, book) => sum + (book.downloadCount || 0), 0);

        // Safely update stats elements
        this.safeUpdateElement('totalBooksCount', totalBooks);
        this.safeUpdateElement('activeBooksCount', activeBooks);
        this.safeUpdateElement('featuredBooksCount', featuredBooks);
        this.safeUpdateElement('totalDownloads', totalDownloads);
    }

    safeUpdateElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    updateTableInfo(total) {
        const element = document.getElementById('tableInfo');
        if (element) {
            element.textContent = `Showing ${total} books`;
        }
    }

    async viewBookDetails(bookId) {
        try {
            console.log('📖 Fetching details for book:', bookId);
            
            // Since your API doesn't have /api/books/:id endpoint,
            // use the books we already loaded
            const book = this.currentBooks.find(b => b._id === bookId);
            
            if (book) {
                console.log('✅ Book found in current books:', book.title);
                this.showBookDetailsModal(book);
            } else {
                console.log('❌ Book not found in current books, trying API...');
                
                // Fallback: Try to get all books and find the specific one
                const response = await fetch(`${this.API_BASE_URL}/books`, {
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    const foundBook = result.books?.find(b => b._id === bookId);
                    if (foundBook) {
                        this.showBookDetailsModal(foundBook);
                    } else {
                        throw new Error('Book not found');
                    }
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }
        } catch (error) {
            console.error('❌ Error fetching book details:', error);
            this.showNotification(`Error loading book details: ${error.message}`, 'error');
        }
    }

    showBookDetailsModal(book) {
        console.log('🎯 Showing book details modal for:', book.title);
        const modal = document.getElementById('bookDetailsModal');
        const content = document.getElementById('bookDetailsContent');
        
        if (!modal || !content) {
            console.error('❌ Book details modal elements not found');
            return;
        }
        
        content.innerHTML = `
            <div class="book-details-layout">
                <div class="book-cover-section">
                    <div class="book-cover-large">
                        ${book.coverImage ? 
                            `<img src="http://localhost:5000${book.coverImage}" alt="${this.escapeHtml(book.title)}" 
                                  onerror="this.style.display='none'">` : 
                            `<div class="default-cover-large">📚</div>`
                        }
                    </div>
                    <div class="book-stats">
                        <div class="stat-item">
                            <span class="stat-label">Downloads</span>
                            <span class="stat-value">${book.downloadCount || 0}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Views</span>
                            <span class="stat-value">${book.viewCount || 0}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Status</span>
                            <span class="stat-value ${book.isActive ? 'status-active' : 'status-inactive'}">
                                ${book.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="book-info-section">
                    <h2 class="book-title-large">${this.escapeHtml(book.title || 'No Title')}</h2>
                    <p class="book-author-large">by ${this.escapeHtml(book.author || 'Unknown Author')}</p>
                    
                    <div class="book-meta-grid">
                        <div class="meta-item">
                            <strong>📚 Category:</strong>
                            <span>${this.escapeHtml(book.category || 'Not specified')}</span>
                        </div>
                        <div class="meta-item">
                            <strong>📅 Published Year:</strong>
                            <span>${book.publicationYear || 'Unknown'}</span>
                        </div>
                        <div class="meta-item">
                            <strong>🏢 Publisher:</strong>
                            <span>${this.escapeHtml(book.publisher || 'Not specified')}</span>
                        </div>
                        <div class="meta-item">
                            <strong>📖 Pages:</strong>
                            <span>${book.pages || 'N/A'}</span>
                        </div>
                        <div class="meta-item">
                            <strong>🌐 Language:</strong>
                            <span>${this.escapeHtml(book.language || 'Not specified')}</span>
                        </div>
                        <div class="meta-item">
                            <strong>🔢 ISBN:</strong>
                            <span>${this.escapeHtml(book.isbn || 'Not available')}</span>
                        </div>
                        <div class="meta-item">
                            <strong>🔓 Access Level:</strong>
                            <span class="access-${book.accessLevel}">${book.accessLevel || 'public'}</span>
                        </div>
                    </div>
                    
                    <div class="book-description-section">
                        <h4>Description</h4>
                        <p class="book-description">${this.escapeHtml(book.description || 'No description available.')}</p>
                    </div>
                    
                    ${book.tags && book.tags.length > 0 ? `
                    <div class="book-tags-section">
                        <h4>Tags</h4>
                        <div class="tags-container">
                            ${book.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="book-additional-info">
                        <h4>Additional Information</h4>
                        <div class="info-grid">
                            <div class="info-item">
                                <strong>⭐ Featured:</strong>
                                <span>${book.isFeatured ? 'Yes' : 'No'}</span>
                            </div>
                            <div class="info-item">
                                <strong>📁 File Size:</strong>
                                <span>${book.fileSize ? this.formatFileSize(book.fileSize) : 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <strong>📅 Created:</strong>
                                <span>${book.createdAt ? new Date(book.createdAt).toLocaleDateString() : 'Unknown'}</span>
                            </div>
                            <div class="info-item">
                                <strong>✏️ Last Updated:</strong>
                                <span>${book.updatedAt ? new Date(book.updatedAt).toLocaleDateString() : 'Unknown'}</span>
                            </div>
                            <div class="info-item">
                                <strong>👤 Uploaded By:</strong>
                                <span>${book.uploadedBy?.name || 'Unknown'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
        console.log('✅ Modal should be visible now');
    
        // Add close functionality
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.style.display = 'none';
            };
        }
        
        // Close when clicking outside modal
        modal.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
    }

editBook(bookId) {
    try {
        // Find the book in currentBooks
        const book = this.currentBooks.find(b => b._id === bookId);
        if (!book) {
            this.showNotification('Book not found', 'error');
            return;
        }

        const modal = document.getElementById('editBookModal');
        if (!modal) {
            console.error('❌ Edit modal not found');
            this.showNotification('Edit feature not available', 'error');
            return;
        }
        
        console.log('📝 Populating edit form for book:', book.title);
        console.log('📖 Book data:', book);
        // Safe element helper functions
        const setValue = (elementId, value) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.value = value || '';
                console.log(`✅ Set ${elementId}:`, value || '');
            } else {
                console.warn(`⚠️ Element not found: ${elementId}`);
            }
        };

        const setChecked = (elementId, checked) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.checked = !!checked;
                console.log(`✅ Set ${elementId}:`, !!checked);
            } else {
                console.warn(`⚠️ Element not found: ${elementId}`);
            }
        };

        // Populate form with book data - only set available elements
        setValue('editTitle', book.title);
        setValue('editAuthor', book.author);
        setValue('editCategory', book.category);
        setValue('editIsbn', book.isbn);
        setValue('editDescription', book.description);
        setValue('editPages', book.pages);
        
        // Optional fields - only set if elements exist
        setValue('editLanguage', book.language || 'English');
        setValue('editPublisher', book.publisher);
        setValue('editPublicationYear', book.publicationYear);
        setValue('editAccessLevel', book.accessLevel || 'public');
        setValue('editTags', book.tags?.join(', '));
        
        setChecked('editIsActive', book.isActive);
        setChecked('editIsFeatured', book.isFeatured);
                const coverImageInput = document.getElementById('editCoverImage');
        const pdfFileInput = document.getElementById('editPdfFile');
        if (coverImageInput) coverImageInput.value = '';
        if (pdfFileInput) pdfFileInput.value = '';
        // Display current files info (if element exists)
        this.displayCurrentFiles(book);
        
        // Store the book ID for the update
        modal.setAttribute('data-book-id', bookId);
        modal.style.display = 'block';
        
        console.log('✅ Edit modal opened successfully');
        
    } catch (error) {
        console.error('❌ Error in editBook:', error);
        this.showNotification('Error opening edit form', 'error');
    }
}

// Enhanced displayCurrentFiles method
displayCurrentFiles(book) {
    const currentFilesDiv = document.getElementById('currentFiles');
    if (!currentFilesDiv) {
        console.log('ℹ️ currentFiles element not found - skipping file display');
        return;
    }
    
    let filesHTML = '<div class="current-files"><h4>Current Files:</h4>';
    
    if (book.coverImage) {
        filesHTML += `
            <div class="current-file">
                <strong>Cover Image:</strong> 
                <img src="http://localhost:5000${book.coverImage}" alt="Current cover" 
                     style="max-width: 100px; display: block; margin: 5px 0; border: 1px solid #ddd; padding: 2px;">
                <small>${book.coverImage.split('/').pop()}</small>
            </div>
        `;
    }
    
    if (book.pdfFile) {
        filesHTML += `
            <div class="current-file">
                <strong>PDF File:</strong> 
                <span>${book.pdfFile.split('/').pop()}</span>
                <small>${book.fileSize ? `(${this.formatFileSize(book.fileSize)})` : ''}</small>
            </div>
        `;
    }
    
    filesHTML += `
        <p style="margin-top: 10px; color: #666; font-size: 12px;">
            <em>Leave file fields empty to keep current files.</em>
        </p>
    </div>`;
    
    currentFilesDiv.innerHTML = filesHTML;
}


// Enhanced updateBook method
async updateBook() {
    try {
        console.log('🔄 Update book method called');
        
        const modal = document.getElementById('editBookModal');
        if (!modal) {
            throw new Error('Edit modal not found');
        }

        const bookId = modal.getAttribute('data-book-id');
        if (!bookId) {
            throw new Error('No book ID found in modal');
        }

        console.log('📝 Updating book ID:', bookId);

        // Validate required fields
        const requiredFields = [
            { id: 'editTitle', name: 'Title' },
            { id: 'editAuthor', name: 'Author' },
            { id: 'editDescription', name: 'Description' },
            { id: 'editCategory', name: 'Category' },
            { id: 'editPages', name: 'Pages' },
            { id: 'editPublicationYear', name: 'Publication Year' },
            { id: 'editPublisher', name: 'Publisher' }
        ];

        for (const field of requiredFields) {
            const element = document.getElementById(field.id);
            if (element && !element.value.trim()) {
                throw new Error(`${field.name} is required`);
            }
        }

        // Create FormData object
        const formData = new FormData();
        
        // Add all fields
        const fields = [
            'editTitle', 'editAuthor', 'editDescription', 'editCategory', 
            'editLanguage', 'editPages', 'editPublicationYear', 'editPublisher',
            'editIsbn', 'editTags', 'editAccessLevel'
        ];

        fields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element && element.value) {
                const fieldName = fieldId.replace('edit', '').toLowerCase();
                formData.append(fieldName, element.value);
                console.log(`✅ Added ${fieldName}:`, element.value);
            }
        });

        // Add checkbox fields
        const editIsActive = document.getElementById('editIsActive');
        const editIsFeatured = document.getElementById('editIsFeatured');
        
        if (editIsActive) formData.append('isActive', editIsActive.checked);
        if (editIsFeatured) formData.append('isFeatured', editIsFeatured.checked);

        // Add files
        const coverImageInput = document.getElementById('editCoverImage');
        const pdfFileInput = document.getElementById('editPdfFile');
        
        if (coverImageInput?.files[0]) {
            formData.append('coverImage', coverImageInput.files[0]);
            console.log('✅ Added new cover image');
        }
        
        if (pdfFileInput?.files[0]) {
            formData.append('pdfFile', pdfFileInput.files[0]);
            console.log('✅ Added new PDF file');
        }

        console.log('📦 Sending update request...');

        const response = await fetch(`${this.API_BASE_URL}/books/${bookId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Update successful:', result);

        if (result.success) {
            this.showNotification('Book updated successfully!', 'success');
            this.closeEditModal();
            this.loadBooks(); // Refresh the list
        } else {
            throw new Error(result.message || 'Failed to update book');
        }

    } catch (error) {
        console.error('❌ Error updating book:', error);
        this.showNotification(`Error updating book: ${error.message}`, 'error');
    }
}
    // Delete book with modal confirmation
    deleteBook(bookId, bookTitle) {
        const modal = document.getElementById('deleteBookModal');
        const titleElement = document.getElementById('deleteBookTitle');
        
        if (!modal || !titleElement) {
            console.error('❌ Delete modal elements not found');
            return;
        }
        
        titleElement.textContent = bookTitle;
        
        // Store bookId for the confirm function
        const confirmBtn = document.getElementById('confirmDeleteBookBtn');
        if (confirmBtn) {
            confirmBtn.setAttribute('data-book-id', bookId);
        }
        
        // Show modal
        modal.style.display = 'block';
    }

    // Confirm and execute deletion
    async confirmDeleteBook(bookId) {
        try {
            console.log('🗑️ Deleting book:', bookId);
            
            const response = await fetch(`${this.API_BASE_URL}/books/${bookId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to delete book: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Delete successful:', result);
            
            this.showNotification('Book deleted successfully!', 'success');
            this.closeDeleteModal();
            this.loadBooks(); // Refresh the list
            
        } catch (error) {
            console.error('❌ Error deleting book:', error);
            this.showNotification(`Error deleting book: ${error.message}`, 'error');
        }
    }

    // Selection and bulk operations
    toggleSelectAll(checkbox) {
        const checkboxes = document.querySelectorAll('.book-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = checkbox.checked;
            this.toggleBookSelection(cb.value);
        });
        this.updateBulkDeleteButton();
    }

    toggleBookSelection(bookId) {
        if (this.selectedBooks.has(bookId)) {
            this.selectedBooks.delete(bookId);
        } else {
            this.selectedBooks.add(bookId);
        }
        this.updateBulkDeleteButton();
    }

    updateBulkDeleteButton() {
        const btn = document.getElementById('bulkDeleteBtn');
        const count = this.selectedBooks.size;
        
        if (btn) {
            if (count > 0) {
                btn.style.display = 'inline-flex';
                btn.innerHTML = `<span class="btn-icon">🗑️</span> Delete Selected (${count})`;
            } else {
                btn.style.display = 'none';
            }
        }
    }

    bulkDelete() {
        const modal = document.getElementById('bulkDeleteModal');
        const countElement = document.getElementById('selectedBooksCount');
        
        if (modal && countElement) {
            countElement.textContent = this.selectedBooks.size;
            modal.style.display = 'block';
        }
    }

    async confirmBulkDelete() {
        try {
            const bookIds = Array.from(this.selectedBooks);
            
            if (bookIds.length === 0) {
                this.showNotification('No books selected for deletion', 'warning');
                return;
            }

            console.log('🗑️ Bulk deleting books:', bookIds);
            
            const response = await fetch(`${this.API_BASE_URL}/books/bulk-delete`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ bookIds })
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification(`${bookIds.length} books deleted successfully!`, 'success');
                this.closeBulkDeleteModal();
                this.selectedBooks.clear();
                this.loadBooks(); // Refresh the list
            } else {
                throw new Error(result.message || 'Failed to delete books');
            }
        } catch (error) {
            console.error('❌ Error bulk deleting books:', error);
            this.showNotification(`Error deleting books: ${error.message}`, 'error');
        }
    }

    // Filtering and searching
    filterBooks() {
        const searchTerm = document.getElementById('searchBooks')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('categoryFilter')?.value || '';
        const statusFilter = document.getElementById('statusFilter')?.value || '';
        const sortBy = document.getElementById('sortBy')?.value || 'newest';

        let filteredBooks = this.currentBooks.filter(book => {
            const matchesSearch = !searchTerm || 
                book.title?.toLowerCase().includes(searchTerm) ||
                book.author?.toLowerCase().includes(searchTerm) ||
                book.isbn?.includes(searchTerm);

            const matchesCategory = !categoryFilter || 
                book.category?.toLowerCase() === categoryFilter;

            const matchesStatus = !statusFilter || 
                (statusFilter === 'active' && book.isActive) ||
                (statusFilter === 'inactive' && !book.isActive);

            return matchesSearch && matchesCategory && matchesStatus;
        });

        // Sort books
        filteredBooks.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                case 'oldest':
                    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
                case 'title':
                    return (a.title || '').localeCompare(b.title || '');
                case 'popular':
                    return (b.downloadCount || 0) - (a.downloadCount || 0);
                default:
                    return 0;
            }
        });

        this.displayBooks(filteredBooks);
    }

    clearFilters() {
        const searchInput = document.getElementById('searchBooks');
        const categoryFilter = document.getElementById('categoryFilter');
        const statusFilter = document.getElementById('statusFilter');
        const sortBy = document.getElementById('sortBy');
        
        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = '';
        if (statusFilter) statusFilter.value = '';
        if (sortBy) sortBy.value = 'newest';
        
        this.filterBooks();
    }

    // Modal close methods
    closeEditModal() {
        const modal = document.getElementById('editBookModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    closeDeleteModal() {
        const modal = document.getElementById('deleteBookModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    closeBulkDeleteModal() {
        const modal = document.getElementById('bulkDeleteModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    closeDetailsModal() {
        const modal = document.getElementById('bookDetailsModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Utility methods
    formatFileSize(bytes) {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
            console.log('Notification:', message);
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
        
        // Auto-remove after 5 seconds
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

    // Additional utility methods
    exportBooks() {
        this.showNotification('Export feature coming soon!', 'info');
    }

    editBookFromDetails() {
        const detailsModal = document.getElementById('bookDetailsModal');
        if (detailsModal) {
            detailsModal.style.display = 'none';
        }
        // You can implement logic to get the current book ID from details modal
        this.showNotification('Edit book from details - implement this', 'info');
    }
}

// Safe initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Books Manager...');
    
    // Check authentication first
    if (typeof authSystem !== 'undefined' && !authSystem.requireAuth()) {
        return;
    }
    
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || !['admin', 'moderator'].includes(user.role)) {
        console.error('❌ Access denied. Admin or moderator role required.');
        return;
    }
    
    // Initialize Books Manager
    window.booksManager = new BooksManager();
});








