/**
 * Client-Side Auth & Profile System (localStorage)
 * Zero backend required, 100% persistent in browser storage.
 */

class AuthManager {
    constructor() {
        this.STORAGE_KEY = 'casino_user_profile';
        this.user = this.loadUser();
        this.avatars = ['🕶️', '🤖', '👑', '🐱', '🐺', '🦊', '🐉', '🎲'];
        this.selectedAvatar = this.avatars[0];

        this.modal = document.getElementById('authModal');
        this.profileModal = document.getElementById('profileModal');
        this.profileBtn = document.getElementById('profileBadgeBtn');
        this.usernameInput = document.getElementById('regUsername');
        this.submitRegBtn = document.getElementById('submitRegBtn');
        this.avatarListEl = document.getElementById('avatarPickerList');

        this.init();
    }

    loadUser() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Error loading user profile:', e);
            return null;
        }
    }

    saveUser() {
        if (!this.user) return;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.user));
        this.renderBadge();
    }

    isLoggedIn() {
        return !!(this.user && this.user.username);
    }

    init() {
        this.renderAvatarPicker();
        this.bindEvents();

        if (!this.isLoggedIn()) {
            this.showRegistrationModal();
        } else {
            this.renderBadge();
        }
    }

    bindEvents() {
        if (this.submitRegBtn) {
            this.submitRegBtn.addEventListener('click', () => this.handleRegister());
        }

        if (this.usernameInput) {
            this.usernameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.handleRegister();
            });
        }

        if (this.profileBtn) {
            this.profileBtn.addEventListener('click', () => this.openProfileModal());
        }

        const closeProfileBtn = document.getElementById('closeProfileBtn');
        if (closeProfileBtn) {
            closeProfileBtn.addEventListener('click', () => this.closeProfileModal());
        }

        if (this.profileModal) {
            this.profileModal.addEventListener('click', (e) => {
                if (e.target === this.profileModal) this.closeProfileModal();
            });
        }
    }

    renderAvatarPicker() {
        if (!this.avatarListEl) return;
        this.avatarListEl.innerHTML = '';
        this.avatars.forEach((avatar, index) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `avatar-option ${avatar === this.selectedAvatar ? 'selected' : ''}`;
            btn.textContent = avatar;
            btn.addEventListener('click', () => {
                this.selectedAvatar = avatar;
                document.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
            this.avatarListEl.appendChild(btn);
        });
    }

    showRegistrationModal() {
        if (this.modal) {
            this.modal.classList.remove('hidden');
        }
    }

    hideRegistrationModal() {
        if (this.modal) {
            this.modal.classList.add('hidden');
        }
    }

    handleRegister() {
        const username = (this.usernameInput ? this.usernameInput.value.trim() : '') || `Игрок${Math.floor(100 + Math.random() * 900)}`;

        this.user = {
            username: username.slice(0, 16),
            avatar: this.selectedAvatar,
            createdAt: Date.now(),
            slotsSpins: 0,
            bjHands: 0,
            totalWon: 0,
            biggestWin: 0
        };

        this.saveUser();
        this.hideRegistrationModal();

        // Give $5,000 starting balance if balance is not set
        if (!localStorage.getItem('casino_balance') || parseFloat(localStorage.getItem('casino_balance')) <= 0) {
            localStorage.setItem('casino_balance', '5000.00');
            if (window.app) {
                window.app.balance = 5000;
                window.app.updateDisplays();
            }
        }

        if (window.casinoAudio) {
            window.casinoAudio.playAtmCash();
        }
        if (window.particleEngine) {
            window.particleEngine.burstFireworks(60);
        }
    }

    getVipRank(balance = 0) {
        if (balance >= 200000) return { title: 'ЛЕГЕНДА', color: '#ffd700' };
        if (balance >= 50000) return { title: 'VIP', color: '#ff007f' };
        if (balance >= 15000) return { title: 'ХАЙРОЛЛЕР', color: '#00f0ff' };
        return { title: 'НОВИЧОК', color: '#a0a0c0' };
    }

    renderBadge() {
        if (!this.user) return;
        const currentBal = window.app ? window.app.balance : (parseFloat(localStorage.getItem('casino_balance')) || 5000);
        const rank = this.getVipRank(currentBal);

        const avatarSpan = document.getElementById('profileAvatar');
        const nameSpan = document.getElementById('profileName');
        const rankSpan = document.getElementById('profileRank');

        if (avatarSpan) avatarSpan.textContent = this.user.avatar;
        if (nameSpan) nameSpan.textContent = this.user.username;
        if (rankSpan) {
            rankSpan.textContent = rank.title;
            rankSpan.style.color = rank.color;
        }
    }

    trackSpin(winAmount) {
        if (!this.user) return;
        this.user.slotsSpins = (this.user.slotsSpins || 0) + 1;
        if (winAmount > 0) {
            this.user.totalWon = (this.user.totalWon || 0) + winAmount;
            if (winAmount > (this.user.biggestWin || 0)) {
                this.user.biggestWin = winAmount;
            }
        }
        this.saveUser();
    }

    trackBlackjack(winAmount) {
        if (!this.user) return;
        this.user.bjHands = (this.user.bjHands || 0) + 1;
        if (winAmount > 0) {
            this.user.totalWon = (this.user.totalWon || 0) + winAmount;
            if (winAmount > (this.user.biggestWin || 0)) {
                this.user.biggestWin = winAmount;
            }
        }
        this.saveUser();
    }

    openProfileModal() {
        if (!this.user || !this.profileModal) return;
        const currentBal = window.app ? window.app.balance : (parseFloat(localStorage.getItem('casino_balance')) || 5000);
        const rank = this.getVipRank(currentBal);

        document.getElementById('modalProfileAvatar').textContent = this.user.avatar;
        document.getElementById('modalProfileName').textContent = this.user.username;
        document.getElementById('modalProfileRank').textContent = rank.title;
        document.getElementById('modalProfileRank').style.color = rank.color;

        document.getElementById('statTotalSpins').textContent = this.user.slotsSpins || 0;
        document.getElementById('statTotalBJ').textContent = this.user.bjHands || 0;
        document.getElementById('statTotalWon').textContent = '$' + Number(this.user.totalWon || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
        document.getElementById('statBiggestWin').textContent = '$' + Number(this.user.biggestWin || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

        this.profileModal.classList.remove('hidden');
    }

    closeProfileModal() {
        if (this.profileModal) {
            this.profileModal.classList.add('hidden');
        }
    }
}

// Immediate instantiation
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.authManager = new AuthManager();
    });
} else {
    window.authManager = new AuthManager();
}
