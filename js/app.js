/**
 * Casino Application Orchestrator
 * Connects Slot Engine, UI DOM, Audio Synth, Particles & Celebrations.
 */

class CasinoApp {
    constructor() {
        this.balance = parseFloat(localStorage.getItem('casino_balance')) || 10000;
        this.bets = [10, 20, 40, 60, 100, 200, 500, 1000, 2000];
        this.betIndex = 1; // Default $20
        this.isSpinning = false;
        this.isTurbo = false;
        this.isAutoSpinning = false;
        this.freeSpinsRemaining = 0;
        this.freeSpinsMultiplier = 3;

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
            atmBtn: document.getElementById('atmBtn'),
            closeAtmBtn: document.getElementById('closeAtmBtn'),
            atmModal: document.getElementById('atmModal'),
            freeSpinsBanner: document.getElementById('freeSpinsBanner'),
            fsLeftCount: document.getElementById('fsLeftCount'),
            paylinesSvg: document.getElementById('paylinesSvg'),
            jpMini: document.getElementById('jpMiniVal'),
            jpMajor: document.getElementById('jpMajorVal'),
            jpGrand: document.getElementById('jpGrandVal'),
            reelsGrid: document.getElementById('reelsGrid')
        };

        // Current 5x3 visible grid of symbols
        this.currentGrid = [];

        this.init();
    }

    init() {
        this.setupInitialReels();
        this.updateDisplays();
        this.bindEvents();
        this.updateSoundIcon();
        this.startJackpotTicker();
    }

    formatCurrency(val) {
        return '$' + Number(val).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    updateDisplays() {
        this.dom.balance.textContent = this.formatCurrency(this.balance);
        this.dom.bet.textContent = this.formatCurrency(this.getCurrentBet());
        localStorage.setItem('casino_balance', this.balance.toFixed(2));
    }

    getCurrentBet() {
        return this.bets[this.betIndex];
    }

    setupInitialReels() {
        this.currentGrid = [];
        for (let col = 0; col < 5; col++) {
            const strip = document.getElementById(`reelStrip-${col}`);
            strip.innerHTML = '';
            const colSymbols = [];
            for (let row = 0; row < 3; row++) {
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
        this.dom.spinBtn.addEventListener('click', () => this.handleSpinRequest());

        // Lever Pull
        if (this.dom.lever) {
            this.dom.lever.addEventListener('click', () => {
                this.pullLeverAnimation();
                this.handleSpinRequest();
            });
        }

        // Keyboard Shortcut: Spacebar
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.repeat && document.activeElement.tagName !== 'BUTTON') {
                e.preventDefault();
                this.handleSpinRequest();
            }
        });

        // Bet adjustments
        this.dom.betUpBtn.addEventListener('click', () => {
            window.casinoAudio.playButtonClick();
            if (this.betIndex < this.bets.length - 1) {
                this.betIndex++;
                this.updateDisplays();
            }
        });

        this.dom.betDownBtn.addEventListener('click', () => {
            window.casinoAudio.playButtonClick();
            if (this.betIndex > 0) {
                this.betIndex--;
                this.updateDisplays();
            }
        });

        this.dom.maxBetBtn.addEventListener('click', () => {
            window.casinoAudio.playButtonClick();
            this.betIndex = this.bets.length - 1;
            this.updateDisplays();
        });

        // Turbo toggle
        this.dom.turboBtn.addEventListener('click', () => {
            window.casinoAudio.playButtonClick();
            this.isTurbo = !this.isTurbo;
            this.dom.turboBtn.classList.toggle('active', this.isTurbo);
        });

        // Auto-spin toggle
        this.dom.autoSpinBtn.addEventListener('click', () => {
            window.casinoAudio.playButtonClick();
            this.isAutoSpinning = !this.isAutoSpinning;
            this.dom.autoSpinBtn.classList.toggle('active', this.isAutoSpinning);
            if (this.isAutoSpinning && !this.isSpinning) {
                this.handleSpinRequest();
            }
        });

        // Sound toggle
        this.dom.soundBtn.addEventListener('click', () => {
            const isMuted = window.casinoAudio.toggleMute();
            this.updateSoundIcon(isMuted);
        });

        // Paytable Modal
        this.dom.paytableBtn.addEventListener('click', () => {
            window.casinoAudio.playButtonClick();
            this.dom.paytableModal.classList.remove('hidden');
        });
        this.dom.closePaytableBtn.addEventListener('click', () => {
            this.dom.paytableModal.classList.add('hidden');
        });

        // ATM Modal
        this.dom.atmBtn.addEventListener('click', () => {
            window.casinoAudio.playButtonClick();
            this.dom.atmModal.classList.remove('hidden');
        });
        this.dom.closeAtmBtn.addEventListener('click', () => {
            this.dom.atmModal.classList.add('hidden');
        });

        // ATM claim buttons
        const claimBtns = document.querySelectorAll('.atm-claim-btn');
        claimBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const amount = parseFloat(e.target.dataset.amount) || 1000;
                this.balance += amount;
                this.updateDisplays();
                window.casinoAudio.playAtmCash();
                window.particleEngine.burstCoins(40);
                this.dom.atmModal.classList.add('hidden');
            });
        });
    }

    updateSoundIcon(isMuted = window.casinoAudio.isMuted) {
        this.dom.soundIcon.textContent = isMuted ? '🔇' : '🔊';
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

            this.dom.jpMini.textContent = this.formatCurrency(this.jackpotMini);
            this.dom.jpMajor.textContent = this.formatCurrency(this.jackpotMajor);
            this.dom.jpGrand.textContent = this.formatCurrency(this.jackpotGrand);
        }, 3000);
    }

    clearPaylines() {
        this.dom.paylinesSvg.innerHTML = '';
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
            this.dom.autoSpinBtn.classList.remove('active');
            this.dom.atmModal.classList.remove('hidden');
            return;
        }

        this.executeSpin();
    }

    async executeSpin() {
        this.isSpinning = true;
        this.dom.spinBtn.disabled = true;
        this.dom.spinBtn.classList.add('spinning');
        this.clearPaylines();

        const currentBet = this.getCurrentBet();
        const isFree = this.freeSpinsRemaining > 0;

        if (isFree) {
            this.freeSpinsRemaining--;
            this.dom.fsLeftCount.textContent = this.freeSpinsRemaining;
            if (this.freeSpinsRemaining === 0) {
                setTimeout(() => {
                    this.dom.freeSpinsBanner.classList.add('hidden');
                }, 2000);
            }
        } else {
            this.balance -= currentBet;
            this.updateDisplays();
        }

        window.casinoAudio.playSpinStart();

        // Generate target outcome
        const outcomeGrid = window.slotEngine.generateSpinOutcome();

        // Animate reels spinning
        await this.animateReels(outcomeGrid);

        this.currentGrid = outcomeGrid;

        // Evaluate results
        const result = window.slotEngine.evaluateSpin(outcomeGrid, currentBet, isFree);

        await this.handleSpinResult(result);

        this.isSpinning = false;
        this.dom.spinBtn.disabled = false;
        this.dom.spinBtn.classList.remove('spinning');

        // Auto-spin loop
        if (this.isAutoSpinning) {
            if (this.balance >= this.getCurrentBet() || this.freeSpinsRemaining > 0) {
                setTimeout(() => {
                    if (this.isAutoSpinning) {
                        this.handleSpinRequest();
                    }
                }, this.isTurbo ? 350 : 700);
            } else {
                this.isAutoSpinning = false;
                this.dom.autoSpinBtn.classList.remove('active');
                this.dom.atmModal.classList.remove('hidden');
            }
        }
    }

    animateReels(outcomeGrid) {
        return new Promise((resolve) => {
            const numReels = 5;
            let reelsFinished = 0;
            let scatterFoundCount = 0;

            const baseSpinDuration = this.isTurbo ? 400 : 1000;
            const reelStaggerDelay = this.isTurbo ? 100 : 250;

            for (let col = 0; col < numReels; col++) {
                const strip = document.getElementById(`reelStrip-${col}`);
                const reelCol = strip.parentElement;

                // Build animation strip
                const spinSymbolCount = this.isTurbo ? 12 : 22 + col * 4;
                const fragment = document.createDocumentFragment();

                // Generate random buffer symbols for blur spin
                for (let i = 0; i < spinSymbolCount; i++) {
                    const sym = window.slotEngine.getRandomSymbol();
                    fragment.appendChild(this.createSymbolElement(sym, col, -1));
                }

                // Append the 3 target final symbols
                for (let row = 0; row < 3; row++) {
                    const targetSym = outcomeGrid[col][row];
                    fragment.appendChild(this.createSymbolElement(targetSym, col, row));
                }

                strip.innerHTML = '';
                strip.appendChild(fragment);

                const symbolHeight = strip.children[0].offsetHeight || 120;
                const totalDistance = spinSymbolCount * symbolHeight;

                const colDelay = col * reelStaggerDelay;
                const duration = baseSpinDuration + colDelay;

                // Animate reel with CSS translation
                strip.style.transition = 'none';
                strip.style.transform = 'translateY(0px)';
                strip.offsetHeight; // Force reflow

                // Start transition
                strip.style.transition = `transform ${duration}ms cubic-bezier(0.1, 0.9, 0.2, 1.05)`;
                strip.style.transform = `translateY(-${totalDistance}px)`;

                // Schedule reel completion
                setTimeout(() => {
                    strip.style.transition = 'none';

                    // Re-render only final 3 symbols in position
                    strip.innerHTML = '';
                    for (let row = 0; row < 3; row++) {
                        const targetSym = outcomeGrid[col][row];
                        strip.appendChild(this.createSymbolElement(targetSym, col, row));
                    }
                    strip.style.transform = 'translateY(0px)';

                    // Reel stop sound
                    window.casinoAudio.playReelStop(col);

                    // Check for Scatters landed on this reel
                    let reelHasScatter = false;
                    for (let row = 0; row < 3; row++) {
                        if (outcomeGrid[col][row].isScatter) {
                            scatterFoundCount++;
                            reelHasScatter = true;
                            window.casinoAudio.playScatterHit(scatterFoundCount);
                            break;
                        }
                    }

                    // Check near-miss anticipation for subsequent reels
                    if (scatterFoundCount >= 2 && col < 4) {
                        const nextCol = document.querySelector(`.reel-column[data-reel="${col + 1}"]`);
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
        if (result.totalWin > 0) {
            this.dom.winDisplay.textContent = this.formatCurrency(result.totalWin);
            this.balance += result.totalWin;
            this.updateDisplays();

            // Highlight winning symbols
            this.highlightWinningSymbols(result.winningLines);

            // Draw laser paylines
            this.drawPaylines(result.winningLines);

            // Trigger Celebration
            await window.celebrations.celebrate(result.celebrationTier, result.totalWin);
        } else {
            this.dom.winDisplay.textContent = '$0.00';
        }

        // Free Spins triggered
        if (result.freeSpinsAwarded > 0) {
            this.freeSpinsRemaining += result.freeSpinsAwarded;
            this.dom.fsLeftCount.textContent = this.freeSpinsRemaining;
            this.dom.freeSpinsBanner.classList.remove('hidden');
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
        svg.innerHTML = '';
        if (!winningLines || winningLines.length === 0) return;

        const colors = ['#00f0ff', '#ff007f', '#ffd700', '#00ff88', '#9d00ff', '#ff5500'];
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

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
    window.app = new CasinoApp();
});
