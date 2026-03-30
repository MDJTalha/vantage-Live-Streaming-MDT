import 'dart:convert';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class WebRTCService {
  RTCPeerConnection? _peerConnection;
  MediaStream? _localStream;
  final Map<String, RTCRtpSender> _senders = {};
  
  final Map<String, dynamic> _iceServers = {
    'iceServers': [
      {'urls': 'stun:stun.l.google.com:19302'},
      {'urls': 'stun:stun1.l.google.com:19302'},
    ],
  };

  Future<MediaStream> getUserMedia({
    bool audio = true,
    Map<String, dynamic>? video,
  }) async {
    final Map<String, dynamic> constraints = {
      'audio': audio,
      'video': video ?? false,
    };

    _localStream = await navigator.mediaDevices.getUserMedia(constraints);
    return _localStream!;
  }

  Future<MediaStream> getDisplayMedia() async {
    final Map<String, dynamic> constraints = {
      'audio': false,
      'video': {
        'displaySurface': 'monitor',
      },
    };

    return await navigator.mediaDevices.getDisplayMedia(constraints);
  }

  Future<RTCPeerConnection> createPeerConnection(
    Map<String, dynamic> configuration,
    Map<String, dynamic> constraints,
  ) async {
    _peerConnection = await createPeerConnection(configuration, constraints);
    return _peerConnection!;
  }

  Future<RTCSessionDescription> createOffer() async {
    return await _peerConnection!.createOffer();
  }

  Future<RTCSessionDescription> createAnswer() async {
    return await _peerConnection!.createAnswer();
  }

  Future<void> setLocalDescription(RTCSessionDescription description) async {
    await _peerConnection!.setLocalDescription(description);
  }

  Future<void> setRemoteDescription(RTCSessionDescription description) async {
    await _peerConnection!.setRemoteDescription(description);
  }

  Future<void> addIceCandidate(RTCIceCandidate candidate) async {
    await _peerConnection!.addCandidate(candidate);
  }

  void toggleAudio(MediaStream? stream, bool enabled) {
    if (stream == null) return;
    
    stream.getAudioTracks().forEach((track) {
      track.enabled = enabled;
    });
  }

  void toggleVideo(MediaStream? stream, bool enabled) {
    if (stream == null) return;
    
    stream.getVideoTracks().forEach((track) {
      track.enabled = enabled;
    });
  }

  Future<void> stopScreenShare() async {
    _localStream?.getTracks().forEach((track) {
      track.stop();
    });
    
    if (_localStream != null) {
      _localStream = await getUserMedia(audio: true, video: {
        'width': {'ideal': 1280},
        'height': {'ideal': 720},
        'facingMode': 'user',
      });
    }
  }

  void addTrack(MediaStream stream) {
    _peerConnection?.addTrack(stream.getVideoTracks()[0], stream);
    _peerConnection?.addTrack(stream.getAudioTracks()[0], stream);
  }

  void onTrack(RTCPeerConnection peerConnection, Function(RTCRtpTrackEvent) callback) {
    peerConnection.onTrack = callback;
  }

  void onIceCandidate(RTCPeerConnection peerConnection, Function(RTCIceCandidateEvent) callback) {
    peerConnection.onIceCandidate = callback;
  }

  Future<void> dispose() async {
    _localStream?.getTracks().forEach((track) {
      track.stop();
    });
    _localStream?.dispose();
    
    await _peerConnection?.close();
    _peerConnection = null;
  }
}
