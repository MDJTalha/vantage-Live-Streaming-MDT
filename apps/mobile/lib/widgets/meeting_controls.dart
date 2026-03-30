import 'package:flutter/material.dart';

class MeetingControls extends StatelessWidget {
  final bool isAudioEnabled;
  final bool isVideoEnabled;
  final bool isScreenSharing;
  final VoidCallback onToggleAudio;
  final VoidCallback onToggleVideo;
  final VoidCallback onToggleScreenShare;
  final VoidCallback onToggleChat;
  final VoidCallback onToggleParticipants;
  final VoidCallback onLeave;

  const MeetingControls({
    super.key,
    required this.isAudioEnabled,
    required this.isVideoEnabled,
    required this.isScreenSharing,
    required this.onToggleAudio,
    required this.onToggleVideo,
    required this.onToggleScreenShare,
    required this.onToggleChat,
    required this.onToggleParticipants,
    required this.onLeave,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      color: Colors.black87,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          // Audio
          _ControlButton(
            icon: isAudioEnabled ? Icons.mic : Icons.mic_off,
            label: isAudioEnabled ? 'Mute' : 'Unmute',
            isActive: isAudioEnabled,
            onTap: onToggleAudio,
          ),

          // Video
          _ControlButton(
            icon: isVideoEnabled ? Icons.videocam : Icons.videocam_off,
            label: isVideoEnabled ? 'Stop Video' : 'Start Video',
            isActive: isVideoEnabled,
            onTap: onToggleVideo,
          ),

          // Screen Share
          _ControlButton(
            icon: Icons.screen_share,
            label: isScreenSharing ? 'Stop Share' : 'Share',
            isActive: isScreenSharing,
            onTap: onToggleScreenShare,
          ),

          // Chat
          _ControlButton(
            icon: Icons.chat_bubble_outline,
            label: 'Chat',
            isActive: false,
            onTap: onToggleChat,
          ),

          // Participants
          _ControlButton(
            icon: Icons.people_outline,
            label: 'Participants',
            isActive: false,
            onTap: onToggleParticipants,
          ),

          // Leave
          _ControlButton(
            icon: Icons.call_end,
            label: 'Leave',
            isActive: false,
            isDestructive: true,
            onTap: onLeave,
          ),
        ],
      ),
    );
  }
}

class _ControlButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final bool isDestructive;
  final VoidCallback onTap;

  const _ControlButton({
    required this.icon,
    required this.label,
    required this.isActive,
    this.isDestructive = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        GestureDetector(
          onTap: onTap,
          child: Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: isDestructive
                  ? Colors.red
                  : (isActive ? Colors.white : Colors.grey[800]),
              shape: BoxShape.circle,
            ),
            child: Icon(
              icon,
              color: isDestructive || isActive ? Colors.black : Colors.white,
              size: 28,
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            color: Colors.white,
            fontSize: 10,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}
