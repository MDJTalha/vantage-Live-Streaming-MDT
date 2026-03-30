import { config } from '@vantage/config';

/**
 * WebRTC Configuration
 * Handles STUN/TURN servers and peer connection settings
 */
export const webrtcConfig = {
  // ICE Servers for WebRTC connection
  iceServers: [
    // Google's public STUN servers
    {
      urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'],
    },
    // Additional STUN servers
    {
      urls: 'stun:stun.services.mozilla.com',
    },
    // TURN server (for NAT traversal)
    {
      urls: config.webrtc.turnServer.url,
      username: config.webrtc.turnServer.username,
      credential: config.webrtc.turnServer.password,
    },
  ],

  // Peer connection configuration
  peerConnection: {
    sdpSemantics: 'unified-plan' as const,
    bundlePolicy: 'max-bundle' as const,
    rtcpMuxPolicy: 'require' as const,
    iceCandidatePoolSize: 10,
  },

  // Offer constraints
  offerOptions: {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true,
  },

  // Media constraints
  mediaConstraints: {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      voiceIsolation: true,
      sampleRate: 48000,
      channelCount: 1,
    },
    video: {
      width: { ideal: 1920, max: 1920 },
      height: { ideal: 1080, max: 1080 },
      frameRate: { ideal: 30, max: 60 },
      facingMode: 'user',
    },
  },

  // Screen share constraints
  screenShareConstraints: {
    video: {
      width: { ideal: 1920, max: 1920 },
      height: { ideal: 1080, max: 1080 },
      frameRate: { ideal: 30, max: 60 },
    },
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  },

  // Codec preferences
  codecs: {
    video: ['VP9', 'VP8', 'H264'],
    audio: ['opus', 'G722', 'PCMU'],
  },

  // Bitrate settings (kbps)
  bitrate: {
    min: 100,
    start: 500,
    max: 3000,
  },

  // Simulcast layers
  simulcast: {
    low: { scaleResolutionDownBy: 4, maxBitrate: 150 },
    medium: { scaleResolutionDownBy: 2, maxBitrate: 500 },
    high: { scaleResolutionDownBy: 1, maxBitrate: 1500 },
  },
};

/**
 * Get optimal ICE servers based on configuration
 */
export function getIceServers(includeTurn: boolean = true): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: ['stun:stun.l.google.com:19302'] },
    { urls: ['stun:stun1.l.google.com:19302'] },
  ];

  if (includeTurn && config.webrtc.turnServer.url) {
    servers.push({
      urls: config.webrtc.turnServer.url,
      username: config.webrtc.turnServer.username,
      credential: config.webrtc.turnServer.password,
    });
  }

  return servers;
}

/**
 * Create peer connection with optimal configuration
 */
export function createPeerConnection(
  configuration?: RTCConfiguration
): RTCPeerConnection {
  const config: RTCConfiguration = {
    ...webrtcConfig.peerConnection,
    iceServers: getIceServers(),
    ...configuration,
  };

  return new RTCPeerConnection(config);
}

/**
 * Get media stream with optimal constraints
 */
export async function getUserMedia(
  constraints?: MediaStreamConstraints
): Promise<MediaStream> {
  const mergedConstraints: MediaStreamConstraints = {
    ...webrtcConfig.mediaConstraints,
    ...constraints,
  };

  return navigator.mediaDevices.getUserMedia(mergedConstraints);
}

/**
 * Get display media for screen sharing
 */
export async function getDisplayMedia(
  constraints?: MediaStreamConstraints
): Promise<MediaStream> {
  const mergedConstraints: MediaStreamConstraints = {
    ...webrtcConfig.screenShareConstraints,
    ...constraints,
  };

  return navigator.mediaDevices.getDisplayMedia(mergedConstraints);
}

export default webrtcConfig;
