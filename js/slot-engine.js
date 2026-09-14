/**
 * Slot Engine Domain Logic (Classic 3-Reel x 3-Row Vegas Slots)
 * Pure business logic: 5 paylines, RNG, symbol payouts, win evaluation.
 */

const SYMBOLS = {
    wild: {
        id: 'wild',
        name: 'WILD',
        icon: '⭐',
        weight: 3,
        isWild: true,
        payouts: { 3: 300 }
    },
    crown: {
        id: 'crown',
        name: 'Корона',
        icon: '👑',
        weight: 4,
        payouts: { 3: 200 }
    },
    diamond: {
        id: 'diamond',
        name: 'Алмаз',
        icon: '💎',
        weight: 5,
        payouts: { 3: 100 }
    },
    seven: {
        id: 'seven',
        name: 'Семерка',
        icon: '7️⃣',
        weight: 7,
        payouts: { 3: 77 }
    },
    bell: {
        id: 'bell',
        name: 'Колокол',
        icon: '🔔',
        weight: 9,
        payouts: { 3: 30 }
    },
    clover: {
        id: 'clover',
        name: 'Клевер',
        icon: '🍀',
        weight: 12,
        payouts: { 3: 20 }
    },
    cherry: {
        id: 'cherry',
        name: 'Вишня',
        icon: '🍒',
        weight: 14,
        payouts: { 2: 3, 3: 10 }
    },
    lemon: {
        id: 'lemon',
        name: 'Лимон',
        icon: '🍋',
        weight: 16,
        payouts: { 3: 6 }
    },
    scatter: {
        id: 'scatter',
        name: 'SCATTER',
        icon: '⚡',
        weight: 5,
        isScatter: true,
        payouts: {}
    }
};

// 5 Classic Vegas 3x3 Paylines
const PAYLINES = [
    [1, 1, 1], // Line 1: Center Horizontal
    [0, 0, 0], // Line 2: Top Horizontal
    [2, 2, 2], // Line 3: Bottom Horizontal
    [0, 1, 2], // Line 4: Diagonal Top-Left to Bottom-Right
    [2, 1, 0]  // Line 5: Diagonal Bottom-Left to Top-Right
];

class SlotEngine {
    constructor() {
        this.symbols = SYMBOLS;
        this.paylines = PAYLINES;
        this.numReels = 3;
        this.numRows = 3;
        this.weightedPool = this.buildWeightedPool();
    }

    buildWeightedPool() {
        const pool = [];
        for (const key in this.symbols) {
            const sym = this.symbols[key];
            for (let i = 0; i < sym.weight; i++) {
                pool.push(sym.id);
            }
        }
        return pool;
    }

    getRandomSymbol() {
        const idx = Math.floor(Math.random() * this.weightedPool.length);
        return this.symbols[this.weightedPool[idx]];
    }

    generateSpinOutcome() {
        // Generates 3 reels x 3 rows grid
        // grid[reelIndex][rowIndex]
        const grid = [];
        for (let col = 0; col < this.numReels; col++) {
            const column = [];
            for (let row = 0; row < this.numRows; row++) {
                column.push(this.getRandomSymbol());
            }
            grid.push(column);
        }
        return grid;
    }

    evaluateSpin(grid, totalBet, isFreeSpins = false) {
        const lineBet = totalBet / this.paylines.length;
        const winningLines = [];
        let totalWin = 0;

        // 1. Evaluate 5 Paylines
        this.paylines.forEach((linePattern, lineIndex) => {
            const lineSymbols = linePattern.map((rowIdx, colIdx) => grid[colIdx][rowIdx]);

            // Determine matching symbol from left to right
            let matchSymbolId = null;
            let matchCount = 0;
            const matchPositions = [];

            for (let col = 0; col < this.numReels; col++) {
                const currentSym = lineSymbols[col];
                if (currentSym.isScatter) {
                    break;
                }

                if (!matchSymbolId) {
                    if (!currentSym.isWild) {
                        matchSymbolId = currentSym.id;
                    }
                    matchCount++;
                    matchPositions.push({ col, row: linePattern[col] });
                } else {
                    if (currentSym.id === matchSymbolId || currentSym.isWild) {
                        matchCount++;
                        matchPositions.push({ col, row: linePattern[col] });
                    } else {
                        break;
                    }
                }
            }

            // In case of all wilds
            if (!matchSymbolId && matchCount >= 3) {
                matchSymbolId = 'wild';
            }

            if (matchSymbolId) {
                const symDef = this.symbols[matchSymbolId];
                const multiplier = symDef.payouts[matchCount] || 0;
                if (multiplier > 0) {
                    let winAmount = lineBet * multiplier;
                    if (isFreeSpins) {
                        winAmount *= 3; // 3x multiplier in Free Spins
                    }
                    totalWin += winAmount;
                    winningLines.push({
                        lineIndex,
                        symbol: symDef,
                        count: matchCount,
                        multiplier,
                        winAmount,
                        positions: matchPositions
                    });
                }
            }
        });

        // 2. Evaluate Scatters (Free Spins trigger)
        let scatterCount = 0;
        const scatterPositions = [];
        for (let col = 0; col < this.numReels; col++) {
            for (let row = 0; row < this.numRows; row++) {
                if (grid[col][row].isScatter) {
                    scatterCount++;
                    scatterPositions.push({ col, row });
                }
            }
        }

        let freeSpinsAwarded = 0;
        if (scatterCount >= 3) {
            freeSpinsAwarded = 10;
            const scatterWin = totalBet * 5;
            totalWin += scatterWin;
        }

        // 3. Determine Celebration Tier
        let celebrationTier = 'none';
        const winRatio = totalWin / (totalBet || 1);

        if (totalWin > 0) {
            if (winRatio >= 50 || winningLines.some(l => l.symbol.id === 'seven' || l.symbol.id === 'crown' || l.symbol.id === 'wild')) {
                celebrationTier = 'godlike';
            } else if (winRatio >= 20) {
                celebrationTier = 'mega';
            } else if (winRatio >= 5) {
                celebrationTier = 'big';
            } else {
                celebrationTier = 'nice';
            }
        }

        return {
            grid,
            totalWin,
            winRatio,
            winningLines,
            scatterCount,
            scatterPositions,
            freeSpinsAwarded,
            celebrationTier,
            isJackpot: celebrationTier === 'godlike'
        };
    }
}

window.slotEngine = new SlotEngine();
