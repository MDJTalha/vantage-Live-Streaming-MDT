'use client';

import { useState, useRef, useEffect } from 'react';
import { Button, Input, Avatar, Badge } from '@vantage/ui';
import { 
  Send, 
  Smile, 
  Paperclip, 
  Search,
  Image,
  File,
  X
} from 'lucide-react';

interface Message {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  content: string;
  timestamp: Date;
  reactions?: Array<{ emoji: string; count: number; users: string[] }>;
  isSystem?: boolean;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onAddReaction?: (messageId: string, emoji: string) => void;
  participants?: Array<{ id: string; name: string; avatar?: string }>;
}

export function ChatPanel({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  onAddReaction,
  participants: _participants = [],
}: ChatPanelProps) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      setShowEmojiPicker(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const emojis = ['👍', '❤️', '🎉', '😂', '😢', '😮', '🔥', '👏'];

  const filteredMessages = messages.filter((msg) =>
    msg.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="w-96 h-full bg-card border-l border-border flex flex-col shadow-2xl animate-slide-in-right">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="font-bold text-lg">Chat</h3>
            <p className="text-sm text-muted-foreground">{messages.length} messages</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative" aria-label="Search messages">
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close chat panel">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-border">
        <Input
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" role="list">
        {filteredMessages.map((msg, index) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isConsecutive={
              index > 0 && messages[index - 1].userId === msg.userId
            }
            onAddReaction={onAddReaction}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border space-y-3">
        {showEmojiPicker && (
          <div className="grid grid-cols-8 gap-2 p-3 bg-muted rounded-xl mb-2 animate-scale-in">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setMessage((prev) => prev + emoji);
                  setShowEmojiPicker(false);
                  inputRef.current?.focus();
                }}
                className="text-xl hover:bg-background rounded p-1 transition-colors"
                aria-label={`Add ${emoji} emoji`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[44px] resize-none pr-12"
            />
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle emoji picker"
            >
              <Smile className="h-5 w-5" />
            </button>
          </div>
          <Button
            variant="primary"
            size="icon"
            onClick={handleSend}
            disabled={!message.trim()}
            className="h-11 w-11 rounded-xl"
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-muted-foreground" aria-label="Attach file">
            <Paperclip className="h-4 w-4 mr-1" />
            Attach
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground" aria-label="Attach image">
            <Image className="h-4 w-4 mr-1" />
            Image
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground" aria-label="Attach document">
            <File className="h-4 w-4 mr-1" />
            File
          </Button>
        </div>
      </div>
    </div>
  );
}

// Component: Message Bubble
function MessageBubble({
  message,
  isConsecutive,
  onAddReaction
}: {
  message: Message;
  isConsecutive: boolean;
  onAddReaction?: (messageId: string, emoji: string) => void;
}) {
  const [showReactions, setShowReactions] = useState(false);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (message.isSystem) {
    return (
      <div className="flex justify-center my-4">
        <Badge variant="secondary" size="sm">
          {message.content}
        </Badge>
      </div>
    );
  }

  return (
    <div
      className={`group flex gap-3 ${isConsecutive ? 'mt-1' : 'mt-4'}`}
      onMouseEnter={() => setShowReactions(true)}
      onMouseLeave={() => setShowReactions(false)}
      role="listitem"
      aria-label={`Message from ${message.name}: ${message.content}`}
    >
      {!isConsecutive ? (
        <Avatar name={message.name} src={message.avatar} size="md" />
      ) : (
        <div className="w-10" />
      )}
      
      <div className="flex-1 space-y-1">
        {!isConsecutive && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{message.name}</span>
            <span className="text-xs text-muted-foreground">
              {formatTime(message.timestamp)}
            </span>
          </div>
        )}
        
        <div className="relative">
          <div className="inline-block bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[80%]">
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {message.reactions.map((reaction, index) => (
                <button
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-background border border-border rounded-full text-xs hover:bg-muted transition-colors"
                >
                  {reaction.emoji}
                  <span className="font-medium">{reaction.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Quick Reaction Bar */}
          {showReactions && (
            <div className="absolute -top-8 right-0 flex items-center gap-1 px-2 py-1.5 bg-background border border-border rounded-full shadow-lg animate-scale-in">
              {['👍', '❤️', '🎉', '😂'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onAddReaction?.(message.id, emoji)}
                  className="text-lg hover:scale-125 transition-transform"
                  aria-label={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatPanel;
