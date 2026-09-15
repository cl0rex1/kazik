/**
 * StreakManager (Cyber Vegas Edition)
 * Manages consecutive win streaks and progressive payout multipliers across Slots and 21 Blackjack.
 * Clean, decoupled architecture with local persistence and reactive UI updates.
 */

class StreakManager {
    constructor() {
        this.currentStreak = parseInt(localStorage.getItem('casino_win_streak') || '0', 10);
        this.maxStreak = parseInt(localStorage.getItem('casino_max_streak') || '0', 10);

        this.dom = {
            container: null,
            countVal: null,
            multVal: null,
            multBadge: null,
            flameIcon: null,
            steps: []
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.dom.container = document.getElementById('streakHudContainer');
        this.dom.countVal = document.getElementById('streakCountVal');
        this.dom.multVal = document.getElementById('streakMultVal');
        this.dom.multBadge = document.getElementById('streakMultBadge');
        this.dom.flameIcon = document.getElementById('streakFlameIcon');
        this.dom.steps = document.querySelectorAll('.streak-step');

        this.updateUI();
    }

    /**
     * Calculates the payout multiplier for the incoming win based on the active streak.
     * Streak 0: x1.0 (no prior win)
     * Streak 1: x1.25 (2nd consecutive win)
     * Streak 2: x1.50 (3rd consecutive win)
     * Streak 3: x2.00 (4th consecutive win)
     * Streak 4+: x3.00 (5+ consecutive wins, MAX fire)
     */
    getCurrentMultiplier() {
        if (this.currentStreak <= 0) return 1.0;
        if (this.currentStreak === 1) return 1.25;
        if (this.currentStreak === 2) return 1.50;
        if (this.currentStreak === 3) return 2.00;
        return 3.00;
    }

    /**
     * Returns the visual multiplier to display on the HUD
     */
    getDisplayMultiplier() {
        return this.getCurrentMultiplier();
    }

    /**
     * Record a win event from Slots or Blackjack.
     * Increments the streak, updates max streak, triggers audio/visual FX.
     * @returns {Object} { streak: number, multiplierApplied: number, nextMultiplier: number }
     */
    recordWin() {
        const multiplierApplied = this.getCurrentMultiplier();
        this.currentStreak++;

        if (this.currentStreak > this.maxStreak) {
            this.maxStreak = this.currentStreak;
            localStorage.setItem('casino_max_streak', this.maxStreak.toString());
        }

        localStorage.setItem('casino_win_streak', this.currentStreak.toString());

        this.updateUI();

        // Audio & visual effects on streak level up
        if (this.currentStreak >= 2) {
            if (window.casinoAudio && typeof window.casinoAudio.playStreakUp === 'function') {
                window.casinoAudio.playStreakUp(this.currentStreak);
            }
            if (window.particleEngine) {
                if (this.currentStreak >= 4) {
                    window.particleEngine.burstFireworks(40);
                } else {
                    window.particleEngine.burstCoins(15);
                }
            }
        }

        return {
            streak: this.currentStreak,
            multiplierApplied: multiplierApplied,
            nextMultiplier: this.getCurrentMultiplier()
        };
    }

    /**
     * Record a loss event. Resets streak back to 0.
     */
    recordLoss() {
        if (this.currentStreak > 0) {
            this.currentStreak = 0;
            localStorage.setItem('casino_win_streak', '0');
            this.updateUI();
        }
    }

    /**
     * Record a push/tie event (e.g. Blackjack push).
     * Streak is preserved without penalty.
     */
    recordPush() {
        this.updateUI();
    }

    /**
     * Synchronize DOM with the current streak state.
     */
    updateUI() {
        if (!this.dom.countVal) {
            this.init();
            if (!this.dom.countVal) return;
        }

        const mult = this.getDisplayMultiplier();
        this.dom.countVal.textContent = this.currentStreak.toString();
        if (this.dom.multVal) {
            this.dom.multVal.textContent = `x${mult.toFixed(mult % 1 === 0 ? 1 : 2)}`;
        }

        if (this.dom.container) {
            if (this.currentStreak >= 4) {
                this.dom.container.className = 'streak-hud-container streak-godlike';
            } else if (this.currentStreak >= 2) {
                this.dom.container.className = 'streak-hud-container streak-on-fire';
            } else if (this.currentStreak === 1) {
                this.dom.container.className = 'streak-hud-container streak-active';
            } else {
                this.dom.container.className = 'streak-hud-container';
            }
        }

        if (this.dom.flameIcon) {
            if (this.currentStreak >= 4) {
                this.dom.flameIcon.textContent = '⚡🔥';
            } else if (this.currentStreak >= 2) {
                this.dom.flameIcon.textContent = '🔥🔥';
            } else if (this.currentStreak === 1) {
                this.dom.flameIcon.textContent = '🔥';
            } else {
                this.dom.flameIcon.textContent = '🔥';
            }
        }

        // Highlight steps
        if (this.dom.steps && this.dom.steps.length) {
            this.dom.steps.forEach(step => {
                const stepNum = parseInt(step.dataset.step, 10);
                if (stepNum <= this.currentStreak) {
                    step.classList.add('step-active');
                    if (stepNum === this.currentStreak) {
                        step.classList.add('step-current');
                    } else {
                        step.classList.remove('step-current');
                    }
                } else {
                    step.classList.remove('step-active');
                    step.classList.remove('step-current');
                }
            });
        }
    }
}

// Global instance
window.streakManager = new StreakManager();
