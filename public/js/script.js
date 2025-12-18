// ===== Mobile Menu Toggle =====
const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');

menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close menu when clicking on a link
navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes gentleFloat {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
    }
`;
document.head.appendChild(style);

// ===== Scroll Effects =====
// Add scroll-based header effect with throttling
let lastScrollY = window.scrollY;
let ticking = false;

function updateHeader() {
    const header = document.querySelector('.header');
    const scrollY = window.scrollY;
    
    if (scrollY > 50) {
        header.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.08)';
    } else {
        header.style.boxShadow = 'inset 0 -1px 0 0 rgba(0, 0, 0, 0.1)';
    }
    
    lastScrollY = scrollY;
    ticking = false;
}

window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
    }
}, { passive: true });

// ===== Intersection Observer for fade-in animations =====
const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -80px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all service cards
document.querySelectorAll('.service-card').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(50px)';
    card.style.transition = `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.12}s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.12}s`;
    observer.observe(card);
});

// ===== Smooth scroll offset for fixed header =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            const headerHeight = document.querySelector('.header').offsetHeight;
            const targetPosition = targetElement.offsetTop - headerHeight - 32;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ===== Performance optimizations =====
// Preload critical animations
window.addEventListener('load', () => {
    document.body.style.opacity = '1';
});

// Detect iOS for specific optimizations
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
if (isIOS) {
    document.body.classList.add('is-ios');
    // Improve scroll performance on iOS
    document.addEventListener('touchstart', () => {}, { passive: true });
}

// Detect Safari for specific features
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
if (isSafari) {
    document.body.classList.add('is-safari');
}

// Debounced resize handler
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        // Recalculate viewport dimensions
        document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    }, 250);
});

// Set initial viewport height
document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
