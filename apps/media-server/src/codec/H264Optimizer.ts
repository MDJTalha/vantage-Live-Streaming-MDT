/**
 * VANTAGE H.264 Optimization
 * Advanced x264 encoder configuration for better quality at lower bitrates
 * Phase 1: HD Optimization
 */

import { Producer, RtpCapabilities } from 'mediasoup';

export interface H264Profile {
  name: string;
  profileLevelId: string;
  maxBitrate: number;
  recommendedFor: string;
}

export class H264Optimizer {
  // H.264 profiles
  private profiles: H264Profile[] = [
    {
      name: 'Baseline',
      profileLevelId: '42001f',
      maxBitrate: 1000000,
      recommendedFor: 'Mobile, low-power devices',
    },
    {
      name: 'Main',
      profileLevelId: '4d001f',
      maxBitrate: 3000000,
      recommendedFor: 'Standard HD conferencing',
    },
    {
      name: 'High',
      profileLevelId: '64001f',
      maxBitrate: 6000000,
      recommendedFor: 'Full HD, high quality',
    },
  ];

  /**
   * Configure producer with optimized H.264 settings
   */
  async configureProducer(producer: Producer): Promise<void> {
    try {
      // Configure x264 encoder with optimal settings
      await producer.setCodecOptions({
        // Bitrate control
        'x-google-start-bitrate': 2500,
        'x-google-max-bitrate': 4000,
        'x-google-min-bitrate': 500,
        
        // Quality optimization
        'x-google-hairplugging': true, // Reduces blocking artifacts
        'x-google-max-quantization': 28,
        'x-google-min-quantization': 10,
        
        // Frame rate and resolution
        'x-google-fps-allocation': 'desired',
        'x-google-resolution-allocation': 'desired',
        
        // Rate control
        'x-google-rate-control-algorithm': 'VBR', // Variable bitrate
        
        // Advanced encoding
        'x-google-content-type': 'regular', // or 'screen' for screen sharing
        'x-google-noise-sensitivity': 1,
        
        // Keyframe settings
        'x-google-max-keyframe-interval': 3000, // 3 seconds at 30fps
        'x-google-min-keyframe-interval': 900,  // 0.9 seconds
      });
      
      // Enable advanced rate control
      await producer.enableAdvancedRateControl(true);
      
      console.log(`✓ Configured optimized H.264 for producer ${producer.id}`);
    } catch (error) {
      console.error('Failed to configure H.264 optimization:', error);
      throw error;
    }
  }

  /**
   * Get optimal H.264 RTP capabilities
   */
  getOptimalH264Capabilities(): RtpCapabilities {
    return {
      codecs: [
        {
          mimeType: 'video/H264',
          preferredPayloadType: 102,
          clockRate: 90000,
          parameters: {
            'packetization-mode': 1,
            'profile-level-id': '64001f', // High profile
            'level-asymmetry-allowed': 1,
          },
          rtcpFeedback: [
            { type: 'nack' },
            { type: 'nack', parameter: 'pli' }, // Picture Loss Indication
            { type: 'ccm', parameter: 'fir' },  // Full Intra Request
            { type: 'goog-remb' },              // Receiver Estimated Max Bitrate
            { type: 'transport-cc' },           // Transport-wide congestion control
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
   * Configure for specific content types
   */
  async configureForContentType(
    producer: Producer,
    contentType: 'person' | 'screen' | 'whiteboard' | 'video'
  ): Promise<void> {
    const settings: any = {};
    
    switch (contentType) {
      case 'person':
        // Optimize for human faces
        settings['x-google-content-type'] = 'regular';
        settings['x-google-noise-sensitivity'] = 1;
        settings['x-google-motion-threshold'] = 50;
        break;
        
      case 'screen':
        // Optimize for screen sharing (text, sharp edges)
        settings['x-google-content-type'] = 'screen';
        settings['x-google-max-quantization'] = 20; // Higher quality
        settings['x-google-min-quantization'] = 8;
        settings['x-google-motion-threshold'] = 10; // More sensitive to motion
        break;
        
      case 'whiteboard':
        // Optimize for whiteboard (static content with occasional changes)
        settings['x-google-content-type'] = 'screen';
        settings['x-google-max-quantization'] = 18;
        settings['x-google-keyframe-frequency'] = 10; // More frequent keyframes
        break;
        
      case 'video':
        // Optimize for pre-recorded video playback
        settings['x-google-content-type'] = 'regular';
        settings['x-google-motion-threshold'] = 80;
        settings['x-google-hairplugging'] = true;
        break;
    }
    
    await producer.setCodecOptions(settings);
    console.log(`✓ Configured H.264 for ${contentType} content`);
  }

  /**
   * Apply low-latency settings
   */
  async configureForLowLatency(producer: Producer): Promise<void> {
    await producer.setCodecOptions({
      'x-google-start-bitrate': 2000,
      'x-google-max-bitrate': 3000,
      'x-google-min-bitrate': 800,
      'x-google-max-quantization': 26,
      'x-google-min-quantization': 12,
      'x-google-max-keyframe-interval': 1500, // 1.5 seconds
      'x-google-rate-control-algorithm': 'CBR', // Constant bitrate for stability
    });
    
    console.log('✓ Configured H.264 for low latency');
  }

  /**
   * Apply high-quality settings
   */
  async configureForHighQuality(producer: Producer): Promise<void> {
    await producer.setCodecOptions({
      'x-google-start-bitrate': 4000,
      'x-google-max-bitrate': 6000,
      'x-google-min-bitrate': 2000,
      'x-google-max-quantization': 30,
      'x-google-min-quantization': 8,
      'x-google-hairplugging': true,
      'x-google-noise-sensitivity': 0, // Minimal noise reduction for quality
      'x-google-rate-control-algorithm': 'VBR',
    });
    
    console.log('✓ Configured H.264 for high quality');
  }

  /**
   * Get recommended profile for resolution
   */
  getRecommendedProfile(resolution: string): H264Profile {
    const height = parseInt(resolution.replace('p', ''));
    
    if (height <= 360) {
      return this.profiles[0]; // Baseline
    } else if (height <= 720) {
      return this.profiles[1]; // Main
    } else {
      return this.profiles[2]; // High
    }
  }

  /**
   * Calculate optimal bitrate for resolution
   */
  calculateOptimalBitrate(
    resolution: string,
    framerate: number,
    contentType: 'person' | 'screen'
  ): number {
    const height = parseInt(resolution.replace('p', ''));
    
    // Base bitrate per pixel
    const baseBitratePerPixel = contentType === 'screen' ? 0.15 : 0.1;
    
    // Calculate pixels per frame
    const width = Math.round(height * 1.778); // 16:9 aspect ratio
    const pixelsPerFrame = width * height;
    
    // Calculate base bitrate
    let bitrate = pixelsPerFrame * baseBitratePerPixel * (framerate / 30);
    
    // Adjust for content type
    if (contentType === 'screen') {
      bitrate *= 1.5; // Screens need more bitrate for text clarity
    }
    
    // Round to nearest 100 Kbps
    return Math.round(bitrate / 100000) * 100000;
  }

  /**
   * Get quality metrics
   */
  async getQualityMetrics(producer: Producer): Promise<{
    currentBitrate: number;
    targetBitrate: number;
    quantization: number;
    frameRate: number;
    resolution: string;
  }> {
    const stats = await producer.getStats();
    
    // Extract relevant metrics from stats
    const videoStats = stats.find(s => s.type === 'video');
    
    return {
      currentBitrate: videoStats?.bitrate || 0,
      targetBitrate: videoStats?.targetBitrate || 0,
      quantization: videoStats?.quantization || 0,
      frameRate: videoStats?.frameRate || 30,
      resolution: videoStats?.resolution || '1080p',
    };
  }
}

export default H264Optimizer;
