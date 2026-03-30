import { PrismaClient, PollStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class PollRepository {
  /**
   * Create poll
   */
  static async create(data: {
    roomId: string;
    question: string;
    options: any;
    multipleChoice: boolean;
    createdBy: string;
  }) {
    return prisma.poll.create({
      data: {
        ...data,
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
  static async getByRoom(roomId: string) {
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
  static async update(id: string, data: Partial<{
    question: string;
    options: any;
    multipleChoice: boolean;
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
    optionId: string;
    userId?: string;
    guestId?: string;
  }) {
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
        ...data,
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
        options: true,
      },
    });

    if (!poll) {
      throw new Error('Poll not found');
    }

    // Calculate vote counts per option
    const options = JSON.parse(JSON.stringify(poll.options));
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
      poll: {
        id: poll.id,
        question: poll.question,
        multipleChoice: poll.multipleChoice,
        status: poll.status,
        totalVotes,
      },
      results: options.map((opt: any) => ({
        id: opt.id,
        text: opt.text,
        votes: voteCounts[opt.id],
        percentage: totalVotes > 0 ? ((voteCounts[opt.id] / totalVotes) * 100).toFixed(1) : '0',
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
            roomCode: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
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
  static async hasVoted(pollId: string, userId?: string, guestId?: string) {
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
}

export default PollRepository;
