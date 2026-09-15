/**
 * Casino Application Orchestrator (Classic 3-Reel Edition)
 * Connects Slot Engine, UI DOM, Audio Synth, Particles, Celebrations & Share Card.
 */

class CasinoApp {
    constructor() {
        const saved = parseFloat(localStorage.getItem('casino_balance'));
        this.balance = (!isNaN(saved) && saved > 0 && saved !== 10000) ? saved : 5000;
        this.bets = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000];
        this.betIndex = 2; // Default $25 (5 lines x $5)
        this.isSpinning = false;
        this.isTurbo = false;
        this.isAutoSpinning = false;
        this.freeSpinsRemaining = 0;
        this.freeSpinsMultiplier = 3;
        this.numReels = 3;
        this.numRows = 3;

        // Jackpots
        this.jackpotMini = 1250.00;
        this.jackpotMajor = 8940.00;
        this.jackpotGrand = 150000.00;

        // DOM elements
        this.dom = {
            balance: document.getElementById('balanceDisplay'),
            win: document.getElementById('winDisplay'),
            bet: document.getElementById('betDisplay'),
            betUpBtn: document.getElementById('betUpBtn'),
            betDownBtn: document.getElementById('betDownBtn'),
            maxBetBtn: document.getElementById('maxBetBtn'),
            spinBtn: document.getElementById('spinBtn'),
            lever: document.getElementById('slotLever'),
            turboBtn: document.getElementById('turboBtn'),
            autoSpinBtn: document.getElementById('autoSpinBtn'),
            soundBtn: document.getElementById('soundToggleBtn'),
            soundIcon: document.getElementById('soundIcon'),
            paytableBtn: document.getElementById('paytableBtn'),
            closePaytableBtn: document.getElementById('closePaytableBtn'),
            paytableModal: document.getElementById('paytableModal'),
            shareBtn: document.getElementById('shareBtn'),
            atmBtn: document.getElementById('atmBtn'),
            closeAtmBtn: document.getElementById('closeAtmBtn'),
            atmModal: document.getElementById('atmModal'),
            freeSpinsBanner: document.getElementById('freeSpinsBanner'),
            fsLeftCount: document.getElementById('fsLeftCount'),
            paylinesSvg: document.getElementById('paylinesSvg'),
            jpMini: document.getElementById('jpMiniVal'),
            jpMajor: document.getElementById('jpMajorVal'),
            jpGrand: document.getElementById('jpGrandVal'),
            reelsGrid: document.getElementById('reelsGrid'),
            modeSlotsBtn: document.getElementById('modeSlotsBtn'),
            modeBlackjackBtn: document.getElementById('modeBlackjackBtn'),
            slotsModeView: document.getElementById('slotsModeView'),
            blackjackModeView: document.getElementById('blackjackModeView'),
            adModal: document.getElementById('adVideoModal'),
            adVideo: document.getElementById('adVideoPlayer'),
            adOverlay: document.getElementById('adVideoOverlay'),
            adPlayPromptBtn: document.getElementById('adPlayPromptBtn'),
            adRewardTitle: document.getElementById('adRewardTitle'),
            adStatusText: document.getElementById('adStatusText'),
            adTimeRemaining: document.getElementById('adTimeRemaining'),
            adClaimRewardBtn: document.getElementById('adClaimRewardBtn'),
            adCloseBtn: document.getElementById('adCloseBtn')
        };

        this.currentMode = 'slots';
        this.pendingAdReward = 0;

        // Current 3x3 visible grid of symbols
        this.currentGrid = [];

        this.init();
    }

    init() {
        this.setupInitialReels();
        this.updateDisplays();
        this.bindEvents();
        this.updateSoundIcon();
        this.startJackpotTicker();
        this.setupModeSwitcher();
        this.setupAdSystem();
    }

    setupModeSwitcher() {
        if (this.dom.modeSlotsBtn) {
            this.dom.modeSlotsBtn.addEventListener('click', () => this.switchMode('slots'));
        }
        if (this.dom.modeBlackjackBtn) {
            this.dom.modeBlackjackBtn.addEventListener('click', () => this.switchMode('blackjack'));
        }
    }

    switchMode(mode) {
        if (this.isSpinning) return;
        this.currentMode = mode;
        if (window.casinoAudio) window.casinoAudio.playButtonClick();

        if (mode === 'slots') {
            if (this.dom.modeSlotsBtn) this.dom.modeSlotsBtn.classList.add('active');
            if (this.dom.modeBlackjackBtn) this.dom.modeBlackjackBtn.classList.remove('active');
            if (this.dom.slotsModeView) this.dom.slotsModeView.classList.remove('hidden');
            if (this.dom.blackjackModeView) this.dom.blackjackModeView.classList.add('hidden');
        } else {
            if (this.dom.modeSlotsBtn) this.dom.modeSlotsBtn.classList.remove('active');
            if (this.dom.modeBlackjackBtn) this.dom.modeBlackjackBtn.classList.add('active');
            if (this.dom.slotsModeView) this.dom.slotsModeView.classList.add('hidden');
            if (this.dom.blackjackModeView) this.dom.blackjackModeView.classList.remove('hidden');
            if (window.blackjackGame) {
                window.blackjackGame.updateBetDisplay();
            }
        }
    }

    formatCurrency(val) {
        return '$' + Number(val).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    updateDisplays() {
        if (this.dom.balance) {
            this.dom.balance.textContent = this.formatCurrency(this.balance);
        }
        if (this.dom.bet) {
            this.dom.bet.textContent = this.formatCurrency(this.getCurrentBet());
        }
        localStorage.setItem('casino_balance', this.balance.toFixed(2));
        if (window.authManager) {
            window.authManager.renderBadge();
        }
    }

    getCurrentBet() {
        return this.bets[this.betIndex];
    }

    setupInitialReels() {
        this.currentGrid = [];
        for (let col = 0; col < this.numReels; col++) {
            const strip = document.getElementById(`reelStrip-${col}`);
            if (!strip) continue;
            strip.innerHTML = '';
            const colSymbols = [];
            for (let row = 0; row < this.numRows; row++) {
                const sym = window.slotEngine.getRandomSymbol();
                colSymbols.push(sym);
                const symEl = this.createSymbolElement(sym, col, row);
                strip.appendChild(symEl);
            }
            this.currentGrid.push(colSymbols);
            strip.style.transform = 'translateY(0px)';
        }
    }

    createSymbolElement(symDef, col, row) {
        const div = document.createElement('div');
        div.className = 'slot-symbol';
        div.dataset.col = col;
        div.dataset.row = row;
        div.dataset.symbolId = symDef.id;

        const iconSpan = document.createElement('span');
        iconSpan.className = 'sym-icon';
        iconSpan.textContent = symDef.icon;

        const nameSpan = document.createElement('span');
        nameSpan.className = 'sym-name';
        nameSpan.textContent = symDef.name;

        div.appendChild(iconSpan);
        div.appendChild(nameSpan);
        return div;
    }

    bindEvents() {
        // Spin Button
        if (this.dom.spinBtn) {
            this.dom.spinBtn.addEventListener('click', () => {
                this.dom.spinBtn.blur();
                this.handleSpinRequest();
            });
        }

        // Mechanical Lever Pull
        if (this.dom.lever) {
            this.dom.lever.addEventListener('click', () => {
                this.pullLeverAnimation();
                this.handleSpinRequest();
            });
        }

        // Keyboard Shortcut: Spacebar
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                if (this.currentMode !== 'slots') return;
                e.preventDefault();
                // If celebration modal is open, collect it
                if (window.celebrations && window.celebrations.overlay && !window.celebrations.overlay.classList.contains('hidden')) {
                    window.celebrations.dismiss();
                    return;
                }
                this.handleSpinRequest();
            }
        });

        // Bet adjustments
        if (this.dom.betUpBtn) {
            this.dom.betUpBtn.addEventListener('click', () => {
                window.casinoAudio.playButtonClick();
                if (this.betIndex < this.bets.length - 1) {
                    this.betIndex++;
                    this.updateDisplays();
                }
            });
        }

        if (this.dom.betDownBtn) {
            this.dom.betDownBtn.addEventListener('click', () => {
                window.casinoAudio.playButtonClick();
                if (this.betIndex > 0) {
                    this.betIndex--;
                    this.updateDisplays();
                }
            });
        }

        if (this.dom.maxBetBtn) {
            this.dom.maxBetBtn.addEventListener('click', () => {
                window.casinoAudio.playButtonClick();
                this.betIndex = this.bets.length - 1;
                this.updateDisplays();
            });
        }

        // Turbo toggle
        if (this.dom.turboBtn) {
            this.dom.turboBtn.addEventListener('click', () => {
                window.casinoAudio.playButtonClick();
                this.isTurbo = !this.isTurbo;
                this.dom.turboBtn.classList.toggle('active', this.isTurbo);
            });
        }

        // Auto-spin toggle
        if (this.dom.autoSpinBtn) {
            this.dom.autoSpinBtn.addEventListener('click', () => {
                window.casinoAudio.playButtonClick();
                this.isAutoSpinning = !this.isAutoSpinning;
                this.dom.autoSpinBtn.classList.toggle('active', this.isAutoSpinning);
                if (this.isAutoSpinning && !this.isSpinning) {
                    this.handleSpinRequest();
                }
            });
        }

        // Sound toggle
        if (this.dom.soundBtn) {
            this.dom.soundBtn.addEventListener('click', () => {
                const isMuted = window.casinoAudio.toggleMute();
                this.updateSoundIcon(isMuted);
            });
        }

        // Share Card Modal Open
        if (this.dom.shareBtn) {
            this.dom.shareBtn.addEventListener('click', () => {
                window.casinoAudio.playButtonClick();
                if (window.shareCard) {
                    window.shareCard.openWithCurrentState();
                }
            });
        }

        // Paytable Modal
        if (this.dom.paytableBtn) {
            this.dom.paytableBtn.addEventListener('click', () => {
                window.casinoAudio.playButtonClick();
                this.dom.paytableModal.classList.remove('hidden');
            });
        }
        if (this.dom.closePaytableBtn) {
            this.dom.closePaytableBtn.addEventListener('click', () => {
                this.dom.paytableModal.classList.add('hidden');
            });
        }

        // ATM Modal
        if (this.dom.atmBtn) {
            this.dom.atmBtn.addEventListener('click', () => {
                window.casinoAudio.playButtonClick();
                this.dom.atmModal.classList.remove('hidden');
            });
        }
        if (this.dom.closeAtmBtn) {
            this.dom.closeAtmBtn.addEventListener('click', () => {
                this.dom.atmModal.classList.add('hidden');
            });
        }

    }

    setupAdSystem() {
        const claimBtns = document.querySelectorAll('.atm-claim-btn');
        claimBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const amount = parseFloat(e.currentTarget.dataset.amount) || 5000;
                this.startAdPlayback(amount);
            });
        });

        if (this.dom.adPlayPromptBtn && this.dom.adVideo) {
            this.dom.adPlayPromptBtn.addEventListener('click', () => {
                if (this.dom.adOverlay) this.dom.adOverlay.classList.add('hidden');
                this.dom.adVideo.play().catch(err => console.log('Video play error:', err));
            });
        }

        if (this.dom.adCloseBtn) {
            this.dom.adCloseBtn.addEventListener('click', () => {
                this.closeAdModal();
            });
        }

        if (this.dom.adClaimRewardBtn) {
            this.dom.adClaimRewardBtn.addEventListener('click', () => {
                this.claimAdReward();
            });
        }

        if (this.dom.adVideo) {
            this.dom.adVideo.addEventListener('timeupdate', () => {
                if (!this.dom.adVideo.duration) return;
                const rem = Math.max(0, this.dom.adVideo.duration - this.dom.adVideo.currentTime);
                const secs = Math.ceil(rem);
                if (this.dom.adTimeRemaining) {
                    this.dom.adTimeRemaining.textContent = `0:${secs < 10 ? '0' : ''}${secs}`;
                }

                if (rem <= 0.35) {
                    this.onAdCompleted();
                }
            });

            this.dom.adVideo.addEventListener('ended', () => {
                this.onAdCompleted();
            });
        }
    }

    startAdPlayback(amount) {
        this.pendingAdReward = amount;
        if (this.dom.atmModal) this.dom.atmModal.classList.add('hidden');
        if (!this.dom.adModal || !this.dom.adVideo) return;

        if (this.dom.adRewardTitle) {
            this.dom.adRewardTitle.textContent = `СМОТРИ РЕКЛАМУ И ЗАБЕРИ +$${amount.toLocaleString()}`;
        }
        if (this.dom.adStatusText) {
            this.dom.adStatusText.textContent = 'Идет показ рекламы спонсора...';
        }
        if (this.dom.adClaimRewardBtn) {
            this.dom.adClaimRewardBtn.disabled = true;
            this.dom.adClaimRewardBtn.classList.remove('ready');
            this.dom.adClaimRewardBtn.textContent = '⏳ ДОСМОТРИТЕ ДО КОНЦА';
        }
        if (this.dom.adOverlay) {
            this.dom.adOverlay.classList.add('hidden');
        }

        this.dom.adModal.classList.remove('hidden');
        this.dom.adVideo.currentTime = 0;
        
        const playPromise = this.dom.adVideo.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                if (this.dom.adOverlay) this.dom.adOverlay.classList.remove('hidden');
            });
        }
    }

    onAdCompleted() {
        if (!this.dom.adClaimRewardBtn || this.dom.adClaimRewardBtn.classList.contains('ready')) return;
        this.dom.adClaimRewardBtn.disabled = false;
        this.dom.adClaimRewardBtn.classList.add('ready');
        this.dom.adClaimRewardBtn.textContent = `⚡ ЗАБРАТЬ +$${this.pendingAdReward.toLocaleString()} ⚡`;
        if (this.dom.adStatusText) {
            this.dom.adStatusText.textContent = '✅ Реклама просмотрена! Награда готова!';
        }
        if (this.dom.adTimeRemaining) {
            this.dom.adTimeRemaining.textContent = '0:00';
        }
    }

    claimAdReward() {
        if (!this.dom.adClaimRewardBtn || this.dom.adClaimRewardBtn.disabled) return;
        this.balance += this.pendingAdReward;
        this.updateDisplays();
        if (window.casinoAudio) window.casinoAudio.playAtmCash();
        if (window.particleEngine) window.particleEngine.burstCoins(50);
        this.closeAdModal();
    }

    closeAdModal() {
        if (this.dom.adVideo) {
            this.dom.adVideo.pause();
        }
        if (this.dom.adModal) {
            this.dom.adModal.classList.add('hidden');
        }
    }

    updateSoundIcon(isMuted = window.casinoAudio.isMuted) {
        if (this.dom.soundIcon) {
            this.dom.soundIcon.textContent = isMuted ? '🔇' : '🔊';
        }
    }

    pullLeverAnimation() {
        if (!this.dom.lever) return;
        this.dom.lever.classList.add('pulled');
        setTimeout(() => {
            this.dom.lever.classList.remove('pulled');
        }, 350);
    }

    startJackpotTicker() {
        setInterval(() => {
            this.jackpotMini += (Math.random() * 0.08);
            this.jackpotMajor += (Math.random() * 0.25);
            this.jackpotGrand += (Math.random() * 0.95);

            if (this.dom.jpMini) this.dom.jpMini.textContent = this.formatCurrency(this.jackpotMini);
            if (this.dom.jpMajor) this.dom.jpMajor.textContent = this.formatCurrency(this.jackpotMajor);
            if (this.dom.jpGrand) this.dom.jpGrand.textContent = this.formatCurrency(this.jackpotGrand);
        }, 3000);
    }

    clearPaylines() {
        if (this.dom.paylinesSvg) {
            this.dom.paylinesSvg.innerHTML = '';
        }
        const winningElements = document.querySelectorAll('.symbol-winning');
        winningElements.forEach(el => el.classList.remove('symbol-winning'));
        const columns = document.querySelectorAll('.reel-column');
        columns.forEach(c => c.classList.remove('anticipation-glow'));
    }

    handleSpinRequest() {
        if (this.isSpinning) return;

        const currentBet = this.getCurrentBet();
        const isFree = this.freeSpinsRemaining > 0;

        if (!isFree && this.balance < currentBet) {
            this.isAutoSpinning = false;
            if (this.dom.autoSpinBtn) this.dom.autoSpinBtn.classList.remove('active');
            if (this.dom.atmModal) this.dom.atmModal.classList.remove('hidden');
            return;
        }

        this.executeSpin();
    }

    async executeSpin() {
        this.isSpinning = true;
        if (this.dom.spinBtn) {
            this.dom.spinBtn.disabled = true;
            this.dom.spinBtn.classList.add('spinning');
        }
        this.clearPaylines();

        const currentBet = this.getCurrentBet();
        const isFree = this.freeSpinsRemaining > 0;

        try {
            if (isFree) {
                this.freeSpinsRemaining--;
                if (this.dom.fsLeftCount) this.dom.fsLeftCount.textContent = this.freeSpinsRemaining;
                if (this.freeSpinsRemaining === 0) {
                    setTimeout(() => {
                        if (this.dom.freeSpinsBanner) this.dom.freeSpinsBanner.classList.add('hidden');
                    }, 2000);
                }
            } else {
                this.balance -= currentBet;
                this.updateDisplays();
            }

            window.casinoAudio.playSpinStart();

            // Generate target 3x3 outcome
            const outcomeGrid = window.slotEngine.generateSpinOutcome();

            // Animate reels spinning
            await this.animateReels(outcomeGrid);

            this.currentGrid = outcomeGrid;

            // Evaluate results
            const result = window.slotEngine.evaluateSpin(outcomeGrid, currentBet, isFree);

            // On Major Wins, pause auto-spin so player can enjoy celebration and share!
            if (result.celebrationTier === 'big' || result.celebrationTier === 'mega' || result.celebrationTier === 'godlike') {
                if (this.isAutoSpinning) {
                    this.isAutoSpinning = false;
                    if (this.dom.autoSpinBtn) this.dom.autoSpinBtn.classList.remove('active');
                }
            }

            await this.handleSpinResult(result);
        } catch (err) {
            console.error('Spin error occurred:', err);
        } finally {
            // Guaranteed state reset
            this.isSpinning = false;
            if (this.dom.spinBtn) {
                this.dom.spinBtn.disabled = false;
                this.dom.spinBtn.classList.remove('spinning');
            }

            // Auto-spin loop
            if (this.isAutoSpinning) {
                if (this.balance >= this.getCurrentBet() || this.freeSpinsRemaining > 0) {
                    setTimeout(() => {
                        if (this.isAutoSpinning && !this.isSpinning) {
                            this.handleSpinRequest();
                        }
                    }, this.isTurbo ? 300 : 600);
                } else {
                    this.isAutoSpinning = false;
                    if (this.dom.autoSpinBtn) this.dom.autoSpinBtn.classList.remove('active');
                    if (this.dom.atmModal) this.dom.atmModal.classList.remove('hidden');
                }
            }
        }
    }

    animateReels(outcomeGrid) {
        return new Promise((resolve) => {
            const numReels = this.numReels;
            let reelsFinished = 0;
            let scatterFoundCount = 0;

            const baseSpinDuration = this.isTurbo ? 350 : 800;
            const reelStaggerDelay = this.isTurbo ? 100 : 220;

            for (let col = 0; col < numReels; col++) {
                const strip = document.getElementById(`reelStrip-${col}`);
                if (!strip) {
                    reelsFinished++;
                    if (reelsFinished === numReels) resolve();
                    continue;
                }

                // Build animation strip with buffer symbols
                const spinSymbolCount = this.isTurbo ? 10 : 18 + col * 4;
                const fragment = document.createDocumentFragment();

                for (let i = 0; i < spinSymbolCount; i++) {
                    const sym = window.slotEngine.getRandomSymbol();
                    fragment.appendChild(this.createSymbolElement(sym, col, -1));
                }

                // Target 3 symbols
                for (let row = 0; row < this.numRows; row++) {
                    const targetSym = outcomeGrid[col][row];
                    fragment.appendChild(this.createSymbolElement(targetSym, col, row));
                }

                strip.innerHTML = '';
                strip.appendChild(fragment);

                const symbolHeight = (strip.children[0] && strip.children[0].offsetHeight) ? strip.children[0].offsetHeight : 104;
                const totalDistance = spinSymbolCount * symbolHeight;

                const colDelay = col * reelStaggerDelay;
                const duration = baseSpinDuration + colDelay;

                // Animate reel downwards
                strip.style.transition = 'none';
                strip.style.transform = 'translateY(0px)';
                void strip.offsetHeight; // Force reflow

                strip.style.transition = `transform ${duration}ms cubic-bezier(0.12, 0.85, 0.25, 1.02)`;
                strip.style.transform = `translateY(-${totalDistance}px)`;

                setTimeout(() => {
                    strip.style.transition = 'none';

                    // Re-render target 3 symbols in resting position
                    strip.innerHTML = '';
                    for (let row = 0; row < this.numRows; row++) {
                        const targetSym = outcomeGrid[col][row];
                        strip.appendChild(this.createSymbolElement(targetSym, col, row));
                    }
                    strip.style.transform = 'translateY(0px)';

                    // Reel stop audio
                    window.casinoAudio.playReelStop(col);

                    // Check Scatters on this reel
                    for (let row = 0; row < this.numRows; row++) {
                        if (outcomeGrid[col][row].isScatter) {
                            scatterFoundCount++;
                            window.casinoAudio.playScatterHit(scatterFoundCount);
                            break;
                        }
                    }

                    // Near-miss anticipation on 3rd reel if first 2 had scatter
                    if (scatterFoundCount >= 2 && col === 1) {
                        const nextCol = document.querySelector(`.reel-column[data-reel="2"]`);
                        if (nextCol) nextCol.classList.add('anticipation-glow');
                        window.casinoAudio.startAnticipation();
                    }

                    reelsFinished++;
                    if (reelsFinished === numReels) {
                        window.casinoAudio.stopAnticipation();
                        resolve();
                    }
                }, duration);
            }
        });
    }

    async handleSpinResult(result) {
        if (window.authManager) {
            window.authManager.trackSpin(result.totalWin);
        }

        if (result.totalWin > 0) {
            if (this.dom.win) this.dom.win.textContent = this.formatCurrency(result.totalWin);
            this.balance += result.totalWin;
            this.updateDisplays();

            // Highlight winning symbols
            this.highlightWinningSymbols(result.winningLines);

            // Draw laser paylines
            this.drawPaylines(result.winningLines);

            // Trigger Celebration
            await window.celebrations.celebrate(result.celebrationTier, result.totalWin);
        } else {
            if (this.dom.win) this.dom.win.textContent = '$0.00';
        }

        // Free Spins triggered in round
        if (result.freeSpinsAwarded > 0) {
            this.freeSpinsRemaining += result.freeSpinsAwarded;
            if (this.dom.fsLeftCount) this.dom.fsLeftCount.textContent = this.freeSpinsRemaining;
            if (this.dom.freeSpinsBanner) this.dom.freeSpinsBanner.classList.remove('hidden');
            window.casinoAudio.playFreeSpinsTrigger();
            window.particleEngine.burstFireworks(100);
            window.celebrations.applyShake('big', 1000);
        }
    }

    highlightWinningSymbols(winningLines) {
        winningLines.forEach(line => {
            line.positions.forEach(pos => {
                const sym = document.querySelector(`.slot-symbol[data-col="${pos.col}"][data-row="${pos.row}"]`);
                if (sym) {
                    sym.classList.add('symbol-winning');
                }
            });
        });
    }

    drawPaylines(winningLines) {
        const svg = this.dom.paylinesSvg;
        if (!svg) return;
        svg.innerHTML = '';
        if (!winningLines || winningLines.length === 0) return;

        const colors = ['#00f0ff', '#ff007f', '#ffd700', '#00ff88', '#9d00ff'];
        const frameRect = svg.getBoundingClientRect();

        winningLines.forEach((line, idx) => {
            const color = colors[idx % colors.length];
            const points = [];

            line.positions.forEach(pos => {
                const sym = document.querySelector(`.slot-symbol[data-col="${pos.col}"][data-row="${pos.row}"]`);
                if (sym) {
                    const symRect = sym.getBoundingClientRect();
                    const x = symRect.left - frameRect.left + symRect.width / 2;
                    const y = symRect.top - frameRect.top + symRect.height / 2;
                    points.push(`${x},${y}`);
                }
            });

            if (points.length > 1) {
                const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
                polyline.setAttribute('points', points.join(' '));
                polyline.setAttribute('class', 'payline-path');
                polyline.setAttribute('stroke', color);
                polyline.style.color = color;
                svg.appendChild(polyline);
            }
        });
    }
}

// Safe instantiation whether loaded synchronously or asynchronously
function initCasinoApp() {
    if (!window.app) {
        window.app = new CasinoApp();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCasinoApp);
} else {
    initCasinoApp();
}

// Global user interaction handler to wake up Web Audio API on mobile
const unlockAudioOnTouch = () => {
    if (window.casinoAudio) {
        window.casinoAudio.init();
    }
    document.removeEventListener('pointerdown', unlockAudioOnTouch);
    document.removeEventListener('keydown', unlockAudioOnTouch);
};
document.addEventListener('pointerdown', unlockAudioOnTouch, { passive: true });
document.addEventListener('keydown', unlockAudioOnTouch, { passive: true });
