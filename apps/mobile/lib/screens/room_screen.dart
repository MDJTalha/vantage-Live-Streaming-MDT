import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:provider/provider.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

import '../providers/webrtc_provider.dart';
import '../providers/room_provider.dart';
import '../services/webrtc_service.dart';
import '../services/api_service.dart';
import 'widgets/video_renderer.dart';
import 'widgets/meeting_controls.dart';
import 'widgets/participants_panel.dart';
import 'widgets/chat_panel.dart';

class RoomScreen extends StatefulWidget {
  const RoomScreen({super.key});

  @override
  State<RoomScreen> createState() => _RoomScreenState();
}

class _RoomScreenState extends State<RoomScreen> {
  final WebRTCService _webrtcService = WebRTCService();
  final ApiService _apiService = ApiService();
  
  MediaStream? _localStream;
  final Map<String, MediaStream> _remoteStreams = {};
  bool _isAudioEnabled = true;
  bool _isVideoEnabled = true;
  bool _isScreenSharing = false;
  bool _isChatOpen = false;
  bool _isParticipantsOpen = false;
  String? _roomCode;
  List<Map<String, dynamic>> _participants = [];
  List<Map<String, dynamic>> _messages = [];

  @override
  void initState() {
    super.initState();
    _initializeRoom();
  }

  Future<void> _initializeRoom() async {
    // Get room code from arguments or generate
    final roomProvider = Provider.of<RoomProvider>(context, listen: false);
    _roomCode = roomProvider.currentRoomCode;

    // Initialize local media
    await _initializeLocalMedia();

    // Connect to WebSocket
    _connectToRoom();
  }

  Future<void> _initializeLocalMedia() async {
    try {
      final stream = await _webrtcService.getUserMedia(
        audio: true,
        video: {
          'width': {'ideal': 1280},
          'height': {'ideal': 720},
          'facingMode': 'user',
        },
      );

      setState(() {
        _localStream = stream;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to access camera: $e')),
        );
      }
    }
  }

  void _connectToRoom() {
    final webrtcProvider = Provider.of<WebRTCProvider>(context, listen: false);
    
    webrtcProvider.connect(_roomCode ?? '');
    
    webrtcProvider.socket?.on('user-joined', (data) {
      setState(() {
        _participants.add(data);
      });
    });

    webrtcProvider.socket?.on('user-left', (data) {
      setState(() {
        _participants.removeWhere((p) => p['id'] == data['id']);
        _remoteStreams.remove(data['id']);
      });
    });

    webrtcProvider.socket?.on('receive-message', (data) {
      setState(() {
        _messages.add(data);
      });
    });
  }

  void _toggleAudio() {
    setState(() {
      _isAudioEnabled = !_isAudioEnabled;
    });
    _webrtcService.toggleAudio(_localStream, _isAudioEnabled);
  }

  void _toggleVideo() {
    setState(() {
      _isVideoEnabled = !_isVideoEnabled;
    });
    _webrtcService.toggleVideo(_localStream, _isVideoEnabled);
  }

  Future<void> _toggleScreenShare() async {
    try {
      if (_isScreenSharing) {
        await _webrtcService.stopScreenShare();
      } else {
        final screenStream = await _webrtcService.getDisplayMedia();
        setState(() {
          _localStream = screenStream;
          _isScreenSharing = true;
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Screen share failed: $e')),
      );
    }
  }

  void _sendMessage(String content) {
    final webrtcProvider = Provider.of<WebRTCProvider>(context, listen: false);
    webrtcProvider.socket?.emit('send-message', {
      'roomId': _roomCode,
      'content': content,
      'type': 'text',
    });
  }

  Future<void> _leaveRoom() async {
    await _webrtcService.dispose();
    Provider.of<WebRTCProvider>(context, listen: false).disconnect();
    
    if (mounted) {
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          // App Bar
          _buildAppBar(),
          
          // Video Grid
          Expanded(
            child: _buildVideoGrid(),
          ),
          
          // Controls
          MeetingControls(
            isAudioEnabled: _isAudioEnabled,
            isVideoEnabled: _isVideoEnabled,
            isScreenSharing: _isScreenSharing,
            onToggleAudio: _toggleAudio,
            onToggleVideo: _toggleVideo,
            onToggleScreenShare: _toggleScreenShare,
            onToggleChat: () => setState(() => _isChatOpen = !_isChatOpen),
            onToggleParticipants: () => setState(() => _isParticipantsOpen = !_isParticipantsOpen),
            onLeave: _leaveRoom,
          ),
        ],
      ),
      // Chat Panel (overlay)
      if (_isChatOpen)
        ChatPanel(
          messages: _messages,
          onSendMessage: _sendMessage,
          onClose: () => setState(() => _isChatOpen = false),
        ),
      // Participants Panel (overlay)
      if (_isParticipantsOpen)
        ParticipantsPanel(
          participants: _participants,
          onClose: () => setState(() => _isParticipantsOpen = false),
        ),
    );
  }

  Widget _buildAppBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: Colors.black87,
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: _leaveRoom,
            color: Colors.white,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Room: $_roomCode',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  '${_participants.length + 1} participants',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.7),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          const Icon(
            Icons.circle,
            color: Colors.green,
            size: 12,
          ),
          const SizedBox(width: 4),
          const Text(
            'Live',
            style: TextStyle(color: Colors.white, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildVideoGrid() {
    final totalParticipants = _remoteStreams.length + 1;
    
    if (totalParticipants == 1) {
      return VideoRenderer(stream: _localStream, isLocal: true);
    }

    return GridView.builder(
      padding: const EdgeInsets.all(8),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: totalParticipants <= 4 ? 2 : 3,
        childAspectRatio: 0.75,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
      ),
      itemCount: totalParticipants,
      itemBuilder: (context, index) {
        if (index == 0) {
          return VideoRenderer(stream: _localStream, isLocal: true);
        }
        
        final remoteId = _remoteStreams.keys.elementAt(index - 1);
        return VideoRenderer(
          stream: _remoteStreams[remoteId],
          isLocal: false,
          participantName: 'Participant',
        );
      },
    );
  }

  @override
  void dispose() {
    _webrtcService.dispose();
    super.dispose();
  }
}
