// ============================================
// User & Authentication Types
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'participant' | 'host' | 'cohost' | 'admin';

export interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
}

// ============================================
// Room & Meeting Types
// ============================================

export interface Room {
  id: string;
  name: string;
  description?: string;
  hostId: string;
  status: RoomStatus;
  settings: RoomSettings;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  endedAt?: Date;
}

export type RoomStatus = 'scheduled' | 'active' | 'ended' | 'recorded';

export interface RoomSettings {
  maxParticipants: number;
  allowChat: boolean;
  allowScreenShare: boolean;
  allowRecording: boolean;
  requirePassword: boolean;
  password?: string;
  requireApproval: boolean;
  enableBreakoutRooms: boolean;
  enableWaitingRoom: boolean;
}

export interface RoomParticipant {
  id: string;
  roomId: string;
  userId: string;
  role: RoomRole;
  joinedAt: Date;
  leftAt?: Date;
  isSpeaking: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
}

export type RoomRole = 'host' | 'cohost' | 'participant' | 'viewer';

// ============================================
// WebRTC Types
// ============================================

export interface PeerConnection {
  peerId: string;
  roomId: string;
  producerIds: string[];
  consumerIds: string[];
  transport: any;
}

export interface Producer {
  id: string;
  peerId: string;
  kind: 'audio' | 'video';
  track: MediaStreamTrack;
  rtpParameters: any;
}

export interface Consumer {
  id: string;
  peerId: string;
  producerId: string;
  kind: 'audio' | 'video';
  rtpParameters: any;
}

// ============================================
// Chat Types
// ============================================

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  type: MessageType;
  timestamp: Date;
  reactions?: Reaction[];
}

export type MessageType = 'text' | 'emoji' | 'system' | 'file';

export interface Reaction {
  emoji: string;
  userId: string;
  timestamp: Date;
}

// ============================================
// Poll & Q&A Types
// ============================================

export interface Poll {
  id: string;
  roomId: string;
  question: string;
  options: PollOption[];
  multipleChoice: boolean;
  createdBy: string;
  createdAt: Date;
  endsAt?: Date;
  status: PollStatus;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export type PollStatus = 'draft' | 'active' | 'ended';

export interface Question {
  id: string;
  roomId: string;
  userId: string;
  content: string;
  upvotes: number;
  answered: boolean;
  createdAt: Date;
}

// ============================================
// Recording Types
// ============================================

export interface Recording {
  id: string;
  roomId: string;
  url: string;
  duration: number;
  size: number;
  status: RecordingStatus;
  createdAt: Date;
  completedAt?: Date;
}

export type RecordingStatus = 'processing' | 'completed' | 'failed';

// ============================================
// Analytics Types
// ============================================

export interface RoomAnalytics {
  roomId: string;
  totalParticipants: number;
  peakConcurrent: number;
  totalDuration: number;
  chatMessages: number;
  recordings: number;
  engagement: EngagementMetrics;
}

export interface EngagementMetrics {
  averageWatchTime: number;
  pollParticipation: number;
  questionCount: number;
  reactionCount: number;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// WebSocket Event Types
// ============================================

export interface WebSocketEvent {
  event: string;
  payload: any;
  roomId?: string;
}

export interface SignalingData {
  type: 'offer' | 'answer' | 'ice-candidate';
  data: any;
  from: string;
  to?: string;
}
