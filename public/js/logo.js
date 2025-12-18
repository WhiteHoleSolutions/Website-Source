// ===== White Hole Logo Animation System =====
// Simple breathing animation for logos

// ===== Header Logo Animation =====
const logo = document.getElementById('logo');
const innerCircle = logo.querySelector('.inner-circle');
const outerCircle = logo.querySelector('.outer-circle');

let headerTime = 0;

function animateHeaderLogo() {
    headerTime += 0.015;
    
    // Gentle breathing animation
    const breathe = Math.sin(headerTime) * 0.04;
    
    innerCircle.style.transform = `scale(${1 + breathe})`;
    outerCircle.style.transform = `scale(${1 + breathe * 0.7})`;
    
    requestAnimationFrame(animateHeaderLogo);
}
animateHeaderLogo();

// ===== Hero Logo Animation =====
const heroLogo = document.getElementById('hero-logo-svg');
const heroInnerCircle = heroLogo.querySelector('.hero-inner-circle');
const heroOuterCircle = heroLogo.querySelector('.hero-outer-circle');

let heroTime = 0;

function animateHeroLogo() {
    heroTime += 0.01;
    
    // Gentle breathing animation
    const pulse = Math.sin(heroTime) * 0.08;
    const outerPulse = Math.sin(heroTime * 0.8) * 0.12;
    
    heroInnerCircle.style.transform = `scale(${1 + pulse})`;
    heroOuterCircle.style.transform = `scale(${1 + outerPulse})`;
    
    requestAnimationFrame(animateHeroLogo);
}
animateHeroLogo();
