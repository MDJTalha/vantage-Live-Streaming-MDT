'use client';

import { useState } from 'react';
import { Button, Card, Avatar, Input } from '@vantage/ui';
import { 
  MessageSquare, 
  ThumbsUp, 
  Check,
  MoreVertical,
  X,
  Send,
  MessageCircle,
  TrendingUp
} from 'lucide-react';

interface Question {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  upvotes: number;
  isAnswered: boolean;
  createdAt: Date;
  answer?: string;
  answeredBy?: string;
}

interface QnAPanelProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  onAskQuestion?: (content: string) => void;
  onUpvote?: (questionId: string) => void;
  onMarkAnswered?: (questionId: string, answer: string) => void;
  isHost?: boolean;
}

export function QnAPanel({
  isOpen,
  onClose,
  questions,
  onAskQuestion,
  onUpvote,
  onMarkAnswered,
  isHost = false,
}: QnAPanelProps) {
  const [question, setQuestion] = useState('');
  const [filter, setFilter] = useState<'all' | 'answered' | 'unanswered' | 'trending'>('all');
  const [_answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');

  const handleAsk = () => {
    if (question.trim()) {
      onAskQuestion?.(question.trim());
      setQuestion('');
    }
  };

  const handleMarkAnswered = (questionId: string) => {
    if (answerText.trim()) {
      onMarkAnswered?.(questionId, answerText.trim());
      setAnsweringId(null);
      setAnswerText('');
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (filter === 'answered') return q.isAnswered;
    if (filter === 'unanswered') return !q.isAnswered;
    if (filter === 'trending') return q.upvotes >= 3;
    return true;
  });

  const sortedQuestions = [...filteredQuestions].sort((a, b) => {
    if (filter === 'trending') return b.upvotes - a.upvotes;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (!isOpen) return null;

  return (
    <div className="w-96 h-full bg-card border-l border-border flex flex-col shadow-2xl animate-slide-in-right">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Q&A</h3>
            <p className="text-sm text-muted-foreground">
              {questions.filter((q) => !q.isAnswered).length} unanswered
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-1">
          <TabButton active={filter === 'all'} onClick={() => setFilter('all')}>
            All
          </TabButton>
          <TabButton active={filter === 'trending'} onClick={() => setFilter('trending')}>
            <TrendingUp className="h-3 w-3 mr-1" />
            Trending
          </TabButton>
          <TabButton active={filter === 'unanswered'} onClick={() => setFilter('unanswered')}>
            Unanswered
          </TabButton>
          <TabButton active={filter === 'answered'} onClick={() => setFilter('answered')}>
            Answered
          </TabButton>
        </div>
      </div>

      {/* Ask Question */}
      <div className="p-4 border-b border-border">
        <div className="flex gap-2">
          <Input
            placeholder="Ask a question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
            className="flex-1"
          />
          <Button
            variant="primary"
            size="icon"
            onClick={handleAsk}
            disabled={!question.trim()}
            className="h-11 w-11 rounded-xl"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Questions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sortedQuestions.length === 0 ? (
          <EmptyState />
        ) : (
          sortedQuestions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              isHost={isHost}
              onUpvote={() => onUpvote?.(q.id)}
              answerText={answerText}
              onAnswerTextChange={setAnswerText}
              onSubmitAnswer={() => handleMarkAnswered(q.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Component: Question Card
function QuestionCard({
  question,
  isHost,
  onUpvote,
  answerText,
  onAnswerTextChange,
  onSubmitAnswer,
}: {
  question: Question;
  isHost: boolean;
  onUpvote: () => void;
  answerText: string;
  onAnswerTextChange: (text: string) => void;
  onSubmitAnswer: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card variant="elevated" className="p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Avatar name={question.userName} src={question.userAvatar} size="md" />
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium leading-relaxed">{question.content}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span>{question.userName}</span>
                <span>•</span>
                <span>{formatTime(question.createdAt)}</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>

          {/* Upvote Button */}
          <button
            onClick={onUpvote}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 ${
              question.upvotes > 0
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <ThumbsUp className="h-4 w-4" />
            <span className="text-sm font-medium">{question.upvotes}</span>
            <span className="text-xs text-muted-foreground">upvotes</span>
          </button>

          {/* Answer Status */}
          {question.isAnswered ? (
            <div className="bg-success/10 border border-success/30 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2 text-success">
                <Check className="h-4 w-4" />
                <span className="text-sm font-medium">Answered</span>
              </div>
              {question.answer && (
                <p className="text-sm text-muted-foreground">{question.answer}</p>
              )}
            </div>
          ) : isHost && isExpanded ? (
            <div className="space-y-2 animate-fade-in-up">
              <Input
                placeholder="Type your answer..."
                value={answerText}
                onChange={(e) => onAnswerTextChange(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onSubmitAnswer}
                  disabled={!answerText.trim()}
                  className="flex-1"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Post Answer
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : !question.isAnswered && isHost ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="w-full"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Answer Question
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

// Component: Tab Button
function TabButton({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-primary text-white shadow-md'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      {children}
    </button>
  );
}

// Component: Empty State
function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
        <MessageSquare className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold mb-2">No questions yet</h3>
      <p className="text-sm text-muted-foreground">
        Be the first to ask a question
      </p>
    </div>
  );
}

// Helper: Format Time
function formatTime(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

export default QnAPanel;
