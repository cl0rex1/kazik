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
        const lastWin = parseFloat(app.dom.win.textContent.replace(/[^0-9.]/g, '')) || 0;
        this.generateCard({
            grid: app.currentGrid,
            win: lastWin,
            bet: app.getCurrentBet(),
            balance: app.balance
        });
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

    generateCard({ grid, win, bet, balance }) {
        if (!this.canvas || !this.ctx) return;

        const w = 920;
        const h = 580;
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

        // 1. Dark Neon Background Gradient
        const bgGrad = ctx.createLinearGradient(0, 0, w, h);
        bgGrad.addColorStop(0, '#090716');
        bgGrad.addColorStop(0.5, '#161036');
        bgGrad.addColorStop(1, '#060512');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Neon Radial Flares
        const glow1 = ctx.createRadialGradient(180, 120, 20, 180, 120, 260);
        glow1.addColorStop(0, 'rgba(255, 0, 127, 0.32)');
        glow1.addColorStop(1, 'transparent');
        ctx.fillStyle = glow1;
        ctx.fillRect(0, 0, w, h);

        const glow2 = ctx.createRadialGradient(740, 460, 20, 740, 460, 320);
        glow2.addColorStop(0, 'rgba(0, 240, 255, 0.3)');
        glow2.addColorStop(1, 'transparent');
        ctx.fillStyle = glow2;
        ctx.fillRect(0, 0, w, h);

        // Outer Glowing Neon Machine Border
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 18;
        ctx.strokeRect(14, 14, w - 28, h - 28);
        ctx.shadowBlur = 0;

        // 2. Header Title
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffb700';
        ctx.font = 'bold 15px "Orbitron", sans-serif';
        ctx.letterSpacing = '4px';
        ctx.fillText('CLASSIC 3-REEL VEGAS SLOTS', w / 2, 52);

        ctx.font = '900 36px "Orbitron", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = 18;
        ctx.fillText('CYBER VEGAS 777', w / 2, 98);
        ctx.shadowBlur = 0;

        // 3. Reels Area (3 Columns x 3 Rows)
        const reelBoxW = 440;
        const reelBoxH = 340;
        const reelBoxX = 50;
        const reelBoxY = 135;

        // Reel Bezel Housing
        ctx.fillStyle = '#0c0a1f';
        ctx.strokeStyle = '#2f2858';
        ctx.lineWidth = 3;
        ctx.beginPath();
        drawRoundRect(reelBoxX, reelBoxY, reelBoxW, reelBoxH, 18);
        ctx.fill();
        ctx.stroke();

        const cellW = (reelBoxW - 24) / 3;
        const cellH = (reelBoxH - 24) / 3;

        for (let col = 0; col < 3; col++) {
            for (let row = 0; row < 3; row++) {
                const cellX = reelBoxX + 12 + col * cellW;
                const cellY = reelBoxY + 12 + row * cellH;

                // Glowing tile card for each symbol
                const cellGrad = ctx.createLinearGradient(cellX, cellY, cellX, cellY + cellH);
                cellGrad.addColorStop(0, '#221a4f');
                cellGrad.addColorStop(1, '#110d29');
                ctx.fillStyle = cellGrad;
                ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                drawRoundRect(cellX + 3, cellY + 3, cellW - 6, cellH - 6, 12);
                ctx.fill();
                ctx.stroke();

                // Draw Symbol
                const sym = (grid && grid[col] && grid[col][row]) ? grid[col][row] : { id: 'seven', icon: '7️⃣', name: 'Семерка' };
                
                // Draw Emoji Icon
                ctx.save();
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = 1.0;
                ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
                ctx.shadowBlur = 12;
                ctx.font = '52px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(sym.icon, cellX + cellW / 2, cellY + cellH / 2 - 10);
                ctx.restore();

                // Draw Symbol Name in neon text
                ctx.save();
                ctx.font = 'bold 12px "Orbitron", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = sym.isWild ? '#ff007f' : sym.isScatter ? '#00f0ff' : '#ffd700';
                ctx.fillText(sym.name.toUpperCase(), cellX + cellW / 2, cellY + cellH / 2 + 30);
                ctx.restore();
            }
        }

        // 4. Stats & Win Panel (Right side)
        const statsX = 520;
        const statsY = 135;
        const statsW = 350;
        const statsH = 340;

        ctx.fillStyle = '#0f0c24';
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        drawRoundRect(statsX, statsY, statsW, statsH, 18);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Big Win Label & Amount
        ctx.textAlign = 'center';
        ctx.font = 'bold 15px "Orbitron", sans-serif';
        ctx.fillStyle = '#00f0ff';
        ctx.letterSpacing = '1px';
        ctx.fillText('ВЫИГРЫШ В РАУНДЕ', statsX + statsW / 2, statsY + 44);

        ctx.font = '900 40px "Orbitron", sans-serif';
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffea70';
        ctx.shadowBlur = 20;
        const formattedWin = '$' + Number(win).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        ctx.fillText(formattedWin, statsX + statsW / 2, statsY + 98);
        ctx.shadowBlur = 0;

        // Divider
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(statsX + 20, statsY + 130);
        ctx.lineTo(statsX + statsW - 20, statsY + 130);
        ctx.stroke();

        // 2 Dedicated Cards for Bet & Balance (Eliminates any horizontal collision!)
        const cardW = 145;
        const cardH = 80;
        const cardY = statsY + 148;

        // Bet Card (Left)
        const betCardX = statsX + 20;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
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

        ctx.font = 'bold 20px "Orbitron", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('$' + Number(bet).toFixed(2), betCardX + cardW / 2, cardY + 56);

        // Balance Card (Right)
        const balCardX = statsX + statsW - cardW - 20;
        ctx.fillStyle = 'rgba(0, 255, 136, 0.04)';
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.35)';
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
        ctx.fillText(formattedBal, balCardX + cardW / 2, cardY + 56);

        // Date stamp badge
        const now = new Date();
        const dateStr = now.toLocaleDateString('ru-RU') + ' ' + now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        ctx.textAlign = 'center';
        ctx.font = 'bold 14px "Rajdhani", sans-serif';
        ctx.letterSpacing = '1px';
        ctx.fillStyle = '#7a76a2';
        ctx.fillText(`● ПРОВЕРЕНО • ${dateStr}`, statsX + statsW / 2, statsY + 288);

        // 5. Official Requested Footer Watermark Link: cl0rex1.github.io/kazik
        ctx.font = 'bold 14px "Orbitron", sans-serif';
        ctx.letterSpacing = '2px';
        ctx.fillStyle = '#00f0ff';
        ctx.fillText('cl0rex1.github.io/kazik  •  CYBER VEGAS 777', w / 2, 535);

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
        if (!this.currentBlob) return;

        const file = new File([this.currentBlob], 'cyber-vegas-win.png', {
            type: 'image/png',
            lastModified: Date.now()
        });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                // CRITICAL FIX: DO NOT pass 'text'!
                // In Telegram & WhatsApp, passing 'text' overrides the image and sends only text!
                // Passing strictly 'files: [file]' forces the app to open the photo attachment sender!
                await navigator.share({
                    files: [file]
                });
                this.showToast('Картинка успешно отправлена!');
            } catch (err) {
                if (err.name !== 'AbortError') {
                    this.downloadPng();
                }
            }
        } else {
            this.downloadPng();
        }
    }

    downloadPng() {
        if (!this.currentDataUrl) return;
        const a = document.createElement('a');
        a.href = this.currentDataUrl;
        a.download = `cyber-vegas-win-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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
