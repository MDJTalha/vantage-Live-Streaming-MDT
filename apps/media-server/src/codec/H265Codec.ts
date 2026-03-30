/**
 * VANTAGE H.265/HEVC Codec Support
 * Next-generation video codec for 4K support
 * Phase 2: 4K Support
 */

import { Worker, Router, Transport, Producer, RtpCapabilities } from 'mediasoup';

export interface H265Config {
  profile: 'main' | 'main10' | 'rext';
  level: string;
  tier: 'main' | 'high';
  bitrate: number;
  maxBitrate: number;
  resolution: {
    width: number;
    height: number;
  };
  framerate: number;
}

export class H265Codec {
  private worker: Worker | null = null;
  private h265Supported: boolean = false;

  /**
   * Initialize H.265 codec support
   */
  async initialize(worker: Worker): Promise<void> {
    this.worker = worker;
    
    // Check if H.265 is supported
    const codecs = worker.appData_supportedCodecs || [];
    this.h265Supported = codecs.some((c: any) => 
      c.mimeType === 'video/H265' || c.mimeType === 'video/HEVC'
    );
    
    if (!this.h265Supported) {
      console.warn('H.265 not natively supported, loading plugin...');
      await this.loadH265Plugin(worker);
    }
    
    console.log('✓ H.265/HEVC codec initialized');
  }

  /**
   * Load H.265 plugin if not natively supported
   */
  private async loadH265Plugin(worker: Worker): Promise<void> {
    try {
      // Load OpenH265 or similar plugin
      // This is a placeholder - actual implementation depends on mediasoup version
      await worker.loadPlugin('mediasoup-h265-plugin', {
        codec: 'H265',
        version: '1.0.0',
      });
      
      this.h265Supported = true;
      console.log('✓ H.265 plugin loaded successfully');
    } catch (error) {
      console.error('Failed to load H.265 plugin:', error);
      throw new Error('H.265 codec not available');
    }
  }

  /**
   * Create 4K producer with H.265
   */
  async create4KProducer(
    transport: Transport,
    config: Partial<H265Config> = {}
  ): Promise<Producer> {
    const defaultConfig: H265Config = {
      profile: 'main',
      level: '5.1',
      tier: 'main',
      bitrate: 8000000,    // 8 Mbps for 4K
      maxBitrate: 12000000, // 12 Mbps max
      resolution: {
        width: 3840,
        height: 2160,
      },
      framerate: 30,
    };

    const finalConfig = { ...defaultConfig, ...config };

    const producer = await transport.produce({
      kind: 'video',
      rtpParameters: {
        codecs: [{
          mimeType: 'video/H265',
          payloadType: 100,
          clockRate: 90000,
          parameters: {
            'profile-level-id': this.getProfileLevelId(finalConfig.profile, finalConfig.level),
            'tier-level-flag': finalConfig.tier === 'high' ? 1 : 0,
          },
          rtcpFeedback: [
            { type: 'nack' },
            { type: 'nack', parameter: 'pli' },
            { type: 'ccm', parameter: 'fir' },
            { type: 'goog-remb' },
            { type: 'transport-cc' },
          ],
        }],
      },
      codecOptions: {
        'x-google-start-bitrate': finalConfig.bitrate,
        'x-google-max-bitrate': finalConfig.maxBitrate,
        'x-google-min-bitrate': finalConfig.bitrate / 4,
        'x-google-frame-rate': finalConfig.framerate,
        'x-google-resolution': `${finalConfig.resolution.width}x${finalConfig.resolution.height}`,
        
        // H.265 specific optimizations
        'x-google-max-quantization': 32,
        'x-google-min-quantization': 12,
        'x-google-rate-control-algorithm': 'VBR',
      },
    });

    console.log(`✓ Created 4K H.265 producer at ${finalConfig.resolution.width}x${finalConfig.resolution.height}`);
    
    return producer;
  }

  /**
   * Configure 4K simulcast layers
   */
  async configure4KSimulcast(producer: Producer): Promise<void> {
    // 6-layer simulcast for 4K
    const layers = [
      { name: 'thumbnail', resolution: '180p', bitrate: 100000 },
      { name: 'low', resolution: '360p', bitrate: 300000 },
      { name: 'medium', resolution: '540p', bitrate: 800000 },
      { name: 'high', resolution: '720p', bitrate: 1500000 },
      { name: 'full_hd', resolution: '1080p', bitrate: 4000000 },
      { name: 'ultra_hd', resolution: '2160p', bitrate: 8000000 },
    ];

    await producer.setMaxSpatialLayer(5); // 0-5 layers

    for (let i = 0; i < layers.length; i++) {
      await producer.setBitrate(layers[i].bitrate, i);
    }

    console.log('✓ Configured 6-layer 4K simulcast');
  }

  /**
   * Get H.265 RTP capabilities
   */
  getH265Capabilities(): RtpCapabilities {
    return {
      codecs: [
        {
          mimeType: 'video/H265',
          preferredPayloadType: 100,
          clockRate: 90000,
          parameters: {
            'profile-level-id': '150010', // Main profile, level 5.1
            'tier-level-flag': 0,
          },
          rtcpFeedback: [
            { type: 'nack' },
            { type: 'nack', parameter: 'pli' },
            { type: 'ccm', parameter: 'fir' },
            { type: 'goog-remb' },
            { type: 'transport-cc' },
          ],
        },
      ],
      headerExtensions: [
        {
          uri: 'http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time',
          preferredId: 3,
        },
        {
          uri: 'http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01',
          preferredId: 5,
        },
      ],
    };
  }

  /**
   * Get profile-level-id for H.265
   */
  private getProfileLevelId(profile: string, level: string): string {
    const profileIds: Record<string, string> = {
      'main': '1',
      'main10': '2',
      'rext': '3',
    };

    const levelIds: Record<string, string> = {
      '4.0': '10',
      '4.1': '11',
      '5.0': '12',
      '5.1': '13',
      '6.0': '14',
      '6.1': '15',
    };

    const profileId = profileIds[profile] || '1';
    const levelId = levelIds[level] || '12';

    return `${profileId}00${levelId}`;
  }

  /**
   * Configure for 4K@60fps
   */
  async configure4K60fps(producer: Producer): Promise<void> {
    await producer.setCodecOptions({
      'x-google-start-bitrate': 12000,
      'x-google-max-bitrate': 18000,
      'x-google-min-bitrate': 6000,
      'x-google-frame-rate': 60,
      'x-google-resolution': '3840x2160',
      'x-google-max-quantization': 30,
      'x-google-min-quantization': 14,
    });

    console.log('✓ Configured H.265 for 4K@60fps');
  }

  /**
   * Get bandwidth comparison
   */
  getBandwidthComparison(resolution: '1080p' | '4K' | '8K'): {
    h264: number;
    h265: number;
    savings: number;
    percentage: number;
  } {
    const bitrates = {
      '1080p': { h264: 2500000, h265: 1500000 },
      '4K': { h264: 15000000, h265: 8000000 },
      '8K': { h264: 50000000, h265: 25000000 },
    };

    const { h264, h265 } = bitrates[resolution];
    const savings = h264 - h265;
    const percentage = (savings / h264) * 100;

    return {
      h264,
      h265,
      savings,
      percentage,
    };
  }

  /**
   * Check if H.265 is supported
   */
  isSupported(): boolean {
    return this.h265Supported;
  }
}

export default H265Codec;
