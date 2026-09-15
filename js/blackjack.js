/**
 * Blackjack / 21 Engine & Controller (Cyber Vegas Edition)
 * Standard Vegas rules: 6-deck shoe, Dealer stands on 17+, Natural Blackjack pays 3:2,
 * Double Down, soft/hard Ace calculation, chip betting, cyber neon card UI.
 */

class BlackjackGame {
    constructor() {
        this.suits = [
            { name: 'hearts', symbol: '♥', color: 'pink' },
            { name: 'diamonds', symbol: '♦', color: 'pink' },
            { name: 'clubs', symbol: '♣', color: 'cyan' },
            { name: 'spades', symbol: '♠', color: 'cyan' }
        ];

        this.ranks = [
            { rank: '2', val: 2 },
            { rank: '3', val: 3 },
            { rank: '4', val: 4 },
            { rank: '5', val: 5 },
            { rank: '6', val: 6 },
            { rank: '7', val: 7 },
            { rank: '8', val: 8 },
            { rank: '9', val: 9 },
            { rank: '10', val: 10 },
            { rank: 'J', val: 10 },
            { rank: 'Q', val: 10 },
            { rank: 'K', val: 10 },
            { rank: 'A', val: 11 }
        ];

        this.shoe = [];
        this.deckCount = 6;
        this.currentBet = 50;
        this.activeBet = 0;
        this.gameState = 'BETTING'; // 'BETTING', 'DEALING', 'PLAYER_TURN', 'DEALER_TURN', 'ROUND_OVER'

        this.playerHand = [];
        this.dealerHand = [];

        this.dom = {
            view: document.getElementById('blackjackView'),
            dealerCards: document.getElementById('bjDealerCards'),
            dealerScore: document.getElementById('bjDealerScore'),
            playerCards: document.getElementById('bjPlayerCards'),
            playerScore: document.getElementById('bjPlayerScore'),
            statusBanner: document.getElementById('bjStatusBanner'),
            statusText: document.getElementById('bjStatusText'),
            currentBetDisplay: document.getElementById('bjCurrentBet'),
            balanceDisplay: document.getElementById('bjBalanceDisplay'),
            chipBtns: document.querySelectorAll('.bj-chip-btn'),
            clearBetBtn: document.getElementById('bjClearBetBtn'),
            doubleBetBtn: document.getElementById('bjDoubleBetBtn'),
            maxBetBtn: document.getElementById('bjMaxBetBtn'),
            dealBtn: document.getElementById('bjDealBtn'),
            hitBtn: document.getElementById('bjHitBtn'),
            standBtn: document.getElementById('bjStandBtn'),
            doubleDownBtn: document.getElementById('bjDoubleDownBtn'),
            betControlsGroup: document.getElementById('bjBetControlsGroup'),
            actionControlsGroup: document.getElementById('bjActionControlsGroup')
        };

        this.initShoe();
        this.bindEvents();
        this.updateBetDisplay();
    }

    initShoe() {
        this.shoe = [];
        for (let d = 0; d < this.deckCount; d++) {
            for (const s of this.suits) {
                for (const r of this.ranks) {
                    this.shoe.push({
                        suit: s.name,
                        symbol: s.symbol,
                        color: s.color,
                        rank: r.rank,
                        val: r.val,
                        id: `${r.rank}-${s.name}-${d}-${Math.random().toString(36).substr(2, 4)}`
                    });
                }
            }
        }
        this.shuffleShoe();
    }

    shuffleShoe() {
        for (let i = this.shoe.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.shoe[i], this.shoe[j]] = [this.shoe[j], this.shoe[i]];
        }
    }

    drawCard() {
        if (this.shoe.length < 20) {
            this.initShoe();
        }
        return this.shoe.pop();
    }

    calculateScore(hand) {
        let total = 0;
        let aces = 0;

        for (const card of hand) {
            if (card.rank === 'A') {
                aces++;
                total += 11;
            } else {
                total += card.val;
            }
        }

        while (total > 21 && aces > 0) {
            total -= 10;
            aces--;
        }

        const isSoft = (aces > 0 && total <= 21);
        return { total, isSoft, isBust: total > 21, isBlackjack: (hand.length === 2 && total === 21) };
    }

    getBalance() {
        return window.app ? window.app.balance : (parseFloat(localStorage.getItem('casino_balance')) || 5000);
    }

    setBalance(val) {
        if (window.app) {
            window.app.balance = Math.max(0, val);
            window.app.updateDisplays();
        } else {
            localStorage.setItem('casino_balance', Math.max(0, val).toFixed(2));
        }
        this.updateBetDisplay();
    }

    bindEvents() {
        if (this.dom.chipBtns) {
            this.dom.chipBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    if (this.gameState !== 'BETTING' && this.gameState !== 'ROUND_OVER') return;
                    const chipVal = parseInt(btn.dataset.value, 10);
                    const bal = this.getBalance();
                    if (this.currentBet + chipVal <= bal) {
                        this.currentBet += chipVal;
                        if (window.casinoAudio) window.casinoAudio.playChipClick();
                        this.updateBetDisplay();
                    }
                });
            });
        }

        if (this.dom.clearBetBtn) {
            this.dom.clearBetBtn.addEventListener('click', () => {
                if (this.gameState !== 'BETTING' && this.gameState !== 'ROUND_OVER') return;
                this.currentBet = 10;
                if (window.casinoAudio) window.casinoAudio.playChipClick();
                this.updateBetDisplay();
            });
        }

        if (this.dom.doubleBetBtn) {
            this.dom.doubleBetBtn.addEventListener('click', () => {
                if (this.gameState !== 'BETTING' && this.gameState !== 'ROUND_OVER') return;
                const bal = this.getBalance();
                if (this.currentBet * 2 <= bal) {
                    this.currentBet *= 2;
                    if (window.casinoAudio) window.casinoAudio.playChipClick();
                    this.updateBetDisplay();
                }
            });
        }

        if (this.dom.maxBetBtn) {
            this.dom.maxBetBtn.addEventListener('click', () => {
                if (this.gameState !== 'BETTING' && this.gameState !== 'ROUND_OVER') return;
                const bal = this.getBalance();
                if (bal <= 0) {
                    this.setStatus('НЕДОСТАТОЧНО СРЕДСТВ! ПОПОЛНИ БАЛАНС В БАНКОМАТЕ', 'loss');
                    if (window.casinoAudio && typeof window.casinoAudio.playLoseSound === 'function') {
                        window.casinoAudio.playLoseSound();
                    }
                    return;
                }
                this.currentBet = Math.max(10, Math.floor(bal));
                if (window.casinoAudio && typeof window.casinoAudio.playChipClick === 'function') {
                    window.casinoAudio.playChipClick();
                }
                this.updateBetDisplay();
            });
        }

        if (this.dom.dealBtn) {
            this.dom.dealBtn.addEventListener('click', () => this.startRound());
        }

        if (this.dom.hitBtn) {
            this.dom.hitBtn.addEventListener('click', () => this.playerHit());
        }

        if (this.dom.standBtn) {
            this.dom.standBtn.addEventListener('click', () => this.playerStand());
        }

        if (this.dom.doubleDownBtn) {
            this.dom.doubleDownBtn.addEventListener('click', () => this.playerDoubleDown());
        }
    }

    updateBetDisplay() {
        if (this.dom.currentBetDisplay) {
            this.dom.currentBetDisplay.textContent = '$' + this.currentBet.toLocaleString();
        }
        if (this.dom.balanceDisplay) {
            const bal = this.getBalance();
            this.dom.balanceDisplay.textContent = '$' + Number(bal).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
    }

    setStatus(text, type = 'normal') {
        if (!this.dom.statusBanner || !this.dom.statusText) return;
        this.dom.statusBanner.className = `bj-status-banner ${type}`;
        this.dom.statusText.textContent = text;
        this.dom.statusBanner.classList.remove('hidden');
    }

    hideStatus() {
        if (this.dom.statusBanner) {
            this.dom.statusBanner.classList.add('hidden');
        }
    }

    async startRound() {
        if (this.gameState === 'DEALING' || this.gameState === 'PLAYER_TURN' || this.gameState === 'DEALER_TURN') {
            return;
        }

        const bal = this.getBalance();
        if (bal < this.currentBet) {
            this.setStatus('НЕДОСТАТОЧНО СРЕДСТВ! ПОПОЛНИ БАЛАНС В БАНКОМАТЕ', 'loss');
            if (window.casinoAudio && typeof window.casinoAudio.playLoseSound === 'function') {
                window.casinoAudio.playLoseSound();
            }
            return;
        }

        this.setBalance(bal - this.currentBet);
        this.activeBet = this.currentBet;
        this.gameState = 'DEALING';
        this.hideStatus();

        if (this.dom.dealBtn) {
            this.dom.dealBtn.disabled = true;
            this.dom.dealBtn.textContent = '⚡ РАЗДАЧА КАРТ... ⚡';
        }

        this.playerHand = [];
        this.dealerHand = [];
        this.renderHands(true);

        if (this.dom.betControlsGroup) this.dom.betControlsGroup.classList.add('hidden');
        if (this.dom.actionControlsGroup) this.dom.actionControlsGroup.classList.remove('hidden');
        if (this.dom.doubleDownBtn) this.dom.doubleDownBtn.disabled = (this.getBalance() < this.activeBet);
        this.disableActions(true);

        // Deal 2 cards to player, 2 cards to dealer (dealer 2nd card is hidden)
        await this.dealCardTo('player');
        await this.dealCardTo('dealer');
        await this.dealCardTo('player');
        await this.dealCardTo('dealer', true);

        const pCalc = this.calculateScore(this.playerHand);
        const dCalc = this.calculateScore(this.dealerHand);

        // Check Naturals
        if (pCalc.isBlackjack || dCalc.isBlackjack) {
            await this.handleBlackjackOutcome(pCalc, dCalc);
            return;
        }

        this.gameState = 'PLAYER_TURN';
        this.disableActions(false);
    }

    async dealCardTo(target, isHidden = false) {
        const card = this.drawCard();
        card.isHidden = isHidden;

        if (target === 'player') {
            this.playerHand.push(card);
        } else {
            this.dealerHand.push(card);
        }

        if (window.casinoAudio) {
            window.casinoAudio.playCardDeal();
        }

        this.renderHands(!this.dealerHand.some(c => !c.isHidden));
        await new Promise(r => setTimeout(r, 260));
    }

    renderHands(dealerFaceUp = false) {
        if (!this.dom.playerCards || !this.dom.dealerCards) return;

        // Player hand render
        this.dom.playerCards.innerHTML = '';
        this.playerHand.forEach((c, idx) => {
            const cardEl = this.createCardElement(c, false, idx);
            this.dom.playerCards.appendChild(cardEl);
        });

        const pCalc = this.calculateScore(this.playerHand);
        if (this.dom.playerScore) {
            this.dom.playerScore.textContent = this.playerHand.length ? pCalc.total : '0';
        }

        // Dealer hand render
        this.dom.dealerCards.innerHTML = '';
        this.dealerHand.forEach((c, idx) => {
            const isCardHidden = c.isHidden && !dealerFaceUp;
            const cardEl = this.createCardElement(c, isCardHidden, idx);
            this.dom.dealerCards.appendChild(cardEl);
        });

        if (this.dom.dealerScore) {
            if (this.dealerHand.length === 0) {
                this.dom.dealerScore.textContent = '0';
            } else if (!dealerFaceUp && this.dealerHand.some(c => c.isHidden)) {
                const visibleCards = this.dealerHand.filter(c => !c.isHidden);
                const dCalc = this.calculateScore(visibleCards);
                this.dom.dealerScore.textContent = dCalc.total;
            } else {
                const dCalc = this.calculateScore(this.dealerHand);
                this.dom.dealerScore.textContent = dCalc.total;
            }
        }
    }

    createCardElement(card, isHidden, index) {
        const cardEl = document.createElement('div');
        cardEl.className = `cyber-card ${isHidden ? 'card-back' : 'card-front'} card-color-${card.color}`;
        cardEl.style.animationDelay = `${index * 0.08}s`;

        if (isHidden) {
            const backPattern = document.createElement('div');
            backPattern.className = 'card-back-pattern';
            backPattern.innerHTML = '<span class="cyber-logo-icon">♠</span>';
            cardEl.appendChild(backPattern);
            return cardEl;
        }

        const topCorner = document.createElement('div');
        topCorner.className = 'card-corner top-corner';
        topCorner.innerHTML = `<span class="c-rank">${card.rank}</span><span class="c-suit">${card.symbol}</span>`;

        const centerSuit = document.createElement('div');
        centerSuit.className = 'card-center-suit';
        centerSuit.textContent = card.symbol;

        const btmCorner = document.createElement('div');
        btmCorner.className = 'card-corner btm-corner';
        btmCorner.innerHTML = `<span class="c-rank">${card.rank}</span><span class="c-suit">${card.symbol}</span>`;

        cardEl.appendChild(topCorner);
        cardEl.appendChild(centerSuit);
        cardEl.appendChild(btmCorner);

        return cardEl;
    }

    disableActions(disabled) {
        if (this.dom.hitBtn) this.dom.hitBtn.disabled = disabled;
        if (this.dom.standBtn) this.dom.standBtn.disabled = disabled;
        if (this.dom.doubleDownBtn) {
            const canDouble = (!disabled && this.playerHand.length === 2 && this.getBalance() >= this.activeBet);
            this.dom.doubleDownBtn.disabled = !canDouble;
        }
    }

    async playerHit() {
        if (this.gameState !== 'PLAYER_TURN') return;
        if (this.dom.doubleDownBtn) this.dom.doubleDownBtn.disabled = true;
        this.disableActions(true);

        await this.dealCardTo('player');
        const pCalc = this.calculateScore(this.playerHand);

        if (pCalc.isBust) {
            await this.endRound('BUST');
        } else if (pCalc.total === 21) {
            await this.playerStand();
        } else {
            this.disableActions(false);
        }
    }

    async playerStand() {
        if (this.gameState !== 'PLAYER_TURN') return;
        this.gameState = 'DEALER_TURN';
        this.disableActions(true);

        // Reveal dealer's hole card
        this.dealerHand.forEach(c => c.isHidden = false);
        this.renderHands(true);
        if (window.casinoAudio) window.casinoAudio.playCardDeal();
        await new Promise(r => setTimeout(r, 500));

        let dCalc = this.calculateScore(this.dealerHand);
        while (dCalc.total < 17) {
            await this.dealCardTo('dealer', false);
            dCalc = this.calculateScore(this.dealerHand);
            await new Promise(r => setTimeout(r, 400));
        }

        const pCalc = this.calculateScore(this.playerHand);
        if (dCalc.isBust) {
            await this.endRound('DEALER_BUST');
        } else if (pCalc.total > dCalc.total) {
            await this.endRound('WIN');
        } else if (pCalc.total === dCalc.total) {
            await this.endRound('PUSH');
        } else {
            await this.endRound('LOSE');
        }
    }

    async playerDoubleDown() {
        if (this.gameState !== 'PLAYER_TURN' || this.playerHand.length !== 2) return;
        const bal = this.getBalance();
        if (bal < this.activeBet) return;

        this.setBalance(bal - this.activeBet);
        this.activeBet *= 2;
        this.disableActions(true);

        if (window.casinoAudio) window.casinoAudio.playChipClick();
        await this.dealCardTo('player');
        const pCalc = this.calculateScore(this.playerHand);

        if (pCalc.isBust) {
            await this.endRound('BUST');
        } else {
            await this.playerStand();
        }
    }

    async handleBlackjackOutcome(pCalc, dCalc) {
        this.dealerHand.forEach(c => c.isHidden = false);
        this.renderHands(true);
        await new Promise(r => setTimeout(r, 400));

        if (pCalc.isBlackjack && dCalc.isBlackjack) {
            await this.endRound('PUSH_BJ');
        } else if (pCalc.isBlackjack) {
            await this.endRound('BLACKJACK');
        } else {
            await this.endRound('DEALER_BJ');
        }
    }

    async endRound(outcome) {
        this.gameState = 'ROUND_OVER';
        this.disableActions(true);

        try {
            let winAmount = 0;
            const currentBal = this.getBalance();
            let streakMult = 1.0;
            if (window.streakManager) {
                streakMult = window.streakManager.getCurrentMultiplier();
            }
            const isStreakBoosted = streakMult > 1.0;
            const streakTag = isStreakBoosted ? ` (СТРИК x${streakMult.toFixed(streakMult % 1 === 0 ? 1 : 2)}! 🔥)` : '';

            switch (outcome) {
                case 'BLACKJACK': {
                    const baseProfit = Math.floor(this.activeBet * 1.5);
                    const profit = Math.round(baseProfit * streakMult);
                    winAmount = this.activeBet + profit;
                    this.setBalance(currentBal + winAmount);
                    this.setStatus(`💥 БЛЭКДЖЕК! ВЫИГРЫШ 3:2: +$${winAmount.toLocaleString()}${streakTag} 💥`, 'bj');
                    if (window.streakManager) window.streakManager.recordWin();
                    if (window.casinoAudio && typeof window.casinoAudio.playJackpotWin === 'function') {
                        window.casinoAudio.playJackpotWin();
                    }
                    if (window.particleEngine) {
                        window.particleEngine.burstCoins(50);
                        window.particleEngine.burstFireworks(60);
                    }
                    if (window.celebrations) {
                        window.celebrations.celebrate('big', winAmount);
                    }
                    break;
                }
                case 'DEALER_BUST': {
                    const profit = Math.round(this.activeBet * streakMult);
                    winAmount = this.activeBet + profit;
                    this.setBalance(currentBal + winAmount);
                    this.setStatus(`🎉 ДИЛЕР ПЕРЕБРАЛ! ВЫИГРЫШ: +$${winAmount.toLocaleString()}${streakTag} 🎉`, 'win');
                    if (window.streakManager) window.streakManager.recordWin();
                    if (window.casinoAudio && typeof window.casinoAudio.playWinChime === 'function') {
                        window.casinoAudio.playWinChime();
                    }
                    if (window.particleEngine) window.particleEngine.burstCoins(25);
                    break;
                }
                case 'WIN': {
                    const profit = Math.round(this.activeBet * streakMult);
                    winAmount = this.activeBet + profit;
                    this.setBalance(currentBal + winAmount);
                    this.setStatus(`🏆 ВЫ ВЫИГРАЛИ! ВЫПЛАТА: +$${winAmount.toLocaleString()}${streakTag} 🏆`, 'win');
                    if (window.streakManager) window.streakManager.recordWin();
                    if (window.casinoAudio && typeof window.casinoAudio.playWinChime === 'function') {
                        window.casinoAudio.playWinChime();
                    }
                    if (window.particleEngine) window.particleEngine.burstCoins(25);
                    break;
                }
                case 'PUSH':
                case 'PUSH_BJ': {
                    winAmount = this.activeBet;
                    this.setBalance(currentBal + winAmount);
                    this.setStatus('🤝 НИЧЬЯ (PUSH)! СТАВКА ВОЗВРАЩЕНА 🤝', 'push');
                    if (window.streakManager) window.streakManager.recordPush();
                    if (window.casinoAudio && typeof window.casinoAudio.playCreditTick === 'function') {
                        window.casinoAudio.playCreditTick();
                    }
                    break;
                }
                case 'BUST': {
                    if (window.streakManager) window.streakManager.recordLoss();
                    this.setStatus(`💀 ПЕРЕБОР (${this.calculateScore(this.playerHand).total})! ВЫ ПРОИГРАЛИ -$${this.activeBet.toLocaleString()}`, 'loss');
                    if (window.casinoAudio && typeof window.casinoAudio.playLoseSound === 'function') {
                        window.casinoAudio.playLoseSound();
                    }
                    break;
                }
                case 'DEALER_BJ': {
                    if (window.streakManager) window.streakManager.recordLoss();
                    this.setStatus(`💀 У ДИЛЕРА БЛЭКДЖЕК! ВЫ ПРОИГРАЛИ -$${this.activeBet.toLocaleString()}`, 'loss');
                    if (window.casinoAudio && typeof window.casinoAudio.playLoseSound === 'function') {
                        window.casinoAudio.playLoseSound();
                    }
                    break;
                }
                case 'LOSE':
                default: {
                    if (window.streakManager) window.streakManager.recordLoss();
                    this.setStatus(`ДИЛЕР ВЫИГРАЛ (${this.calculateScore(this.dealerHand).total} ПРОТИВ ${this.calculateScore(this.playerHand).total}) -$${this.activeBet.toLocaleString()}`, 'loss');
                    if (window.casinoAudio && typeof window.casinoAudio.playLoseSound === 'function') {
                        window.casinoAudio.playLoseSound();
                    }
                    break;
                }
            }

            // Track stats in user profile
            if (window.authManager) {
                window.authManager.trackBlackjack(winAmount > this.activeBet ? winAmount - this.activeBet : 0);
            }
        } catch (err) {
            console.error('Error during endRound:', err);
        } finally {
            if (this.dom.betControlsGroup) this.dom.betControlsGroup.classList.remove('hidden');
            if (this.dom.actionControlsGroup) this.dom.actionControlsGroup.classList.add('hidden');
            if (this.dom.dealBtn) {
                this.dom.dealBtn.disabled = false;
                this.dom.dealBtn.textContent = '⚡ СЛЕДУЮЩИЙ РАУНД ⚡';
            }
        }
    }
}

// Instantiate upon DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.blackjackGame = new BlackjackGame();
    });
} else {
    window.blackjackGame = new BlackjackGame();
}
