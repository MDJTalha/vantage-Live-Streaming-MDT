import { createPeerConnection, getDisplayMedia, getUserMedia } from './webrtc';

/**
 * WebRTC Client Manager
 * Handles peer connections and media streams
 */
export class WebRTCClient {
  private peerConnection?: RTCPeerConnection;
  private localStream?: MediaStream;
  private remoteStreams: Map<string, MediaStream> = new Map();
  private dataChannel?: RTCDataChannel;
  private onStreamAdded?: (stream: MediaStream, peerId: string) => void;
  private onIceCandidate?: (candidate: RTCIceCandidateInit) => void;
  private onConnectionStateChange?: (state: string) => void;

  /**
   * Initialize peer connection
   */
  async initialize(
    options: {
      onStreamAdded?: (stream: MediaStream, peerId: string) => void;
      onStreamRemoved?: (peerId: string) => void;
      onIceCandidate?: (candidate: RTCIceCandidateInit) => void;
      onConnectionStateChange?: (state: string) => void;
    } = {}
  ): Promise<void> {
    this.onStreamAdded = options.onStreamAdded;
    this.onIceCandidate = options.onIceCandidate;
    this.onConnectionStateChange = options.onConnectionStateChange;

    this.peerConnection = createPeerConnection();

    // Setup event handlers
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidate) {
        this.onIceCandidate(event.candidate.toJSON());
      }
    };

    this.peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        const stream = event.streams[0];
        const peerId = event.transceiver?.mid || 'unknown';
        
        if (this.onStreamAdded) {
          this.onStreamAdded(stream, peerId);
        }
        
        this.remoteStreams.set(peerId, stream);
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(this.peerConnection!.connectionState);
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      if (this.peerConnection?.iceConnectionState === 'failed') {
        console.warn('ICE connection failed, attempting restart...');
        this.restartIce();
      }
    };
  }

  /**
   * Start local media (camera + mic)
   */
  async startLocalMedia(constraints?: MediaStreamConstraints): Promise<MediaStream> {
    this.localStream = await getUserMedia(constraints);
    
    // Add tracks to peer connection
    this.localStream.getTracks().forEach((track) => {
      if (this.peerConnection) {
        this.peerConnection.addTrack(track, this.localStream!);
      }
    });

    return this.localStream;
  }

  /**
   * Start screen sharing
   */
  async startScreenShare(constraints?: MediaStreamConstraints): Promise<MediaStream> {
    const screenStream = await getDisplayMedia(constraints);
    
    // Replace video track
    if (this.peerConnection && this.localStream) {
      const sender = this.peerConnection
        .getSenders()
        .find((s) => s.track?.kind === 'video');

      if (sender) {
        sender.replaceTrack(screenStream.getVideoTracks()[0]);
      }
    }

    // Handle screen share stop
    screenStream.getVideoTracks()[0].onended = () => {
      this.stopScreenShare();
    };

    return screenStream;
  }

  /**
   * Stop screen sharing and resume camera
   */
  async stopScreenShare(): Promise<void> {
    if (this.localStream && this.peerConnection) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      
      if (videoTrack) {
        const sender = this.peerConnection
          .getSenders()
          .find((s) => s.track?.kind === 'video');

        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      }
    }
  }

  /**
   * Toggle video track
   */
  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = enabled;
      }
    }
  }

  /**
   * Toggle audio track
   */
  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = enabled;
      }
    }
  }

  /**
   * Switch camera (front/back)
   */
  async switchCamera(): Promise<void> {
    if (!this.localStream) return;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) return;

    const currentConstraints = videoTrack.getConstraints();
    const facingMode = currentConstraints.facingMode === 'user' ? 'environment' : 'user';

    const newStream = await getUserMedia({
      video: { ...currentConstraints, facingMode },
    });

    const newTrack = newStream.getVideoTracks()[0];

    if (this.peerConnection) {
      const sender = this.peerConnection
        .getSenders()
        .find((s) => s.track?.kind === 'video');

      if (sender) {
        sender.replaceTrack(newTrack);
      }
    }

    // Update local stream
    this.localStream.removeTrack(videoTrack);
    this.localStream.addTrack(newTrack);
    videoTrack.stop();
  }

  /**
   * Create offer (for peer connection initiation)
   */
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    
    return offer;
  }

  /**
   * Create answer (for peer connection response)
   */
  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.setRemoteDescription(offer);
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    
    return answer;
  }

  /**
   * Set remote description
   */
  async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.setRemoteDescription(description);
  }

  /**
   * Add ICE candidate
   */
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  /**
   * Restart ICE connection
   */
  async restartIce(): Promise<void> {
    if (!this.peerConnection) return;

    const offer = await this.peerConnection.createOffer({
      iceRestart: true,
    });
    
    await this.peerConnection.setLocalDescription(offer);

    if (this.onIceCandidate && this.peerConnection.localDescription) {
      const candidate = this.peerConnection.localDescription.toJSON() as RTCIceCandidateInit;
      this.onIceCandidate(candidate);
    }
  }

  /**
   * Create data channel
   */
  createDataChannel(label: string, options?: RTCDataChannelInit): RTCDataChannel {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    this.dataChannel = this.peerConnection.createDataChannel(label, options);
    
    this.dataChannel.onopen = () => {
      console.log(`Data channel "${label}" opened`);
    };

    this.dataChannel.onclose = () => {
      console.log(`Data channel "${label}" closed`);
    };

    return this.dataChannel;
  }

  /**
   * Send data via data channel
   */
  sendData(data: any): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(data));
    }
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStream | undefined {
    return this.localStream;
  }

  /**
   * Get remote stream by peer ID
   */
  getRemoteStream(peerId: string): MediaStream | undefined {
    return this.remoteStreams.get(peerId);
  }

  /**
   * Get all remote streams
   */
  getAllRemoteStreams(): Map<string, MediaStream> {
    return this.remoteStreams;
  }

  /**
   * Get connection state
   */
  getConnectionState(): string {
    return this.peerConnection?.connectionState || 'closed';
  }

  /**
   * Get ICE connection state
   */
  getIceConnectionState(): string {
    return this.peerConnection?.iceConnectionState || 'closed';
  }

  /**
   * Close peer connection
   */
  close(): void {
    // Stop local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = undefined;
    }

    // Close remote streams
    this.remoteStreams.forEach((stream) => {
      stream.getTracks().forEach((track) => track.stop());
    });
    this.remoteStreams.clear();

    // Close data channel
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = undefined;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = undefined;
    }
  }
}

export default WebRTCClient;
