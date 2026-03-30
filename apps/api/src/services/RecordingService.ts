import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import crypto from 'crypto';

export interface RecordingMetadata {
  id: string;
  roomId: string;
  title: string;
  duration: number;
  size: number;
  format: string;
  createdAt: Date;
  status: 'processing' | 'ready' | 'failed';
  thumbnailUrl?: string;
}

export interface UploadRecordingOptions {
  roomId: string;
  title: string;
  duration: number;
  format?: string;
}

/**
 * Recording Service
 * Handles meeting recording storage and retrieval using S3
 */
export class RecordingService {
  private s3Client: S3Client;
  private bucket: string;
  private region: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.bucket = process.env.S3_BUCKET || 'vantage-recordings';
    
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  /**
   * Generate unique recording key
   */
  private generateRecordingKey(roomId: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `recordings/${roomId}/${timestamp}-${random}`;
  }

  /**
   * Upload recording file to S3
   */
  async uploadRecording(
    filePath: string,
    options: UploadRecordingOptions
  ): Promise<RecordingMetadata> {
    const key = this.generateRecordingKey(options.roomId);
    const fileStream = createReadStream(filePath);
    const stats = await require('fs/promises').stat(filePath);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: fileStream,
      ContentType: `video/${options.format || 'mp4'}`,
      Metadata: {
        'room-id': options.roomId,
        'title': options.title,
        'duration': options.duration.toString(),
        'format': options.format || 'mp4',
      },
    });

    await this.s3Client.send(command);

    return {
      id: key.split('/').pop() || '',
      roomId: options.roomId,
      title: options.title,
      duration: options.duration,
      size: stats.size,
      format: options.format || 'mp4',
      createdAt: new Date(),
      status: 'ready',
    };
  }

  /**
   * Get signed URL for recording playback
   */
  async getRecordingUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Get recording metadata
   */
  async getRecordingMetadata(key: string): Promise<RecordingMetadata | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      const metadata = response.Metadata || {};

      return {
        id: key.split('/').pop() || '',
        roomId: metadata['room-id'] || '',
        title: metadata['title'] || '',
        duration: parseInt(metadata['duration'] || '0'),
        size: response.ContentLength || 0,
        format: metadata['format'] || 'mp4',
        createdAt: response.LastModified || new Date(),
        status: 'ready',
      };
    } catch (error) {
      console.error('Error getting recording metadata:', error);
      return null;
    }
  }

  /**
   * List recordings for a room
   */
  async listRecordings(roomId: string, maxKeys: number = 100): Promise<RecordingMetadata[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: `recordings/${roomId}/`,
      MaxKeys: maxKeys,
    });

    const response = await this.s3Client.send(command);
    const recordings: RecordingMetadata[] = [];

    for (const obj of response.Contents || []) {
      if (obj.Key) {
        const metadata = await this.getRecordingMetadata(obj.Key);
        if (metadata) {
          recordings.push(metadata);
        }
      }
    }

    return recordings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Delete recording
   */
  async deleteRecording(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * Generate thumbnail from video
   */
  async generateThumbnail(videoKey: string, timePosition: number = 5): Promise<string> {
    // In production, use ffmpeg to extract thumbnail
    // For now, return placeholder
    const thumbnailKey = videoKey.replace('recordings/', 'thumbnails/') + '.jpg';
    return thumbnailKey;
  }

  /**
   * Get storage usage
   */
  async getStorageUsage(roomId?: string): Promise<{ total: number; count: number }> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: roomId ? `recordings/${roomId}/` : 'recordings/',
    });

    let totalSize = 0;
    let count = 0;

    const response = await this.s3Client.send(command);
    
    for (const obj of response.Contents || []) {
      totalSize += obj.Size || 0;
      count++;
    }

    return { total: totalSize, count };
  }
}

export default RecordingService;
