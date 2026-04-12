import { PrismaClient, PollStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class PollRepository {
  /**
   * Create poll
   */
  static async create(data: {
    roomId: string;
    title: string;
    options: any;
    allowMultiple: boolean;
  }) {
    return prisma.poll.create({
      data: {
        roomId: data.roomId,
        title: data.title,
        options: data.options,
        allowMultiple: data.allowMultiple,
        status: 'ACTIVE',
      },
    });
  }

  /**
   * Get poll by ID
   */
  static async getById(id: string) {
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
  static async getByRoom(roomId: string) {
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
  static async update(id: string, data: Partial<{
    title: string;
    options: any;
    allowMultiple: boolean;
    status: PollStatus;
    endsAt: Date;
  }>) {
    return prisma.poll.update({
      where: { id },
      data,
    });
  }

  /**
   * Activate poll
   */
  static async activate(id: string, endsAt?: Date) {
    return prisma.poll.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        endsAt: endsAt || new Date(Date.now() + 30 * 60 * 1000), // 30 min default
      },
    });
  }

  /**
   * End poll
   */
  static async end(id: string) {
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
  static async delete(id: string) {
    return prisma.poll.delete({
      where: { id },
    });
  }

  /**
   * Vote on poll
   */
  static async vote(pollId: string, data: {
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
  static async getResults(pollId: string) {
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        votes: true,
      },
    });

    if (!poll) {
      throw new Error('Poll not found');
    }

    // Calculate vote counts per option
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
        percentage: totalVotes > 0 ? ((voteCounts[idx] / totalVotes) * 100).toFixed(1) : '0',
      })),
    };
  }

  /**
   * Get active polls
   */
  static async getActivePolls() {
    return prisma.poll.findMany({
      where: {
        status: 'ACTIVE',
        endsAt: {
          gt: new Date(),
        },
      },
      include: {
        room: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            votes: true,
          },
        },
      },
    });
  }

  /**
   * Check if user has voted
   */
  static async hasVoted(pollId: string, userId?: string) {
    const vote = await prisma.pollVote.findFirst({
      where: {
        pollId,
        userId,
      },
    });
    return !!vote;
  }
}

export default PollRepository;
