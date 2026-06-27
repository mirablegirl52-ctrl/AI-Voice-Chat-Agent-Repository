/**
 * Voice Activity Detection (VAD) — lightweight client-side VAD using the Web Audio API.
 *
 * Detects when the user starts and stops speaking by monitoring mic input levels.
 * Uses an adaptive noise threshold that learns the background noise floor.
 *
 * Lifecycle:
 *   const vad = new VoiceActivityDetector()
 *   await vad.start(onSpeechStart, onSpeechEnd)
 *   vad.stop()
 */

export interface VADOptions {
  /** Minimum volume (0-255) to count as speech (adaptive, but this is the floor) */
  minVolumeFloor?: number
  /** Number of consecutive speech frames needed to trigger speech start */
  speechStartFrames?: number
  /** Silence duration (ms) after speech to trigger speech end */
  silenceDuration?: number
  /** How often to sample (ms) */
  sampleInterval?: number
  /** Enable adaptive threshold */
  adaptive?: boolean
}

const DEFAULTS: Required<VADOptions> = {
  minVolumeFloor: 18,
  speechStartFrames: 3,
  silenceDuration: 1400,
  sampleInterval: 50,
  adaptive: true,
}

export class VoiceActivityDetector {
  private analyser: AnalyserNode | null = null
  private stream: MediaStream | null = null
  private ctx: AudioContext | null = null
  private intervalId: number | null = null
  private running = false

  // Adaptive threshold
  private noiseFloor = 10
  private noiseHistory: number[] = []
  private readonly noiseHistoryMax = 50

  // State tracking
  private speechFrameCount = 0
  private silenceFrameCount = 0
  private isSpeaking = false
  private lastSpeechTime = 0

  // Callbacks
  private onSpeechStartCb: (() => void) | null = null
  private onSpeechEndCb: (() => void) | null = null
  private onVolumeCb: ((volume: number) => void) | null = null

  private options: Required<VADOptions>

  constructor(options?: VADOptions) {
    this.options = { ...DEFAULTS, ...options }
  }

  /**
   * Start VAD monitoring. Requires microphone permission.
   */
  async start(
    onSpeechStart: () => void,
    onSpeechEnd: () => void,
    onVolume?: (volume: number) => void
  ): Promise<boolean> {
    if (this.running) return true

    this.onSpeechStartCb = onSpeechStart
    this.onSpeechEndCb = onSpeechEnd
    this.onVolumeCb = onVolume || null

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          noiseSuppression: true,
          echoCancellation: true,
          autoGainControl: true,
        },
      })
      this.ctx = new AudioContext()
      const source = this.ctx.createMediaStreamSource(this.stream)
      this.analyser = this.ctx.createAnalyser()
      this.analyser.fftSize = 512
      this.analyser.smoothingTimeConstant = 0.6
      source.connect(this.analyser)
    } catch {
      return false
    }

    this.running = true
    this.resetState()

    const buffer = new Uint8Array(this.analyser.frequencyBinCount)

    this.intervalId = window.setInterval(() => {
      if (!this.analyser || !this.running) return

      this.analyser.getByteFrequencyData(buffer)

      // Calculate RMS-like volume from low-mid frequencies (human voice range)
      // Focus on 85-255 Hz range (typical speech fundamental frequency)
      const sampleRate = this.ctx?.sampleRate || 44100
      const binSize = sampleRate / this.analyser.fftSize
      const lowBin = Math.floor(80 / binSize)
      const highBin = Math.ceil(4000 / binSize)

      let sum = 0
      let count = 0
      for (let i = lowBin; i < Math.min(highBin, buffer.length); i++) {
        sum += buffer[i] * buffer[i]
        count++
      }
      const rms = Math.sqrt(sum / Math.max(count, 1))
      this.onVolumeCb?.(rms)

      // Adaptive threshold
      if (this.options.adaptive) {
        this.updateNoiseFloor(rms)
      }
      const threshold = this.getCurrentThreshold()

      if (rms > threshold) {
        this.speechFrameCount++
        this.silenceFrameCount = 0
        this.lastSpeechTime = Date.now()

        if (!this.isSpeaking && this.speechFrameCount >= this.options.speechStartFrames) {
          this.isSpeaking = true
          this.onSpeechStartCb?.()
        }
      } else {
        this.silenceFrameCount++
        if (this.isSpeaking) {
          const silenceTime = Date.now() - this.lastSpeechTime
          if (silenceTime > this.options.silenceDuration) {
            this.isSpeaking = false
            this.speechFrameCount = 0
            this.onSpeechEndCb?.()
          }
        }
      }
    }, this.options.sampleInterval)

    return true
  }

  /**
   * Get the current adaptive threshold.
   */
  private getCurrentThreshold(): number {
    const adaptiveThreshold = this.noiseFloor + 12
    return Math.max(this.options.minVolumeFloor, adaptiveThreshold)
  }

  /**
   * Update the noise floor estimate based on recent history.
   * Only updates when not speaking (background noise estimation).
   */
  private updateNoiseFloor(volume: number): void {
    if (this.isSpeaking) return // Don't update during speech

    this.noiseHistory.push(volume)
    if (this.noiseHistory.length > this.noiseHistoryMax) {
      this.noiseHistory.shift()
    }

    // Use the median of recent noise samples
    if (this.noiseHistory.length >= 10) {
      const sorted = [...this.noiseHistory].sort((a, b) => a - b)
      const median = sorted[Math.floor(sorted.length / 2)]
      // Smoothly adjust noise floor
      this.noiseFloor = this.noiseFloor * 0.8 + median * 0.2
    }
  }

  /**
   * Temporarily disable speech detection (e.g., during TTS playback).
   * The detector keeps running but won't fire callbacks.
   */
  pause(): void {
    this.isSpeaking = false
    this.speechFrameCount = 0
    this.silenceFrameCount = 0
  }

  /**
   * Resume speech detection after a pause.
   */
  resume(): void {
    this.resetState()
  }

  get isActive(): boolean {
    return this.isSpeaking
  }

  get isRunning(): boolean {
    return this.running
  }

  private resetState(): void {
    this.speechFrameCount = 0
    this.silenceFrameCount = 0
    this.isSpeaking = false
    this.lastSpeechTime = 0
    this.noiseHistory = []
  }

  /**
   * Stop VAD and release all audio resources.
   */
  stop(): void {
    this.running = false
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop())
      this.stream = null
    }
    if (this.ctx) {
      this.ctx.close()
      this.ctx = null
    }
    this.analyser = null
    this.resetState()
    this.onSpeechStartCb = null
    this.onSpeechEndCb = null
    this.onVolumeCb = null
  }
}
