import 'package:flutter/material.dart';

class RoomProvider extends ChangeNotifier {
  String? _currentRoomCode;
  Map<String, dynamic>? _currentRoom;
  List<Map<String, dynamic>> _rooms = [];
  bool _isLoading = false;

  String? get currentRoomCode => _currentRoomCode;
  Map<String, dynamic>? get currentRoom => _currentRoom;
  List<Map<String, dynamic>> get rooms => _rooms;
  bool get isLoading => _isLoading;

  void setCurrentRoom(String roomCode) {
    _currentRoomCode = roomCode;
    notifyListeners();
  }

  void clearCurrentRoom() {
    _currentRoomCode = null;
    _currentRoom = null;
    notifyListeners();
  }

  void setRooms(List<Map<String, dynamic>> rooms) {
    _rooms = rooms;
    notifyListeners();
  }

  void addRoom(Map<String, dynamic> room) {
    _rooms.insert(0, room);
    notifyListeners();
  }

  void updateRoom(String roomId, Map<String, dynamic> updates) {
    final index = _rooms.indexWhere((r) => r['id'] == roomId);
    if (index != -1) {
      _rooms[index] = {..._rooms[index], ...updates};
      notifyListeners();
    }
  }

  void removeRoom(String roomId) {
    _rooms.removeWhere((r) => r['id'] == roomId);
    notifyListeners();
  }
}
