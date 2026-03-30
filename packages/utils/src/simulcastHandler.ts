// Re-export simulcast handler from media-server
// This is a placeholder - in production, import from compiled output
export type SimulcastLayer = {
  rid: string;
  scaleResolutionDownBy: number;
  maxBitrate: number;
  maxFramerate?: number;
};

export const simulcastConfig = {
  layers: [
    { rid: 'h', scaleResolutionDownBy: 1, maxBitrate: 1500000, maxFramerate: 30 },
    { rid: 'm', scaleResolutionDownBy: 2, maxBitrate: 500000, maxFramerate: 20 },
    { rid: 'l', scaleResolutionDownBy: 4, maxBitrate: 150000, maxFramerate: 10 },
  ] as SimulcastLayer[],
  svcModes: ['L3T3_KEY', 'L2T2', 'L2T1', 'L1T1'],
};

// Client-side simulcast handler (simplified)
export class SimulcastHandler {
  private currentLayer: 'h' | 'm' | 'l' = 'h';

  getOptimalLayer(availableBitrate: number): 'h' | 'm' | 'l' {
    if (availableBitrate >= 1000000) return 'h';
    if (availableBitrate >= 400000) return 'm';
    return 'l';
  }

  getCurrentLayer(): 'h' | 'm' | 'l' {
    return this.currentLayer;
  }

  setLayer(layer: 'h' | 'm' | 'l'): void {
    this.currentLayer = layer;
  }
}
