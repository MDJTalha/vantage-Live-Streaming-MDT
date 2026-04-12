import { PrismaClient, PollStatus } from '@prisma/client';

const prisma = new PrismaClient();

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
    title: string;
    options: any[];
    allowMultiple?: boolean;
  }) {
    return prisma.poll.create({
      data: {
        roomId: data.roomId,
        title: data.title,
        options: data.options,
        allowMultiple: data.allowMultiple ?? false,
        status: 'ACTIVE',
      },
      include: {
        votes: true,
      },
    });
  }

  /**
   * Get poll by ID
   */
  static async getPollById(id: string) {
    return prisma.poll.findUnique({
      where: { id },
      include: {
        room: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        votes: true,
      },
    });
  }

  /**
   * Get polls by room
   */
  static async getPollsByRoom(roomId: string) {
    return prisma.poll.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      include: {
        votes: true,
      },
    });
  }

  /**
   * Update poll
   */
  static async updatePoll(id: string, data: {
    title?: string;
    options?: any[];
    allowMultiple?: boolean;
    status?: PollStatus;
    endsAt?: Date;
  }) {
    return prisma.poll.update({
      where: { id },
      data,
    });
  }

  /**
   * Activate poll
   */
  static async activatePoll(id: string, durationMinutes: number = 30) {
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
  static async endPoll(id: string) {
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
  static async deletePoll(id: string) {
    return prisma.poll.delete({
      where: { id },
    });
  }

  /**
   * Vote on poll
   */
  static async voteOnPoll(pollId: string, data: {
    optionIndex: number;
    userId?: string;
  }) {
    // Check if already voted
    const existingVote = await prisma.pollVote.findFirst({
      where: {
        pollId,
        userId: data.userId,
      },
    });

    if (existingVote) {
      throw new Error('Already voted on this poll');
    }

    return prisma.pollVote.create({
      data: {
        pollId,
        optionIndex: data.optionIndex,
        userId: data.userId,
      },
    });
  }

  /**
   * Get poll results
   */
  static async getPollResults(pollId: string) {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        votes: true,
      },
    });

    if (!poll) {
      throw new Error('Poll not found');
    }

    const options = poll.options as any[];
    const voteCounts: Record<number, number> = {};

    options.forEach((_opt: any, idx: number) => {
      voteCounts[idx] = 0;
    });

    poll.votes.forEach((vote) => {
      if (voteCounts[vote.optionIndex] !== undefined) {
        voteCounts[vote.optionIndex]++;
      }
    });

    const totalVotes = poll.votes.length;

    return {
      poll: {
        id: poll.id,
        title: poll.title,
        allowMultiple: poll.allowMultiple,
        status: poll.status,
        totalVotes,
      },
      results: options.map((opt: any, idx: number) => ({
        text: opt,
        votes: voteCounts[idx],
        percentage: totalVotes > 0
          ? ((voteCounts[idx] / totalVotes) * 100).toFixed(1)
          : '0',
      })),
    };
  }

  /**
   * Check if user has voted
   */
  static async hasVoted(pollId: string, userId?: string): Promise<boolean> {
    const vote = await prisma.pollVote.findFirst({
      where: {
        pollId,
        userId,
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
    content: string;
  }) {
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
  static async getQuestionsByRoom(roomId: string) {
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
  static async upvoteQuestion(questionId: string) {
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
  static async markQuestionAnswered(questionId: string) {
    return prisma.question.update({
      where: { id: questionId },
      data: {
        isAnswered: true,
      },
    });
  }

  /**
   * Delete question
   */
  static async deleteQuestion(questionId: string) {
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
