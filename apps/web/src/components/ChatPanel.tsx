'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/contexts/ChatContext';
import {
  Send,
  Users,
  MessageSquare,
  X,
  Minimize2,
  Maximize2,
  User,
  Check,
  CheckCheck,
  MessageCircle
} from 'lucide-react';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const {
    isConnected,
    messages,
    users,
    sendMessage,
    sendBroadcastMessage,
    selectedRoom,
    selectRoom,
    currentUserId,
    getUnreadCount,
  } = useChat();
  
  const [messageInput, setMessageInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isBroadcastMode, setIsBroadcastMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    if (isBroadcastMode || !selectedRoom) {
      sendBroadcastMessage(messageInput);
    } else {
      sendMessage(messageInput, selectedRoom);
    }
    
    setMessageInput('');
    inputRef.current?.focus();
  };

  const handleSelectUser = (userId: string) => {
    selectRoom(userId);
    setIsBroadcastMode(false);
  };

  const filteredMessages = selectedRoom
    ? messages.filter(m => m.senderId === selectedRoom || m.receiverId === selectedRoom || m.senderId === currentUserId)
    : messages;

  const unreadCount = getUnreadCount();

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-0 right-4 w-96 bg-[#1e293b] border border-blue-500/20 rounded-t-2xl shadow-2xl transition-all duration-300 z-50 ${isMinimized ? 'h-14' : 'h-[600px]'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-blue-500/20 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <MessageCircle className="h-5 w-5 text-blue-400" />
            {isConnected && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white">
              {isBroadcastMode ? 'Broadcast to All' : selectedRoom ? 'Direct Message' : 'Chat'}
            </h3>
            <p className="text-xs text-blue-300">
              {isConnected ? 'Connected' : 'Connecting...'} • {unreadCount > 0 && `${unreadCount} unread`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4 text-blue-300" /> : <Minimize2 className="h-4 w-4 text-blue-300" />}
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
          >
            <X className="h-4 w-4 text-red-400" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Users List */}
          <div className="p-3 border-b border-blue-500/20 max-h-32 overflow-y-auto">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-medium text-blue-300">Online Users ({users.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setIsBroadcastMode(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all ${
                  isBroadcastMode || !selectedRoom
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500/10 text-blue-300 hover:bg-blue-500/20'
                }`}
              >
                <Users className="h-3 w-3" />
                All
              </button>
              {users.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all ${
                    selectedRoom === user.id
                      ? 'bg-cyan-600 text-white'
                      : 'bg-blue-500/10 text-blue-300 hover:bg-blue-500/20'
                  }`}
                >
                  <User className="h-3 w-3" />
                  {user.name}
                  {user.online && (
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 h-[340px]">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-blue-500/30 mx-auto mb-3" />
                <p className="text-blue-300 text-sm">No messages yet</p>
                <p className="text-blue-400/60 text-xs mt-1">Start the conversation!</p>
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                      msg.senderId === currentUserId
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-blue-500/10 text-blue-100 rounded-bl-sm'
                    }`}
                  >
                    {msg.type === 'broadcast' && msg.senderId !== currentUserId && (
                      <p className="text-xs text-blue-300 mb-1">{msg.senderName}</p>
                    )}
                    <p className="text-sm">{msg.content}</p>
                    <div className="flex items-center gap-1 mt-1.5 justify-end">
                      <span className="text-xs opacity-60">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.senderId === currentUserId && (
                        msg.read ? (
                          <CheckCheck className="h-3 w-3 opacity-60" />
                        ) : (
                          <Check className="h-3 w-3 opacity-60" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-blue-500/20 bg-[#0f172a]/50">
            <div className="flex items-center gap-3">
              <input
                ref={inputRef}
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={isBroadcastMode ? "Message everyone..." : "Type a message..."}
                className="flex-1 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!messageInput.trim() || !isConnected}
                className="p-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed rounded-xl transition-colors"
              >
                <Send className="h-5 w-5 text-white" />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
