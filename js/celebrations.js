/**
 * Win FX & Celebration Orchestrator
 * Controls tiered visual effects, camera shakes, rolling counters, and particle explosions.
 */

class CelebrationsOrchestrator {
    constructor() {
        this.overlay = document.getElementById('celebrationOverlay');
        this.tierBadge = document.getElementById('celebrationTierBadge');
        this.counter = document.getElementById('celebrationCounter');
        this.subText = document.getElementById('celebrationSub');
        this.collectBtn = document.getElementById('celebrationCollectBtn');
        this.screenFx = document.getElementById('screenFxOverlay');

        this.currentCounterAnim = null;
        this.currentResolve = null;

        if (this.collectBtn) {
            this.collectBtn.addEventListener('click', () => this.dismiss());
        }
        if (this.overlay) {
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) this.dismiss();
            });
        }
    }

    applyShake(type = 'mild', durationMs = 600) {
        document.body.classList.remove('shake-mild', 'shake-big', 'shake-mega', 'shake-godlike');
        const className = `shake-${type}`;
        document.body.classList.add(className);

        if (type !== 'godlike') {
            setTimeout(() => {
                document.body.classList.remove(className);
            }, durationMs);
        }
    }

    clearShake() {
        document.body.classList.remove('shake-mild', 'shake-big', 'shake-mega', 'shake-godlike');
    }

    triggerStrobe(type = 'flash') {
        if (!this.screenFx) return;
        this.screenFx.className = 'screen-fx-overlay';
        if (type === 'flash') {
            this.screenFx.classList.add('strobe-flash');
            setTimeout(() => {
                this.screenFx.classList.remove('strobe-flash');
            }, 1200);
        } else if (type === 'godlike') {
            this.screenFx.classList.add('strobe-flash', 'godlike-laser');
        }
    }

    clearStrobe() {
        if (this.screenFx) {
            this.screenFx.className = 'screen-fx-overlay';
        }
    }

    formatCurrency(amount) {
        return '$' + Number(amount).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    animateCounter(targetAmount, durationMs = 2000, onTick = null) {
        return new Promise((resolve) => {
            const startTime = performance.now();
            const startVal = 0;

            const step = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / durationMs, 1);
                // Ease out expo
                const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                const current = startVal + (targetAmount - startVal) * ease;

                this.counter.textContent = this.formatCurrency(current);

                if (Math.random() < 0.4) {
                    window.casinoAudio.playCoinTally();
                }

                if (onTick) onTick(current);

                if (progress < 1) {
                    this.currentCounterAnim = requestAnimationFrame(step);
                } else {
                    this.counter.textContent = this.formatCurrency(targetAmount);
                    resolve();
                }
            };

            this.currentCounterAnim = requestAnimationFrame(step);
        });
    }

    celebrate(tier, winAmount) {
        return new Promise((resolve) => {
            this.currentResolve = resolve;

            if (tier === 'nice') {
                // Inline reel celebration, no modal popup to keep flow fast
                this.applyShake('mild', 400);
                window.casinoAudio.playWinFanfare('nice');
                window.particleEngine.burstCoins(25);
                setTimeout(resolve, 1400);
                return;
            }

            // Big, Mega, or Godlike: Show Fullscreen Celebration Overlay
            this.overlay.classList.remove('hidden');
            this.tierBadge.className = 'celebration-badge';

            let duration = 2400;

            if (tier === 'big') {
                this.tierBadge.textContent = 'БОЛЬШОЙ КУШ!';
                this.tierBadge.classList.add('tier-big');
                this.subText.textContent = 'ОТЛИЧНЫЙ ЗАНОС!';
                this.applyShake('big', 1000);
                this.triggerStrobe('flash');
                window.casinoAudio.playWinFanfare('big');
                window.particleEngine.burstCoins(70);
                window.particleEngine.burstConfetti(120);
                duration = 2000;
            } else if (tier === 'mega') {
                this.tierBadge.textContent = '⚡ МЕГА ВЫИГРЫШ! ⚡';
                this.tierBadge.classList.add('tier-mega');
                this.subText.textContent = 'БАНК ВЗОРВАН!';
                this.applyShake('mega', 1500);
                this.triggerStrobe('flash');
                window.casinoAudio.playWinFanfare('mega');
                window.particleEngine.burstCoins(120);
                window.particleEngine.burstConfetti(220);
                window.particleEngine.burstFireworks(60);
                duration = 2600;
            } else if (tier === 'godlike') {
                this.tierBadge.textContent = '👑 ДЖЕКПОТ БОГОВ! 👑';
                this.tierBadge.classList.add('tier-godlike');
                this.subText.textContent = 'АБСОЛЮТНЫЙ РЕКОРД КАЗИНО!';
                this.applyShake('godlike', 0);
                this.triggerStrobe('godlike');
                window.casinoAudio.playWinFanfare('godlike');
                window.particleEngine.startJackpotStorm();
                duration = 3200;
            }

            this.animateCounter(winAmount, duration).then(() => {
                // If auto-spin is on, auto dismiss after 1.5s
                if (window.app && window.app.isAutoSpinning) {
                    setTimeout(() => this.dismiss(), 1500);
                }
            });
        });
    }

    dismiss() {
        if (this.currentCounterAnim) {
            cancelAnimationFrame(this.currentCounterAnim);
            this.currentCounterAnim = null;
        }

        this.clearShake();
        this.clearStrobe();
        window.particleEngine.stopJackpotStorm();

        if (this.overlay) {
            this.overlay.classList.add('hidden');
        }

        if (this.currentResolve) {
            const res = this.currentResolve;
            this.currentResolve = null;
            res();
        }
    }
}

window.celebrations = new CelebrationsOrchestrator();
