import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor (Auto refresh on 401)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Ignore if not a 401, or if it was a login/register request
    if (
      !error.response ||
      error.response.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register')
    ) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes('/auth/refresh')) {
      // The refresh request itself failed -> logout user
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login?expired=true';
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      window.location.href = '/login';
      isRefreshing = false;
      return Promise.reject(error);
    }

    try {
      const response = await axios.post(
        `${api.defaults.baseURL}/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const { accessToken } = response.data;
      localStorage.setItem('accessToken', accessToken);

      api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      processQueue(null, accessToken);
      isRefreshing = false;

      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login?expired=true';
      isRefreshing = false;
      return Promise.reject(refreshError);
    }
  }
);

export default api;

// ─── Interfaces ─────────────────────────────────────────────────────────────
export interface TestCase {
  // Backend DB format
  input?: string;
  expected?: string;
  // Frontend mock format (normalized field names)
  stdin?: string;
  expectedStdout?: string;
  description?: string;
}

export interface Problem {
  id: string;
  title: string;
  slug: string;
  description: string;
  tier: 'Explorer' | 'Apprentice' | 'Builder' | 'Master';
  domain: 'cse' | 'ece';
  reward: number;
  publicTestCases: TestCase[] | null;
  createdAt: string;
  _count?: {
    submissions: number;
  };
}

export interface Submission {
  id: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'BLOCKED';
  score?: number;
  language?: string;
  nextAllowedAt?: string;
  feedback?: any;
  createdAt: string;
  problem: {
    id: string;
    title: string;
    slug: string;
    tier: string;
  };
}

export const MOCK_PROBLEMS: Problem[] = [
  {
    id: 'mock-p1',
    title: 'Two Sum',
    slug: 'two-sum',
    tier: 'Explorer',
    domain: 'cse',
    reward: 100,
    description: `## Problem Statement

Given an array of integers \`nums\` and an integer \`target\`, return **indices** of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

## Constraints
- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i] <= 10^9\`
- \`-10^9 <= target <= 10^9\`

## Examples

**Example 1:**
\`\`\`
Input: nums = [2, 7, 11, 15], target = 9
Output: [0, 1]
\`\`\`

**Example 2:**
\`\`\`
Input: nums = [3, 2, 4], target = 6
Output: [1, 2]
\`\`\``,
    publicTestCases: [
      { stdin: '4\n2 7 11 15\n9', expectedStdout: '0 1', description: 'Basic pair at start' },
      { stdin: '3\n3 2 4\n6', expectedStdout: '1 2', description: 'Pair in middle' },
      { stdin: '2\n3 3\n6', expectedStdout: '0 1', description: 'Duplicate elements' },
    ],
    createdAt: new Date().toISOString(),
    _count: { submissions: 42 },
  },
  {
    id: 'mock-p2',
    title: 'LRU Cache',
    slug: 'lru-cache',
    tier: 'Builder',
    domain: 'cse',
    reward: 250,
    description: `## Problem Statement

Design a data structure that follows the constraints of a **Least Recently Used (LRU) cache**.

Implement the \`LRUCache\` class:
- \`LRUCache(int capacity)\` — Initialize the LRU cache with positive size \`capacity\`.
- \`int get(int key)\` — Return the value of the \`key\` if it exists, otherwise return \`-1\`.
- \`void put(int key, int value)\` — Update or insert key-value pair. Evict the least recently used key if capacity is exceeded.

## Constraints
- \`1 <= capacity <= 3000\``,
    publicTestCases: [
      {
        stdin: '2\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2\nput 4 4\nget 1\nget 3\nget 4',
        expectedStdout: '1 -1 -1 1 3 4',
        description: 'Standard eviction sequence',
      },
    ],
    createdAt: new Date().toISOString(),
    _count: { submissions: 18 },
  },
  {
    id: 'mock-p3',
    title: 'Token Bucket Rate Limiter',
    slug: 'rate-limiter',
    tier: 'Builder',
    domain: 'cse',
    reward: 250,
    description: `## Problem Statement

Implement a **Token Bucket Rate Limiter**.

- A bucket has a maximum capacity of \`maxTokens\` tokens.
- The bucket refills at a rate of \`refillRate\` tokens per second.
- Each incoming request consumes 1 token.

## Constraints
- \`1 <= maxTokens <= 100\``,
    publicTestCases: [
      {
        stdin: '3 1\n0\n0\n0\n0\n1\n2',
        expectedStdout: 'true true true false true true',
        description: 'Burst then refill',
      },
    ],
    createdAt: new Date().toISOString(),
    _count: { submissions: 15 },
  },
];

// ─── API Methods ─────────────────────────────────────────────────────────────
export async function getProblems(params?: { tier?: string; domain?: string }): Promise<Problem[]> {
  try {
    const response = await api.get('/students/problems', { params });
    return response.data;
  } catch (err) {
    console.warn('Backend unavailable, using mock problem list fallback');
    let list = MOCK_PROBLEMS;
    if (params?.domain && params.domain !== 'all') {
      list = list.filter((p) => p.domain === params.domain);
    }
    if (params?.tier && params.tier !== 'all') {
      list = list.filter((p) => p.tier === params.tier);
    }
    return list;
  }
}

export async function getProblemBySlug(slug: string): Promise<Problem> {
  try {
    const response = await api.get(`/students/problems/${slug}`);
    return response.data;
  } catch (err) {
    console.warn(`Backend unavailable, using mock problem details fallback for slug: ${slug}`);
    const found = MOCK_PROBLEMS.find((p) => p.slug === slug);
    if (found) return found;
    return MOCK_PROBLEMS[0];
  }
}

export async function generateAIProblem(topic: string, difficulty: string, domain: string): Promise<Problem> {
  try {
    const response = await api.post('/students/problems/generate-ai', {
      topic,
      difficulty,
      domain,
    });
    return response.data.problem;
  } catch (err) {
    console.warn('AI Problem Generation endpoint unavailable, returning simulated AI problem');
    const slug = `ai-${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
    return {
      id: 'ai-gen-' + Date.now(),
      title: `AI Challenge: ${topic}`,
      slug,
      tier: (difficulty as any) || 'Builder',
      domain: (domain as any) || 'cse',
      reward: difficulty === 'Architect' ? 250 : 150,
      description: `### AI Generated Problem: ${topic}\n\nImplement an optimized algorithmic solution for **${topic}** under high performance constraints.\n\n### Input Format\nInteger input \`N\`.\n\n### Output Format\nReturn calculated metric.`,
      publicTestCases: [{ input: '5', expected: '15' }],
      createdAt: new Date().toISOString(),
    };
  }
}

/** @deprecated S3 upload is no longer used. Code is sent directly to the backend. */
export async function getPresignedUrl(problemId: string, language: string): Promise<{ uploadUrl: string; s3Key: string }> {
  console.warn('[api] getPresignedUrl is deprecated — code is now submitted directly.');
  return { uploadUrl: '', s3Key: '' };
}

/** @deprecated S3 upload is no longer used. Code is sent directly to the backend. */
export async function uploadCodeToMinio(uploadUrl: string, code: string): Promise<void> {
  console.warn('[api] uploadCodeToMinio is deprecated — code is now submitted directly.');
}

/**
 * Submit a coding solution directly to the backend (no S3/MinIO required).
 * The raw code string is stored in the database via Submission.codeContent.
 */
export async function submitSolution(problemId: string, code: string, language: string): Promise<{ submissionId: string; status: string }> {
  try {
    const response = await api.post(`/students/problems/${problemId}/submit`, {
      code,
      language,
    });
    return response.data;
  } catch (err) {
    console.warn('Backend submit endpoint unavailable, using mock submission response');
    return {
      submissionId: 'mock-sub-' + Date.now(),
      status: 'queued',
    };
  }
}

export async function getSubmissions(): Promise<{ data: Submission[]; meta: any }> {
  try {
    const response = await api.get('/students/submissions');
    return response.data;
  } catch (err) {
    return {
      data: [
        {
          id: 'sub-mock-1',
          status: 'completed',
          score: 100,
          createdAt: new Date().toISOString(),
          problem: {
            id: 'mock-p1',
            title: 'Two Sum',
            slug: 'two-sum',
            tier: 'Explorer',
          },
        },
      ],
      meta: { total: 1, page: 1, limit: 20, pages: 1 },
    };
  }
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  avatar?: string;
  score: number;
  passRate: number;
  trend: number;
  isUser?: boolean;
  isAnonymized?: boolean;
  handles?: string;
}

export interface LeaderboardResponse {
  tab: string;
  podium: LeaderboardEntry[];
  items: LeaderboardEntry[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export async function getLeaderboard(
  page: number = 1,
  limit: number = 10,
  tab: string = 'cohort'
): Promise<LeaderboardResponse> {
  try {
    const response = await api.get('/students/leaderboard', {
      params: { page, limit, tab },
    });
    return response.data;
  } catch (err) {
    const allMockCandidates: LeaderboardEntry[] = [
      { id: '1', rank: 1, name: 'Priya Shah', score: 9840, passRate: 98, trend: 14, isUser: false, handles: 'priyashah.dev' },
      { id: '2', rank: 2, name: 'Marcus Chen', score: 9612, passRate: 96, trend: 22, isUser: false, handles: 'marcus.dev' },
      { id: '3', rank: 3, name: 'Aarav Mehta', score: 9405, passRate: 95, trend: 8, isUser: true, handles: 'aarav.mehta' },
      { id: '4', rank: 4, name: 'Sofia Romano', score: 9308, passRate: 94, trend: 45, isUser: false, handles: 'sofia.r' },
      { id: '5', rank: 5, name: 'Ken Watanabe', score: 9227, passRate: 92, trend: 18, isUser: false, handles: 'ken.w' },
      { id: '6', rank: 6, name: 'Liam O\'Brien', score: 9154, passRate: 90, trend: 82, isUser: false, handles: 'liam.ob' },
      { id: '7', rank: 7, name: 'Yuki Tanaka', score: 9081, passRate: 88, trend: 12, isUser: false, handles: 'yuki.t' },
      { id: '8', rank: 8, name: 'Arjun Patel', score: 9008, passRate: 86, trend: 34, isUser: false, handles: 'arjun.p' },
      { id: '9', rank: 9, name: 'Emma Schmidt', score: 8935, passRate: 84, trend: 9, isUser: false, handles: 'emma.s' },
      { id: '10', rank: 10, name: 'Diego Rivera', score: 8862, passRate: 82, trend: 57, isUser: false, handles: 'diego.r' },
      { id: '11', rank: 11, name: 'Zara Khan', score: 8789, passRate: 80, trend: -3, isUser: false, handles: 'zara.k' },
      { id: '12', rank: 12, name: 'Noah Park', score: 8716, passRate: 78, trend: 28, isUser: false, handles: 'noah.p' },
      { id: '13', rank: 13, name: 'Lena Müller', score: 8643, passRate: 76, trend: 14, isUser: false, handles: 'lena.m' },
      { id: '14', rank: 14, name: 'Tomás Silva', score: 8570, passRate: 74, trend: 62, isUser: false, handles: 'tomas.s' },
      { id: '15', rank: 15, name: 'Ava Johnson', score: 8497, passRate: 72, trend: 41, isUser: false, handles: 'ava.j' },
    ];

    const podium = allMockCandidates.slice(0, 3);
    const tableCandidates = allMockCandidates.slice(3);

    const startIndex = (page - 1) * limit;
    const items = tableCandidates.slice(startIndex, startIndex + limit);
    const totalPages = Math.ceil(tableCandidates.length / limit);

    return {
      tab,
      podium,
      items,
      pagination: {
        page,
        limit,
        totalItems: tableCandidates.length,
        totalPages,
      },
    };
  }
}

export async function getUserBadges(): Promise<any[]> {
  try {
    const response = await api.get('/students/badges');
    return response.data;
  } catch (err) {
    console.warn('Badges API call returned error or 401, using dev fallback:', err);
    return [];
  }
}

export async function toggleAnonymize(isAnonymized: boolean): Promise<any> {
  try {
    const response = await api.patch('/students/anonymize', { isAnonymized });
    return response.data;
  } catch (err) {
    console.warn('Backend unavailable, mock anonymize success');
    return { success: true };
  }
}

export async function getSystemHealth(): Promise<{ status: string; aiProvider: string }> {
  try {
    // /health is unauthenticated on the root or api level, but based on app.ts it's on root `/health`
    // However, our axios instance defaults to /api, so let's use a full URL or override it.
    // We will just hit `/health` by taking the VITE_API_URL and removing `/api`
    const baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api').replace('/api', '');
    const res = await fetch(`${baseURL}/health`);
    return await res.json();
  } catch (e) {
    return { status: 'error', aiProvider: 'Offline' };
  }
}
