import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';

class VideoRenderer extends StatelessWidget {
  final MediaStream? stream;
  final bool isLocal;
  final String? participantName;

  const VideoRenderer({
    super.key,
    required this.stream,
    this.isLocal = false,
    this.participantName,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(12),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Stack(
          children: [
            // Video
            if (stream != null)
              RTCVideoView(
                stream!.getVideoTracks().isEmpty
                    ? null
                    : stream!.getVideoTracks().first,
                objectFit: RTCVideoViewObjectFit.RTCVideoViewObjectFitCover,
              )
            else
              const Center(
                child: CircularProgressIndicator(),
              ),

            // Placeholder when video is off
            if (stream == null || stream!.getVideoTracks().isEmpty)
              Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircleAvatar(
                      radius: 40,
                      backgroundColor: Colors.grey[800],
                      child: Text(
                        participantName?.substring(0, 1).toUpperCase() ?? 'U',
                        style: const TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      isLocal ? 'You' : (participantName ?? 'Participant'),
                      style: const TextStyle(color: Colors.white),
                    ),
                  ],
                ),
              ),

            // Name badge
            Positioned(
              bottom: 8,
              left: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      isLocal ? 'You' : (participantName ?? 'Participant'),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                      ),
                    ),
                    if (stream != null && stream!.getAudioTracks().isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(left: 4),
                        child: Icon(
                          stream!.getAudioTracks().first.enabled
                              ? Icons.mic
                              : Icons.mic_off,
                          size: 14,
                          color: stream!.getAudioTracks().first.enabled
                              ? Colors.green
                              : Colors.red,
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
