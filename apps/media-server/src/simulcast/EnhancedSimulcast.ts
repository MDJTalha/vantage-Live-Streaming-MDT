/**
 * VANTAGE Enhanced Simulcast Implementation
 * 5-layer simulcast with adaptive bitrate switching
 * Phase 1: HD Optimization
 */

import { Producer, Consumer } from 'mediasoup';

export interface SimulcastLayer {
  name: string;
  resolution: string;
  width: number;
  height: number;
  bitrate: number;
  framerate: number;
}

export interface NetworkStats {
  availableBandwidth: number;
  packetLoss: number;
  rtt: number;
  jitter: number;
}

export class EnhancedSimulcast {
  // 5-layer simulcast configuration
  private layers: SimulcastLayer[] = [
    {
      name: 'thumbnail',
      resolution: '180p',
      width: 320,
      height: 180,
      bitrate: 100000,    // 100 Kbps
      framerate: 15,
    },
    {
      name: 'low',
      resolution: '360p',
      width: 640,
      height: 360,
      bitrate: 300000,    // 300 Kbps
      framerate: 24,
    },
    {
      name: 'medium',
      resolution: '540p',
      width: 960,
      height: 540,
      bitrate: 800000,    // 800 Kbps
      framerate: 30,
    },
    {
      name: 'high',
      resolution: '720p',
      width: 1280,
      height: 720,
      bitrate: 1500000,   // 1.5 Mbps
      framerate: 30,
    },
    {
      name: 'full_hd',
      resolution: '1080p',
      width: 1920,
      height: 1080,
      bitrate: 3000000,   // 3 Mbps
      framerate: 30,
    },
  ];

  /**
   * Configure producer with 5-layer simulcast
   */
  async configureSimulcast(producer: Producer): Promise<void> {
    try {
      // Enable all 5 spatial layers
      await producer.setMaxSpatialLayer(4); // 0-4 layers
      
      // Configure bitrate for each layer
      for (let i = 0; i < this.layers.length; i++) {
        await producer.setBitrate(this.layers[i].bitrate, i);
      }
      
      // Enable temporal scalability (2x frame rate layers)
      await producer.setMaxTemporalLayer(1); // 15fps + 30fps
      
      console.log(`✓ Configured 5-layer simulcast for producer ${producer.id}`);
    } catch (error) {
      console.error('Failed to configure simulcast:', error);
      throw error;
    }
  }

  /**
   * Intelligently select optimal layer based on network conditions
   */
  async selectOptimalLayer(
    consumer: Consumer,
    networkStats: NetworkStats
  ): Promise<number> {
    const { availableBandwidth, packetLoss, rtt } = networkStats;
    
    // Calculate optimal layer based on multiple factors
    let optimalLayer = 0;
    let targetBitrate = availableBandwidth * 0.8; // Use 80% of available bandwidth
    
    // Adjust for packet loss
    if (packetLoss > 0.05) {
      targetBitrate *= 0.5; // Reduce by 50% if packet loss > 5%
    } else if (packetLoss > 0.02) {
      targetBitrate *= 0.75; // Reduce by 25% if packet loss > 2%
    }
    
    // Adjust for high RTT
    if (rtt > 200) {
      targetBitrate *= 0.7; // Reduce by 30% if RTT > 200ms
    }
    
    // Find best layer for target bitrate
    for (let i = this.layers.length - 1; i >= 0; i--) {
      if (targetBitrate >= this.layers[i].bitrate) {
        optimalLayer = i;
        break;
      }
    }
    
    // Get current layer
    const currentLayer = await consumer.getCurrentSpatialLayer();
    
    // Smooth transitions (don't switch too frequently)
    // Only allow gradual changes (max 1 layer at a time)
    if (Math.abs(optimalLayer - currentLayer) > 1) {
      const direction = optimalLayer > currentLayer ? 1 : -1;
      const targetLayer = currentLayer + direction;
      
      await consumer.setMaxSpatialLayer(targetLayer);
      console.log(`Gradual layer switch: ${currentLayer} → ${targetLayer}`);
      
      return targetLayer;
    } else {
      if (optimalLayer !== currentLayer) {
        await consumer.setMaxSpatialLayer(optimalLayer);
        console.log(`Layer switch: ${currentLayer} → ${optimalLayer} (${this.layers[optimalLayer].resolution})`);
      }
      
      return optimalLayer;
    }
  }

  /**
   * Get layer information
   */
  getLayerInfo(layerIndex: number): SimulcastLayer | null {
    if (layerIndex < 0 || layerIndex >= this.layers.length) {
      return null;
    }
    return this.layers[layerIndex];
  }

  /**
   * Get all available layers
   */
  getAllLayers(): SimulcastLayer[] {
    return [...this.layers];
  }

  /**
   * Calculate bandwidth savings with simulcast
   */
  calculateBandwidthSavings(activeLayer: number): {
    original: number;
    optimized: number;
    savings: number;
    percentage: number;
  } {
    const originalBitrate = this.layers[this.layers.length - 1].bitrate; // Full HD
    const optimizedBitrate = this.layers[activeLayer].bitrate;
    const savings = originalBitrate - optimizedBitrate;
    const percentage = (savings / originalBitrate) * 100;
    
    return {
      original: originalBitrate,
      optimized: optimizedBitrate,
      savings,
      percentage,
    };
  }

  /**
   * Configure for specific use cases
   */
  async configureForUseCase(
    producer: Producer,
    useCase: 'conference' | 'webinar' | 'screen-share' | 'mobile'
  ): Promise<void> {
    switch (useCase) {
      case 'conference':
        // Balanced quality and bandwidth
        await this.configureSimulcast(producer);
        break;
        
      case 'webinar':
        // Higher quality for active speakers
        await producer.setMaxSpatialLayer(4);
        await producer.setBitrate(4000000, 4); // 4 Mbps for 1080p
        break;
        
      case 'screen-share':
        // Prioritize resolution over frame rate
        await producer.setMaxSpatialLayer(4);
        await producer.setBitrate(2000000, 4); // 2 Mbps for 1080p
        await producer.setMaxTemporalLayer(0); // 15fps is enough for screens
        break;
        
      case 'mobile':
        // Optimize for mobile networks
        await producer.setMaxSpatialLayer(2); // Max 540p
        await producer.setBitrate(600000, 2); // 600 Kbps
        break;
    }
    
    console.log(`✓ Configured simulcast for ${useCase}`);
  }
}

export default EnhancedSimulcast;
