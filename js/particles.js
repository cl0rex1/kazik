/**
 * High-Performance 2D Canvas Particle Engine (Optimized for Mobile & Budget Devices)
 * Uses pre-rendered offscreen sprite caching for 3D tumbling coins,
 * eliminates expensive runtime shadowBlur/gradients, and enforces strict particle limits.
 */

class ParticleEngine {
    constructor(canvasId = 'particleCanvas') {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d', { alpha: true }) : null;
        this.particles = [];
        this.shockwaves = [];
        this.isStormActive = false;
        this.stormInterval = null;
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        // Hard particle caps to prevent any frame drops on mobile
        this.MAX_PARTICLES = 100;

        // Pre-render coin rotation frames into offscreen canvases
        this.coinSprites = this.preRenderCoinSprites();

        this.initCanvas();
        window.addEventListener('resize', () => this.initCanvas(), { passive: true });
        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    initCanvas() {
        if (!this.canvas) return;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    /**
     * Pre-renders 12 rotation frames of a 3D gold coin onto an offscreen canvas.
     * Runtime animation uses instant hardware-accelerated drawImage instead of expensive gradients/shadows!
     */
    preRenderCoinSprites() {
        const sprites = [];
        const frames = 12;
        const size = 48;
        const r = 20;

        for (let i = 0; i < frames; i++) {
            const offscreen = document.createElement('canvas');
            offscreen.width = size;
            offscreen.height = size;
            const octx = offscreen.getContext('2d');

            const angle = (i / frames) * Math.PI;
            const cosAngle = Math.cos(angle);
            const scaleY = Math.max(0.12, Math.abs(cosAngle));

            octx.translate(size / 2, size / 2);
            octx.scale(1, scaleY);

            // Outer coin body
            const grad = octx.createLinearGradient(-r, -r, r, r);
            grad.addColorStop(0, '#fff6a3');
            grad.addColorStop(0.3, '#ffd700');
            grad.addColorStop(0.7, '#b8860b');
            grad.addColorStop(1, '#634700');

            octx.beginPath();
            octx.arc(0, 0, r, 0, Math.PI * 2);
            octx.fillStyle = grad;
            octx.fill();

            // Embossed ring
            if (scaleY > 0.35) {
                octx.beginPath();
                octx.arc(0, 0, r * 0.74, 0, Math.PI * 2);
                octx.strokeStyle = '#fff8b3';
                octx.lineWidth = 2;
                octx.stroke();

                // Dollar symbol
                octx.fillStyle = '#5c4100';
                octx.font = 'bold 18px sans-serif';
                octx.textAlign = 'center';
                octx.textBaseline = 'middle';
                octx.fillText('$', 0, 1);
            }

            sprites.push({ canvas: offscreen, size });
        }
        return sprites;
    }

    loop() {
        if (this.ctx && (this.particles.length > 0 || this.shockwaves.length > 0)) {
            this.ctx.clearRect(0, 0, this.width, this.height);

            // Update & Draw Shockwaves (Simple, fast rings without shadowBlur)
            for (let i = this.shockwaves.length - 1; i >= 0; i--) {
                const sw = this.shockwaves[i];
                sw.radius += sw.speed;
                sw.alpha -= sw.decay;
                if (sw.alpha <= 0) {
                    this.shockwaves.splice(i, 1);
                    continue;
                }
                this.ctx.beginPath();
                this.ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
                this.ctx.strokeStyle = sw.color;
                this.ctx.lineWidth = sw.thickness * sw.alpha;
                this.ctx.globalAlpha = sw.alpha;
                this.ctx.stroke();
            }

            // Update & Draw Particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.update(this.height);
                if (p.isDead()) {
                    this.particles.splice(i, 1);
                    continue;
                }
                p.draw(this.ctx, this.coinSprites);
            }
            this.ctx.globalAlpha = 1.0;
        }
        requestAnimationFrame(this.loop);
    }

    burstShockwave(x = this.width / 2, y = this.height / 2, color = '#ff007f') {
        if (this.shockwaves.length >= 3) return;
        this.shockwaves.push({
            x,
            y,
            radius: 8,
            speed: 16,
            thickness: 8,
            alpha: 0.9,
            decay: 0.035,
            color
        });
    }

    burstCoins(count = 35, originX = this.width / 2, originY = this.height / 2) {
        const remainingCapacity = this.MAX_PARTICLES - this.particles.length;
        const toAdd = Math.min(count, Math.max(0, remainingCapacity));
        for (let i = 0; i < toAdd; i++) {
            this.particles.push(new OptimizedCoinParticle(originX, originY));
        }
    }

    burstConfetti(count = 40) {
        const remainingCapacity = this.MAX_PARTICLES - this.particles.length;
        const toAdd = Math.min(count, Math.max(0, remainingCapacity));
        for (let i = 0; i < toAdd; i++) {
            const x = Math.random() * this.width;
            const y = -15 - Math.random() * 30;
            this.particles.push(new OptimizedConfettiParticle(x, y));
        }
    }

    burstFireworks(count = 35, x = this.width / 2, y = this.height / 3) {
        this.burstShockwave(x, y, '#ffd700');
        const remainingCapacity = this.MAX_PARTICLES - this.particles.length;
        const toAdd = Math.min(count, Math.max(0, remainingCapacity));
        const colors = ['#ff007f', '#00f0ff', '#ffd700', '#00ff88', '#ffffff'];
        for (let i = 0; i < toAdd; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.particles.push(new OptimizedSparkParticle(x, y, color));
        }
    }

    startJackpotStorm() {
        if (this.isStormActive) return;
        this.isStormActive = true;

        this.burstShockwave(this.width / 2, this.height / 2, '#ffd700');
        this.burstCoins(45, this.width / 2, this.height / 2);

        this.stormInterval = setInterval(() => {
            if (!this.isStormActive) return;
            if (this.particles.length < 80) {
                this.burstCoins(8, this.width * (0.2 + Math.random() * 0.6), this.height * 0.5);
                this.burstConfetti(12);
            }
        }, 320);
    }

    stopJackpotStorm() {
        this.isStormActive = false;
        if (this.stormInterval) {
            clearInterval(this.stormInterval);
            this.stormInterval = null;
        }
    }

    clear() {
        this.stopJackpotStorm();
        this.particles = [];
        this.shockwaves = [];
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.width, this.height);
        }
    }
}

/**
 * High-Performance Sprite-Cached Gold Coin
 */
class OptimizedCoinParticle {
    constructor(x, y) {
        this.x = x + (Math.random() * 40 - 20);
        this.y = y + (Math.random() * 30 - 15);
        this.vx = (Math.random() - 0.5) * 16;
        this.vy = -(12 + Math.random() * 15);
        this.gravity = 0.7;
        this.friction = 0.985;
        this.bounciness = 0.5;

        this.frameIndex = Math.floor(Math.random() * 12);
        this.animSpeed = 0.25 + Math.random() * 0.3;
        this.life = 1.0;
        this.decay = 0.007 + Math.random() * 0.005;
    }

    update(floorY) {
        this.x += this.vx;
        this.vy += this.gravity;
        this.y += this.vy;
        this.vx *= this.friction;

        const ground = floorY - 20;
        if (this.y >= ground) {
            this.y = ground;
            this.vy = -this.vy * this.bounciness;
            this.vx *= 0.88;
        }

        this.frameIndex = (this.frameIndex + this.animSpeed) % 12;
        this.life -= this.decay;
    }

    draw(ctx, sprites) {
        if (this.life <= 0) return;
        const sprite = sprites[Math.floor(this.frameIndex) % 12];
        const half = sprite.size / 2;

        ctx.globalAlpha = Math.max(0, Math.min(1, this.life * 1.8));
        ctx.drawImage(sprite.canvas, this.x - half, this.y - half);
    }

    isDead() {
        return this.life <= 0;
    }
}

/**
 * Lightweight Confetti Particle
 */
class OptimizedConfettiParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.w = 7 + Math.random() * 6;
        this.h = 10 + Math.random() * 8;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = 3 + Math.random() * 5;
        this.rot = Math.random() * Math.PI;
        this.rotSpeed = 0.08 + Math.random() * 0.12;

        const colors = ['#ff007f', '#00f0ff', '#ffd700', '#00ff88', '#9d00ff', '#ffffff'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.life = 1.0;
        this.decay = 0.008 + Math.random() * 0.006;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rot += this.rotSpeed;
        this.life -= this.decay;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        const cosW = Math.cos(this.rot) * this.w;
        ctx.fillRect(this.x - cosW / 2, this.y - this.h / 2, cosW, this.h);
    }

    isDead() {
        return this.life <= 0;
    }
}

/**
 * Fast Spark Particle (No shadowBlur overhead)
 */
class OptimizedSparkParticle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 10;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = 2.5 + Math.random() * 2.5;
        this.gravity = 0.2;
        this.friction = 0.94;
        this.life = 1.0;
        this.decay = 0.025 + Math.random() * 0.02;
    }

    update() {
        this.x += this.vx;
        this.vy += this.gravity;
        this.y += this.vy;
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.life -= this.decay;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    isDead() {
        return this.life <= 0;
    }
}

window.particleEngine = new ParticleEngine();
