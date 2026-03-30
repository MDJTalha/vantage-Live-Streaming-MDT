import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class WebRTCProvider extends ChangeNotifier {
  IO.Socket? _socket;
  bool _isConnected = false;
  String? _roomId;
  List<Map<String, dynamic>> _participants = [];

  IO.Socket? get socket => _socket;
  bool get isConnected => _isConnected;
  String? get roomId => _roomId;
  List<Map<String, dynamic>> get participants => _participants;

  void connect(String roomId) {
    _roomId = roomId;
    
    _socket = IO.io(
      'http://localhost:4000',
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .build(),
    );

    _socket!.connect();

    _socket!.onConnect((_) {
      _isConnected = true;
      notifyListeners();
      
      // Join room
      _socket!.emit('join-room', {'roomId': roomId});
    });

    _socket!.onDisconnect((_) {
      _isConnected = false;
      notifyListeners();
    });

    _socket!.on('user-joined', (data) {
      _participants.add(data);
      notifyListeners();
    });

    _socket!.on('user-left', (data) {
      _participants.removeWhere((p) => p['id'] == data['id']);
      notifyListeners();
    });
  }

  void disconnect() {
    if (_roomId != null) {
      _socket?.emit('leave-room', {'roomId': _roomId});
    }
    _socket?.disconnect();
    _socket = null;
    _isConnected = false;
    _roomId = null;
    _participants = [];
    notifyListeners();
  }

  void sendMessage(String content) {
    if (_socket != null && _roomId != null) {
      _socket!.emit('send-message', {
        'roomId': _roomId,
        'content': content,
        'type': 'text',
      });
    }
  }

  void sendSignal(String type, Map<String, dynamic> data) {
    if (_socket != null) {
      _socket!.emit(type, data);
    }
  }
}
