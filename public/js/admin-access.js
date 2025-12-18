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
                <form id="admin-password-form">
                    <input 
                        type="password" 
                        id="admin-password-input" 
                        placeholder="Enter admin password" 
                        autocomplete="off"
                        required
                    >
                    <div class="admin-modal-buttons">
                        <button type="submit" class="admin-btn-primary">Access</button>
                        <button type="button" class="admin-btn-cancel">Cancel</button>
                    </div>
                </form>
                <div class="admin-error"></div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        setTimeout(() => modal.classList.add('active'), 10);
        
        const input = modal.querySelector('#admin-password-input');
        const form = modal.querySelector('#admin-password-form');
        const cancelBtn = modal.querySelector('.admin-btn-cancel');
        const errorDiv = modal.querySelector('.admin-error');
        
        input.focus();
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const password = input.value;
            
            if (this.verifyPassword(password)) {
                this.closeModal(modal);
                this.openAdminPanel();
            } else {
                errorDiv.textContent = 'Incorrect password';
                input.value = '';
                input.focus();
                
                // Shake animation
                modal.querySelector('.admin-modal-content').style.animation = 'shake 0.3s';
                setTimeout(() => {
                    modal.querySelector('.admin-modal-content').style.animation = '';
                }, 300);
            }
        });
        
        cancelBtn.addEventListener('click', () => this.closeModal(modal));
        modal.querySelector('.admin-modal-overlay').addEventListener('click', () => this.closeModal(modal));
    }
    
    verifyPassword(password) {
        // In production, this should verify against a secure backend
        return password === this.adminPassword;
    }
    
    closeModal(modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
    
    openAdminPanel() {
        // Open admin panel in new tab
        window.open('admin.html', '_blank');
    }
}

// Initialize admin access
window.adminAccess = new AdminAccess();
