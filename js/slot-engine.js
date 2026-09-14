/**
 * Slot Engine Domain Logic
 * Pure business logic: paylines, weighted RNG, symbol payouts, win evaluation.
 */

const SYMBOLS = {
    crown: {
        id: 'crown',
        name: 'Корона',
        icon: '👑',
        weight: 3,
        payouts: { 3: 10, 4: 50, 5: 250 }
    },
    diamond: {
        id: 'diamond',
        name: 'Алмаз',
        icon: '💎',
        weight: 4,
        payouts: { 3: 8, 4: 35, 5: 150 }
    },
    seven: {
        id: 'seven',
        name: 'Семерка',
        icon: '7️⃣',
        weight: 6,
        payouts: { 3: 6, 4: 25, 5: 100 }
    },
    bell: {
        id: 'bell',
        name: 'Колокол',
        icon: '🔔',
        weight: 8,
        payouts: { 3: 4, 4: 15, 5: 50 }
    },
    clover: {
        id: 'clover',
        name: 'Клевер',
        icon: '🍀',
        weight: 10,
        payouts: { 3: 3, 4: 10, 5: 35 }
    },
    cherry: {
        id: 'cherry',
        name: 'Вишня',
        icon: '🍒',
        weight: 12,
        payouts: { 3: 2, 4: 8, 5: 25 }
    },
    lemon: {
        id: 'lemon',
        name: 'Лимон',
        icon: '🍋',
        weight: 15,
        payouts: { 3: 1.5, 4: 5, 5: 15 }
    },
    wild: {
        id: 'wild',
        name: 'WILD',
        icon: '⭐',
        weight: 4,
        isWild: true,
        payouts: { 3: 15, 4: 60, 5: 300 }
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

const PAYLINES = [
    [1, 1, 1, 1, 1], // Line 1: Center horizontal
    [0, 0, 0, 0, 0], // Line 2: Top horizontal
    [2, 2, 2, 2, 2], // Line 3: Bottom horizontal
    [0, 1, 2, 1, 0], // Line 4: V shape
    [2, 1, 0, 1, 2], // Line 5: Inverted V
    [0, 0, 1, 2, 2], // Line 6: Step down
    [2, 2, 1, 0, 0], // Line 7: Step up
    [1, 0, 0, 0, 1], // Line 8: Top trough
    [1, 2, 2, 2, 1], // Line 9: Bottom ridge
    [1, 0, 1, 2, 1], // Line 10: Zigzag down
    [1, 2, 1, 0, 1], // Line 11: Zigzag up
    [0, 1, 0, 1, 0], // Line 12: Top zigzag
    [2, 1, 2, 1, 2], // Line 13: Bottom zigzag
    [0, 1, 1, 1, 0], // Line 14: Mid trough
    [2, 1, 1, 1, 2], // Line 15: Mid ridge
    [0, 0, 2, 0, 0], // Line 16
    [2, 2, 0, 2, 2], // Line 17
    [0, 2, 2, 2, 0], // Line 18
    [2, 0, 0, 0, 2], // Line 19
    [1, 1, 0, 1, 1]  // Line 20
];

class SlotEngine {
    constructor() {
        this.symbols = SYMBOLS;
        this.paylines = PAYLINES;
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

    generateReelStrip(length = 30) {
        const strip = [];
        for (let i = 0; i < length; i++) {
            strip.push(this.getRandomSymbol());
        }
        return strip;
    }

    generateSpinOutcome() {
        // Generates 5 reels x 3 rows grid
        // grid[reelIndex][rowIndex]
        const grid = [];
        for (let col = 0; col < 5; col++) {
            const column = [];
            for (let row = 0; row < 3; row++) {
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

        // 1. Evaluate Paylines
        this.paylines.forEach((linePattern, lineIndex) => {
            const lineSymbols = linePattern.map((rowIdx, colIdx) => grid[colIdx][rowIdx]);

            // Determine matching symbol from left to right (ignoring scatters for line wins)
            let matchSymbolId = null;
            let matchCount = 0;
            const matchPositions = [];

            for (let col = 0; col < 5; col++) {
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

            if (matchSymbolId && matchCount >= 3) {
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
        for (let col = 0; col < 5; col++) {
            for (let row = 0; row < 3; row++) {
                if (grid[col][row].isScatter) {
                    scatterCount++;
                    scatterPositions.push({ col, row });
                }
            }
        }

        let freeSpinsAwarded = 0;
        if (scatterCount >= 3) {
            freeSpinsAwarded = scatterCount === 3 ? 10 : scatterCount === 4 ? 15 : 25;
            const scatterWin = totalBet * (scatterCount * 2);
            totalWin += scatterWin;
        }

        // 3. Determine Celebration Tier
        let celebrationTier = 'none';
        const winRatio = totalWin / (totalBet || 1);

        if (totalWin > 0) {
            if (winRatio >= 50 || (winningLines.some(l => l.count === 5 && (l.symbol.id === 'crown' || l.symbol.id === 'seven' || l.symbol.id === 'diamond')))) {
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
