// ===== Admin Access Module =====
// Secret admin menu activation (CTRL+~ + password)

class AdminAccess {
    constructor() {
        this.keysPressed = [];
        this.secretSequence = ['Control', '`'];
        this.isListening = false;
        this.adminPassword = 'admin123'; // Change this in production
        
        this.init();
    }
    
    init() {
        this.setupKeyListener();
    }
    
    setupKeyListener() {
        let ctrlPressed = false;
        
        document.addEventListener('keydown', (e) => {
            // Check for Ctrl+` combination
            if (e.key === 'Control') {
                ctrlPressed = true;
            }
            
            if (ctrlPressed && e.key === '`') {
                e.preventDefault();
                this.showPasswordPrompt();
                ctrlPressed = false;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key === 'Control') {
                ctrlPressed = false;
            }
        });
    }
    
    showPasswordPrompt() {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'admin-modal';
        modal.innerHTML = `
            <div class="admin-modal-overlay"></div>
            <div class="admin-modal-content">
                <h2>Admin Access</h2>
                <p style="text-align: center; color: var(--text-secondary); margin-bottom: 1.5rem;">
                    Redirecting to admin login...
                </p>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);
        
        // Redirect to login page after short delay
        setTimeout(() => {
            window.open('admin-login.html', '_blank');
            this.closeModal(modal);
        }, 800);
    }
    
    closeModal(modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

// Initialize admin access
window.adminAccess = new AdminAccess();
