/**
 * Share Card Generator
 * Stylized winner card rendered on Canvas, with Web Share API, PNG download, and Clipboard copy.
 */

class ShareCardGenerator {
    constructor() {
        this.canvas = document.getElementById('screenshotCanvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.modal = document.getElementById('shareModal');
        this.previewImg = document.getElementById('sharePreviewImg');
        this.toast = document.getElementById('shareNotification');
        this.btnNativeShare = document.getElementById('btnNativeShare');
        this.btnDownload = document.getElementById('btnDownloadImg');
        this.btnCopy = document.getElementById('btnCopyImg');
        this.closeBtn = document.getElementById('closeShareBtn');

        this.currentBlob = null;
        this.currentDataUrl = null;

        this.bindEvents();
    }

    bindEvents() {
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.hideModal());
        }
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.hideModal();
            });
        }
        if (this.btnNativeShare) {
            this.btnNativeShare.addEventListener('click', () => this.shareNative());
        }
        if (this.btnDownload) {
            this.btnDownload.addEventListener('click', () => this.downloadPng());
        }
        if (this.btnCopy) {
            this.btnCopy.addEventListener('click', () => this.copyToClipboard());
        }

        // Bind all potential share buttons (header, celebrations)
        const headerShareBtn = document.getElementById('shareBtn');
        if (headerShareBtn) {
            headerShareBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openWithCurrentState();
            });
        }

        const celShareBtn = document.getElementById('celebrationShareBtn');
        if (celShareBtn) {
            celShareBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openWithCurrentState();
            });
        }
    }

    showToast(message) {
        if (!this.toast) return;
        this.toast.textContent = message;
        this.toast.classList.remove('hidden');
        setTimeout(() => {
            this.toast.classList.add('hidden');
        }, 2500);
    }

    hideModal() {
        if (this.modal) this.modal.classList.add('hidden');
    }

    openWithCurrentState() {
        if (!window.app) return;
        const app = window.app;
        const mode = app.currentMode || 'slots';
        let win = 0;
        let bet = 0;
        let bjData = null;

        if (mode === 'blackjack' && window.blackjackGame) {
            const bj = window.blackjackGame;
            bet = bj.activeBet || bj.currentBet || 50;
            const pScore = bj.calculateScore(bj.playerHand || []);
            const dScore = bj.calculateScore(bj.dealerHand || []);
            const statusText = (bj.dom.statusText && bj.dom.statusText.textContent) ? bj.dom.statusText.textContent : 'РАУНД 21';
            const statusClass = (bj.dom.statusBanner && bj.dom.statusBanner.className) ? bj.dom.statusBanner.className : '';

            if (statusClass.includes('bj')) {
                win = Math.floor(bet * 1.5);
            } else if (statusClass.includes('win')) {
                win = bet;
            } else {
                win = 0;
            }

            bjData = {
                dealerHand: bj.dealerHand || [],
                dealerScore: dScore ? dScore.total : 0,
                playerHand: bj.playerHand || [],
                playerScore: pScore ? pScore.total : 0,
                statusText: statusText,
                statusClass: statusClass
            };
        } else {
            const winText = (app.dom && app.dom.win && app.dom.win.textContent) ? app.dom.win.textContent : '$0.00';
            const cleanWin = winText.split('(')[0].replace(/[^0-9.]/g, '');
            win = parseFloat(cleanWin) || 0;
            bet = (typeof app.getCurrentBet === 'function') ? app.getCurrentBet() : 50;
        }

        try {
            this.generateCard({
                mode: mode,
                grid: app.currentGrid,
                win: win,
                bet: bet,
                balance: app.balance || 0,
                bjData: bjData
            });
        } catch (err) {
            console.error('Error generating share card:', err);
        }

        if (this.modal) this.modal.classList.remove('hidden');
    }

    dataUrlToBlob(dataUrl) {
        try {
            const arr = dataUrl.split(',');
            const mime = arr[0].match(/:(.*?);/)[1];
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new Blob([u8arr], { type: mime });
        } catch (e) {
            console.error('Error converting dataUrl to blob', e);
            return null;
        }
    }

    generateCard({ mode = 'slots', grid, win, bet, balance, bjData }) {
        if (!this.canvas || !this.ctx) return;

        const w = 960;
        const h = 590;
        this.canvas.width = w;
        this.canvas.height = h;
        const ctx = this.ctx;

        const drawRoundRect = (x, y, rw, rh, rad) => {
            if (ctx.roundRect) {
                ctx.roundRect(x, y, rw, rh, rad);
            } else {
                ctx.rect(x, y, rw, rh);
            }
        };

        // User profile data
        const user = (window.authManager && window.authManager.user) ? window.authManager.user : {
            username: 'Игрок',
            avatar: '🕶️'
        };
        const rank = (window.authManager) ? window.authManager.getVipRank(balance) : { title: 'НОВИЧОК', color: '#a0a0c0' };

        // 1. Dark Cyber Gradient Background
        const bgGrad = ctx.createLinearGradient(0, 0, w, h);
        bgGrad.addColorStop(0, '#060513');
        bgGrad.addColorStop(0.45, '#120d2c');
        bgGrad.addColorStop(1, '#050410');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Neon Radial Flares
        const glow1 = ctx.createRadialGradient(160, 100, 10, 160, 100, 260);
        glow1.addColorStop(0, 'rgba(255, 0, 127, 0.28)');
        glow1.addColorStop(1, 'transparent');
        ctx.fillStyle = glow1;
        ctx.fillRect(0, 0, w, h);

        const glow2 = ctx.createRadialGradient(780, 480, 20, 780, 480, 320);
        glow2.addColorStop(0, 'rgba(0, 240, 255, 0.25)');
        glow2.addColorStop(1, 'transparent');
        ctx.fillStyle = glow2;
        ctx.fillRect(0, 0, w, h);

        // Outer Double Glowing Neon Bezel
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 16;
        ctx.strokeRect(14, 14, w - 28, h - 28);
        ctx.strokeStyle = 'rgba(255, 0, 127, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(20, 20, w - 40, h - 40);
        ctx.shadowBlur = 0;

        // 2. Header: Profile Badge (Left) & Brand (Right)
        // Profile Card Pill
        const profX = 35;
        const profY = 28;
        const profW = 270;
        const profH = 58;

        ctx.fillStyle = 'rgba(20, 18, 45, 0.85)';
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        drawRoundRect(profX, profY, profW, profH, 16);
        ctx.fill();
        ctx.stroke();

        // Avatar
        ctx.font = '32px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(user.avatar || '🕶️', profX + 34, profY + profH / 2);

        // Name & Rank
        ctx.textAlign = 'left';
        ctx.font = 'bold 16px "Orbitron", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText((user.username || 'Игрок').slice(0, 14), profX + 70, profY + 24);

        ctx.font = '800 11px "Orbitron", sans-serif';
        ctx.fillStyle = rank.color || '#a0a0c0';
        ctx.fillText(`★ ${rank.title || 'НОВИЧОК'}`, profX + 70, profY + 44);

        // Brand & Mode Subtitle (Right / Center)
        ctx.textAlign = 'right';
        ctx.font = 'bold 13px "Orbitron", sans-serif';
        ctx.fillStyle = '#00f0ff';
        ctx.letterSpacing = '2px';
        ctx.fillText(mode === 'blackjack' ? '🃏 21 ОЧКО / CYBER BLACKJACK' : '🎰 CLASSIC 3-REEL VEGAS SLOTS', w - 40, 48);

        ctx.font = '900 28px "Orbitron", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = 14;
        ctx.fillText('CYBER VEGAS 777', w - 40, 78);
        ctx.shadowBlur = 0;

        // 3. Left Area: Slots Grid OR Blackjack Table Felt
        const leftX = 35;
        const leftY = 104;
        const leftW = 490;
        const leftH = 390;

        if (mode === 'blackjack') {
            // Cyber Table Felt
            const feltGrad = ctx.createRadialGradient(leftX + leftW / 2, leftY + 120, 10, leftX + leftW / 2, leftY + 120, 260);
            feltGrad.addColorStop(0, '#0d2822');
            feltGrad.addColorStop(0.8, '#08171a');
            feltGrad.addColorStop(1, '#040b0e');
            ctx.fillStyle = feltGrad;
            ctx.strokeStyle = 'rgba(0, 255, 136, 0.4)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            drawRoundRect(leftX, leftY, leftW, leftH, 20);
            ctx.fill();
            ctx.stroke();

            // Table banner
            ctx.textAlign = 'center';
            ctx.font = 'bold 12px "Rajdhani", sans-serif';
            ctx.letterSpacing = '2px';
            ctx.fillStyle = '#00ff88';
            ctx.fillText('★ BLACKJACK PAYS 3 TO 2 • DEALER STANDS ON 17 ★', leftX + leftW / 2, leftY + 26);

            // Mini card drawer helper
            const drawMiniCard = (cx, cy, card, isHidden) => {
                const cw = 54;
                const ch = 78;
                ctx.save();
                if (isHidden) {
                    ctx.fillStyle = '#0c1322';
                    ctx.strokeStyle = '#00f0ff';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    drawRoundRect(cx, cy, cw, ch, 6);
                    ctx.fill();
                    ctx.stroke();
                    ctx.fillStyle = '#00f0ff';
                    ctx.font = '22px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('♠', cx + cw / 2, cy + ch / 2);
                } else {
                    ctx.fillStyle = '#ffffff';
                    ctx.strokeStyle = '#d0d4dc';
                    ctx.lineWidth = 1.5;
                    ctx.shadowColor = 'rgba(0,0,0,0.5)';
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    drawRoundRect(cx, cy, cw, ch, 6);
                    ctx.fill();
                    ctx.stroke();

                    const isRed = (card.suit === 'hearts' || card.suit === 'diamonds' || card.color === 'pink');
                    ctx.fillStyle = isRed ? '#e6005c' : '#0077b6';
                    ctx.font = 'bold 15px "Rajdhani", sans-serif';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    ctx.fillText(card.rank, cx + 5, cy + 4);

                    ctx.font = '12px sans-serif';
                    ctx.fillText(card.symbol, cx + 5, cy + 19);

                    ctx.font = '24px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(card.symbol, cx + cw / 2, cy + ch / 2 + 8);
                }
                ctx.restore();
            };

            // Dealer Section
            ctx.textAlign = 'center';
            ctx.font = 'bold 14px "Orbitron", sans-serif';
            ctx.fillStyle = '#a0a0c0';
            ctx.fillText(`ДИЛЕР  [ ${bjData ? bjData.dealerScore : 0} ]`, leftX + leftW / 2, leftY + 54);

            const dCards = (bjData && bjData.dealerHand && bjData.dealerHand.length) ? bjData.dealerHand : [
                { rank: 'K', symbol: '♠', suit: 'spades', color: 'cyan' },
                { rank: '8', symbol: '♦', suit: 'diamonds', color: 'pink' }
            ];
            const dStartX = leftX + (leftW - (dCards.length * 42 + 16)) / 2;
            dCards.forEach((c, i) => {
                drawMiniCard(dStartX + i * 42, leftY + 66, c, c.isHidden);
            });

            // Center Outcome Banner
            const bannerY = leftY + 164;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            drawRoundRect(leftX + 30, bannerY, leftW - 60, 36, 10);
            ctx.fill();
            ctx.stroke();

            ctx.textAlign = 'center';
            ctx.font = 'bold 13px "Orbitron", sans-serif';
            ctx.fillStyle = '#ffd700';
            ctx.textBaseline = 'middle';
            const statusLabel = (bjData && bjData.statusText) ? bjData.statusText : 'РАУНД ЗАВЕРШЕН';
            ctx.fillText(statusLabel.slice(0, 38), leftX + leftW / 2, bannerY + 18);

            // Player Section
            ctx.textAlign = 'center';
            ctx.font = 'bold 14px "Orbitron", sans-serif';
            ctx.fillStyle = '#00f0ff';
            ctx.fillText(`ВАША РУКА  [ ${bjData ? bjData.playerScore : 0} ]`, leftX + leftW / 2, leftY + 228);

            const pCards = (bjData && bjData.playerHand && bjData.playerHand.length) ? bjData.playerHand : [
                { rank: 'A', symbol: '♠', suit: 'spades', color: 'cyan' },
                { rank: 'J', symbol: '♥', suit: 'hearts', color: 'pink' }
            ];
            const pStartX = leftX + (leftW - (pCards.length * 42 + 16)) / 2;
            pCards.forEach((c, i) => {
                drawMiniCard(pStartX + i * 42, leftY + 242, c, false);
            });

        } else {
            // Classic Slots 3x3 Grid
            ctx.fillStyle = '#0c0a22';
            ctx.strokeStyle = '#322564';
            ctx.lineWidth = 3;
            ctx.beginPath();
            drawRoundRect(leftX, leftY, leftW, leftH, 18);
            ctx.fill();
            ctx.stroke();

            const cellW = (leftW - 24) / 3;
            const cellH = (leftH - 24) / 3;

            for (let col = 0; col < 3; col++) {
                for (let row = 0; row < 3; row++) {
                    const cellX = leftX + 12 + col * cellW;
                    const cellY = leftY + 12 + row * cellH;

                    const cellGrad = ctx.createLinearGradient(cellX, cellY, cellX, cellY + cellH);
                    cellGrad.addColorStop(0, '#221950');
                    cellGrad.addColorStop(1, '#110c2a');
                    ctx.fillStyle = cellGrad;
                    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    drawRoundRect(cellX + 3, cellY + 3, cellW - 6, cellH - 6, 12);
                    ctx.fill();
                    ctx.stroke();

                    const sym = (grid && grid[col] && grid[col][row]) ? grid[col][row] : { id: 'seven', icon: '7️⃣', name: 'Семерка' };

                    ctx.save();
                    ctx.font = '54px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(sym.icon, cellX + cellW / 2, cellY + cellH / 2 - 10);
                    ctx.restore();

                    ctx.save();
                    ctx.font = 'bold 12px "Orbitron", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = sym.isWild ? '#ff007f' : sym.isScatter ? '#00f0ff' : '#ffd700';
                    ctx.fillText(sym.name.toUpperCase(), cellX + cellW / 2, cellY + cellH / 2 + 34);
                    ctx.restore();
                }
            }
        }

        // 4. Right Area: Stats & Win Showcase
        const rightX = 550;
        const rightY = 104;
        const rightW = 375;
        const rightH = 390;

        ctx.fillStyle = '#0f0c24';
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        drawRoundRect(rightX, rightY, rightW, rightH, 18);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Big Win Heading
        ctx.textAlign = 'center';
        ctx.font = 'bold 15px "Orbitron", sans-serif';
        ctx.fillStyle = '#00f0ff';
        ctx.letterSpacing = '1.5px';
        ctx.fillText('РЕЗУЛЬТАТ РАУНДА', rightX + rightW / 2, rightY + 44);

        ctx.font = '900 42px "Orbitron", sans-serif';
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffea70';
        ctx.shadowBlur = 18;
        const formattedWin = '$' + Number(win).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        ctx.fillText(formattedWin, rightX + rightW / 2, rightY + 102);
        ctx.shadowBlur = 0;

        // Divider
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rightX + 24, rightY + 136);
        ctx.lineTo(rightX + rightW - 24, rightY + 136);
        ctx.stroke();

        // 2 Cards for Bet & Balance
        const cardW = 154;
        const cardH = 82;
        const cardY = rightY + 154;

        // Bet Card (Left)
        const betCardX = rightX + 24;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        drawRoundRect(betCardX, cardY, cardW, cardH, 12);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.font = 'bold 13px "Rajdhani", sans-serif';
        ctx.letterSpacing = '1.5px';
        ctx.fillStyle = '#8b88ad';
        ctx.fillText('СТАВКА', betCardX + cardW / 2, cardY + 26);

        ctx.font = 'bold 21px "Orbitron", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('$' + Number(bet).toFixed(2), betCardX + cardW / 2, cardY + 58);

        // Balance Card (Right)
        const balCardX = rightX + rightW - cardW - 24;
        ctx.fillStyle = 'rgba(0, 255, 136, 0.05)';
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        drawRoundRect(balCardX, cardY, cardW, cardH, 12);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.font = 'bold 13px "Rajdhani", sans-serif';
        ctx.letterSpacing = '1.5px';
        ctx.fillStyle = '#8b88ad';
        ctx.fillText('БАЛАНС', balCardX + cardW / 2, cardY + 26);

        ctx.font = 'bold 19px "Orbitron", sans-serif';
        ctx.fillStyle = '#00ff88';
        const formattedBal = '$' + Number(balance).toLocaleString('en-US', { minimumFractionDigits: 2 });
        ctx.fillText(formattedBal, balCardX + cardW / 2, cardY + 58);

        // Total Statistics Pill
        const totalWon = (user && user.totalWon) ? user.totalWon : win;
        const totalPillY = rightY + 258;
        ctx.fillStyle = 'rgba(255, 215, 0, 0.08)';
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        drawRoundRect(rightX + 24, totalPillY, rightW - 48, 42, 10);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.font = 'bold 13px "Rajdhani", sans-serif';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(`🏆 ВСЕГО ВЫИГРАНО: $${Number(totalWon).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, rightX + rightW / 2, totalPillY + 26);

        // Date stamp string
        const now = new Date();
        const dateStr = now.toLocaleDateString('ru-RU') + ' ' + now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

        // Streak Card / Pill
        const streak = (window.streakManager) ? window.streakManager.currentStreak : 0;
        const streakMult = (window.streakManager) ? window.streakManager.getCurrentMultiplier() : 1.0;
        const streakPillY = rightY + 306;
        if (streak > 0) {
            ctx.fillStyle = 'rgba(255, 100, 0, 0.16)';
            ctx.strokeStyle = '#ff7700';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            drawRoundRect(rightX + 24, streakPillY, rightW - 48, 30, 8);
            ctx.fill();
            ctx.stroke();

            ctx.textAlign = 'center';
            ctx.font = 'bold 13px "Rajdhani", sans-serif';
            ctx.fillStyle = '#ffcc00';
            ctx.fillText(`🔥 СТРИК ПОБЕД: ${streak} подряд (x${streakMult.toFixed(streakMult % 1 === 0 ? 1 : 2)})`, rightX + rightW / 2, streakPillY + 19);

            // Date stamp below streak pill
            ctx.textAlign = 'center';
            ctx.font = 'bold 11px "Rajdhani", sans-serif';
            ctx.fillStyle = '#7a76a2';
            ctx.fillText(`● ЧЕСТНАЯ ИГРА • ${dateStr}`, rightX + rightW / 2, rightY + 356);
        } else {
            // Date stamp standard
            ctx.textAlign = 'center';
            ctx.font = 'bold 13px "Rajdhani", sans-serif';
            ctx.fillStyle = '#7a76a2';
            ctx.fillText(`● ЧЕСТНАЯ ИГРА • ${dateStr}`, rightX + rightW / 2, rightY + 346);
        }

        // 5. Official Footer Link Watermark
        ctx.textAlign = 'center';
        ctx.font = 'bold 14px "Orbitron", sans-serif';
        ctx.fillStyle = '#00f0ff';
        ctx.fillText('cl0rex1.github.io/kazik  •  CYBER VEGAS 777  •  MEGA UPDATE 2.1', w / 2, 545);

        // Convert to dataUrl and Blob synchronously
        this.currentDataUrl = this.canvas.toDataURL('image/png');
        this.currentBlob = this.dataUrlToBlob(this.currentDataUrl);

        if (this.previewImg) {
            this.previewImg.src = this.currentDataUrl;
        }
    }

    async shareNative() {
        if (!this.currentBlob && this.currentDataUrl) {
            this.currentBlob = this.dataUrlToBlob(this.currentDataUrl);
        }
        if (!this.currentBlob && !this.currentDataUrl) return;

        let file = null;
        if (this.currentBlob) {
            try {
                file = new File([this.currentBlob], 'cyber-vegas-win.png', {
                    type: 'image/png',
                    lastModified: Date.now()
                });
            } catch (e) {
                file = null;
            }
        }

        let canShareFile = false;
        try {
            if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
                canShareFile = true;
            }
        } catch (e) {
            canShareFile = false;
        }

        if (canShareFile && file) {
            try {
                await navigator.share({
                    files: [file]
                });
                this.showToast('Картинка успешно отправлена!');
                return;
            } catch (err) {
                if (err && err.name === 'AbortError') {
                    return; // User intentionally cancelled the native share picker
                }
            }
        }

        // Graceful fallback: download PNG directly to device
        this.downloadPng();
    }

    downloadPng() {
        if (!this.currentDataUrl && !this.currentBlob) return;
        const a = document.createElement('a');
        let objectUrl = null;
        if (this.currentBlob && window.URL && typeof window.URL.createObjectURL === 'function') {
            try {
                objectUrl = URL.createObjectURL(this.currentBlob);
                a.href = objectUrl;
            } catch (e) {
                a.href = this.currentDataUrl;
            }
        } else {
            a.href = this.currentDataUrl;
        }
        a.download = `cyber-vegas-win-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        }, 200);
        this.showToast('Картинка сохранена на устройство!');
    }

    async copyToClipboard() {
        if (!this.currentBlob && this.currentDataUrl) {
            this.currentBlob = this.dataUrlToBlob(this.currentDataUrl);
        }
        if (!this.currentBlob) return;

        try {
            if (navigator.clipboard && window.ClipboardItem) {
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': this.currentBlob })
                ]);
                this.showToast('Скриншот скопирован в буфер обмена!');
            } else {
                this.downloadPng();
            }
        } catch (err) {
            this.downloadPng();
        }
    }
}

// Guaranteed instantiation
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.shareCard = new ShareCardGenerator();
    });
} else {
    window.shareCard = new ShareCardGenerator();
}
