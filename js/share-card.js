/**
 * Share Card Generator
 * Renders a stylized cyber-vegas win card using HTML5 Canvas,
 * with support for Web Share API (mobile/desktop), PNG download, and Clipboard copy.
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

        // 1. Background Gradient
        const bgGrad = ctx.createLinearGradient(0, 0, w, h);
        bgGrad.addColorStop(0, '#0a0818');
        bgGrad.addColorStop(0.5, '#151032');
        bgGrad.addColorStop(1, '#070512');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Neon Glow Orbs
        const glow1 = ctx.createRadialGradient(180, 120, 20, 180, 120, 260);
        glow1.addColorStop(0, 'rgba(255, 0, 127, 0.3)');
        glow1.addColorStop(1, 'transparent');
        ctx.fillStyle = glow1;
        ctx.fillRect(0, 0, w, h);

        const glow2 = ctx.createRadialGradient(740, 460, 20, 740, 460, 320);
        glow2.addColorStop(0, 'rgba(0, 240, 255, 0.28)');
        glow2.addColorStop(1, 'transparent');
        ctx.fillStyle = glow2;
        ctx.fillRect(0, 0, w, h);

        // Outer Neon Border
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

        // Reel Bezel
        ctx.fillStyle = '#0e0b20';
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

                // Cell box
                ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                drawRoundRect(cellX + 4, cellY + 4, cellW - 8, cellH - 8, 12);
                ctx.fill();
                ctx.stroke();

                // Draw Symbol with full opacity and bright emoji font
                const sym = (grid && grid[col] && grid[col][row]) ? grid[col][row] : { icon: '7️⃣', name: '777' };
                
                ctx.save();
                // CRITICAL FIX: Reset fillStyle to #fff so emoji alpha isn't masked to 5%!
                ctx.fillStyle = '#ffffff';
                ctx.globalAlpha = 1.0;
                ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
                ctx.shadowBlur = 12;
                ctx.font = '56px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(sym.icon, cellX + cellW / 2, cellY + cellH / 2);
                ctx.restore();
            }
        }

        // 4. Stats & Win Panel (Right side)
        const statsX = 520;
        const statsY = 135;
        const statsW = 350;
        const statsH = 340;

        ctx.fillStyle = '#100c26';
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
        ctx.fillText('ВЫИГРЫШ В РАУНДЕ', statsX + statsW / 2, statsY + 48);

        ctx.font = '900 42px "Orbitron", sans-serif';
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffea70';
        ctx.shadowBlur = 20;
        const formattedWin = '$' + Number(win).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        ctx.fillText(formattedWin, statsX + statsW / 2, statsY + 102);
        ctx.shadowBlur = 0;

        // Horizontal Divider
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(statsX + 25, statsY + 138);
        ctx.lineTo(statsX + statsW - 25, statsY + 138);
        ctx.stroke();

        // 2-Column Stats Layout (Zero Horizontal Text Collisions!)
        const col1Center = statsX + statsW * 0.28;
        const col2Center = statsX + statsW * 0.72;

        // Column 1: СТАВКА
        ctx.textAlign = 'center';
        ctx.font = 'bold 14px "Rajdhani", sans-serif';
        ctx.letterSpacing = '1.5px';
        ctx.fillStyle = '#8b88ad';
        ctx.fillText('СТАВКА', col1Center, statsY + 175);

        ctx.font = 'bold 22px "Orbitron", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('$' + Number(bet).toFixed(2), col1Center, statsY + 208);

        // Vertical divider between columns
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(statsX + statsW / 2, statsY + 160);
        ctx.lineTo(statsX + statsW / 2, statsY + 225);
        ctx.stroke();

        // Column 2: БАЛАНС
        ctx.textAlign = 'center';
        ctx.font = 'bold 14px "Rajdhani", sans-serif';
        ctx.letterSpacing = '1.5px';
        ctx.fillStyle = '#8b88ad';
        ctx.fillText('БАЛАНС', col2Center, statsY + 175);

        ctx.font = 'bold 22px "Orbitron", sans-serif';
        ctx.fillStyle = '#00ff88';
        ctx.fillText('$' + Number(balance).toLocaleString('en-US', { minimumFractionDigits: 2 }), col2Center, statsY + 208);

        // Second Horizontal Divider
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(statsX + 25, statsY + 248);
        ctx.lineTo(statsX + statsW - 25, statsY + 248);
        ctx.stroke();

        // Date stamp
        const now = new Date();
        const dateStr = now.toLocaleDateString('ru-RU') + ' ' + now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        ctx.textAlign = 'center';
        ctx.font = 'bold 14px "Rajdhani", sans-serif';
        ctx.letterSpacing = '1px';
        ctx.fillStyle = '#7875a0';
        ctx.fillText(`ПРОВЕРЕНО • ${dateStr}`, statsX + statsW / 2, statsY + 292);

        // 5. Footer Watermark
        ctx.font = '13px "Orbitron", sans-serif';
        ctx.fillStyle = '#7a76a0';
        ctx.fillText('CYBER VEGAS 777 • GITHUB PAGES', w / 2, 532);

        // Convert to dataUrl and Blob
        this.currentDataUrl = this.canvas.toDataURL('image/png');
        if (this.previewImg) {
            this.previewImg.src = this.currentDataUrl;
        }

        this.canvas.toBlob((blob) => {
            this.currentBlob = blob;
        }, 'image/png');
    }

    async shareNative() {
        if (!this.currentBlob) return;

        const file = new File([this.currentBlob], 'cyber-vegas-win.png', { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    title: 'Мой занос в Cyber Vegas 777!',
                    text: 'Смотри, какой куш я только что сорвал в Cyber Vegas 777! 🎰🔥',
                    files: [file]
                });
                this.showToast('Успешно отправлено!');
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

// Guaranteed instantiation whether loaded early or late
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.shareCard = new ShareCardGenerator();
    });
} else {
    window.shareCard = new ShareCardGenerator();
}
