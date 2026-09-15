/**
 * Web Audio API Procedural Sound Synthesizer
 * 100% standalone, zero external audio assets required.
 */
class CasinoAudioEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = localStorage.getItem('casino_muted') === 'true';
        this.masterGain = null;
        this.anticipationOsc = null;
        this.anticipationGain = null;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
                this.masterGain.connect(this.ctx.destination);
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('casino_muted', this.isMuted);
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
        }
        return this.isMuted;
    }

    playButtonClick() {
        this.init();
        if (!this.ctx || this.isMuted) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = this.ctx.currentTime;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(300, t + 0.04);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.04);
    }

    playSpinStart() {
        this.init();
        if (!this.ctx || this.isMuted) return;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(450, t + 0.25);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.3);
    }

    playReelTick() {
        this.init();
        if (!this.ctx || this.isMuted) return;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(480, t);
        osc.frequency.exponentialRampToValueAtTime(120, t + 0.02);

        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.02);
    }

    playReelStop(reelIndex = 0) {
        this.init();
        if (!this.ctx || this.isMuted) return;

        const t = this.ctx.currentTime;

        // Mechanical punch impact (sine pitch-drop)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const baseFreq = 160 + reelIndex * 24;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, t);
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.12);

        // Click transient noise
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.03);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 1200 + reelIndex * 150;

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.2, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(t);
    }

    playScatterHit(scatterCount = 1) {
        this.init();
        if (!this.ctx || this.isMuted) return;

        const t = this.ctx.currentTime;
        const notes = [587.33, 739.99, 880, 1174.66, 1479.98]; // D5, F#5, A5, D6, F#6
        const freq = notes[Math.min(scatterCount - 1, notes.length - 1)];

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.35);

        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.38);
    }

    startAnticipation() {
        this.init();
        if (!this.ctx || this.isMuted || this.anticipationOsc) return;

        const t = this.ctx.currentTime;
        this.anticipationOsc = this.ctx.createOscillator();
        this.anticipationGain = this.ctx.createGain();

        this.anticipationOsc.type = 'sawtooth';
        this.anticipationOsc.frequency.setValueAtTime(260, t);
        this.anticipationOsc.frequency.exponentialRampToValueAtTime(800, t + 3.0);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, t);
        filter.frequency.linearRampToValueAtTime(2000, t + 3.0);

        this.anticipationGain.gain.setValueAtTime(0.01, t);
        this.anticipationGain.gain.linearRampToValueAtTime(0.35, t + 2.0);

        this.anticipationOsc.connect(filter);
        filter.connect(this.anticipationGain);
        this.anticipationGain.connect(this.masterGain);

        this.anticipationOsc.start(t);
    }

    stopAnticipation() {
        if (this.anticipationOsc && this.ctx) {
            const t = this.ctx.currentTime;
            this.anticipationGain.gain.cancelScheduledValues(t);
            this.anticipationGain.gain.setValueAtTime(this.anticipationGain.gain.value, t);
            this.anticipationGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
            this.anticipationOsc.stop(t + 0.1);
            this.anticipationOsc = null;
            this.anticipationGain = null;
        }
    }

    playCoinTally() {
        this.init();
        if (!this.ctx || this.isMuted) return;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const baseFrequencies = [1200, 1400, 1600, 1800, 2000];
        const freq = baseFrequencies[Math.floor(Math.random() * baseFrequencies.length)];

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.3, t + 0.05);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.05);
    }

    playWinFanfare(tier = 'nice') {
        this.init();
        if (!this.ctx || this.isMuted) return;

        const t = this.ctx.currentTime;

        if (tier === 'nice') {
            const chord = [523.25, 659.25, 783.99]; // C5, E5, G5
            chord.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const startT = t + idx * 0.08;

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, startT);

                gain.gain.setValueAtTime(0.25, startT);
                gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.4);

                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start(startT);
                osc.stop(startT + 0.4);
            });
        } else if (tier === 'big') {
            const melody = [523.25, 659.25, 783.99, 1046.50, 1318.51];
            melody.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const startT = t + idx * 0.09;

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, startT);

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(1500, startT);

                gain.gain.setValueAtTime(0.25, startT);
                gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.5);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.masterGain);
                osc.start(startT);
                osc.stop(startT + 0.5);
            });
        } else if (tier === 'mega') {
            this.playBassDrop(t);
            const chords = [
                [523.25, 659.25, 783.99],
                [587.33, 739.99, 880.00],
                [659.25, 830.61, 987.77],
                [783.99, 987.77, 1174.66],
                [1046.50, 1318.51, 1567.98]
            ];
            chords.forEach((chord, chordIdx) => {
                const chordT = t + chordIdx * 0.16;
                chord.forEach(freq => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(freq, chordT);

                    const filter = this.ctx.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(2400, chordT);

                    gain.gain.setValueAtTime(0.2, chordT);
                    gain.gain.exponentialRampToValueAtTime(0.001, chordT + 0.6);

                    osc.connect(filter);
                    filter.connect(gain);
                    gain.connect(this.masterGain);
                    osc.start(chordT);
                    osc.stop(chordT + 0.6);
                });
            });
        } else if (tier === 'godlike') {
            this.playBassDrop(t);
            this.playJackpotSiren(t);
            const arpeggio = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
            arpeggio.forEach((freq, idx) => {
                const noteT = t + idx * 0.07;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, noteT);

                gain.gain.setValueAtTime(0.3, noteT);
                gain.gain.exponentialRampToValueAtTime(0.001, noteT + 0.7);

                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start(noteT);
                osc.stop(noteT + 0.7);
            });
        }
    }

    playBassDrop(startTime) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, startTime);
        osc.frequency.exponentialRampToValueAtTime(32, startTime + 0.8);

        gain.gain.setValueAtTime(0.8, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.9);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(startTime);
        osc.stop(startTime + 0.9);
    }

    playJackpotSiren(startTime) {
        const sirenOsc = this.ctx.createOscillator();
        const sirenGain = this.ctx.createGain();

        sirenOsc.type = 'sawtooth';
        sirenOsc.frequency.setValueAtTime(440, startTime);

        // Siren LFO
        for (let i = 0; i < 6; i++) {
            const cycleStart = startTime + i * 0.3;
            sirenOsc.frequency.linearRampToValueAtTime(880, cycleStart + 0.15);
            sirenOsc.frequency.linearRampToValueAtTime(440, cycleStart + 0.3);
        }

        sirenGain.gain.setValueAtTime(0.2, startTime);
        sirenGain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.9);

        sirenOsc.connect(sirenGain);
        sirenGain.connect(this.masterGain);
        sirenOsc.start(startTime);
        sirenOsc.stop(startTime + 1.9);
    }

    playAtmCash() {
        this.init();
        if (!this.ctx || this.isMuted) return;

        const t = this.ctx.currentTime;

        // Cash register mechanical click
        const clickOsc = this.ctx.createOscillator();
        const clickGain = this.ctx.createGain();
        clickOsc.type = 'square';
        clickOsc.frequency.setValueAtTime(600, t);
        clickOsc.frequency.exponentialRampToValueAtTime(100, t + 0.05);
        clickGain.gain.setValueAtTime(0.4, t);
        clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        clickOsc.connect(clickGain);
        clickGain.connect(this.masterGain);
        clickOsc.start(t);
        clickOsc.stop(t + 0.05);

        // "Cha-ching" Bell double ring
        [1567.98, 2093.00].forEach((freq, idx) => {
            const bellOsc = this.ctx.createOscillator();
            const bellGain = this.ctx.createGain();
            const bellT = t + 0.07 + idx * 0.09;

            bellOsc.type = 'sine';
            bellOsc.frequency.setValueAtTime(freq, bellT);

            bellGain.gain.setValueAtTime(0.4, bellT);
            bellGain.gain.exponentialRampToValueAtTime(0.001, bellT + 0.5);

            bellOsc.connect(bellGain);
            bellGain.connect(this.masterGain);
            bellOsc.start(bellT);
            bellOsc.stop(bellT + 0.5);
        });
    }

    playFreeSpinsTrigger() {
        this.init();
        if (!this.ctx || this.isMuted) return;

        const t = this.ctx.currentTime;
        this.playBassDrop(t);

        const riserOsc = this.ctx.createOscillator();
        const riserGain = this.ctx.createGain();

        riserOsc.type = 'sawtooth';
        riserOsc.frequency.setValueAtTime(150, t);
        riserOsc.frequency.exponentialRampToValueAtTime(1200, t + 1.2);

        riserGain.gain.setValueAtTime(0.35, t);
        riserGain.gain.exponentialRampToValueAtTime(0.001, t + 1.3);

        riserOsc.connect(riserGain);
        riserGain.connect(this.masterGain);
        riserOsc.start(t);
        riserOsc.stop(t + 1.3);
    }

    playCardDeal() {
        this.init();
        if (!this.ctx || this.isMuted) return;

        const t = this.ctx.currentTime;
        // White noise transient for card swoosh
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.08);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1800, t);
        filter.frequency.exponentialRampToValueAtTime(800, t + 0.08);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start(t);
    }

    playChipClick() {
        this.init();
        if (!this.ctx || this.isMuted) return;

        const t = this.ctx.currentTime;
        [1800, 2400].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const startT = t + idx * 0.03;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, startT);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.5, startT + 0.04);

            gain.gain.setValueAtTime(0.25, startT);
            gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.04);

            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(startT);
            osc.stop(startT + 0.04);
        });
    }
}

window.casinoAudio = new CasinoAudioEngine();
