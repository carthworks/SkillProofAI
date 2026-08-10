import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock POST /auth/register
  http.post('*/api/auth/register', async ({ request }) => {
    const { name, email, domain } = (await request.json()) as any;

    if (!name || !email || !domain) {
      return HttpResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    return HttpResponse.json(
      {
        user: {
          id: 'mock-user-123',
          email,
          name,
          domain,
          tier: 'Explorer',
          xp: 0,
        },
        accessToken: 'mock-access-token-jwt-15m',
        refreshToken: 'mock-refresh-token-jwt-7d',
      },
      { status: 201 }
    );
  }),

  // Mock POST /auth/login
  http.post('*/api/auth/login', async ({ request }) => {
    const { email } = (await request.json()) as any;

    if (!email) {
      return HttpResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    return HttpResponse.json(
      {
        user: {
          id: 'mock-user-123',
          email,
          name: 'Mock Student User',
          domain: 'cse',
          tier: 'Explorer',
          xp: 1500,
        },
        accessToken: 'mock-access-token-jwt-15m',
        refreshToken: 'mock-refresh-token-jwt-7d',
      },
      { status: 200 }
    );
  }),

  // Mock POST /auth/refresh
  http.post('*/api/auth/refresh', async ({ request }) => {
    const { refreshToken } = (await request.json()) as any;

    if (!refreshToken) {
      return HttpResponse.json({ error: 'Refresh token is required' }, { status: 400 });
    }

    return HttpResponse.json(
      {
        accessToken: 'mock-new-access-token-jwt-rotated',
      },
      { status: 200 }
    );
  }),

  // Mock POST /auth/logout
  http.post('*/api/auth/logout', () => {
    return HttpResponse.json({ success: true }, { status: 200 });
  }),

  // Mock GET /auth/me
  http.get('*/api/auth/me', () => {
    return HttpResponse.json(
      {
        user: {
          id: 'mock-user-123',
          email: 'mock.student@college.edu',
          name: 'Mock Student User',
          domain: 'cse',
          tier: 'Explorer',
          xp: 1500,
          walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        },
      },
      { status: 200 }
    );
  }),

  // Mock GET /students/profile
  http.get('*/api/students/profile', () => {
    return HttpResponse.json(
      {
        id: 'mock-user-123',
        name: 'Mock Student User',
        domain: 'cse',
        tier: 'Explorer',
        xp: 1500,
        badges: [],
      },
      { status: 200 }
    );
  }),

  // Mock GET /students/problems
  http.get('*/api/students/problems', () => {
    return HttpResponse.json([
      { id: 'p1', title: 'Basic Arrays (MSW Mock)', tier: 'Explorer', domain: 'cse' },
      { id: 'p2', title: 'SPICE Circuit Validation (MSW Mock)', tier: 'Explorer', domain: 'ece' },
      { id: 'p3', title: 'Graph Traversal (MSW Mock)', tier: 'Apprentice', domain: 'cse' },
    ]);
  }),
];
