/**
 * Nostalgic audio effects synthesized purely via Web Audio API.
 * Provides analog knob clicks, radio static, and tuning sweeps.
 */

class RetroAudioEffects {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private isStaticPlaying = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Mechanical rotary dial click / detent tick sound
   */
  public playKnobClick(pitchMultiplier = 1) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320 * pitchMultiplier, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.025);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } catch {
      // AudioContext might be blocked until user gesture
    }
  }

  /**
   * Heavy vintage switch toggle click (for Power or Mode buttons)
   */
  public playSwitchClunk() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } catch {
      // ignore
    }
  }

  /**
   * Station lock chime when auto-scan or tuning finds a broadcast
   */
  public playStationLockBeep() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch {
      // ignore
    }
  }

  /**
   * Set analog radio static hiss volume (0.0 to 1.0)
   */
  public setStaticVolume(volume: number) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      if (volume <= 0.01) {
        if (this.noiseGain) {
          this.noiseGain.gain.setValueAtTime(0, ctx.currentTime);
        }
        return;
      }

      if (!this.isStaticPlaying) {
        // Create 2 seconds of pink/white noise buffer
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = data[i];
          data[i] *= 3.5; // boost
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1800;
        filter.Q.value = 1.0;

        const gain = ctx.createGain();
        gain.gain.value = Math.min(volume * 0.12, 0.15);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start();
        this.noiseNode = noise;
        this.noiseGain = gain;
        this.isStaticPlaying = true;
      } else if (this.noiseGain) {
        this.noiseGain.gain.setValueAtTime(
          Math.min(volume * 0.12, 0.15),
          ctx.currentTime
        );
      }
    } catch {
      // ignore
    }
  }

  public stopStatic() {
    try {
      if (this.noiseGain && this.ctx) {
        this.noiseGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
    } catch {
      // ignore
    }
  }
}

export const retroAudio = new RetroAudioEffects();
