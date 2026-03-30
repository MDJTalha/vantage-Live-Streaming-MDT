/**
 * Database Query Optimization Utilities
 * Prevents N+1 queries, optimizes includes, and manages connections
 */

import { PrismaClient } from '@prisma/client';

/**
 * Query optimization helper
 * Usage: 
 *   const users = await optimizeQuery(
 *     () => prisma.user.findMany(),
 *     { batchSize: 100, timeout: 5000 }
 *   );
 */
export async function optimizeQuery<T>(
  queryFn: () => Promise<T>,
  options: {
    batchSize?: number;
    timeout?: number;
    cache?: boolean;
  } = {}
): Promise<T> {
  const { timeout = 30000 } = options;

  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), timeout)
    );

    const result = await Promise.race([queryFn(), timeoutPromise]);
    return result as T;
  } catch (error) {
    throw new Error(`Database query failed: ${(error as Error).message}`);
  }
}

/**
 * Selective include patterns to avoid N+1 queries
 * Use these patterns instead of full includes
 */
export const IncludePatterns = {
  // User includes
  user: {
    basic: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      role: true,
    },
    withStats: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      role: true,
      _count: {
        select: {
          roomsHosted: true,
          participants: true,
          messages: true,
        },
      },
    },
  },

  // Room includes
  room: {
    basic: {
      id: true,
      roomCode: true,
      name: true,
      status: true,
      startedAt: true,
      createdAt: true,
    },
    withHost: {
      id: true,
      roomCode: true,
      name: true,
      status: true,
      host: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    withParticipants: {
      id: true,
      roomCode: true,
      name: true,
      participants: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          joinedAt: true,
          isVideoEnabled: true,
          isAudioEnabled: true,
        },
        take: 100, // Prevent loading all participants
      },
    },
    full: {
      include: {
        host: true,
        participants: {
          include: {
            user: true,
          },
          take: 100,
        },
        analytics: true,
      },
    },
  },

  // Chat message includes
  chatMessage: {
    basic: {
      id: true,
      content: true,
      messageType: true,
      createdAt: true,
    },
    withSender: {
      id: true,
      content: true,
      messageType: true,
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
      createdAt: true,
    },
    withThread: {
      id: true,
      content: true,
      messageType: true,
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
      replies: {
        select: {
          id: true,
          content: true,
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          createdAt: true,
        },
        take: 50, // Limit replies to prevent large payloads
      },
      createdAt: true,
    },
  },

  // Participant includes
  participant: {
    basic: {
      id: true,
      role: true,
      joinedAt: true,
      isVideoEnabled: true,
      isAudioEnabled: true,
    },
    withUser: {
      id: true,
      role: true,
      joinedAt: true,
      isVideoEnabled: true,
      isAudioEnabled: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    withMedia: {
      id: true,
      role: true,
      isVideoEnabled: true,
      isAudioEnabled: true,
      producers: {
        take: 10,
      },
      consumers: {
        take: 10,
      },
    },
  },
};

/**
 * Batch fetch to prevent N+1 queries
 * Usage:
 *   const users = await batchFetch(
 *     userIds,
 *     (ids) => prisma.user.findMany({ where: { id: { in: ids } } }),
 *     { batchSize: 100 }
 *   );
 */
export async function batchFetch<T, R>(
  items: T[],
  fetchFn: (items: T[]) => Promise<R[]>,
  options: { batchSize?: number } = {}
): Promise<R[]> {
  const { batchSize = 100 } = options;
  
  if (items.length === 0) return [];

  const batches = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  const results = await Promise.all(
    batches.map(batch => fetchFn(batch))
  );

  return results.flat();
}

/**
 * Map results from batch fetch
 * Usage:
 *   const userMap = mapResults(users, user => user.id);
 *   const result = items.map(item => userMap[item.userId]);
 */
export function mapResults<T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K
): Record<K, T> {
  return items.reduce((acc, item) => {
    acc[keyFn(item)] = item;
    return acc;
  }, {} as Record<K, T>);
}

/**
 * Pagination helper
 * Usage:
 *   const { skip, take } = getPaginationParams(page, pageSize);
 */
export function getPaginationParams(
  page: number = 1,
  pageSize: number = 20
): { skip: number; take: number } {
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.max(1, Math.min(100, Math.floor(pageSize)));
  
  return {
    skip: (safePage - 1) * safePageSize,
    take: safePageSize,
  };
}

/**
 * Pagination response helper
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function getPaginationMeta(
  page: number,
  pageSize: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / pageSize);
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Database connection pool configuration
 * Add to prisma client:
 *   const prisma = new PrismaClient({
 *     log: ['warn', 'error'],
 *   });
 *   
 *   // After some time
 *   await prisma.$disconnect();
 */
export const PrismaConfig = {
  // Connection pool settings for production
  production: {
    connection_limit: 10,
    socket_keep_alive: true,
    tcp_keep_alives_idle: 0,
    statement_cache_size: 25,
  },

  // Connection settings for development
  development: {
    connection_limit: 5,
    socket_keep_alive: true,
  },
};

/**
 * Transaction wrapper for atomic operations
 * Usage:
 *   const result = await withTransaction(
 *     prisma,
 *     async (tx) => {
 *       const user = await tx.user.create(...);
 *       const session = await tx.session.create(...);
 *       return { user, session };
 *     }
 *   );
 */
export async function withTransaction<T>(
  prisma: PrismaClient,
  callback: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    return callback(tx as any);
  });
}

/**
 * Soft delete helper
 * Add to schema: deletedAt DateTime? @map("deleted_at")
 */
export const SoftDeleteHelper = {
  /**
   * Include only non-deleted records
   */
  notDeleted: {
    where: { deletedAt: null },
  },

  /**
   * Include deleted records in queries
   */
  includeDeleted: {
    where: undefined,
  },

  /**
   * Mark as deleted instead of removing
   */
  delete: async (prisma: any, model: string, id: string) => {
    return prisma[model].update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  /**
   * Permanently delete
   */
  hardDelete: async (prisma: any, model: string, id: string) => {
    return prisma[model].delete({
      where: { id },
    });
  },
};

/**
 * Query performance monitoring
 */
export class QueryMonitor {
  private static queries: Map<string, { count: number; totalTime: number }> = new Map();

  static async monitor<T>(
    name: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();
    const result = await queryFn();
    const duration = Date.now() - start;

    const existing = this.queries.get(name) || { count: 0, totalTime: 0 };
    this.queries.set(name, {
      count: existing.count + 1,
      totalTime: existing.totalTime + duration,
    });

    if (duration > 1000) {
      console.warn(`[SLOW QUERY] ${name} took ${duration}ms`);
    }

    return result;
  }

  static getStats() {
    const stats: Record<string, any> = {};
    
    for (const [name, data] of this.queries) {
      stats[name] = {
        count: data.count,
        avgTime: Math.round(data.totalTime / data.count),
        totalTime: data.totalTime,
      };
    }

    return stats;
  }

  static reset() {
    this.queries.clear();
  }
}
