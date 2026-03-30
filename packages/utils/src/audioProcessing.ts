/**
 * Audio Processing Utilities
 * Noise cancellation, echo cancellation, and audio enhancement
 */

/**
 * Audio constraints for optimal voice quality
 */
export const audioConstraints: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 48000,
  sampleSize: 16,
  channelCount: 1,
};

/**
 * Enhanced audio constraints for music/high-quality audio
 */
export const musicAudioConstraints: MediaTrackConstraints = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
  sampleRate: 48000,
  sampleSize: 16,
  channelCount: 2,
};

/**
 * Audio Processing Options
 */
export interface AudioProcessingOptions {
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
  voiceIsolation?: boolean;
  noiseReductionLevel?: 'low' | 'medium' | 'high';
}

/**
 * Audio Processor using Web Audio API
 */
export class AudioProcessor {
  private audioContext?: AudioContext;
  private mediaStreamSource?: MediaStreamAudioSourceNode;
  private destination?: MediaStreamAudioDestinationNode;
  private analyser?: AnalyserNode;
  private gainNode?: GainNode;
  private biquadFilter?: BiquadFilterNode;
  private processorNode?: ScriptProcessorNode;
  private inputStream?: MediaStream;
  private outputProcessor?: (buffer: Float32Array) => Float32Array;

  /**
   * Initialize audio processing chain
   */
  async initialize(
    stream: MediaStream,
    options: AudioProcessingOptions = {}
  ): Promise<MediaStream> {
    this.audioContext = new AudioContext({
      sampleRate: 48000,
      latencyHint: 'interactive',
    });

    this.inputStream = stream;
    this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
    this.destination = this.audioContext.createMediaStreamDestination();

    // Create audio processing chain
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;

    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 1.0;

    // Apply audio enhancements
    await this.applyProcessing(options);

    // Connect nodes
    this.mediaStreamSource.connect(this.analyser);
    this.mediaStreamSource.connect(this.gainNode);
    this.gainNode.connect(this.destination);

    return this.destination.stream;
  }

  /**
   * Apply audio processing based on options
   */
  private async applyProcessing(options: AudioProcessingOptions): Promise<void> {
    const {
      echoCancellation = true,
      noiseSuppression = true,
      autoGainControl = true,
      voiceIsolation = true,
      noiseReductionLevel = 'medium',
    } = options;

    // Create noise reduction filter
    if (noiseSuppression) {
      this.applyNoiseReduction(noiseReductionLevel);
    }

    // Create high-pass filter to remove low-frequency noise
    this.applyHighPassFilter(80);

    // Apply automatic gain control
    if (autoGainControl) {
      this.applyAutoGainControl();
    }
  }

  /**
   * Apply noise reduction using biquad filter
   */
  private applyNoiseReduction(level: 'low' | 'medium' | 'high'): void {
    if (!this.audioContext || !this.mediaStreamSource) return;

    this.biquadFilter = this.audioContext.createBiquadFilter();
    this.biquadFilter.type = 'highpass';
    
    // Adjust cutoff based on level
    const cutoffFreq = level === 'low' ? 100 : level === 'medium' ? 150 : 200;
    this.biquadFilter.frequency.value = cutoffFreq;
    this.biquadFilter.Q.value = 0.7;

    this.mediaStreamSource.connect(this.biquadFilter);
  }

  /**
   * Apply high-pass filter
   */
  private applyHighPassFilter(cutoffFreq: number): void {
    if (!this.audioContext || !this.mediaStreamSource) return;

    const highPass = this.audioContext.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.value = cutoffFreq;
    highPass.Q.value = 0.707;

    this.mediaStreamSource.connect(highPass);
  }

  /**
   * Apply automatic gain control
   */
  private applyAutoGainControl(): void {
    if (!this.audioContext || !this.gainNode) return;

    // Create compressor for dynamic range control
    const compressor = this.audioContext.createDynamicsCompressor();
    compressor.threshold.value = -50;
    compressor.knee.value = 40;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    this.gainNode.connect(compressor);
    compressor.connect(this.destination!);
  }

  /**
   * Get audio level (0-1)
   */
  getAudioLevel(): number {
    if (!this.analyser) return 0;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    const sum = dataArray.reduce((a, b) => a + b, 0);
    const average = sum / dataArray.length;

    return average / 255;
  }

  /**
   * Get frequency data for visualization
   */
  getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    return dataArray;
  }

  /**
   * Set volume/gain
   */
  setVolume(gain: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, gain));
    }
  }

  /**
   * Mute audio
   */
  mute(): void {
    if (this.gainNode) {
      this.gainNode.gain.value = 0;
    }
  }

  /**
   * Unmute audio
   */
  unmute(): void {
    if (this.gainNode) {
      this.gainNode.gain.value = 1;
    }
  }

  /**
   * Detect if user is speaking
   */
  isSpeaking(threshold: number = 0.1): boolean {
    return this.getAudioLevel() > threshold;
  }

  /**
   * Apply custom audio processing
   */
  setOutputProcessor(processor: (buffer: Float32Array) => Float32Array): void {
    this.outputProcessor = processor;
  }

  /**
   * Get processed output stream
   */
  getOutputStream(): MediaStream | undefined {
    return this.destination?.stream;
  }

  /**
   * Cleanup audio processing
   */
  async cleanup(): Promise<void> {
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = undefined;
    }

    if (this.inputStream) {
      this.inputStream.getTracks().forEach((track) => track.stop());
      this.inputStream = undefined;
    }

    this.mediaStreamSource = undefined;
    this.destination = undefined;
    this.analyser = undefined;
    this.gainNode = undefined;
    this.biquadFilter = undefined;
  }
}

/**
 * Noise cancellation using AI (requires TensorFlow.js or similar)
 * This is a placeholder for integration with RNNoise or similar
 */
export class AINoiseCancellation {
  private model?: any;
  private isInitialized: boolean = false;

  /**
   * Initialize AI noise cancellation model
   */
  async initialize(): Promise<void> {
    // Placeholder for RNNoise or similar integration
    // In production, load TensorFlow.js model or WebAssembly module
    console.log('AI Noise Cancellation initialized (placeholder)');
    this.isInitialized = true;
  }

  /**
   * Process audio buffer through AI model
   */
  process(buffer: Float32Array): Float32Array {
    if (!this.isInitialized) {
      return buffer;
    }

    // Placeholder: In production, run AI inference here
    // For now, return unprocessed buffer
    return buffer;
  }

  /**
   * Check if AI noise cancellation is available
   */
  isAvailable(): boolean {
    return this.isInitialized;
  }
}

export default AudioProcessor;
