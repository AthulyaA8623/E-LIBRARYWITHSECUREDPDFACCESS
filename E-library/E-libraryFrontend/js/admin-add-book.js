
// admin-add-book.js - DEBUGGING VERSION
// Book Management System - Debugging JavaScript Solution

// IMMEDIATE CHECK - Stop if not on add-book page
(function() {
    'use strict';
    
    console.log('🔍 Checking if this is add-book page...');
    
    // Check if we have the main form element
    const form = document.getElementById('addBookForm');
    if (!form) {
        console.log('🛑 This is not the add-book page. Stopping script.');
        // Create empty manager to prevent errors
        window.addBookManager = {
            initialize: function() {},
            showNotification: function(msg, type) { console.log('Notification:', msg, type); },
            resetForm: function() { console.log('resetForm called but form not found'); }
        };
        return; // STOP EXECUTION
    }
    
    console.log('✅ On add-book page! Starting AddBookManager...');
    
    // Only define the class if we're on the right page
    class AddBookManager {
        constructor() {
            console.log('🎯 AddBookManager started on add-book page!');
            
            // API Configuration
            this.API_BASE_URL = 'http://localhost:5000/api';
            this.token = localStorage.getItem('authToken');
            console.log('🔑 Token exists:', !!this.token);
            
            // Remove required attributes from hidden file inputs to prevent browser validation errors
            this.removeRequiredFromFileInputs();
            
            // Check if all required elements exist
            this.validateRequiredElements();
            
            this.initializeEventListeners();
            this.updatePreview();
            this.updateCharCount();
        }

        removeRequiredFromFileInputs() {
            // Remove required attributes to prevent browser validation errors on hidden inputs
            const coverInput = document.getElementById('bookCover');
            const pdfInput = document.getElementById('bookPdf');
            
            if (coverInput) coverInput.removeAttribute('required');
            if (pdfInput) pdfInput.removeAttribute('required');
            
            console.log('✅ Removed required attributes from file inputs');
        }

        validateRequiredElements() {
            const requiredElements = [
                'bookTitle', 'bookAuthor', 'bookDescription', 'bookCategory',
                'bookPages', 'bookPublishedDate', 'bookPublisher', 'bookPreview',
                'coverUploadArea', 'pdfUploadArea', 'coverStatus', 'pdfStatus'
            ];
            
            requiredElements.forEach(id => {
                if (!document.getElementById(id)) {
                    console.error(`❌ Required element missing: ${id}`);
                }
            });
        }

        initializeEventListeners() {
            console.log('🔧 Setting up event listeners...');
            
            // Form submission
            document.getElementById('addBookForm').addEventListener('submit', (e) => {
                this.handleFormSubmit(e);
            });

            // File upload handlers
            this.setupFileUpload('bookCover', 'coverUploadArea', 'coverPreview', 'coverStatus', this.handleCoverUpload.bind(this));
            this.setupFileUpload('bookPdf', 'pdfUploadArea', null, 'pdfStatus', this.handlePdfUpload.bind(this));

            // Real-time preview updates
            document.getElementById('bookTitle').addEventListener('input', () => this.updatePreview());
            document.getElementById('bookAuthor').addEventListener('input', () => this.updatePreview());
            document.getElementById('bookDescription').addEventListener('input', () => {
                this.updateCharCount();
                this.updatePreview();
            });
            document.getElementById('bookCategory').addEventListener('change', () => this.updatePreview());
            document.getElementById('bookPages').addEventListener('input', () => this.updatePreview());
            document.getElementById('bookTags').addEventListener('input', () => this.updatePreview());
            document.getElementById('bookIsbn').addEventListener('input', () => this.updatePreview());

            console.log('✅ All event listeners added successfully!');
        }

        setupFileUpload(inputId, areaId, previewId, statusId, handler) {
            const fileInput = document.getElementById(inputId);
            const uploadArea = document.getElementById(areaId);
            const statusElement = document.getElementById(statusId);
            const previewElement = previewId ? document.getElementById(previewId) : null;

            if (!fileInput || !uploadArea || !statusElement) {
                console.error(`❌ File upload elements missing for ${inputId}`);
                return;
            }

            uploadArea.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => handler(e, fileInput, uploadArea, previewElement, statusElement));

            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('drag-over');
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('drag-over');
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('drag-over');
                fileInput.files = e.dataTransfer.files;
                handler(e, fileInput, uploadArea, previewElement, statusElement);
            });
        }

        handleCoverUpload(event, fileInput, uploadArea, previewElement, statusElement) {
            const file = fileInput.files[0];
            if (file) {
                if (!file.type.startsWith('image/')) {
                    this.showNotification('Please select an image file', 'error');
                    fileInput.value = '';
                    return;
                }

                if (file.size > 5 * 1024 * 1024) {
                    this.showNotification('Cover image must be less than 5MB', 'error');
                    fileInput.value = '';
                    return;
                }

                statusElement.textContent = `${file.name} (${this.formatFileSize(file.size)})`;
                statusElement.className = 'stat-value uploaded';

                const reader = new FileReader();
                reader.onload = (e) => {
                    if (previewElement) {
                        previewElement.innerHTML = `
                            <div class="image-preview">
                                <img src="${e.target.result}" alt="Cover preview">
                                <button type="button" class="remove-image" onclick="addBookManager.removeFile('bookCover', 'coverPreview', 'coverStatus')">×</button>
                            </div>
                        `;
                    }
                };
                
                reader.onerror = () => {
                    this.showNotification('Error reading cover image file', 'error');
                    fileInput.value = '';
                    statusElement.textContent = 'Not uploaded';
                    statusElement.className = 'stat-value';
                };
                
                reader.readAsDataURL(file);

                uploadArea.style.display = 'none';
                this.updatePreview();
            }
        }

        handlePdfUpload(event, fileInput, uploadArea, previewElement, statusElement) {
            const file = fileInput.files[0];
            if (file) {
                if (file.type !== 'application/pdf') {
                    this.showNotification('Please select a PDF file', 'error');
                    fileInput.value = '';
                    return;
                }

                if (file.size > 50 * 1024 * 1024) {
                    this.showNotification('PDF file must be less than 50MB', 'error');
                    fileInput.value = '';
                    return;
                }

                statusElement.textContent = `${file.name} (${this.formatFileSize(file.size)})`;
                statusElement.className = 'stat-value uploaded';

                const fileInfo = document.getElementById('pdfFileInfo');
                if (fileInfo) {
                    fileInfo.innerHTML = `
                        <div class="file-info-card">
                            <div class="file-icon">📄</div>
                            <div class="file-details">
                                <div class="file-name">${file.name}</div>
                                <div class="file-size">${this.formatFileSize(file.size)}</div>
                            </div>
                            <button type="button" class="remove-file" onclick="addBookManager.removeFile('bookPdf', null, 'pdfStatus')">×</button>
                        </div>
                    `;
                }

                uploadArea.style.display = 'none';
            }
        }

        removeFile(inputId, previewId, statusId) {
            const fileInput = document.getElementById(inputId);
            const statusElement = document.getElementById(statusId);
            
            if (fileInput) fileInput.value = '';
            if (statusElement) {
                statusElement.textContent = 'Not uploaded';
                statusElement.className = 'stat-value';
            }
            
            if (previewId) {
                const previewElement = document.getElementById(previewId);
                if (previewElement) previewElement.innerHTML = '';
                
                const uploadArea = document.getElementById(inputId.replace('book', '').toLowerCase() + 'UploadArea');
                if (uploadArea) uploadArea.style.display = 'flex';
            } else {
                const fileInfo = document.getElementById('pdfFileInfo');
                if (fileInfo) fileInfo.innerHTML = '';
                
                const pdfUploadArea = document.getElementById('pdfUploadArea');
                if (pdfUploadArea) pdfUploadArea.style.display = 'flex';
            }
            
            // Remove error borders when file is removed
            this.removeUploadAreaErrors();
            this.updatePreview();
        }

        removeUploadAreaErrors() {
            const coverArea = document.getElementById('coverUploadArea');
            const pdfArea = document.getElementById('pdfUploadArea');
            
            if (coverArea) coverArea.classList.remove('error-border');
            if (pdfArea) pdfArea.classList.remove('error-border');
        }

        updateCharCount() {
            const textarea = document.getElementById('bookDescription');
            const charCount = document.getElementById('descriptionCharCount');
            if (!textarea || !charCount) return;
            
            charCount.textContent = textarea.value.length;
            
            if (textarea.value.length > 500) {
                charCount.style.color = '#e53e3e';
            } else {
                charCount.style.color = '#4a5568';
            }
        }

        async handleFormSubmit(e) {
            e.preventDefault();
            
            console.log('🚀 STARTING FORM SUBMISSION');
            
            const token = localStorage.getItem('authToken');
            if (!token) {
                this.showNotification('Please login first', 'error');
                return;
            }

            // Get current user info for uploadedBy field
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (!currentUser) {
                this.showNotification('Please login first', 'error');
                return;
            }

            console.log('👤 Current User:', currentUser);
            console.log('🔑 Token:', token.substring(0, 20) + '...');

            const submitButton = e.target.querySelector('button[type="submit"]');
            const buttonText = submitButton.querySelector('.btn-text');
            const loading = submitButton.querySelector('.loading');

            try {
                // Show loading
                buttonText.style.display = 'none';
                loading.style.display = 'inline';

                // Validate form first
                if (!this.validateForm()) {
                    throw new Error('Please fill all required fields');
                }

                // DEBUG: Check all field values
                console.log('🔍 FIELD VALUES:');
                console.log('Title:', document.getElementById('bookTitle').value);
                console.log('Author:', document.getElementById('bookAuthor').value);
                console.log('Description:', document.getElementById('bookDescription').value);
                console.log('Category:', document.getElementById('bookCategory').value);
                console.log('Language:', document.getElementById('bookLanguage').value);
                console.log('Pages:', document.getElementById('bookPages').value);
                console.log('Publication Year:', document.getElementById('bookPublishedDate').value);
                console.log('Publisher:', document.getElementById('bookPublisher').value);
                console.log('ISBN:', document.getElementById('bookIsbn').value);
                console.log('Tags:', document.getElementById('bookTags').value);
                console.log('Access Level:', document.getElementById('bookPublic').checked ? 'public' : 'premium');
                console.log('Cover File:', document.getElementById('bookCover').files[0]?.name);
                console.log('PDF File:', document.getElementById('bookPdf').files[0]?.name);

                // Create FormData with EXACT field names that match your backend
                const formData = new FormData();
                
                // BASIC INFORMATION - MATCHING YOUR BOOK SCHEMA
                formData.append('title', document.getElementById('bookTitle').value.trim());
                formData.append('author', document.getElementById('bookAuthor').value.trim());
                formData.append('description', document.getElementById('bookDescription').value.trim());
                formData.append('category', document.getElementById('bookCategory').value);
                formData.append('language', document.getElementById('bookLanguage').value);
                formData.append('pages', parseInt(document.getElementById('bookPages').value));
                formData.append('publicationYear', parseInt(document.getElementById('bookPublishedDate').value));
                formData.append('publisher', document.getElementById('bookPublisher').value.trim());
                
                // ISBN FIELD
                const isbnValue = document.getElementById('bookIsbn').value.trim();
                if (isbnValue) {
                    formData.append('isbn', isbnValue);
                } else {
                    formData.append('isbn', '');
                }

                // TAGS
                const tagsInput = document.getElementById('bookTags').value;
                if (tagsInput) {
                    formData.append('tags', tagsInput);
                } else {
                    formData.append('tags', '');
                }

                // ACCESS LEVEL
                const isPublic = document.getElementById('bookPublic').checked;
                formData.append('accessLevel', isPublic ? 'public' : 'premium');

                // Add files
                const coverFile = document.getElementById('bookCover').files[0];
                const pdfFile = document.getElementById('bookPdf').files[0];
                
                if (coverFile) {
                    formData.append('coverImage', coverFile);
                    console.log('📷 Cover file added:', coverFile.name);
                }
                if (pdfFile) {
                    formData.append('pdfFile', pdfFile);
                    console.log('📄 PDF file added:', pdfFile.name);
                }

                // DEBUG: Log all form data entries
                console.log('📦 FormData entries:');
                for (let [key, value] of formData.entries()) {
                    if (key !== 'coverImage' && key !== 'pdfFile') {
                        console.log(`  ${key}:`, value);
                    } else {
                        console.log(`  ${key}:`, '[FILE]', value.name, value.size, 'bytes');
                    }
                }

                console.log('📤 Sending request to server...');

                // Send request to your backend
                const response = await fetch(`${this.API_BASE_URL}/books`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                        // Don't set Content-Type for FormData - browser will set it with boundary
                    },
                    body: formData
                });

                const data = await response.json();
                console.log('📥 Full server response:', data);
                console.log('📊 Response status:', response.status);
                console.log('✅ Response ok:', response.ok);

                if (!response.ok) {
                    let errorMessage = 'Failed to create book';
                    if (data.message) errorMessage = data.message;
                    if (data.error) errorMessage = data.error;
                    
                    // Handle duplicate ISBN specifically
                    if (data.message && data.message.includes('ISBN')) {
                        errorMessage = 'A book with this ISBN already exists';
                    }
                    
                    console.error('❌ Server error details:', data);
                    throw new Error(errorMessage);
                }

                // SUCCESS!
                this.showNotification('✅ Book added successfully!', 'success');
                
                // Reset form
                this.resetForm();
                
                // Redirect after 2 seconds
                setTimeout(() => {
                    window.location.href = 'books.html';
                }, 2000);

            } catch (error) {
                console.error('❌ Add book error:', error);
                this.showNotification(`❌ ${error.message}`, 'error');
            } finally {
                // Hide loading
                buttonText.style.display = 'inline';
                loading.style.display = 'none';
            }
        }

        validateForm() {
            const requiredFields = [
                'bookTitle', 'bookAuthor', 'bookDescription', 'bookCategory', 
                'bookPages', 'bookPublishedDate', 'bookPublisher', 'bookLanguage'
            ];

            let isValid = true;

            // Validate text fields
            for (const fieldId of requiredFields) {
                const field = document.getElementById(fieldId);
                if (!field || !field.value.trim()) {
                    this.highlightError(field, 'This field is required');
                    isValid = false;
                } else {
                    this.removeError(field);
                }
            }

            // Check files with visual error highlighting
            const coverFile = document.getElementById('bookCover').files[0];
            const pdfFile = document.getElementById('bookPdf').files[0];
            
            const coverUploadArea = document.getElementById('coverUploadArea');
            const pdfUploadArea = document.getElementById('pdfUploadArea');
            
            if (!coverFile) {
                this.showNotification('Cover image is required', 'error');
                if (coverUploadArea) coverUploadArea.classList.add('error-border');
                isValid = false;
            } else {
                if (coverUploadArea) coverUploadArea.classList.remove('error-border');
            }

            if (!pdfFile) {
                this.showNotification('PDF file is required', 'error');
                if (pdfUploadArea) pdfUploadArea.classList.add('error-border');
                isValid = false;
            } else {
                if (pdfUploadArea) pdfUploadArea.classList.remove('error-border');
            }

            // Check description length
            const description = document.getElementById('bookDescription');
            if (description && description.value.length > 500) {
                this.highlightError(description, 'Description must be less than 500 characters');
                isValid = false;
            }

            return isValid;
        }

        highlightError(field, message) {
            if (!field) return;
            
            field.classList.add('error');
            let errorElement = field.parentNode.querySelector('.error-message');
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'error-message';
                field.parentNode.appendChild(errorElement);
            }
            errorElement.textContent = message;
        }

        removeError(field) {
            if (!field) return;
            
            field.classList.remove('error');
            const errorElement = field.parentNode.querySelector('.error-message');
            if (errorElement) {
                errorElement.remove();
            }
        }

        updatePreview() {
            const previewElement = document.getElementById('bookPreview');
            if (!previewElement) return;

            const title = document.getElementById('bookTitle').value;
            const author = document.getElementById('bookAuthor').value;
            const description = document.getElementById('bookDescription').value;
            const category = document.getElementById('bookCategory').value;
            const pages = document.getElementById('bookPages').value;
            const isbn = document.getElementById('bookIsbn').value;

            if (!title && !author && !description) {
                previewElement.innerHTML = `
                    <div class="preview-placeholder">
                        <div class="preview-icon">📖</div>
                        <p>Book preview will appear here</p>
                        <small style="color: #a0aec0;">Fill in the form to see the preview</small>
                    </div>
                `;
                return;
            }

            // Get cover preview if exists
            const coverPreview = document.getElementById('coverPreview');
            const coverPreviewHTML = coverPreview ? coverPreview.innerHTML : '';
            
            previewElement.innerHTML = `
                <div class="book-preview-card">
                    <div class="preview-cover">
                        ${coverPreviewHTML || '<div class="default-cover">📚</div>'}
                    </div>
                    <div class="preview-details">
                        <h4 class="preview-title">${title || 'Untitled Book'}</h4>
                        <p class="preview-author">by ${author || 'Unknown Author'}</p>
                        <div class="preview-meta">
                            ${category ? `<span class="preview-category">${category}</span>` : ''}
                            ${pages ? `<span class="preview-pages">${pages} pages</span>` : ''}
                            ${isbn ? `<span class="preview-isbn">ISBN: ${isbn}</span>` : ''}
                        </div>
                        <p class="preview-description">${description || 'No description provided.'}</p>
                        <div class="preview-tags">
                            ${this.generateTagsPreview()}
                        </div>
                    </div>
                </div>
            `;
        }

        generateTagsPreview() {
            const tagsInput = document.getElementById('bookTags');
            if (!tagsInput || !tagsInput.value) return '';

            const tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag);
            return tags.map(tag => `<span class="preview-tag">${tag}</span>`).join('');
        }

        resetForm() {
            const form = document.getElementById('addBookForm');
            if (form) form.reset();
            
            this.removeFile('bookCover', 'coverPreview', 'coverStatus');
            this.removeFile('bookPdf', null, 'pdfStatus');
            
            const coverUploadArea = document.getElementById('coverUploadArea');
            const pdfUploadArea = document.getElementById('pdfUploadArea');
            
            if (coverUploadArea) coverUploadArea.style.display = 'flex';
            if (pdfUploadArea) pdfUploadArea.style.display = 'flex';
            
            this.updateCharCount();
            this.updatePreview();
            this.removeUploadAreaErrors();
            
            console.log('✅ Form reset successfully');
        }

        formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
                    <span class="notification-message">${message}</span>
                </div>
                <button class="notification-close" onclick="this.parentElement.remove()">×</button>
            `;
            
            container.appendChild(notification);
            
            // Auto remove after 5 seconds
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

    // Initialize the manager (only runs on add-book page)
    window.addBookManager = new AddBookManager();
})(); 


