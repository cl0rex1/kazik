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

        // Also bind the celebration modal share button
        const celShareBtn = document.getElementById('celebrationShareBtn');
        if (celShareBtn) {
            celShareBtn.addEventListener('click', () => {
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
        }, 2200);
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

    async generateCard({ grid, win, bet, balance }) {
        if (!this.canvas || !this.ctx) return;

        const w = 920;
        const h = 580;
        this.canvas.width = w;
        this.canvas.height = h;
        const ctx = this.ctx;

        // 1. Background Gradient
        const bgGrad = ctx.createLinearGradient(0, 0, w, h);
        bgGrad.addColorStop(0, '#0a0818');
        bgGrad.addColorStop(0.5, '#161132');
        bgGrad.addColorStop(1, '#080612');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Neon Glow Orbs
        const glow1 = ctx.createRadialGradient(160, 100, 20, 160, 100, 250);
        glow1.addColorStop(0, 'rgba(255, 0, 127, 0.25)');
        glow1.addColorStop(1, 'transparent');
        ctx.fillStyle = glow1;
        ctx.fillRect(0, 0, w, h);

        const glow2 = ctx.createRadialGradient(760, 480, 20, 760, 480, 300);
        glow2.addColorStop(0, 'rgba(0, 240, 255, 0.25)');
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
        ctx.font = 'bold 16px "Orbitron", sans-serif';
        ctx.letterSpacing = '4px';
        ctx.fillText('CLASSIC 3-REEL VEGAS SLOTS', w / 2, 50);

        ctx.font = '900 36px "Orbitron", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = 15;
        ctx.fillText('CYBER VEGAS 777', w / 2, 95);
        ctx.shadowBlur = 0;

        // 3. Reels Area (3 Columns x 3 Rows)
        const reelBoxW = 440;
        const reelBoxH = 340;
        const reelBoxX = 50;
        const reelBoxY = 135;

        const drawRoundRect = (x, y, rw, rh, rad) => {
            if (ctx.roundRect) {
                ctx.roundRect(x, y, rw, rh, rad);
            } else {
                ctx.rect(x, y, rw, rh);
            }
        };

        // Reel Bezel
        ctx.fillStyle = '#0e0b20';
        ctx.strokeStyle = '#2f2858';
        ctx.lineWidth = 3;
        ctx.beginPath();
        drawRoundRect(reelBoxX, reelBoxY, reelBoxW, reelBoxH, 16);
        ctx.fill();
        ctx.stroke();

        const cellW = (reelBoxW - 24) / 3;
        const cellH = (reelBoxH - 24) / 3;

        for (let col = 0; col < 3; col++) {
            for (let row = 0; row < 3; row++) {
                const cellX = reelBoxX + 12 + col * cellW;
                const cellY = reelBoxY + 12 + row * cellH;

                ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                drawRoundRect(cellX + 4, cellY + 4, cellW - 8, cellH - 8, 10);
                ctx.fill();
                ctx.stroke();

                // Draw Symbol
                const sym = (grid && grid[col] && grid[col][row]) ? grid[col][row] : { icon: '7️⃣', name: '777' };
                ctx.font = '52px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(sym.icon, cellX + cellW / 2, cellY + cellH / 2);
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
        ctx.shadowBlur = 12;
        ctx.beginPath();
        drawRoundRect(statsX, statsY, statsW, statsH, 16);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Big Win Label & Amount
        ctx.textAlign = 'center';
        ctx.font = 'bold 16px "Orbitron", sans-serif';
        ctx.fillStyle = '#00f0ff';
        ctx.fillText('ВЫИГРЫШ В РАУНДЕ', statsX + statsW / 2, statsY + 50);

        ctx.font = '900 44px "Orbitron", sans-serif';
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffea70';
        ctx.shadowBlur = 18;
        const formattedWin = '$' + Number(win).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        ctx.fillText(formattedWin, statsX + statsW / 2, statsY + 105);
        ctx.shadowBlur = 0;

        // Divider
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(statsX + 30, statsY + 140);
        ctx.lineTo(statsX + statsW - 30, statsY + 140);
        ctx.stroke();

        // Bet & Balance
        ctx.textAlign = 'left';
        ctx.font = '16px "Rajdhani", sans-serif';
        ctx.fillStyle = '#8b88ad';
        ctx.fillText('РАЗМЕР СТАВКИ:', statsX + 35, statsY + 185);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px "Orbitron", sans-serif';
        ctx.fillText('$' + Number(bet).toFixed(2), statsX + statsW - 35, statsY + 185);

        ctx.textAlign = 'left';
        ctx.font = '16px "Rajdhani", sans-serif';
        ctx.fillStyle = '#8b88ad';
        ctx.fillText('ТЕКУЩИЙ БАЛАНС:', statsX + 35, statsY + 230);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 18px "Orbitron", sans-serif';
        ctx.fillText('$' + Number(balance).toLocaleString('en-US', { minimumFractionDigits: 2 }), statsX + statsW - 35, statsY + 230);

        // Date stamp
        const now = new Date();
        const dateStr = now.toLocaleDateString('ru-RU') + ' ' + now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        ctx.textAlign = 'center';
        ctx.font = '13px "Rajdhani", sans-serif';
        ctx.fillStyle = '#656285';
        ctx.fillText(`ПРОВЕРЕНО • ${dateStr}`, statsX + statsW / 2, statsY + 295);

        // 5. Footer Watermark
        ctx.font = '13px "Orbitron", sans-serif';
        ctx.fillStyle = '#7a76a0';
        ctx.fillText('github.com/kazik • CYBER VEGAS 777', w / 2, 530);

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
            // Fallback for browsers without image sharing: download file
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

window.shareCard = new ShareCardGenerator();
