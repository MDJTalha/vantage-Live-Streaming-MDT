'use client';

import { useState } from 'react';
import { Button, Card, Badge, Input } from '@vantage/ui';
import { 
  BarChart3, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Users,
  TrendingUp,
  X
} from 'lucide-react';

interface PollOption {
  id: string;
  text: string;
  votes: number;
  percentage: number;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  status: 'active' | 'ended' | 'draft';
  createdBy: string;
  createdAt: Date;
  multipleChoice: boolean;
}

interface PollPanelProps {
  isOpen: boolean;
  onClose: () => void;
  polls: Poll[];
  onCreatePoll?: (question: string, options: string[], multipleChoice: boolean) => void;
  onVote?: (pollId: string, optionIds: string[]) => void;
  onEndPoll?: (pollId: string) => void;
  isHost?: boolean;
}

export function PollPanel({
  isOpen,
  onClose,
  polls,
  onCreatePoll,
  onVote,
  onEndPoll,
  isHost = false,
}: PollPanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [multipleChoice, setMultipleChoice] = useState(false);

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreate = () => {
    if (question.trim() && options.every((o) => o.trim())) {
      onCreatePoll?.(question, options, multipleChoice);
      setQuestion('');
      setOptions(['', '']);
      setMultipleChoice(false);
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-96 h-full bg-card border-l border-border flex flex-col shadow-2xl animate-slide-in-right">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Polls</h3>
            <p className="text-sm text-muted-foreground">{polls.length} polls</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isHost && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreating(!isCreating)}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              New
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Create Poll Form */}
      {isCreating && (
        <div className="p-4 border-b border-border bg-muted/50 space-y-4 animate-fade-in-down">
          <div>
            <label className="text-sm font-medium mb-2 block">Question</label>
            <Input
              placeholder="What would you like to ask?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Options</label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="flex-1"
                  />
                  {options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                      className="h-10 w-10"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddOption}
              className="mt-2"
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add Option
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="multipleChoice"
              checked={multipleChoice}
              onChange={(e) => setMultipleChoice(e.target.checked)}
              className="w-4 h-4 rounded border-border"
            />
            <label htmlFor="multipleChoice" className="text-sm">
              Allow multiple choices
            </label>
          </div>

          <div className="flex gap-2">
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleCreate}
              disabled={!question.trim() || options.some((o) => !o.trim())}
            >
              Create Poll
            </Button>
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Polls List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {polls.length === 0 ? (
          <EmptyState />
        ) : (
          polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              isHost={isHost}
              onVote={onVote}
              onEndPoll={onEndPoll}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Component: Poll Card
function PollCard({ 
  poll, 
  isHost, 
  onVote, 
  onEndPoll 
}: { 
  poll: Poll; 
  isHost: boolean;
  onVote?: (pollId: string, optionIds: string[]) => void;
  onEndPoll?: (pollId: string) => void;
}) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const statusColors = {
    active: 'bg-success text-success-foreground',
    ended: 'bg-muted text-foreground',
    draft: 'bg-warning text-warning-foreground',
  };

  const handleVote = () => {
    if (selectedOptions.length > 0) {
      onVote?.(poll.id, selectedOptions);
    }
  };

  return (
    <Card variant="elevated" className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold mb-2">{poll.question}</h4>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{poll.totalVotes} votes</span>
            </div>
            <Badge className={statusColors[poll.status]} size="sm">
              {poll.status === 'active' && <Clock className="h-3 w-3 mr-1" />}
              {poll.status}
            </Badge>
          </div>
        </div>
        {isHost && poll.status === 'active' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEndPoll?.(poll.id)}
          >
            End
          </Button>
        )}
      </div>

      {/* Options */}
      <div className="space-y-2">
        {poll.options.map((option) => (
          <button
            key={option.id}
            onClick={() => {
              if (poll.multipleChoice) {
                setSelectedOptions((prev) =>
                  prev.includes(option.id)
                    ? prev.filter((id) => id !== option.id)
                    : [...prev, option.id]
                );
              } else {
                setSelectedOptions([option.id]);
              }
            }}
            disabled={poll.status !== 'active'}
            className={`w-full p-3 rounded-xl border transition-all duration-200 text-left relative overflow-hidden ${
              selectedOptions.includes(option.id)
                ? 'border-primary bg-primary/10'
                : 'border-border hover:border-primary/50'
            } ${poll.status !== 'active' ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {/* Progress Bar Background */}
            {poll.totalVotes > 0 && (
              <div
                className="absolute inset-y-0 left-0 bg-primary/5 transition-all duration-500"
                style={{ width: `${option.percentage}%` }}
              />
            )}
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedOptions.includes(option.id)
                      ? 'border-primary bg-primary'
                      : 'border-border'
                  }`}
                >
                  {selectedOptions.includes(option.id) && (
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  )}
                </div>
                <span className="text-sm font-medium">{option.text}</span>
              </div>
              {poll.totalVotes > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{option.percentage}%</span>
                  <span className="text-xs text-muted-foreground">({option.votes})</span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Vote Button */}
      {poll.status === 'active' && !isHost && (
        <Button
          variant="primary"
          size="sm"
          className="w-full"
          onClick={handleVote}
          disabled={selectedOptions.length === 0 || (poll.multipleChoice && selectedOptions.length === 0)}
          leftIcon={<TrendingUp className="h-4 w-4" />}
        >
          Vote
        </Button>
      )}
    </Card>
  );
}

// Component: Empty State
function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
        <BarChart3 className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold mb-2">No polls yet</h3>
      <p className="text-sm text-muted-foreground">
        Create a poll to engage your audience
      </p>
    </div>
  );
}

export default PollPanel;
