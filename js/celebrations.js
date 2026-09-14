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
        this.autoDismissTimer = null;

        if (this.collectBtn) {
            this.collectBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.dismiss();
            });
        }
        if (this.overlay) {
            // Clicking anywhere on overlay or backdrop dismisses celebration
            this.overlay.addEventListener('click', () => this.dismiss());
        }
    }

    applyShake(type = 'mild', durationMs = 600) {
        this.clearShake();
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
            }, 1000);
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

    animateCounter(targetAmount, durationMs = 1500) {
        return new Promise((resolve) => {
            const startTime = performance.now();
            const startVal = 0;

            const step = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / durationMs, 1);
                const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                const current = startVal + (targetAmount - startVal) * ease;

                if (this.counter) {
                    this.counter.textContent = this.formatCurrency(current);
                }

                if (Math.random() < 0.35) {
                    window.casinoAudio.playCoinTally();
                }

                if (progress < 1) {
                    this.currentCounterAnim = requestAnimationFrame(step);
                } else {
                    if (this.counter) {
                        this.counter.textContent = this.formatCurrency(targetAmount);
                    }
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
                this.applyShake('mild', 400);
                window.casinoAudio.playWinFanfare('nice');
                window.particleEngine.burstCoins(25);
                setTimeout(() => {
                    this.dismiss();
                }, 1000);
                return;
            }

            // Big, Mega, or Godlike: Show Fullscreen Celebration Overlay
            if (this.overlay) {
                this.overlay.classList.remove('hidden');
            }
            if (this.tierBadge) {
                this.tierBadge.className = 'celebration-badge';
            }

            let counterDuration = 1600;
            let autoDismissAfter = 4000;

            if (tier === 'big') {
                if (this.tierBadge) {
                    this.tierBadge.textContent = 'БОЛЬШОЙ КУШ!';
                    this.tierBadge.classList.add('tier-big');
                }
                if (this.subText) this.subText.textContent = 'ОТЛИЧНЫЙ ЗАНОС!';
                this.applyShake('big', 800);
                this.triggerStrobe('flash');
                window.casinoAudio.playWinFanfare('big');
                window.particleEngine.burstCoins(60);
                window.particleEngine.burstConfetti(100);
                counterDuration = 1400;
                autoDismissAfter = 3200;
            } else if (tier === 'mega') {
                if (this.tierBadge) {
                    this.tierBadge.textContent = '⚡ МЕГА ВЫИГРЫШ! ⚡';
                    this.tierBadge.classList.add('tier-mega');
                }
                if (this.subText) this.subText.textContent = 'БАНК ВЗОРВАН!';
                this.applyShake('mega', 1200);
                this.triggerStrobe('flash');
                window.casinoAudio.playWinFanfare('mega');
                window.particleEngine.burstCoins(100);
                window.particleEngine.burstConfetti(180);
                window.particleEngine.burstFireworks(50);
                counterDuration = 1800;
                autoDismissAfter = 4000;
            } else if (tier === 'godlike') {
                if (this.tierBadge) {
                    this.tierBadge.textContent = '👑 ДЖЕКПОТ БОГОВ! 👑';
                    this.tierBadge.classList.add('tier-godlike');
                }
                if (this.subText) this.subText.textContent = 'АБСОЛЮТНЫЙ РЕКОРД КАЗИНО!';
                this.applyShake('godlike', 0);
                this.triggerStrobe('godlike');
                window.casinoAudio.playWinFanfare('godlike');
                window.particleEngine.startJackpotStorm();
                counterDuration = 2200;
                autoDismissAfter = 5000;
            }

            this.animateCounter(winAmount, counterDuration);

            // Guaranteed auto-dismiss safety timer
            if (this.autoDismissTimer) clearTimeout(this.autoDismissTimer);
            this.autoDismissTimer = setTimeout(() => {
                this.dismiss();
            }, autoDismissAfter);
        });
    }

    dismiss() {
        if (this.autoDismissTimer) {
            clearTimeout(this.autoDismissTimer);
            this.autoDismissTimer = null;
        }

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
