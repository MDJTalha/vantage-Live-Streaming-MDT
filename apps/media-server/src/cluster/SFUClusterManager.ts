/**
 * VANTAGE SFU Cluster Manager
 * Manages multiple SFU instances for 1,000+ participant support
 * Initiative 1: Scale to 1,000+ concurrent participants
 */

import { Worker, Router, Transport, Producer, Consumer } from 'mediasoup';
import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

export interface SFUInstance {
  id: string;
  worker: Worker;
  routers: Map<string, Router>;
  load: number; // 0.0 to 1.0
  participants: number;
  maxParticipants: number;
  host: string;
  port: number;
  status: 'active' | 'busy' | 'offline';
  lastHeartbeat: number;
}

export interface RoomSFUAssignment {
  roomId: string;
  sfuId: string;
  assignedAt: number;
}

export class SFUClusterManager {
  private sfuInstances: Map<string, SFUInstance> = new Map();
  private roomAssignments: Map<string, RoomSFUAssignment> = new Map();
  private redisClient: RedisClientType;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly MAX_PARTICIPANTS_PER_SFU = 150;
  private readonly HEARTBEAT_INTERVAL_MS = 5000;

  constructor() {
    this.redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
  }

  /**
   * Initialize SFU Cluster Manager
   */
  async initialize(): Promise<void> {
    try {
      // Connect to Redis for cross-SFU communication
      await this.redisClient.connect();
      logger.info('✓ Connected to Redis for SFU clustering');

      // Start heartbeat monitoring
      this.startHeartbeat();

      // Subscribe to SFU events
      await this.subscribeToSFUEvents();

      logger.info('✓ SFU Cluster Manager initialized');
    } catch (error) {
      logger.error('Failed to initialize SFU Cluster Manager:', error);
      throw error;
    }
  }

  /**
   * Register a new SFU instance
   */
  async registerSFU(sfuConfig: {
    id: string;
    worker: Worker;
    host: string;
    port: number;
  }): Promise<void> {
    const sfuInstance: SFUInstance = {
      id: sfuConfig.id,
      worker: sfuConfig.worker,
      routers: new Map(),
      load: 0,
      participants: 0,
      maxParticipants: this.MAX_PARTICIPANTS_PER_SFU,
      host: sfuConfig.host,
      port: sfuConfig.port,
      status: 'active',
      lastHeartbeat: Date.now(),
    };

    this.sfuInstances.set(sfuConfig.id, sfuInstance);

    // Publish SFU registration to Redis
    await this.redisClient.publish(
      'sfu:events',
      JSON.stringify({
        type: 'sfu-registered',
        sfuId: sfuConfig.id,
        timestamp: Date.now(),
      })
    );

    logger.info(`✓ Registered SFU instance: ${sfuConfig.id}`);
  }

  /**
   * Get or create router for a room
   */
  async getRoomRouter(roomId: string): Promise<Router> {
    // Check if room already has an assigned SFU
    const assignment = this.roomAssignments.get(roomId);

    if (assignment) {
      const sfu = this.sfuInstances.get(assignment.sfuId);
      if (sfu && sfu.routers.has(roomId)) {
        return sfu.routers.get(roomId)!;
      }
    }

    // Find best SFU for this room
    const bestSFU = await this.findBestSFU();

    // Create router on selected SFU
    const router = await bestSFU.worker.createRouter({
      mediaCodecs: [
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          clockRate: 90000,
          channels: 2,
        },
        {
          kind: 'video',
          mimeType: 'video/H264',
          clockRate: 90000,
          parameters: {
            'packetization-mode': 1,
            'profile-level-id': '4d001f',
            'level-asymmetry-allowed': 1,
          },
          rtcpFeedback: [
            { type: 'nack' },
            { type: 'nack', parameter: 'pli' },
            { type: 'ccm', parameter: 'fir' },
            { type: 'goog-remb' },
            { type: 'transport-cc' },
          ],
        },
        {
          kind: 'video',
          mimeType: 'video/VP8',
          clockRate: 90000,
          parameters: {
            'x-google-start-bitrate': 1000,
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
    });

    // Store router
    bestSFU.routers.set(roomId, router);

    // Assign room to this SFU
    this.roomAssignments.set(roomId, {
      roomId,
      sfuId: bestSFU.id,
      assignedAt: Date.now(),
    });

    // Publish router creation
    await this.redisClient.publish(
      'sfu:events',
      JSON.stringify({
        type: 'router-created',
        roomId,
        sfuId: bestSFU.id,
        timestamp: Date.now(),
      })
    );

    logger.info(`✓ Created router for room ${roomId} on SFU ${bestSFU.id}`);

    return router;
  }

  /**
   * Find best SFU for new room/participant
   */
  private async findBestSFU(): Promise<SFUInstance> {
    // Filter active SFUs with capacity
    const availableSFUs = Array.from(this.sfuInstances.values()).filter(
      (sfu) =>
        sfu.status === 'active' &&
        sfu.participants < sfu.maxParticipants &&
        Date.now() - sfu.lastHeartbeat < this.HEARTBEAT_INTERVAL_MS * 2
    );

    if (availableSFUs.length === 0) {
      throw new Error('No SFU instances available with capacity');
    }

    // Select SFU with lowest load
    const bestSFU = availableSFUs.reduce((best, current) =>
      current.load < best.load ? current : best
    );

    return bestSFU;
  }

  /**
   * Add participant to room
   */
  async addParticipant(
    roomId: string,
    participantId: string
  ): Promise<SFUInstance> {
    const assignment = this.roomAssignments.get(roomId);

    if (!assignment) {
      throw new Error(`Room ${roomId} has no assigned SFU`);
    }

    const sfu = this.sfuInstances.get(assignment.sfuId);

    if (!sfu) {
      throw new Error(`SFU ${assignment.sfuId} not found`);
    }

    // Update participant count
    sfu.participants++;
    sfu.load = sfu.participants / sfu.maxParticipants;

    // Update status based on load
    if (sfu.load > 0.9) {
      sfu.status = 'busy';
    }

    // Publish participant join
    await this.redisClient.publish(
      'sfu:events',
      JSON.stringify({
        type: 'participant-joined',
        roomId,
        participantId,
        sfuId: sfu.id,
        participantCount: sfu.participants,
        timestamp: Date.now(),
      })
    );

    logger.info(
      `Participant ${participantId} joined room ${roomId} on SFU ${sfu.id} (load: ${Math.round(sfu.load * 100)}%)`
    );

    return sfu;
  }

  /**
   * Remove participant from room
   */
  async removeParticipant(
    roomId: string,
    participantId: string
  ): Promise<void> {
    const assignment = this.roomAssignments.get(roomId);

    if (!assignment) {
      return;
    }

    const sfu = this.sfuInstances.get(assignment.sfuId);

    if (!sfu) {
      return;
    }

    // Update participant count
    sfu.participants = Math.max(0, sfu.participants - 1);
    sfu.load = sfu.participants / sfu.maxParticipants;

    // Update status
    if (sfu.load < 0.7 && sfu.status === 'busy') {
      sfu.status = 'active';
    }

    // Publish participant leave
    await this.redisClient.publish(
      'sfu:events',
      JSON.stringify({
        type: 'participant-left',
        roomId,
        participantId,
        sfuId: sfu.id,
        participantCount: sfu.participants,
        timestamp: Date.now(),
      })
    );

    logger.info(
      `Participant ${participantId} left room ${roomId} on SFU ${sfu.id} (load: ${Math.round(sfu.load * 100)}%)`
    );
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      const now = Date.now();

      for (const [sfuId, sfu] of this.sfuInstances.entries()) {
        // Check if SFU is still alive
        if (now - sfu.lastHeartbeat > this.HEARTBEAT_INTERVAL_MS * 3) {
          logger.warn(`SFU ${sfuId} heartbeat timeout, marking as offline`);
          sfu.status = 'offline';

          // Publish SFU offline event
          await this.redisClient.publish(
            'sfu:events',
            JSON.stringify({
              type: 'sfu-offline',
              sfuId,
              timestamp: now,
            })
          );
        }
      }
    }, this.HEARTBEAT_INTERVAL_MS);

    logger.info('✓ SFU heartbeat monitoring started');
  }

  /**
   * Subscribe to SFU events
   */
  private async subscribeToSFUEvents(): Promise<void> {
    const subscriber = this.redisClient.duplicate();
    await subscriber.connect();

    await subscriber.subscribe('sfu:events', (message) => {
      const event = JSON.parse(message);
      this.handleSFUEvent(event);
    });

    logger.info('✓ Subscribed to SFU events');
  }

  /**
   * Handle SFU events
   */
  private handleSFUEvent(event: any): void {
    switch (event.type) {
      case 'sfu-heartbeat':
        const sfu = this.sfuInstances.get(event.sfuId);
        if (sfu) {
          sfu.lastHeartbeat = event.timestamp;
          sfu.load = event.load;
          sfu.participants = event.participants;
        }
        break;

      case 'sfu-registered':
        logger.info(`SFU ${event.sfuId} registered`);
        break;

      case 'sfu-offline':
        logger.warn(`SFU ${event.sfuId} went offline`);
        // TODO: Trigger failover for affected rooms
        break;
    }
  }

  /**
   * Get cluster statistics
   */
  getClusterStats(): {
    totalSFUs: number;
    activeSFUs: number;
    totalParticipants: number;
    totalRooms: number;
    averageLoad: number;
  } {
    const sfus = Array.from(this.sfuInstances.values());
    const activeSFUs = sfus.filter(
      (s) => s.status === 'active' || s.status === 'busy'
    );
    const totalParticipants = sfus.reduce((sum, s) => sum + s.participants, 0);

    return {
      totalSFUs: sfus.length,
      activeSFUs: activeSFUs.length,
      totalParticipants,
      totalRooms: this.roomAssignments.size,
      averageLoad:
        activeSFUs.length > 0
          ? activeSFUs.reduce((sum, s) => sum + s.load, 0) / activeSFUs.length
          : 0,
    };
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    await this.redisClient.quit();

    logger.info('✓ SFU Cluster Manager cleaned up');
  }
}

export default SFUClusterManager;
