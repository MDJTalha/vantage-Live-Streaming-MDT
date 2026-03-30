import { Producer, Consumer, Router, WebRtcTransport } from 'mediasoup';

/**
 * Simulcast Configuration
 * Multiple quality layers for adaptive streaming
 */
export interface SimulcastLayer {
  rid: string;
  scaleResolutionDownBy: number;
  maxBitrate: number;
  maxFramerate?: number;
}

export const simulcastConfig = {
  // VP8/VP9 simulcast layers
  layers: [
    { rid: 'h', scaleResolutionDownBy: 1, maxBitrate: 1500000, maxFramerate: 30 },
    { rid: 'm', scaleResolutionDownBy: 2, maxBitrate: 500000, maxFramerate: 20 },
    { rid: 'l', scaleResolutionDownBy: 4, maxBitrate: 150000, maxFramerate: 10 },
  ] as SimulcastLayer[],

  // SVC scalability modes for VP9
  svcModes: ['L3T3_KEY', 'L2T2', 'L2T1', 'L1T1'],
};

/**
 * Simulcast Handler
 * Manages multiple quality layers for each producer
 */
export class SimulcastHandler {
  private producerLayers: Map<string, Map<string, Producer>> = new Map();
  private consumerLayers: Map<string, Map<string, Consumer>> = new Map();
  private layerBitrates: Map<string, number> = new Map();

  /**
   * Add simulcast producer layers
   */
  async addSimulcastProducer(
    transport: WebRtcTransport,
    kind: 'video',
    rtpParameters: any,
    encodings?: SimulcastLayer[]
  ): Promise<{ producers: Map<string, Producer> }> {
    const producers = new Map<string, Producer>();
    const layers = encodings || simulcastConfig.layers;

    // Create producer for each layer
    for (const layer of layers) {
      const producer = await transport.produce({
        kind,
        rtpParameters,
        encodings: [
          {
            rid: layer.rid,
            scaleResolutionDownBy: layer.scaleResolutionDownBy,
            maxBitrate: layer.maxBitrate,
            maxFramerate: layer.maxFramerate,
          },
        ],
        appData: {
          layer: layer.rid,
          scaleResolutionDownBy: layer.scaleResolutionDownBy,
          maxBitrate: layer.maxBitrate,
        },
      });

      producers.set(layer.rid, producer);

      // Monitor producer
      producer.on('trackended', () => {
        console.log(`Simulcast producer ${layer.rid} ended`);
        producers.delete(layer.rid);
      });
    }

    // Store producers
    const mainProducer = producers.get('h')!;
    this.producerLayers.set(mainProducer.id, producers);

    return { producers };
  }

  /**
   * Create consumer for specific layer
   */
  async createLayerConsumer(
    transport: WebRtcTransport,
    producerId: string,
    layer: 'h' | 'm' | 'l',
    rtpCapabilities: any
  ): Promise<Consumer | null> {
    const producers = this.producerLayers.get(producerId);
    
    if (!producers) {
      console.error(`No simulcast layers found for producer ${producerId}`);
      return null;
    }

    const producer = producers.get(layer);
    
    if (!producer) {
      console.error(`Layer ${layer} not found for producer ${producerId}`);
      return null;
    }

    const consumer = await transport.consume({
      producerId: producer.id,
      rtpCapabilities,
      appData: {
        layer,
        producerId,
      },
    });

    // Store consumer
    if (!this.consumerLayers.has(producerId)) {
      this.consumerLayers.set(producerId, new Map());
    }
    this.consumerLayers.get(producerId)!.set(layer, consumer);

    return consumer;
  }

  /**
   * Switch consumer to different layer based on bandwidth
   */
  async switchLayer(
    consumerId: string,
    producerId: string,
    targetLayer: 'h' | 'm' | 'l'
  ): Promise<boolean> {
    const consumerMap = this.consumerLayers.get(producerId);
    
    if (!consumerMap) {
      return false;
    }

    const targetConsumer = consumerMap.get(targetLayer);
    
    if (!targetConsumer) {
      return false;
    }

    // Resume target layer
    await targetConsumer.resume();

    // Pause other layers
    for (const [layer, consumer] of consumerMap) {
      if (layer !== targetLayer) {
        await consumer.pause();
      }
    }

    console.log(`Switched consumer ${consumerId} to layer ${targetLayer}`);
    return true;
  }

  /**
   * Get optimal layer based on available bandwidth
   */
  getOptimalLayer(availableBitrate: number): 'h' | 'm' | 'l' {
    if (availableBitrate >= 1000000) {
      return 'h'; // High quality (>1 Mbps)
    } else if (availableBitrate >= 400000) {
      return 'm'; // Medium quality (>400 Kbps)
    } else {
      return 'l'; // Low quality
    }
  }

  /**
   * Adaptive bitrate control
   */
  async adaptToBandwidth(
    consumerId: string,
    producerId: string,
    availableBitrate: number
  ): Promise<void> {
    const optimalLayer = this.getOptimalLayer(availableBitrate);
    await this.switchLayer(consumerId, producerId, optimalLayer);
  }

  /**
   * Get all available layers for producer
   */
  getAvailableLayers(producerId: string): string[] {
    const producers = this.producerLayers.get(producerId);
    
    if (!producers) {
      return [];
    }

    return Array.from(producers.keys());
  }

  /**
   * Get layer stats
   */
  getLayerStats(producerId: string): any[] {
    const producers = this.producerLayers.get(producerId);
    
    if (!producers) {
      return [];
    }

    return Array.from(producers.values()).map((producer) => ({
      layer: producer.appData.layer,
      bitrate: producer.appData.maxBitrate,
      scaleResolutionDownBy: producer.appData.scaleResolutionDownBy,
      score: producer.score,
    }));
  }

  /**
   * Cleanup producer layers
   */
  async cleanupProducer(producerId: string): Promise<void> {
    const producers = this.producerLayers.get(producerId);
    
    if (producers) {
      for (const producer of producers.values()) {
        producer.close();
      }
      this.producerLayers.delete(producerId);
    }

    // Cleanup consumers
    const consumers = this.consumerLayers.get(producerId);
    
    if (consumers) {
      for (const consumer of consumers.values()) {
        consumer.close();
      }
      this.consumerLayers.delete(producerId);
    }
  }

  /**
   * Get total bitrate for all layers
   */
  getTotalBitrate(producerId: string): number {
    const producers = this.producerLayers.get(producerId);
    
    if (!producers) {
      return 0;
    }

    let total = 0;
    for (const producer of producers.values()) {
      const score = producer.score;
      if (score && score.producerScore > 0) {
        total += score.producerScore;
      }
    }

    return total;
  }
}

export default SimulcastHandler;
