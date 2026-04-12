import { Router, Response } from 'express';
import prisma from '../db/prisma';
import AuthMiddleware from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';

const router = Router();

// ==================== GET ALL PODCASTS ====================
router.get('/', AuthMiddleware.requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const podcasts = await prisma.podcast.findMany({
      where: { userId: req.user!.userId },
      include: {
        _count: {
          select: { episodes: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const podcastList = podcasts.map(podcast => ({
      id: podcast.id,
      title: podcast.title,
      description: podcast.description,
      coverImageUrl: podcast.coverImageUrl,
      isPublished: podcast.isPublished,
      episodeCount: podcast._count.episodes,
      createdAt: podcast.createdAt,
      updatedAt: podcast.updatedAt,
    }));

    res.json({ podcasts: podcastList });
    return;
  } catch (error) {
    throw error;
  }
});

// ==================== CREATE PODCAST ====================
router.post('/', AuthMiddleware.requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, coverImageUrl } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const podcast = await prisma.podcast.create({
      data: {
        userId: req.user!.userId,
        title,
        description: description || null,
        coverImageUrl: coverImageUrl || null,
      },
    });

    res.status(201).json({
      id: podcast.id,
      title: podcast.title,
      description: podcast.description,
      coverImageUrl: podcast.coverImageUrl,
      isPublished: podcast.isPublished,
      createdAt: podcast.createdAt,
      updatedAt: podcast.updatedAt,
    });
    return;
  } catch (error) {
    throw error;
  }
});

// ==================== GET PODCAST BY ID ====================
router.get('/:id', AuthMiddleware.requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const podcast = await prisma.podcast.findUnique({
      where: { id },
      include: {
        episodes: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!podcast) {
      return res.status(404).json({ error: 'Podcast not found' });
    }

    // Verify ownership
    if (podcast.userId !== req.user!.userId) {
      return res.status(403).json({ error: 'Not authorized to access this podcast' });
    }

    res.json({
      id: podcast.id,
      title: podcast.title,
      description: podcast.description,
      coverImageUrl: podcast.coverImageUrl,
      isPublished: podcast.isPublished,
      episodes: podcast.episodes.map(ep => ({
        id: ep.id,
        title: ep.title,
        description: ep.description,
        audioUrl: ep.audioUrl,
        videoUrl: ep.videoUrl,
        duration: ep.duration,
        episodeNumber: ep.episodeNumber,
        seasonNumber: ep.seasonNumber,
        isPublished: ep.isPublished,
        publishedAt: ep.publishedAt,
        viewCount: ep.viewCount,
        likeCount: ep.likeCount,
        createdAt: ep.createdAt,
        updatedAt: ep.updatedAt,
      })),
      createdAt: podcast.createdAt,
      updatedAt: podcast.updatedAt,
    });
    return;
  } catch (error) {
    throw error;
  }
});

// ==================== UPDATE PODCAST ====================
router.patch('/:id', AuthMiddleware.requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const podcast = await prisma.podcast.findUnique({ where: { id } });

    if (!podcast) {
      return res.status(404).json({ error: 'Podcast not found' });
    }

    if (podcast.userId !== req.user!.userId) {
      return res.status(403).json({ error: 'Not authorized to update this podcast' });
    }

    const updated = await prisma.podcast.update({
      where: { id },
      data: updateData,
    });

    res.json({
      id: updated.id,
      title: updated.title,
      description: updated.description,
      coverImageUrl: updated.coverImageUrl,
      isPublished: updated.isPublished,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
    return;
  } catch (error) {
    throw error;
  }
});

// ==================== DELETE PODCAST ====================
router.delete('/:id', AuthMiddleware.requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const podcast = await prisma.podcast.findUnique({ where: { id } });

    if (!podcast) {
      return res.status(404).json({ error: 'Podcast not found' });
    }

    if (podcast.userId !== req.user!.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this podcast' });
    }

    await prisma.podcast.delete({ where: { id } });

    res.status(204).send();
    return;
  } catch (error) {
    throw error;
  }
});

// ==================== GET EPISODES ====================
router.get('/:id/episodes', AuthMiddleware.requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const podcast = await prisma.podcast.findUnique({ where: { id } });

    if (!podcast) {
      return res.status(404).json({ error: 'Podcast not found' });
    }

    if (podcast.userId !== req.user!.userId) {
      return res.status(403).json({ error: 'Not authorized to access this podcast' });
    }

    const episodes = await prisma.episode.findMany({
      where: { podcastId: id },
      orderBy: { createdAt: 'desc' }
    });

    const episodeList = episodes.map(ep => ({
      id: ep.id,
      title: ep.title,
      description: ep.description,
      audioUrl: ep.audioUrl,
      videoUrl: ep.videoUrl,
      duration: ep.duration,
      episodeNumber: ep.episodeNumber,
      seasonNumber: ep.seasonNumber,
      isPublished: ep.isPublished,
      publishedAt: ep.publishedAt,
      viewCount: ep.viewCount,
      likeCount: ep.likeCount,
      createdAt: ep.createdAt,
      updatedAt: ep.updatedAt,
    }));

    res.json({ episodes: episodeList });
    return;
  } catch (error) {
    throw error;
  }
});

// ==================== CREATE EPISODE ====================
router.post('/:id/episodes', AuthMiddleware.requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, episodeNumber, seasonNumber } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const podcast = await prisma.podcast.findUnique({ where: { id } });

    if (!podcast) {
      return res.status(404).json({ error: 'Podcast not found' });
    }

    if (podcast.userId !== req.user!.userId) {
      return res.status(403).json({ error: 'Not authorized to add episodes to this podcast' });
    }

    // Calculate episode number if not provided
    const epNumber = episodeNumber ?? (await prisma.episode.count({ where: { podcastId: id } })) + 1;
    const seasonNum = seasonNumber ?? 1;

    const episode = await prisma.episode.create({
      data: {
        podcastId: id,
        title,
        description: description || null,
        episodeNumber: epNumber,
        seasonNumber: seasonNum,
      },
    });

    res.status(201).json({
      id: episode.id,
      title: episode.title,
      description: episode.description,
      audioUrl: episode.audioUrl,
      videoUrl: episode.videoUrl,
      duration: episode.duration,
      episodeNumber: episode.episodeNumber,
      seasonNumber: episode.seasonNumber,
      isPublished: episode.isPublished,
      publishedAt: episode.publishedAt,
      viewCount: episode.viewCount,
      likeCount: episode.likeCount,
      createdAt: episode.createdAt,
      updatedAt: episode.updatedAt,
    });
    return;
  } catch (error) {
    throw error;
  }
});

export default router;
