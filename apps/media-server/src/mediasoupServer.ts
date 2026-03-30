import mediasoup, {
  Worker,
  WebRtcTransport,
  PlainTransport,
  Router,
  Producer,
  Consumer,
  ActiveSpeakerObserver,
} from 'mediasoup';
import { config } from '@vantage/config';
import { v4 as uuidv4 } from 'uuid';

/**
 * Mediasoup Server Configuration
 */
export const mediasoupConfig = {
  // Worker settings
  worker: {
    rtcMinPort: config.mediaServer.minPort,
    rtcMaxPort: config.mediaServer.maxPort,
    logLevel: 'warn' as const,
    logTags: [
      'info',
      'ice',
      'dtls',
      'rtp',
      'srtp',
      'rtcp',
      'rtx',
      'bwe',
      'score',
      'simulcast',
      'svc',
      'sctp',
    ],
  },

  // Router settings
  router: {
    mediaCodecs: [
      {
        kind: 'audio' as const,
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2,
      },
      {
        kind: 'video' as const,
        mimeType: 'video/VP9',
        clockRate: 90000,
        parameters: {
          'profile-id': 2,
        },
      },
      {
        kind: 'video' as const,
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: {
          'x-google-start-bitrate': 1000,
        },
      },
      {
        kind: 'video' as const,
        mimeType: 'video/H264',
        clockRate: 90000,
        parameters: {
          'packetization-mode': 1,
          'profile-level-id': '4d0032',
          'level-asymmetry-allowed': 1,
          'x-google-start-bitrate': 1000,
        },
      },
    ],
  },

  // WebRTC transport settings
  webRtcTransport: {
    listenIps: [
      {
        ip: config.mediaServer.host || '0.0.0.0',
        announcedIp: undefined, // Set to public IP if behind NAT
      },
    ],
    initialAvailableOutgoingBitrate: 1000000,
    minimumAvailableOutgoingBitrate: 600000,
    maxSctpMessageSize: 262144,
    maxIncomingBitrate: 1500000,
    enableUdpMultiplex: true,
    enableSctp: true,
    numSctpStreams: {
      os: 1024,
      mis: 1024,
    },
    iceRestartInterval: 30000,
    iceCandidates: [
      {
        ip: config.mediaServer.host || '0.0.0.0',
        port: config.mediaServer.port,
        protocol: 'udp' as const,
      },
    ],
  },

  // Plain transport (for RTMP ingestion)
  plainTransport: {
    listenIp: {
      ip: config.mediaServer.host || '0.0.0.0',
      announcedIp: undefined,
    },
    rtcpMux: true,
    comedia: false,
  },

  // Video codec preferences
  codecs: {
    video: ['VP9', 'VP8', 'H264'],
    audio: ['opus'],
  },

  // Simulcast encoding layers
  simulcastEncodings: [
    { scaleResolutionDownBy: 1, maxBitrate: 1500000 }, // High
    { scaleResolutionDownBy: 2, maxBitrate: 500000 },  // Medium
    { scaleResolutionDownBy: 4, maxBitrate: 150000 },  // Low
  ],

  // SVC encoding (for VP9)
  svcEncodings: [
    { scalabilityMode: 'L3T3_KEY' }, // 3 spatial, 3 temporal layers
  ],
};

/**
 * Mediasoup Server Manager
 * Manages workers, routers, and transports
 */
export class MediasoupServer {
  private worker?: Worker;
  private router?: Router;
  private transports: Map<string, WebRtcTransport> = new Map();
  private producers: Map<string, Producer> = new Map();
  private consumers: Map<string, Consumer> = new Map();
  private activeSpeakerObserver?: ActiveSpeakerObserver;

  /**
   * Initialize mediasoup worker and router
   */
  async initialize(): Promise<void> {
    console.log('🎬 Initializing Mediasoup server...');

    // Create worker
    this.worker = await mediasoup.createWorker(mediasoupConfig.worker);

    this.worker.on('died', () => {
      console.error('❌ Mediasoup worker died, exiting...');
      process.exit(1);
    });

    console.log(`✅ Mediasoup worker created with PID ${this.worker.pid}`);

    // Create router
    this.router = await this.worker.createRouter(mediasoupConfig.router);
    console.log('✅ Mediasoup router created');

    // Create active speaker observer
    this.activeSpeakerObserver = this.router.createActiveSpeakerObserver({
      interval: 500,
    });

    console.log('✅ Mediasoup server initialized');
  }

  /**
   * Create WebRTC transport for peer
   */
  async createWebRtcTransport(isProducer: boolean = true): Promise<{
    transport: WebRtcTransport;
    parameters: any;
  }> {
    if (!this.router) {
      throw new Error('Mediasoup router not initialized');
    }

    const transport = await this.router.createWebRtcTransport({
      ...mediasoupConfig.webRtcTransport,
      enableSctp: isProducer, // Enable SCTP for data channels
    });

    // Store transport
    this.transports.set(transport.id, transport);

    // Monitor transport
    transport.on('sctpstatechange', (sctpState) => {
      console.log(`📡 Transport ${transport.id} SCTP state: ${sctpState}`);
    });

    transport.on('icestatechange', (iceState) => {
      console.log(`📡 Transport ${transport.id} ICE state: ${iceState}`);
    });

    transport.on('dtlsstatechange', (dtlsState) => {
      console.log(`📡 Transport ${transport.id} DTLS state: ${dtlsState}`);
    });

    transport.on('close', () => {
      console.log(`📡 Transport ${transport.id} closed`);
      this.transports.delete(transport.id);
    });

    return {
      transport,
      parameters: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
        sctpParameters: transport.sctpParameters,
      },
    };
  }

  /**
   * Connect transport (after client sends DTLS parameters)
   */
  async connectTransport(transportId: string, dtlsParameters: any): Promise<void> {
    const transport = this.transports.get(transportId);
    
    if (!transport) {
      throw new Error(`Transport ${transportId} not found`);
    }

    await transport.connect({ dtlsParameters });
    console.log(`✅ Transport ${transportId} connected`);
  }

  /**
   * Create producer (client publishing media)
   */
  async createProducer(
    transportId: string,
    kind: 'audio' | 'video',
    rtpParameters: any,
    appData?: any
  ): Promise<{ producer: Producer; id: string }> {
    const transport = this.transports.get(transportId);
    
    if (!transport) {
      throw new Error(`Transport ${transportId} not found`);
    }

    const producer = await transport.produce({
      kind,
      rtpParameters,
      appData: {
        ...appData,
        peerId: appData?.peerId || uuidv4(),
      },
    });

    // Store producer
    this.producers.set(producer.id, producer);

    // Add to active speaker observer if audio
    if (kind === 'audio' && this.activeSpeakerObserver) {
      this.activeSpeakerObserver.addProducer({ producer });
    }

    console.log(`🎬 Producer created: ${producer.id} (${kind})`);

    return { producer, id: producer.id };
  }

  /**
   * Create consumer (client receiving media)
   */
  async createConsumer(
    transportId: string,
    producerId: string,
    rtpCapabilities: any
  ): Promise<{ consumer: Consumer; parameters: any }> {
    const transport = this.transports.get(transportId);
    const producer = this.producers.get(producerId);

    if (!transport) {
      throw new Error(`Transport ${transportId} not found`);
    }

    if (!producer) {
      throw new Error(`Producer ${producerId} not found`);
    }

    // Check if client can consume
    if (!this.router!.canConsume({ producerId, rtpCapabilities })) {
      throw new Error('Client cannot consume producer');
    }

    const consumer = await transport.consume({
      producerId,
      rtpCapabilities,
      paused: producer.kind === 'video', // Start video paused
      appData: {
        peerId: producer.appData.peerId,
        producerId,
      },
    });

    // Store consumer
    this.consumers.set(consumer.id, consumer);

    // Resume consumer when ready
    consumer.on('producerclose', () => {
      console.log(`📥 Consumer ${consumer.id} closed (producer closed)`);
      this.consumers.delete(consumer.id);
    });

    console.log(`📥 Consumer created: ${consumer.id} for producer ${producerId}`);

    return {
      consumer,
      parameters: {
        id: consumer.id,
        producerId: producer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        type: consumer.type,
        producerPaused: consumer.producerPaused,
      },
    };
  }

  /**
   * Resume consumer (for video)
   */
  async resumeConsumer(consumerId: string): Promise<void> {
    const consumer = this.consumers.get(consumerId);
    
    if (!consumer) {
      throw new Error(`Consumer ${consumerId} not found`);
    }

    await consumer.resume();
    console.log(`▶️ Consumer ${consumerId} resumed`);
  }

  /**
   * Pause consumer
   */
  async pauseConsumer(consumerId: string): Promise<void> {
    const consumer = this.consumers.get(consumerId);
    
    if (!consumer) {
      throw new Error(`Consumer ${consumerId} not found`);
    }

    await consumer.pause();
    console.log(`⏸️ Consumer ${consumerId} paused`);
  }

  /**
   * Set consumer priority
   */
  async setConsumerPriority(consumerId: string, priority: number): Promise<void> {
    const consumer = this.consumers.get(consumerId);
    
    if (!consumer) {
      throw new Error(`Consumer ${consumerId} not found`);
    }

    await consumer.setPriority(priority);
    console.log(`🔝 Consumer ${consumerId} priority set to ${priority}`);
  }

  /**
   * Request keyframe for video consumer
   */
  async requestKeyframe(consumerIds: string[]): Promise<void> {
    const consumers = consumerIds
      .map((id) => this.consumers.get(id))
      .filter((c): c is Consumer => c !== undefined);

    if (consumers.length > 0) {
      await this.router!.requestKeyFrame(consumers);
      console.log(`🔑 Keyframe requested for ${consumers.length} consumers`);
    }
  }

  /**
   * Get router RTP capabilities
   */
  getRtpCapabilities(): any {
    if (!this.router) {
      throw new Error('Router not initialized');
    }
    return this.router.rtpCapabilities;
  }

  /**
   * Close transport and all associated producers/consumers
   */
  async closeTransport(transportId: string): Promise<void> {
    const transport = this.transports.get(transportId);
    
    if (transport) {
      transport.close();
      this.transports.delete(transportId);
      console.log(`🗑️ Transport ${transportId} closed`);
    }
  }

  /**
   * Get server stats
   */
  getStats() {
    return {
      worker: {
        pid: this.worker?.pid,
        status: this.worker ? 'running' : 'stopped',
      },
      router: {
        id: this.router?.id,
      },
      transports: this.transports.size,
      producers: this.producers.size,
      consumers: this.consumers.size,
    };
  }

  /**
   * Cleanup all resources
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Mediasoup resources...');

    // Close all transports
    for (const transport of this.transports.values()) {
      transport.close();
    }

    this.transports.clear();
    this.producers.clear();
    this.consumers.clear();

    if (this.router) {
      this.router.close();
    }

    if (this.worker) {
      this.worker.close();
    }

    console.log('✅ Mediasoup cleanup complete');
  }
}

export default MediasoupServer;
