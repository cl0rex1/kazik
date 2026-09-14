/**
 * High-Performance 2D Canvas Particle Engine
 * Realistic 3D-tumbling gold coins with ground bounce physics,
 * neon confetti ribbons, firework sparks, and radial shockwaves.
 */

class ParticleEngine {
    constructor(canvasId = 'particleCanvas') {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.particles = [];
        this.shockwaves = [];
        this.isStormActive = false;
        this.stormInterval = null;
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.initCanvas();
        window.addEventListener('resize', () => this.initCanvas());
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

    loop() {
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.width, this.height);

            // Update & Draw Shockwaves
            for (let i = this.shockwaves.length - 1; i >= 0; i--) {
                const sw = this.shockwaves[i];
                sw.radius += sw.speed;
                sw.alpha -= sw.decay;
                if (sw.alpha <= 0) {
                    this.shockwaves.splice(i, 1);
                    continue;
                }
                this.ctx.save();
                this.ctx.beginPath();
                this.ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
                this.ctx.strokeStyle = sw.color;
                this.ctx.lineWidth = sw.thickness * sw.alpha;
                this.ctx.shadowColor = sw.color;
                this.ctx.shadowBlur = 20;
                this.ctx.globalAlpha = sw.alpha;
                this.ctx.stroke();
                this.ctx.restore();
            }

            // Update & Draw Particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.update(this.height);
                if (p.isDead()) {
                    this.particles.splice(i, 1);
                    continue;
                }
                p.draw(this.ctx);
            }
        }
        requestAnimationFrame(this.loop);
    }

    burstShockwave(x = this.width / 2, y = this.height / 2, color = '#ff007f') {
        this.shockwaves.push({
            x,
            y,
            radius: 10,
            speed: 18,
            thickness: 12,
            alpha: 1,
            decay: 0.025,
            color
        });
    }

    burstCoins(count = 60, originX = this.width / 2, originY = this.height / 2) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new CoinParticle(originX, originY));
        }
    }

    burstConfetti(count = 100) {
        for (let i = 0; i < count; i++) {
            const x = Math.random() * this.width;
            const y = -20 - Math.random() * 50;
            this.particles.push(new ConfettiParticle(x, y));
        }
    }

    burstFireworks(count = 80, x = this.width / 2, y = this.height / 3) {
        this.burstShockwave(x, y, '#ffd700');
        const colors = ['#ff007f', '#00f0ff', '#ffd700', '#00ff88', '#ffffff', '#9d00ff'];
        for (let i = 0; i < count; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.particles.push(new SparkParticle(x, y, color));
        }
    }

    startJackpotStorm() {
        if (this.isStormActive) return;
        this.isStormActive = true;

        this.burstShockwave(this.width / 2, this.height / 2, '#ffd700');
        this.burstCoins(120, this.width / 2, this.height / 2);

        this.stormInterval = setInterval(() => {
            if (!this.isStormActive) return;
            // Spawn continuous coins and confetti
            this.burstCoins(15, this.width * (0.2 + Math.random() * 0.6), this.height * 0.5);
            this.burstConfetti(25);
            if (Math.random() < 0.4) {
                this.burstFireworks(40, this.width * (0.1 + Math.random() * 0.8), this.height * (0.2 + Math.random() * 0.4));
            }
        }, 180);
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
    }
}

/**
 * 3D Tumbling Gold Coin with Physics & Bounce
 */
class CoinParticle {
    constructor(x, y) {
        this.x = x + (Math.random() * 60 - 30);
        this.y = y + (Math.random() * 40 - 20);
        this.radius = 12 + Math.random() * 6;

        // Upward explosive fountain velocities
        this.vx = (Math.random() - 0.5) * 18;
        this.vy = -(14 + Math.random() * 18);
        this.gravity = 0.65;
        this.friction = 0.98;
        this.bounciness = 0.55;

        // 3D tumble rotation angles
        this.angle = Math.random() * Math.PI * 2;
        this.rotSpeed = 0.15 + Math.random() * 0.25;
        this.life = 1;
        this.decay = 0.0035 + Math.random() * 0.003;
    }

    update(floorY) {
        this.x += this.vx;
        this.vy += this.gravity;
        this.y += this.vy;
        this.vx *= this.friction;

        // Ground bounce
        const ground = floorY - this.radius;
        if (this.y >= ground) {
            this.y = ground;
            this.vy = -this.vy * this.bounciness;
            this.vx *= 0.85; // Floor drag
        }

        this.angle += this.rotSpeed;
        this.life -= this.decay;
    }

    draw(ctx) {
        if (this.life <= 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.globalAlpha = Math.max(0, Math.min(1, this.life * 1.5));

        // 3D vertical scale projection
        const cosAngle = Math.cos(this.angle);
        ctx.scale(1, cosAngle);

        // Coin Outer Rim
        const grad = ctx.createLinearGradient(-this.radius, -this.radius, this.radius, this.radius);
        grad.addColorStop(0, '#fff6a3');
        grad.addColorStop(0.3, '#ffd700');
        grad.addColorStop(0.7, '#b8860b');
        grad.addColorStop(1, '#634700');

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 10;
        ctx.fill();

        // Inner Embossed Ring
        if (Math.abs(cosAngle) > 0.3) {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * 0.72, 0, Math.PI * 2);
            ctx.strokeStyle = '#fff8b3';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Center Dollar Symbol
            ctx.fillStyle = '#634700';
            ctx.font = `bold ${Math.floor(this.radius * 0.85)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', 0, 1);
        }

        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

/**
 * Neon Confetti Strip
 */
class ConfettiParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.w = 8 + Math.random() * 8;
        this.h = 12 + Math.random() * 12;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = 3 + Math.random() * 6;
        this.rotX = Math.random() * Math.PI;
        this.rotY = Math.random() * Math.PI;
        this.rotXSpeed = 0.05 + Math.random() * 0.1;
        this.rotYSpeed = 0.05 + Math.random() * 0.1;

        const colors = ['#ff007f', '#00f0ff', '#ffd700', '#00ff88', '#9d00ff', '#ff3366', '#ffffff'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.life = 1;
        this.decay = 0.003 + Math.random() * 0.003;
    }

    update() {
        this.x += this.vx + Math.sin(this.rotX) * 1.5;
        this.y += this.vy;
        this.rotX += this.rotXSpeed;
        this.rotY += this.rotYSpeed;
        this.life -= this.decay;
    }

    draw(ctx) {
        if (this.life <= 0) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.scale(Math.cos(this.rotX), Math.sin(this.rotY));
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

/**
 * Firework Spark Ember
 */
class SparkParticle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = 4 + Math.random() * 14;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = 2.5 + Math.random() * 3.5;
        this.gravity = 0.22;
        this.friction = 0.94;
        this.life = 1;
        this.decay = 0.015 + Math.random() * 0.02;
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
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}

window.particleEngine = new ParticleEngine();
