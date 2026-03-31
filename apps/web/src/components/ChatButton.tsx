'use client';

import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import ChatPanel from './ChatPanel';
import { useChat } from '@/contexts/ChatContext';

export default function ChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { getUnreadCount } = useChat();
  const unreadCount = getUnreadCount();

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 p-4 bg-blue-600 hover:bg-blue-500 rounded-full shadow-lg hover:shadow-blue-500/50 transition-all duration-300 z-40 group"
      >
        <MessageCircle className="h-6 w-6 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {/* Tooltip */}
        <span className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-[#1e293b] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-blue-500/20">
          {isOpen ? 'Close Chat' : 'Open Chat'}
        </span>
      </button>

      {/* Chat Panel */}
      <ChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
