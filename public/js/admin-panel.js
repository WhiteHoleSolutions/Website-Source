// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.currentAlbumId = null;
        this.init();
    }

    init() {
        this.setupTabs();
        this.loadAlbums();
        this.loadInquiries();
        this.setupAlbumForm();
    }

    setupTabs() {
        const tabs = document.querySelectorAll('.admin-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs and contents
                document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked tab
                tab.classList.add('active');
                
                // Show corresponding content
                const tabName = tab.getAttribute('data-tab');
                document.getElementById(`${tabName}-tab`).classList.add('active');
            });
        });
    }

    async loadAlbums() {
        const container = document.getElementById('admin-albums');
        
        try {
            const response = await fetch('/api/albums');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const albums = await response.json();

            if (albums.length === 0) {
                container.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                        <h3>No Albums Yet</h3>
                        <p>Create your first album to get started</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = albums.map(album => this.createAlbumCard(album)).join('');
        } catch (error) {
            console.error('Error loading albums:', error);
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <h3>Error Loading Albums</h3>
                    <p>Failed to connect to server. Please try again.</p>
                </div>
            `;
        }
    }

    createAlbumCard(album) {
        const coverImage = album.images[0]?.url || 'https://picsum.photos/400/300';
        const imageCount = album.images.length;
        
        return `
            <div class="admin-album-card" data-album-id="${album.id}">
                <img src="${coverImage}" alt="${album.name}" class="admin-album-cover">
                <div class="admin-album-info">
                    <h3 class="admin-album-name">${album.name}</h3>
                    <div class="admin-album-category">${this.formatCategory(album.category)}</div>
                    <div class="admin-album-stats">
                        <span>${imageCount} image${imageCount !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="admin-album-actions">
                        <button class="edit-btn" onclick="adminPanel.editAlbum(${album.id})">Edit</button>
                        <button class="delete-btn" onclick="adminPanel.deleteAlbum(${album.id}, '${album.name}')">Delete</button>
                    </div>
                </div>
            </div>
        `;
    }

    formatCategory(category) {
        return category.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    async loadInquiries() {
        const container = document.getElementById('inquiries-list');
        
        try {
            const response = await fetch('/api/inquiries');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const inquiries = await response.json();

            if (inquiries.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        <h3>No Inquiries Yet</h3>
                        <p>Customer inquiries will appear here</p>
                    </div>
                `;
                return;
            }

            // Sort by date, newest first
            inquiries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            container.innerHTML = inquiries.map(inquiry => this.createInquiryCard(inquiry)).join('');
        } catch (error) {
            console.error('Error loading inquiries:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <h3>Error Loading Inquiries</h3>
                    <p>Failed to connect to server. Please try again.</p>
                </div>
            `;
        }
    }

    createInquiryCard(inquiry) {
        const date = new Date(inquiry.timestamp);
        const formattedDate = date.toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const readClass = inquiry.read ? 'read' : 'unread';
        
        return `
            <div class="inquiry-card ${readClass}" data-inquiry-id="${inquiry.id}">
                <div class="inquiry-header">
                    <div class="inquiry-meta">
                        <h3 class="inquiry-name">${inquiry.name}</h3>
                        <span class="inquiry-type-badge ${inquiry.type}">${inquiry.type}</span>
                        <div class="inquiry-date">${formattedDate}</div>
                    </div>
                    <div class="inquiry-actions">
                        ${!inquiry.read ? `<button class="mark-read-btn" onclick="adminPanel.markAsRead(${inquiry.id})">Mark Read</button>` : ''}
                        <button class="inquiry-delete-btn" onclick="adminPanel.deleteInquiry(${inquiry.id})">Delete</button>
                    </div>
                </div>
                <div class="inquiry-body">
                    <div class="inquiry-details">
                        <div class="inquiry-detail-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                            <a href="mailto:${inquiry.email}">${inquiry.email}</a>
                        </div>
                        ${inquiry.phone ? `
                            <div class="inquiry-detail-item">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                </svg>
                                <a href="tel:${inquiry.phone}">${inquiry.phone}</a>
                            </div>
                        ` : ''}
                        <div class="inquiry-detail-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            <span>Service: ${this.formatCategory(inquiry.service)}</span>
                        </div>
                    </div>
                    <div class="inquiry-message">
                        <div class="inquiry-label">Message:</div>
                        ${inquiry.message}
                    </div>
                </div>
            </div>
        `;
    }

    setupAlbumForm() {
        const form = document.getElementById('album-form');
        const imageInput = document.getElementById('album-images');
        const imagePreview = document.getElementById('image-preview');

        imageInput.addEventListener('change', (e) => {
            imagePreview.innerHTML = '';
            const files = Array.from(e.target.files);
            
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = document.createElement('img');
                    img.src = event.target.result;
                    img.style.width = '100%';
                    img.style.height = '100px';
                    img.style.objectFit = 'cover';
                    img.style.borderRadius = '8px';
                    imagePreview.appendChild(img);
                };
                reader.readAsDataURL(file);
            });
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveAlbum();
        });
    }

    async saveAlbum() {
        const name = document.getElementById('album-name').value;
        const category = document.getElementById('album-category').value;
        const imageFiles = document.getElementById('album-images').files;

        if (!name || !category || imageFiles.length === 0) {
            alert('Please fill in all required fields and select at least one image');
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('category', category);
        
        Array.from(imageFiles).forEach((file, index) => {
            formData.append(`images`, file);
        });

        try {
            const url = this.currentAlbumId 
                ? `/api/albums/${this.currentAlbumId}` 
                : '/api/albums';
            
            const method = this.currentAlbumId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                body: formData
            });

            if (response.ok) {
                this.closeAlbumModal();
                await this.loadAlbums();
                alert(`Album ${this.currentAlbumId ? 'updated' : 'created'} successfully!`);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save album');
            }
        } catch (error) {
            console.error('Error saving album:', error);
            alert(`Error: ${error.message}`);
        }

        this.currentAlbumId = null;
    }

    openCreateAlbumModal() {
        this.currentAlbumId = null;
        document.getElementById('modal-title').textContent = 'Create New Album';
        document.getElementById('album-form').reset();
        document.getElementById('image-preview').innerHTML = '';
        document.getElementById('album-modal').classList.add('active');
    }

    closeAlbumModal() {
        document.getElementById('album-modal').classList.remove('active');
        this.currentAlbumId = null;
    }

    async editAlbum(albumId) {
        this.currentAlbumId = albumId;
        document.getElementById('modal-title').textContent = 'Edit Album';
        
        try {
            const response = await fetch(`/api/albums/${albumId}`);
            if (response.ok) {
                const album = await response.json();
                document.getElementById('album-name').value = album.name;
                document.getElementById('album-category').value = album.category;
                // Note: File inputs cannot be pre-populated for security reasons
            }
        } catch (error) {
            console.error('Error loading album:', error);
        }
        
        document.getElementById('album-modal').classList.add('active');
    }

    async deleteAlbum(albumId, albumName) {
        if (!confirm(`Are you sure you want to delete "${albumName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/albums/${albumId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await this.loadAlbums();
                alert('Album deleted successfully');
            } else {
                throw new Error('Failed to delete album');
            }
        } catch (error) {
            console.error('Error deleting album:', error);
            alert(`Error: ${error.message}`);
        }
    }

    async markAsRead(inquiryId) {
        try {
            const response = await fetch(`/api/inquiries/${inquiryId}/read`, {
                method: 'PATCH'
            });

            if (response.ok) {
                await this.loadInquiries();
            } else {
                throw new Error('Failed to mark as read');
            }
        } catch (error) {
            console.error('Error marking inquiry as read:', error);
            alert(`Error: ${error.message}`);
        }
    }

    async deleteInquiry(inquiryId) {
        if (!confirm('Are you sure you want to delete this inquiry?')) {
            return;
        }

        try {
            const response = await fetch(`/api/inquiries/${inquiryId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await this.loadInquiries();
                alert('Inquiry deleted successfully');
            } else {
                throw new Error('Failed to delete inquiry');
            }
        } catch (error) {
            console.error('Error deleting inquiry:', error);
            alert(`Error: ${error.message}`);
        }
    }
}

// Global functions for button onclick handlers
let adminPanel;

function openCreateAlbumModal() {
    adminPanel.openCreateAlbumModal();
}

function closeAlbumModal() {
    adminPanel.closeAlbumModal();
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.close();
        // If window.close() doesn't work (blocked by browser), redirect
        setTimeout(() => {
            window.location.href = '/';
        }, 100);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
});
