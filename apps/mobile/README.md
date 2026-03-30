# VANTAGE Mobile App Guide

## Overview

VANTAGE mobile app is built with Flutter for cross-platform iOS and Android support.

## Setup

### Prerequisites

- Flutter SDK >= 3.0.0
- Dart >= 3.0.0
- Xcode (for iOS)
- Android Studio (for Android)

### Installation

```bash
cd apps/mobile

# Get dependencies
flutter pub get

# Run on device
flutter run

# Build for release
flutter build apk --release  # Android
flutter build ios --release  # iOS
```

## Project Structure

```
apps/mobile/
├── lib/
│   ├── main.dart              # App entry point
│   ├── screens/
│   │   ├── splash_screen.dart
│   │   ├── login_screen.dart
│   │   ├── home_screen.dart
│   │   └── room_screen.dart
│   ├── widgets/
│   │   ├── video_renderer.dart
│   │   ├── meeting_controls.dart
│   │   ├── chat_panel.dart
│   │   └── participants_panel.dart
│   ├── services/
│   │   ├── webrtc_service.dart
│   │   ├── api_service.dart
│   │   └── notification_service.dart
│   ├── providers/
│   │   ├── auth_provider.dart
│   │   ├── room_provider.dart
│   │   └── webrtc_provider.dart
│   └── models/
├── assets/
├── pubspec.yaml
└── analysis_options.yaml
```

## Features

### Video Conferencing
- HD video calls
- Audio/video toggle
- Screen sharing
- Multiple participants grid

### Real-time Chat
- In-meeting messaging
- Emoji reactions
- Message history

### Notifications
- Push notifications via Firebase
- Local notifications
- Meeting reminders

## Configuration

### Android

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

### iOS

Add to `ios/Runner/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>VANTAGE needs camera access for video calls</string>
<key>NSMicrophoneUsageDescription</key>
<string>VANTAGE needs microphone access for audio calls</string>
```

## State Management

Uses Provider pattern for state management:

- `AuthProvider` - User authentication
- `RoomProvider` - Room state
- `WebRTCProvider` - WebRTC connection

## API Integration

```dart
final apiService = ApiService();

// Login
await apiService.login('email@example.com', 'password');

// Create room
await apiService.createRoom(name: 'My Meeting');

// Join room
await apiService.joinRoom('room-code');
```

## WebRTC Integration

```dart
final webrtcService = WebRTCService();

// Get local media
final stream = await webrtcService.getUserMedia(
  audio: true,
  video: {'facingMode': 'user'},
);

// Create peer connection
final pc = await webrtcService.createPeerConnection(
  configuration,
  constraints,
);

// Send/receive offers
final offer = await pc.createOffer();
await pc.setLocalDescription(offer);
```

## Push Notifications

```dart
await NotificationService.initialize();

// Get FCM token
final token = await NotificationService.getFCMToken();

// Subscribe to topic
await NotificationService.subscribeToTopic('meetings');
```

## Building for Production

### Android

```bash
flutter build apk --release --split-per-abi
```

### iOS

```bash
flutter build ios --release
```

Then archive in Xcode.

## Testing

```bash
# Run tests
flutter test

# Run with coverage
flutter test --coverage
```

## Troubleshooting

### Camera/Permissions

Ensure permissions are granted in app settings.

### WebRTC Issues

Check network connectivity and STUN/TURN server configuration.

### Build Errors

Run `flutter clean` and `flutter pub get`.
