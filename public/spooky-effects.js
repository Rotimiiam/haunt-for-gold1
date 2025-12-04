/**
 * Spooky Halloween Effects
 * Animated fog particles, flying bats, and floating decorations
 */

class SpookyEffects {
  constructor() {
    this.fogCanvas = null;
    this.fogCtx = null;
    this.fogParticles = [];
    this.bats = [];
    this.decorations = [];
    this.animationId = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    
    this.createFogCanvas();
    this.createDecorations();
    this.createBats();
    this.initFogParticles();
    this.animate();
    this.initialized = true;
  }

  createFogCanvas() {
    this.fogCanvas = document.createElement('canvas');
    this.fogCanvas.id = 'fogCanvas';
    this.fogCanvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1002;
    `;
    document.body.appendChild(this.fogCanvas);
    this.fogCtx = this.fogCanvas.getContext('2d');
    this.resizeFogCanvas();
    window.addEventListener('resize', () => this.resizeFogCanvas());
  }

  resizeFogCanvas() {
    if (this.fogCanvas) {
      this.fogCanvas.width = window.innerWidth;
      this.fogCanvas.height = window.innerHeight;
    }
  }

  initFogParticles() {
    this.fogParticles = [];
    const particleCount = Math.floor(window.innerWidth / 15);
    
    for (let i = 0; i < particleCount; i++) {
      this.fogParticles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: Math.random() * 80 + 40,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.2,
        opacity: Math.random() * 0.15 + 0.05
      });
    }
  }

  createDecorations() {
    const decorationsContainer = document.createElement('div');
    decorationsContainer.id = 'spookyDecorations';
    decorationsContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1002;
      overflow: hidden;
    `;
    document.body.appendChild(decorationsContainer);

    // Floating pumpkins and ghosts
    const emojis = ['🎃', '👻', '🦇', '💀', '🕷️', '🕸️'];
    const decorCount = 12;

    for (let i = 0; i < decorCount; i++) {
      const decor = document.createElement('div');
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      decor.textContent = emoji;
      decor.style.cssText = `
        position: absolute;
        font-size: ${Math.random() * 20 + 20}px;
        opacity: ${Math.random() * 0.4 + 0.2};
        animation: float${i % 3} ${Math.random() * 5 + 8}s ease-in-out infinite;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        filter: drop-shadow(0 0 10px rgba(255, 100, 0, 0.3));
      `;
      decorationsContainer.appendChild(decor);
      this.decorations.push(decor);
    }

    // Add floating animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float0 {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-30px) rotate(10deg); }
      }
      @keyframes float1 {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-20px) rotate(-10deg); }
      }
      @keyframes float2 {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-40px) rotate(5deg); }
      }
      @keyframes batFly {
        0% { transform: translateX(-100px) translateY(0); }
        25% { transform: translateX(25vw) translateY(-30px); }
        50% { transform: translateX(50vw) translateY(10px); }
        75% { transform: translateX(75vw) translateY(-20px); }
        100% { transform: translateX(calc(100vw + 100px)) translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  createBats() {
    const batsContainer = document.createElement('div');
    batsContainer.id = 'flyingBats';
    batsContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1002;
      overflow: hidden;
    `;
    document.body.appendChild(batsContainer);

    // Create flying bats
    for (let i = 0; i < 5; i++) {
      const bat = document.createElement('div');
      bat.textContent = '🦇';
      bat.style.cssText = `
        position: absolute;
        font-size: ${Math.random() * 15 + 20}px;
        opacity: ${Math.random() * 0.5 + 0.3};
        top: ${Math.random() * 40 + 5}%;
        left: -100px;
        animation: batFly ${Math.random() * 10 + 15}s linear infinite;
        animation-delay: ${Math.random() * 10}s;
      `;
      batsContainer.appendChild(bat);
      this.bats.push(bat);
    }
  }

  animate() {
    if (!this.fogCtx || !this.fogCanvas) return;

    this.fogCtx.clearRect(0, 0, this.fogCanvas.width, this.fogCanvas.height);

    // Draw fog particles
    for (const particle of this.fogParticles) {
      particle.x += particle.speedX;
      particle.y += particle.speedY;

      // Wrap around screen
      if (particle.x < -particle.radius) particle.x = this.fogCanvas.width + particle.radius;
      if (particle.x > this.fogCanvas.width + particle.radius) particle.x = -particle.radius;
      if (particle.y < -particle.radius) particle.y = this.fogCanvas.height + particle.radius;
      if (particle.y > this.fogCanvas.height + particle.radius) particle.y = -particle.radius;

      // Draw fog particle
      const gradient = this.fogCtx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.radius
      );
      gradient.addColorStop(0, `rgba(100, 80, 120, ${particle.opacity})`);
      gradient.addColorStop(1, 'rgba(100, 80, 120, 0)');

      this.fogCtx.fillStyle = gradient;
      this.fogCtx.beginPath();
      this.fogCtx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      this.fogCtx.fill();
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    const fogCanvas = document.getElementById('fogCanvas');
    const decorations = document.getElementById('spookyDecorations');
    const bats = document.getElementById('flyingBats');
    
    if (fogCanvas) fogCanvas.remove();
    if (decorations) decorations.remove();
    if (bats) bats.remove();
    
    this.initialized = false;
  }
}

// Create and initialize spooky effects when DOM is ready
const spookyEffects = new SpookyEffects();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => spookyEffects.init());
} else {
  spookyEffects.init();
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.spookyEffects = spookyEffects;
}
