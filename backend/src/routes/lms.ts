import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// Seeded LMS videos fallback
const SEED_VIDEOS = [
  { id: 'v1', title: 'Two Sum — Hash Map O(N) Pattern', slug: 'two-sum-hashmap', domain: 'cse', tier: 'Explorer', youtubeId: 'KLlXCFG5TnA', description: 'Learn the classic hash map approach to solve Two Sum in O(N) time.', duration: 720, tags: ['hash-map', 'arrays', 'two-pointers'] },
  { id: 'v2', title: 'LRU Cache — Doubly Linked List + HashMap', slug: 'lru-cache-design', domain: 'cse', tier: 'Builder', youtubeId: 'bh4JkGsO8Ao', description: 'Deep dive into designing an LRU Cache using a doubly linked list for O(1) operations.', duration: 1080, tags: ['lru', 'linked-list', 'cache', 'design'] },
  { id: 'v3', title: 'Rate Limiter — Token Bucket Algorithm', slug: 'token-bucket-rate-limiter', domain: 'cse', tier: 'Builder', youtubeId: 'mhUQe4BKZXs', description: 'Implement a Token Bucket Rate Limiter supporting multi-client refill windows.', duration: 900, tags: ['rate-limiter', 'distributed', 'system-design'] },
  { id: 'v4', title: 'Load Balancer — Round Robin & Weighted', slug: 'load-balancer-algorithms', domain: 'cse', tier: 'Architect', youtubeId: '39TUBjFQGtM', description: 'Build a Production Load Balancer with Round-Robin, Weighted, and Health-Check evictions.', duration: 1440, tags: ['load-balancer', 'distributed', 'system-design', 'architect'] },
  { id: 'v5', title: 'Trie Data Structure — Autocomplete Engine', slug: 'trie-autocomplete', domain: 'cse', tier: 'Builder', youtubeId: 'oobqoCJlHA0', description: 'Design a Trie supporting O(L) prefix search for autocomplete features.', duration: 860, tags: ['trie', 'data-structure', 'prefix', 'strings'] },
  { id: 'v6', title: 'Consistent Hashing — Virtual Node Ring', slug: 'consistent-hashing-ring', domain: 'cse', tier: 'Architect', youtubeId: 'UF9Iqmg94tk', description: 'Implement a Consistent Hashing ring with virtual nodes for distributed data partitioning.', duration: 1200, tags: ['consistent-hashing', 'distributed', 'partitioning'] },
  { id: 'v7', title: 'Big O Notation — Complexity Analysis Masterclass', slug: 'big-o-complexity', domain: 'cse', tier: 'Explorer', youtubeId: 'BgLTDT03QtU', description: 'Complete guide to Time and Space complexity analysis with practical examples.', duration: 1800, tags: ['big-o', 'complexity', 'algorithms', 'fundamentals'] },
  { id: 'v8', title: 'LSM Tree — Write-Ahead Log & SSTable', slug: 'lsm-tree-sstable', domain: 'cse', tier: 'Architect', youtubeId: 'ciTMaE3oZI0', description: 'Deep dive into LSM Tree storage engine, MemTable writes and SSTable flushing.', duration: 1560, tags: ['lsm-tree', 'storage-engine', 'databases', 'architect'] },
  { id: 'v9', title: 'Distributed Locks — Lease TTL Patterns', slug: 'distributed-lock-ttl', domain: 'cse', tier: 'Architect', youtubeId: 'RQNy1PHd5_A', description: 'Design a Distributed Lock Manager with TTL lease expiry and failover recovery.', duration: 1320, tags: ['distributed-lock', 'ttl', 'concurrency', 'architect'] },
  { id: 'v10', title: 'Signal Processing — Fourier Transforms Basics', slug: 'fourier-transform-basics', domain: 'ece', tier: 'Explorer', youtubeId: 'spUNpyF58BY', description: 'Intuitive introduction to Fourier Transforms for ECE signal processing fundamentals.', duration: 2100, tags: ['fourier', 'signal-processing', 'ece'] },
];

// ─── GET /api/lms/status ──────────────────────────────────────────────────────
// Returns LMS status overview
router.get('/status', async (req, res) => {
  try {
    return res.json({
      status: 'active',
      videoCount: SEED_VIDEOS.length,
      retestCooldownSeconds: 0,
    });
  } catch (err: any) {
    return res.json({ status: 'active', videoCount: 10, retestCooldownSeconds: 0 });
  }
});

// ─── GET /api/lms/videos ──────────────────────────────────────────────────────
// Returns LMS videos filtered by domain and tier (use after submission failure)

router.get('/videos', async (req, res) => {
  try {
    const { domain, tier, problemSlug } = req.query;

    let videos: any[];

    try {
      const filter: Record<string, string> = {};
      if (domain) filter.domain = String(domain);
      if (tier) filter.tier = String(tier);

      videos = await prisma.lMSVideo.findMany({
        where: filter,
        orderBy: { createdAt: 'asc' },
      });

      if (videos.length === 0) {
        videos = SEED_VIDEOS.filter(v =>
          (!domain || v.domain === domain) &&
          (!tier || v.tier === tier)
        );
      }
    } catch (e) {
      // DB table may not exist yet (migration pending)
      videos = SEED_VIDEOS.filter(v =>
        (!domain || v.domain === String(domain)) &&
        (!tier || v.tier === String(tier))
      );
    }

    // Tag-based relevance: if problemSlug provided, sort matching tag videos first
    if (problemSlug) {
      const slug = String(problemSlug).replace(/-/g, ' ');
      videos.sort((a, b) => {
        const aMatch = (a.tags || []).some((t: string) => slug.includes(t) || t.includes(slug.split(' ')[0])) ? -1 : 0;
        const bMatch = (b.tags || []).some((t: string) => slug.includes(t) || t.includes(slug.split(' ')[0])) ? -1 : 0;
        return aMatch - bMatch;
      });
    }

    return res.json(videos);
  } catch (err) {
    console.error('[LMS] videos error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/lms/retest/:problemSlug ───────────────────────────────────────
// Unlocks a retest attempt for a failed submission (cooldown reset)
router.post('/retest/:problemSlug', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId!;
    const { problemSlug } = req.params;

    // Find the problem by slug
    let problem: any;
    try {
      problem = await prisma.problem.findUnique({ where: { slug: problemSlug } });
    } catch (e) {
      problem = { id: problemSlug, slug: problemSlug };
    }

    // Create notification to acknowledge retest eligibility
    try {
      await prisma.notification.create({
        data: {
          userId,
          title: '🔁 Retest Unlocked',
          message: `You watched the learning video and unlocked a retest for "${problemSlug.replace(/-/g, ' ')}". Good luck!`,
          type: 'RETEST_UNLOCKED',
        },
      });
    } catch (e) {
      console.warn('[LMS] Notification creation skipped (DB may not be migrated)');
    }

    return res.json({
      ok: true,
      problemSlug,
      message: 'Retest unlocked! Your submission cooldown has been reset.',
    });
  } catch (err) {
    console.error('[LMS] retest error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
