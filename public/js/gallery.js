// ===== Gallery Module =====
// Handles photo gallery display, albums, and image viewer

class GalleryManager {
    constructor() {
        this.albums = [];
        this.currentAlbum = null;
        this.currentImageIndex = 0;
        this.rotationIntervals = new Map();
        this.viewerOpen = false;
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.isDragging = false;
        
        // Touch handling
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartDistance = 0;
        this.lastTouchDistance = 0;
        this.isSwiping = false;
        this.isPinching = false;
        
        // Device detection
        this.isMobile = this.detectMobile();
        
        this.init();
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
            || window.matchMedia('(max-width: 768px)').matches 
            || ('ontouchstart' in window);
    }
    
    init() {
        this.loadAlbums();
        this.setupViewer();
        this.setupKeyboardShortcuts();
    }
    
    async loadAlbums() {
        try {
            const response = await fetch('/api/albums');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const allAlbums = await response.json();
            // Filter out private albums
            this.albums = allAlbums.filter(album => !album.is_private);
            this.renderGallery();
            this.startRotations();
        } catch (error) {
            console.error('Failed to load albums:', error);
            const gallerySection = document.getElementById('gallery');
            if (gallerySection) {
                gallerySection.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 4rem;">Unable to load gallery. Please try again later.</p>';
            }
        }
    }
    
    renderGallery() {
        const gallerySection = document.getElementById('gallery');
        if (!gallerySection) return;
        
        const container = gallerySection.querySelector('.gallery-grid') || this.createGalleryContainer(gallerySection);
        container.innerHTML = '';
        
        this.albums.forEach((album, index) => {
            const albumCard = this.createAlbumCard(album, index);
            container.appendChild(albumCard);
        });
    }
    
    createGalleryContainer(section) {
        const container = document.createElement('div');
        container.className = 'gallery-grid';
        section.appendChild(container);
        return container;
    }
    
    createAlbumCard(album, index) {
        const card = document.createElement('div');
        card.className = 'album-card';
        card.dataset.albumId = album.id;
        
        const imageContainer = document.createElement('div');
        imageContainer.className = 'album-image-container';
        
        const img = document.createElement('img');
        img.src = album.images[0].url;
        img.alt = album.name;
        img.className = 'album-cover';
        img.dataset.albumIndex = index;
        
        const overlay = document.createElement('div');
        overlay.className = 'album-overlay';
        
        const title = document.createElement('h3');
        title.textContent = album.name;
        
        const count = document.createElement('span');
        count.className = 'image-count';
        count.textContent = `${album.images.length} photos`;
        
        overlay.appendChild(title);
        overlay.appendChild(count);
        imageContainer.appendChild(img);
        imageContainer.appendChild(overlay);
        card.appendChild(imageContainer);
        
        card.addEventListener('click', () => this.openAlbum(album));
        
        return card;
    }
    
    startRotations() {
        this.albums.forEach((album, index) => {
            if (album.images.length > 1) {
                let currentIndex = 0;
                const interval = setInterval(() => {
                    currentIndex = (currentIndex + 1) % album.images.length;
                    const img = document.querySelector(`img[data-album-index="${index}"]`);
                    if (img) {
                        img.style.opacity = '0';
                        setTimeout(() => {
                            img.src = album.images[currentIndex].url;
                            img.style.opacity = '1';
                        }, 300);
                    }
                }, 3000);
                
                this.rotationIntervals.set(album.id, interval);
            }
        });
    }
    
    openAlbum(album) {
        this.currentAlbum = album;
        this.currentImageIndex = 0;
        this.openViewer();
    }
    
    setupViewer() {
        // Create viewer modal if it doesn't exist
        if (!document.getElementById('image-viewer')) {
            const viewer = document.createElement('div');
            viewer.id = 'image-viewer';
            viewer.className = 'image-viewer';
            
            // Different controls for mobile vs desktop
            const controlsHTML = this.isMobile ? `
                <button class="viewer-close" aria-label="Close">&times;</button>
                <div class="viewer-controls viewer-controls-mobile">
                    <span class="viewer-counter"></span>
                    <button class="viewer-reset" aria-label="Reset Zoom">Reset</button>
                </div>
            ` : `
                <button class="viewer-close" aria-label="Close">&times;</button>
                <button class="viewer-prev" aria-label="Previous">&#8249;</button>
                <button class="viewer-next" aria-label="Next">&#8250;</button>
                <div class="viewer-controls">
                    <button class="viewer-zoom-in" aria-label="Zoom In">+</button>
                    <button class="viewer-zoom-out" aria-label="Zoom Out">-</button>
                    <button class="viewer-reset" aria-label="Reset">⟲</button>
                    <span class="viewer-counter"></span>
                </div>
            `;
            
            viewer.innerHTML = `
                <div class="viewer-overlay"></div>
                <div class="viewer-content">
                    ${controlsHTML}
                    <div class="viewer-image-container">
                        <div class="viewer-image" role="img" aria-label="Gallery image"></div>
                    </div>
                    <div class="viewer-caption"></div>
                    ${this.isMobile ? '<div class="viewer-hint">Swipe to navigate • Pinch to zoom</div>' : ''}
                </div>
            `;
            document.body.appendChild(viewer);
            
            // Setup event listeners
            viewer.querySelector('.viewer-close').addEventListener('click', () => this.closeViewer());
            viewer.querySelector('.viewer-overlay').addEventListener('click', () => this.closeViewer());
            
            // Desktop-only controls
            if (!this.isMobile) {
                viewer.querySelector('.viewer-prev').addEventListener('click', () => this.previousImage());
                viewer.querySelector('.viewer-next').addEventListener('click', () => this.nextImage());
                viewer.querySelector('.viewer-zoom-in').addEventListener('click', () => this.zoomIn());
                viewer.querySelector('.viewer-zoom-out').addEventListener('click', () => this.zoomOut());
            }
            
            viewer.querySelector('.viewer-reset').addEventListener('click', () => this.resetView());
            
            // Pan functionality (mouse)
            const imageContainer = viewer.querySelector('.viewer-image-container');
            
            // Prevent context menu and drag
            imageContainer.addEventListener('contextmenu', (e) => e.preventDefault());
            imageContainer.addEventListener('dragstart', (e) => e.preventDefault());
            
            imageContainer.addEventListener('mousedown', (e) => this.startDrag(e));
            imageContainer.addEventListener('mousemove', (e) => this.drag(e));
            imageContainer.addEventListener('mouseup', () => this.endDrag());
            imageContainer.addEventListener('mouseleave', () => this.endDrag());
            
            // Touch support for mobile
            imageContainer.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
            imageContainer.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
            imageContainer.addEventListener('touchend', (e) => this.handleTouchEnd(e));
            
            // Wheel zoom
            imageContainer.addEventListener('wheel', (e) => {
                e.preventDefault();
                if (e.deltaY < 0) {
                    this.zoomIn();
                } else {
                    this.zoomOut();
                }
            }, { passive: false });
        }
    }
    
    openViewer() {
        const viewer = document.getElementById('image-viewer');
        const image = viewer.querySelector('.viewer-image');
        const caption = viewer.querySelector('.viewer-caption');
        const counter = viewer.querySelector('.viewer-counter');
        
        viewer.classList.add('active');
        this.viewerOpen = true;
        document.body.style.overflow = 'hidden';
        
        this.updateViewerImage();
    }
    
    closeViewer() {
        const viewer = document.getElementById('image-viewer');
        viewer.classList.remove('active');
        this.viewerOpen = false;
        document.body.style.overflow = '';
        this.resetView();
    }
    
    updateViewerImage() {
        if (!this.currentAlbum) return;
        
        const viewer = document.getElementById('image-viewer');
        const imageDiv = viewer.querySelector('.viewer-image');
        const caption = viewer.querySelector('.viewer-caption');
        const counter = viewer.querySelector('.viewer-counter');
        
        const currentImage = this.currentAlbum.images[this.currentImageIndex];
        
        imageDiv.style.opacity = '0';
        setTimeout(() => {
            imageDiv.style.backgroundImage = `url('${currentImage.url}')`;
            caption.textContent = currentImage.caption || '';
            counter.textContent = `${this.currentImageIndex + 1} / ${this.currentAlbum.images.length}`;
            imageDiv.style.opacity = '1';
        }, 200);
    }
    
    nextImage() {
        if (!this.currentAlbum) return;
        this.currentImageIndex = (this.currentImageIndex + 1) % this.currentAlbum.images.length;
        this.resetView();
        this.updateViewerImage();
    }
    
    previousImage() {
        if (!this.currentAlbum) return;
        this.currentImageIndex = (this.currentImageIndex - 1 + this.currentAlbum.images.length) % this.currentAlbum.images.length;
        this.resetView();
        this.updateViewerImage();
    }
    
    zoomIn() {
        this.scale = Math.min(this.scale + 0.2, 5);
        this.applyTransform();
    }
    
    zoomOut() {
        this.scale = Math.max(this.scale - 0.2, 0.5);
        this.applyTransform();
    }
    
    resetView() {
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.applyTransform();
    }
    
    applyTransform() {
        const viewer = document.getElementById('image-viewer');
        const imageDiv = viewer.querySelector('.viewer-image');
        imageDiv.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
    }
    
    startDrag(e) {
        if (this.scale <= 1) return;
        this.isDragging = true;
        this.dragStartX = e.clientX - this.translateX;
        this.dragStartY = e.clientY - this.translateY;
        document.body.style.cursor = 'grabbing';
    }
    
    drag(e) {
        if (!this.isDragging) return;
        this.translateX = e.clientX - this.dragStartX;
        this.translateY = e.clientY - this.dragStartY;
        this.applyTransform();
    }
    
    // Mobile touch handlers
    handleTouchStart(e) {
        if (e.touches.length === 1) {
            // Single touch - pan or swipe
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
            
            if (this.scale > 1) {
                // Pan mode when zoomed
                this.isDragging = true;
                this.dragStartX = e.touches[0].clientX - this.translateX;
                this.dragStartY = e.touches[0].clientY - this.translateY;
            } else {
                // Swipe mode when not zoomed
                this.isSwiping = true;
            }
        } else if (e.touches.length === 2) {
            // Two finger pinch zoom
            e.preventDefault();
            this.isPinching = true;
            this.isSwiping = false;
            this.isDragging = false;
            
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            this.touchStartDistance = Math.sqrt(dx * dx + dy * dy);
            this.lastTouchDistance = this.touchStartDistance;
        }
    }
    
    handleTouchMove(e) {
        if (e.touches.length === 1 && this.isDragging && this.scale > 1) {
            // Pan when zoomed
            e.preventDefault();
            this.translateX = e.touches[0].clientX - this.dragStartX;
            this.translateY = e.touches[0].clientY - this.dragStartY;
            this.applyTransform();
        } else if (e.touches.length === 2 && this.isPinching) {
            // Pinch zoom
            e.preventDefault();
            
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const delta = distance - this.lastTouchDistance;
            const zoomDelta = delta * 0.01;
            
            this.scale = Math.max(0.5, Math.min(5, this.scale + zoomDelta));
            this.applyTransform();
            
            this.lastTouchDistance = distance;
        }
    }
    
    handleTouchEnd(e) {
        if (this.isSwiping && e.changedTouches.length === 1) {
            // Detect swipe direction
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const deltaX = touchEndX - this.touchStartX;
            const deltaY = touchEndY - this.touchStartY;
            
            // Only trigger swipe if horizontal movement is dominant and significant
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    this.previousImage();
                } else {
                    this.nextImage();
                }
            }
        }
        
        this.isDragging = false;
        this.isSwiping = false;
        this.isPinching = false;
        this.touchStartDistance = 0;
    }
    
    endDrag() {
        this.isDragging = false;
        document.body.style.cursor = '';
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (!this.viewerOpen) return;
            
            switch(e.key) {
                case 'Escape':
                    this.closeViewer();
                    break;
                case 'ArrowLeft':
                    this.previousImage();
                    break;
                case 'ArrowRight':
                    this.nextImage();
                    break;
                case '+':
                case '=':
                    this.zoomIn();
                    break;
                case '-':
                    this.zoomOut();
                    break;
                case '0':
                    this.resetView();
                    break;
            }
        });
    }
}

// Initialize gallery when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.galleryManager = new GalleryManager();
    });
} else {
    window.galleryManager = new GalleryManager();
}
