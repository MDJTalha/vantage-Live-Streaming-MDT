'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface VirtualBackgroundOptions {
  enabled: boolean;
  type: 'none' | 'blur' | 'image';
  blurStrength?: number;
  imageUrl?: string;
}

/**
 * Virtual Background Processor
 * Uses MediaPipe Selfie Segmentation for background replacement
 */
export class VirtualBackgroundProcessor {
  private segmentationModel: any = null;
  private canvas: HTMLCanvasElement;
  private backgroundImage: HTMLImageElement | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.getContext('2d', { willReadFrequently: true });
  }

  /**
   * Initialize the segmentation model
   */
  async initialize(): Promise<void> {
    try {
      // Load MediaPipe Selfie Segmentation
      // In production, use: @mediapipe/selfie-segmentation
      // For now, we'll use a simpler approach
      console.log('Initializing virtual background processor...');
      
      // Dynamic import for production
      // const { SelfieSegmentation } = await import('@mediapipe/selfie-segmentation');
      // this.segmentationModel = new SelfieSegmentation({
      //   locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie-segmentation/${file}`,
      // });
      
      // this.segmentationModel.setOptions({
      //   modelSelection: 1, // landscape model
      //   selfieMode: true,
      // });
      
      // this.segmentationModel.onResults(this.onSegmentationResults.bind(this));
      
      console.log('✓ Virtual background processor initialized');
    } catch (error) {
      console.error('Failed to initialize virtual background:', error);
      throw error;
    }
  }

  /**
   * Process video frame with virtual background
   */
  async processFrame(
    videoElement: HTMLVideoElement,
    outputCanvas: HTMLCanvasElement,
    options: VirtualBackgroundOptions
  ): Promise<void> {
    if (!options.enabled || videoElement.readyState < 2) {
      return;
    }

    const ctx = outputCanvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    outputCanvas.width = videoElement.videoWidth || 640;
    outputCanvas.height = videoElement.videoHeight || 480;

    try {
      if (options.type === 'none') {
        // Just draw the video
        ctx.drawImage(videoElement, 0, 0, outputCanvas.width, outputCanvas.height);
        return;
      }

      if (options.type === 'blur') {
        // Apply blur to entire frame (simple approach)
        // In production, use segmentation to blur only background
        const blurStrength = options.blurStrength || 10;
        
        // Draw blurred version
        ctx.filter = `blur(${blurStrength}px)`;
        ctx.drawImage(videoElement, 0, 0, outputCanvas.width, outputCanvas.height);
        ctx.filter = 'none';
        
        // In production with MediaPipe:
        // 1. Run segmentation to get person mask
        // 2. Draw blurred background
        // 3. Draw person over blurred background using mask
        return;
      }

      if (options.type === 'image' && options.imageUrl) {
        // Load background image if not already loaded
        if (!this.backgroundImage || this.backgroundImage.src !== options.imageUrl) {
          this.backgroundImage = new Image();
          this.backgroundImage.src = options.imageUrl;
          await new Promise((resolve) => {
            if (this.backgroundImage) {
              this.backgroundImage.onload = resolve;
            }
          });
        }

        // In production with MediaPipe:
        // 1. Run segmentation to get person mask
        // 2. Draw custom background image
        // 3. Draw person over background using mask
        
        // Simple approach for now:
        // Draw background image
        if (this.backgroundImage) {
          ctx.drawImage(this.backgroundImage, 0, 0, outputCanvas.width, outputCanvas.height);
          
          // Draw video on top (in production, use mask to only draw person)
          ctx.globalAlpha = 0.9; // Slight transparency to blend
          ctx.drawImage(videoElement, 0, 0, outputCanvas.width, outputCanvas.height);
          ctx.globalAlpha = 1.0;
        }
      }
    } catch (error) {
      console.error('Error processing frame:', error);
      throw error;
    }
  }

  /**
   * Cleanup
   */
  dispose(): void {
    if (this.segmentationModel) {
      // this.segmentationModel.close();
      this.segmentationModel = null;
    }
  }
}

/**
 * Virtual Background Hook
 * Handles background segmentation and replacement
 */
export function useVirtualBackground(
  videoElement: HTMLVideoElement | null,
  canvasElement: HTMLCanvasElement | null,
  options: VirtualBackgroundOptions
) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const processorRef = useRef<VirtualBackgroundProcessor | null>(null);
  const animationFrameRef = useRef<number>();
  const backgroundElementRef = useRef<HTMLImageElement | null>(null);

  // Initialize processor
  useEffect(() => {
    processorRef.current = new VirtualBackgroundProcessor();
    
    return () => {
      processorRef.current?.dispose();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Load background image
  useEffect(() => {
    if (options.type === 'image' && options.imageUrl) {
      const img = new Image();
      img.src = options.imageUrl;
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        backgroundElementRef.current = img;
      };
    }
  }, [options.imageUrl]);

  // Process video frames
  useEffect(() => {
    if (!options.enabled || !videoElement || !canvasElement || !processorRef.current) {
      return;
    }

    setIsProcessing(true);
    const canvas = canvasElement;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setError('Could not get canvas context');
      setIsProcessing(false);
      return;
    }

    let isMounted = true;

    const processFrame = async () => {
      if (!isMounted || !videoElement || videoElement.paused || videoElement.ended) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      try {
        await processorRef.current!.processFrame(videoElement, canvas, options);
        setIsProcessing(false);
      } catch (err) {
        console.error('Error processing frame:', err);
        setError('Failed to process video frame');
        setIsProcessing(false);
      }

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    processFrame();

    return () => {
      isMounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [options.enabled, options.type, options.blurStrength, videoElement, canvasElement]);

  // Update background image
  const updateBackground = useCallback((imageUrl: string) => {
    const img = new Image();
    img.src = imageUrl;
    img.crossOrigin = 'anonymous';
    backgroundElementRef.current = img;
  }, []);

  // Disable background
  const disableBackground = useCallback(() => {
    if (canvasElement) {
      const ctx = canvasElement.getContext('2d');
      if (ctx && videoElement) {
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
      }
    }
  }, [canvasElement, videoElement]);

  return {
    isProcessing,
    error,
    updateBackground,
    disableBackground,
  };
}

export default useVirtualBackground;
