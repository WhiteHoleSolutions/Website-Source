// ===== Inquiry Form Module =====
// Handles customer inquiry submissions

class InquiryManager {
    constructor() {
        this.init();
    }
    
    init() {
        this.setupForm();
    }
    
    setupForm() {
        const form = document.getElementById('inquiry-form');
        if (!form) return;
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitInquiry(form);
        });
    }
    
    async submitInquiry(form) {
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            type: formData.get('type'),
            service: formData.get('service'),
            message: formData.get('message'),
            timestamp: new Date().toISOString()
        };
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        
        try {
            const response = await fetch('/api/inquiries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                this.showSuccess();
                form.reset();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit inquiry');
            }
        } catch (error) {
            console.error('Inquiry submission error:', error);
            alert('Failed to submit inquiry. Please try again or contact us directly at admin@White-hole-solutions.com');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
    
    showSuccess() {
        const message = document.createElement('div');
        message.className = 'inquiry-success';
        message.innerHTML = `
            <div class="success-content">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <h3>Thank You!</h3>
                <p>Your inquiry has been received. We'll get back to you shortly.</p>
            </div>
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.classList.add('active');
        }, 10);
        
        setTimeout(() => {
            message.classList.remove('active');
            setTimeout(() => message.remove(), 300);
        }, 4000);
    }
}

// Initialize inquiry manager
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.inquiryManager = new InquiryManager();
    });
} else {
    window.inquiryManager = new InquiryManager();
}
