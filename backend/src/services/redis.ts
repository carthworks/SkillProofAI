import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL ?? 'redis://:redis_dev_secret@127.0.0.1:6380';

const redis = new Redis(redisUrl, {
  family:               4, // Force IPv4 to prevent Windows dual-stack socket aborts
  maxRetriesPerRequest: null,
  enableOfflineQueue:   true,
  keepAlive:            10000,
  retryStrategy: (times) => Math.min(times * 200, 3000),
});

redis.on('connect', () => {
  console.log('[Redis] Connected successfully');
});

redis.on('error', (err: any) => {
  if (
    err.code === 'ECONNREFUSED' ||
    err.code === 'ENOTFOUND' ||
    err.code === 'ECONNABORTED' ||
    err.code === 'ECONNRESET' ||
    err.message?.includes('ECONNABORTED') ||
    err.message?.includes('ECONNRESET')
  ) {
    return;
  }
  console.error('[Redis] Client error:', err.message);
});

export default redis;
