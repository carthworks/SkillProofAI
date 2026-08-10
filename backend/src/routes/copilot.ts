import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';
import { streamCopilotChat } from '../services/llmService';
import { copilotRateLimiter } from '../middleware/rateLimiter';
import redis from '../services/redis';

const router = Router();
const prisma = new PrismaClient();

router.post('/chat', requireAuth, copilotRateLimiter, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId || 'usr-1';

    const chatSchema = z.object({
      messages: z.array(z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().max(2000), // Protect against large prompt injection
      })).max(50),
      currentPage: z.string().optional(),
      mode: z.string().optional().default('mentor'),
    });

    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid payload format', details: parsed.error.issues });
    }

    const { messages, currentPage, mode } = parsed.data;

    // Fetch user or construct fallback for demo/mock users
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        submissions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        }
      }
    }).catch(() => null);

    const profile = user
      ? { name: user.name, domain: user.domain, tier: user.tier }
      : { name: 'Developer', domain: 'cse', tier: 'Explorer' };
    const lastSubmissionScore = user?.submissions?.[0]?.score ?? null;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = streamCopilotChat(
      messages,
      {
        profile,
        currentPage: currentPage || 'Unknown',
        lastSubmissionScore,
      },
      mode
    );

    let fullResponse = '';

    for await (const chunk of stream) {
      fullResponse += chunk;
      // SSE format: data: <content>\n\n
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();

    // Persist conversation history to Redis
    try {
      const historyKey = `copilot:history:${userId}`;
      const newMessages = [
        ...messages,
        { role: 'assistant', content: fullResponse }
      ];
      await redis.setex(historyKey, 86400, JSON.stringify(newMessages));
    } catch (err: any) {
      console.warn('[Copilot] Failed to cache conversation history to Redis:', err.message);
    }

  } catch (err: any) {
    console.error('Copilot chat error:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Internal server error', message: err?.message });
    }
    res.end();
  }
});

export default router;
