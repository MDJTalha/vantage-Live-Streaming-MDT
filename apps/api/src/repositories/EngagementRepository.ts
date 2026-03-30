import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface Poll {
  id: string;
  roomId: string;
  question: string;
  options: any;
  multipleChoice: boolean;
  createdBy: string;
  status: string;
  createdAt: Date;
  endsAt?: Date;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  votes: PollVote[];
}

export interface PollVote {
  id: string;
  pollId: string;
  optionId: string;
  userId?: string;
  guestId?: string;
  createdAt: Date;
}

export interface Question {
  id: string;
  roomId: string;
  userId?: string;
  guestName?: string;
  content: string;
  upvotes: number;
  answered: boolean;
  createdAt: Date;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

/**
 * Poll & Q&A Repository
 */
export class EngagementRepository {
  // ============================================
  // Poll Methods
  // ============================================

  /**
   * Create poll
   */
  static async createPoll(data: {
    roomId: string;
    question: string;
    options: any[];
    multipleChoice: boolean;
    createdBy: string;
  }): Promise<Poll> {
    return prisma.poll.create({
      data: {
        roomId: data.roomId,
        question: data.question,
        options: JSON.stringify(data.options),
        multipleChoice: data.multipleChoice,
        createdBy: data.createdBy,
        status: 'DRAFT',
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        votes: true,
      },
    });
  }

  /**
   * Get poll by ID
   */
  static async getPollById(id: string): Promise<Poll | null> {
    return prisma.poll.findUnique({
      where: { id },
      include: {
        room: {
          select: {
            id: true,
            name: true,
            roomCode: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        votes: true,
      },
    });
  }

  /**
   * Get polls by room
   */
  static async getPollsByRoom(roomId: string): Promise<Poll[]> {
    return prisma.poll.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        votes: true,
      },
    });
  }

  /**
   * Update poll
   */
  static async updatePoll(id: string, data: {
    question?: string;
    options?: any[];
    multipleChoice?: boolean;
    status?: string;
    endsAt?: Date;
  }): Promise<Poll> {
    return prisma.poll.update({
      where: { id },
      data,
    });
  }

  /**
   * Activate poll
   */
  static async activatePoll(id: string, durationMinutes: number = 30): Promise<Poll> {
    return prisma.poll.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        endsAt: new Date(Date.now() + durationMinutes * 60 * 1000),
      },
    });
  }

  /**
   * End poll
   */
  static async endPoll(id: string): Promise<Poll> {
    return prisma.poll.update({
      where: { id },
      data: {
        status: 'ENDED',
      },
    });
  }

  /**
   * Delete poll
   */
  static async deletePoll(id: string): Promise<Poll> {
    return prisma.poll.delete({
      where: { id },
    });
  }

  /**
   * Vote on poll
   */
  static async voteOnPoll(pollId: string, data: {
    optionId: string;
    userId?: string;
    guestId?: string;
  }): Promise<PollVote> {
    // Check if already voted
    const existingVote = await prisma.pollVote.findFirst({
      where: {
        pollId,
        OR: [
          { userId: data.userId },
          { guestId: data.guestId },
        ],
      },
    });

    if (existingVote) {
      throw new Error('Already voted on this poll');
    }

    return prisma.pollVote.create({
      data: {
        pollId,
        optionId: data.optionId,
        userId: data.userId,
        guestId: data.guestId,
      },
    });
  }

  /**
   * Get poll results
   */
  static async getPollResults(pollId: string): Promise<{
    poll: Poll;
    results: Array<{
      id: string;
      text: string;
      votes: number;
      percentage: string;
    }>;
  }> {
    const poll = await this.getPollById(pollId);
    
    if (!poll) {
      throw new Error('Poll not found');
    }

    const options = JSON.parse(poll.options);
    const voteCounts: Record<string, number> = {};

    options.forEach((opt: any) => {
      voteCounts[opt.id] = 0;
    });

    poll.votes.forEach((vote) => {
      if (voteCounts[vote.optionId] !== undefined) {
        voteCounts[vote.optionId]++;
      }
    });

    const totalVotes = poll.votes.length;

    return {
      poll,
      results: options.map((opt: any) => ({
        id: opt.id,
        text: opt.text,
        votes: voteCounts[opt.id],
        percentage: totalVotes > 0 
          ? ((voteCounts[opt.id] / totalVotes) * 100).toFixed(1) 
          : '0',
      })),
    };
  }

  /**
   * Check if user has voted
   */
  static async hasVoted(pollId: string, userId?: string, guestId?: string): Promise<boolean> {
    const vote = await prisma.pollVote.findFirst({
      where: {
        pollId,
        OR: [
          { userId },
          { guestId },
        ],
      },
    });
    return !!vote;
  }

  // ============================================
  // Question (Q&A) Methods
  // ============================================

  /**
   * Create question
   */
  static async createQuestion(data: {
    roomId: string;
    userId?: string;
    guestName?: string;
    content: string;
  }): Promise<Question> {
    return prisma.question.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Get questions by room
   */
  static async getQuestionsByRoom(roomId: string): Promise<Question[]> {
    return prisma.question.findMany({
      where: { roomId },
      orderBy: [
        { upvotes: 'desc' },
        { createdAt: 'asc' },
      ],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  /**
   * Upvote question
   */
  static async upvoteQuestion(questionId: string): Promise<Question> {
    return prisma.question.update({
      where: { id: questionId },
      data: {
        upvotes: { increment: 1 },
      },
    });
  }

  /**
   * Mark question as answered
   */
  static async markQuestionAnswered(questionId: string): Promise<Question> {
    return prisma.question.update({
      where: { id: questionId },
      data: {
        answered: true,
      },
    });
  }

  /**
   * Delete question
   */
  static async deleteQuestion(questionId: string): Promise<Question> {
    return prisma.question.delete({
      where: { id: questionId },
    });
  }

  /**
   * Get question count for room
   */
  static async getQuestionCount(roomId: string): Promise<number> {
    return prisma.question.count({
      where: { roomId },
    });
  }
}

export default EngagementRepository;
