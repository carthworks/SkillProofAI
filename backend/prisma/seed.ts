import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('👤 Seeding users...');
  const hashedPassword = await bcrypt.hash('password123', 12);

  await prisma.user.upsert({
    where: { email: 'tkarthikeyan@gmail.com' },
    update: { password: hashedPassword },
    create: {
      email: 'tkarthikeyan@gmail.com',
      password: hashedPassword,
      name: 'Karthikeyan',
      domain: 'cse',
      tier: 'Explorer',
      xp: 100,
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: 'student@college.edu' },
    update: { password: hashedPassword, badgesEarned: 2 },
    create: {
      email: 'student@college.edu',
      password: hashedPassword,
      name: 'Demo Student',
      domain: 'cse',
      tier: 'Explorer',
      xp: 450,
      badgesEarned: 2,
    },
  });

  // Seed 2 sample badges for Demo Student
  await prisma.badge.upsert({
    where: { id: 'seed-badge-1' },
    update: {},
    create: {
      id: 'seed-badge-1',
      verifyId: '8f9e2b10-7a3c-4d5e-9f0a-1b2c3d4e5f6a',
      userId: studentUser.id,
      title: 'Two Sum Verified Badge',
      problemTitle: 'Two Sum',
      problemSlug: 'two-sum',
      score: 98,
      status: 'AI_VERIFIED',
      pdfUrl: '/api/verify/8f9e2b10-7a3c-4d5e-9f0a-1b2c3d4e5f6a/pdf',
    },
  });

  await prisma.badge.upsert({
    where: { id: 'seed-badge-2' },
    update: {},
    create: {
      id: 'seed-badge-2',
      verifyId: '3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f',
      userId: studentUser.id,
      title: 'LRU Cache Verified Badge',
      problemTitle: 'LRU Cache',
      problemSlug: 'lru-cache',
      score: 92,
      status: 'EXPERT_VERIFIED',
      pdfUrl: '/api/verify/3c4d5e6f-7a8b-9c0d-1e2f-3a4b5c6d7e8f/pdf',
    },
  });

  console.log('🛡️ Seeding Reviewer Account...');
  const reviewerPassword = await bcrypt.hash('Reviewer123!', 12);
  await prisma.user.upsert({
    where: { email: 'reviewer@talentforge.in' },
    update: { password: reviewerPassword, role: 'REVIEWER' },
    create: {
      email: 'reviewer@talentforge.in',
      password: reviewerPassword,
      name: 'Senior Expert Reviewer',
      domain: 'cse',
      role: 'REVIEWER',
      tier: 'Expert',
      xp: 5000,
    },
  });

  console.log('💼 Seeding Employer Recruiter Account...');
  const employerPassword = await bcrypt.hash('password123', 12);
  await prisma.user.upsert({
    where: { email: 'employer@talentforge.in' },
    update: { password: employerPassword, role: 'EMPLOYER' },
    create: {
      email: 'employer@talentforge.in',
      password: employerPassword,
      name: 'Enterprise Tech Recruiter (Stripe)',
      domain: 'cse',
      role: 'EMPLOYER',
      tier: 'Enterprise',
      xp: 10000,
    },
  });

  console.log('👑 Seeding Admin Account...');
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  await prisma.user.upsert({
    where: { email: 'admin@talentforge.in' },
    update: { password: adminPassword, role: 'ADMIN' },
    create: {
      email: 'admin@talentforge.in',
      password: adminPassword,
      name: 'System Admin Manager',
      domain: 'cse',
      role: 'ADMIN',
      tier: 'Master',
      xp: 99999,
    },
  });

  console.log('👥 Seeding sample CSE students (5)...');
  const cseStudents = [
    { email: 'cse1@college.edu', name: 'Alice Smith', college: 'MIT', degree: 'B.Tech', skills: [{ name: 'React', level: 'Intermediate' }, { name: 'Python', level: 'Advanced' }] },
    { email: 'cse2@college.edu', name: 'Bob Johnson', college: 'Stanford', degree: 'B.Tech', skills: [{ name: 'Node.js', level: 'Beginner' }] },
    { email: 'cse3@college.edu', name: 'Charlie Brown', college: 'Berkeley', degree: 'M.Tech', skills: [{ name: 'Java', level: 'Advanced' }, { name: 'Spring Boot', level: 'Intermediate' }] },
    { email: 'cse4@college.edu', name: 'Diana Prince', college: 'CMU', degree: 'B.Tech', skills: [{ name: 'Go', level: 'Advanced' }] },
    { email: 'cse5@college.edu', name: 'Evan Wright', college: 'Georgia Tech', degree: 'M.Tech', skills: [{ name: 'C++', level: 'Intermediate' }, { name: 'Rust', level: 'Beginner' }] },
  ];
  for (const s of cseStudents) {
    await prisma.user.upsert({
      where: { email: s.email },
      update: { password: hashedPassword, role: 'STUDENT', college: s.college, degree: s.degree, skills: s.skills },
      create: {
        email: s.email, password: hashedPassword, name: s.name, domain: 'cse', role: 'STUDENT', tier: 'Explorer', xp: Math.floor(Math.random() * 500), college: s.college, degree: s.degree, skills: s.skills,
        walletAddress: `0xabc123${Math.random().toString(16).substring(2, 8)}`,
      },
    });
  }

  console.log('👥 Seeding sample ECE students (3)...');
  const eceStudents = [
    { email: 'ece1@college.edu', name: 'Fiona Gallagher', college: 'Caltech', degree: 'B.Tech', skills: [{ name: 'Verilog', level: 'Intermediate' }, { name: 'C', level: 'Advanced' }] },
    { email: 'ece2@college.edu', name: 'George Miller', college: 'Purdue', degree: 'B.Tech', skills: [{ name: 'MATLAB', level: 'Advanced' }] },
    { email: 'ece3@college.edu', name: 'Hannah Abbott', college: 'UIUC', degree: 'M.Tech', skills: [{ name: 'Embedded C', level: 'Intermediate' }, { name: 'VHDL', level: 'Beginner' }] },
  ];
  for (const s of eceStudents) {
    await prisma.user.upsert({
      where: { email: s.email },
      update: { password: hashedPassword, role: 'STUDENT', college: s.college, degree: s.degree, skills: s.skills },
      create: {
        email: s.email, password: hashedPassword, name: s.name, domain: 'ece', role: 'STUDENT', tier: 'Explorer', xp: Math.floor(Math.random() * 300), college: s.college, degree: s.degree, skills: s.skills,
        walletAddress: `0xdef456${Math.random().toString(16).substring(2, 8)}`,
      },
    });
  }

  console.log('🛡️ Seeding sample Reviewers (5)...');
  const reviewers = [
    { email: 'rev1@talentforge.in', name: 'Reviewer One', domain: 'cse', tier: 'Expert' },
    { email: 'rev2@talentforge.in', name: 'Reviewer Two', domain: 'cse', tier: 'Master' },
    { email: 'rev3@talentforge.in', name: 'Reviewer Three', domain: 'ece', tier: 'Expert' },
    { email: 'rev4@talentforge.in', name: 'Reviewer Four', domain: 'cse', tier: 'Expert' },
    { email: 'rev5@talentforge.in', name: 'Reviewer Five', domain: 'ece', tier: 'Master' },
  ];
  for (const r of reviewers) {
    await prisma.user.upsert({
      where: { email: r.email },
      update: { password: reviewerPassword, role: 'REVIEWER' },
      create: {
        email: r.email, password: reviewerPassword, name: r.name, domain: r.domain, role: 'REVIEWER', tier: r.tier, xp: Math.floor(Math.random() * 2000) + 3000,
      },
    });
  }

  console.log('💼 Seeding sample Employers (3)...');
  const employers = [
    { email: 'emp1@google.com', name: 'Recruiter Google', company: 'Google', domain: 'cse' },
    { email: 'emp2@microsoft.com', name: 'Recruiter Microsoft', company: 'Microsoft', domain: 'cse' },
    { email: 'emp3@intel.com', name: 'Recruiter Intel', company: 'Intel', domain: 'ece' },
  ];
  for (const e of employers) {
    await prisma.user.upsert({
      where: { email: e.email },
      update: { password: employerPassword, role: 'EMPLOYER' },
      create: {
        email: e.email, password: employerPassword, name: `${e.name} (${e.company})`, domain: e.domain, role: 'EMPLOYER', tier: 'Enterprise', xp: 5000,
      },
    });
  }


  console.log('🌱 Seeding 8 comprehensive problems (incl. Flagship Load Balancer)...');

  // ─── Problem 1: Two Sum (Easy - Explorer) ──────────────────────────────────
  await prisma.problem.upsert({
    where: { slug: 'two-sum' },
    update: {},
    create: {
      title: 'Two Sum',
      slug: 'two-sum',
      tier: 'Explorer',
      domain: 'cse',
      reward: 100,
      description: `## Problem Statement\nGiven an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.\n\n## Constraints\n- \`2 ≤ nums.length ≤ 10^4\`\n- Time: O(n), Space: O(n)`,
      publicTestCases: [
        { stdin: '4\n2 7 11 15\n9', expectedStdout: '0 1', description: 'Basic pair' },
        { stdin: '3\n3 2 4\n6', expectedStdout: '1 2', description: 'Middle pair' },
      ],
      hiddenTestCases: [
        { stdin: '5\n1 2 3 4 5\n9', expectedStdout: '3 4', weight: 10 },
        { stdin: '6\n-3 4 3 90 -1 100\n0', expectedStdout: '0 2', weight: 10 },
        { stdin: '4\n0 0 0 0\n0', expectedStdout: '0 1', weight: 10 },
        { stdin: '2\n-1000000000 1000000000\n0', expectedStdout: '0 1', weight: 15 },
        { stdin: '5\n1 5 3 7 2\n10', expectedStdout: '1 3', weight: 10 },
      ],
    },
  });

  // ─── Problem 2: LRU Cache (Medium - Builder) ──────────────────────────────
  await prisma.problem.upsert({
    where: { slug: 'lru-cache' },
    update: {},
    create: {
      title: 'LRU Cache',
      slug: 'lru-cache',
      tier: 'Builder',
      domain: 'cse',
      reward: 250,
      description: `## Problem Statement\nImplement a Least Recently Used (LRU) Cache supporting \`get\` and \`put\` in O(1) time complexity.\n\n## Constraints\n- \`1 ≤ capacity ≤ 3000\``,
      publicTestCases: [
        { stdin: '2\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2', expectedStdout: '1 -1', description: 'Eviction test' },
      ],
      hiddenTestCases: [
        { stdin: '3\nput 1 1\nput 2 2\nput 3 3\nget 1\nput 4 4\nget 2\nget 3\nget 4', expectedStdout: '1 -1 3 4', weight: 12 },
        { stdin: '2\nput 1 10\nput 2 20\nget 1\nput 3 30\nget 2\nget 3', expectedStdout: '10 -1 30', weight: 10 },
      ],
    },
  });

  // ─── Problem 3: Token Bucket Rate Limiter (Medium - Builder) ─────────────
  await prisma.problem.upsert({
    where: { slug: 'rate-limiter' },
    update: {},
    create: {
      title: 'Token Bucket Rate Limiter',
      slug: 'rate-limiter',
      tier: 'Builder',
      domain: 'cse',
      reward: 250,
      description: `## Problem Statement\nImplement a Token Bucket Rate Limiter with capacity and refill rate.`,
      publicTestCases: [
        { stdin: '3 1\n0\n0\n0\n0\n1\n2', expectedStdout: 'true true true false true true', description: 'Burst refill' },
      ],
      hiddenTestCases: [
        { stdin: '5 2\n0\n0\n0\n0\n0\n0\n1\n2', expectedStdout: 'true true true true true false true true', weight: 12 },
      ],
    },
  });

  // ─── Problem 4: Flagship - Build a Load Balancer (Hard - Architect) ────────
  await prisma.problem.upsert({
    where: { slug: 'build-a-load-balancer' },
    update: {},
    create: {
      title: 'Build a Load Balancer',
      slug: 'build-a-load-balancer',
      tier: 'Architect',
      domain: 'cse',
      reward: 500,
      description: `## Flagship Challenge: Build an Enterprise Load Balancer

Design a high-scale Load Balancer supporting **Weighted Round-Robin**, **Health Check Eviction**, and **Dynamic Node Failover**.

### Requirements
1. **Initialize Nodes**: Configure backend nodes with assigned weights (\`node_name weight\`).
2. **Weighted Round-Robin Routing**: Distribute incoming HTTP requests according to assigned node weight quotas.
3. **Health Checks**:
   - \`fail node_name\`: Marks backend node as UNHEALTHY (evict from active pool immediately).
   - \`recover node_name\`: Marks node as HEALTHY (re-enter active pool).
4. **Fallback**: If all nodes are unhealthy, return \`NO_HEALTHY_NODES\`.

### Expected Complexity
- **Routing Time:** O(1) amortized
- **Space:** O(N) backend nodes`,
      publicTestCases: [
        {
          stdin: '3\nnode1 1\nnode2 1\nnode3 1\nrequest\nrequest\nrequest',
          expectedStdout: 'node1 node2 node3',
          description: 'Basic Round-Robin',
        },
        {
          stdin: '3\nnode1 1\nnode2 1\nnode3 1\nfail node2\nrequest\nrequest',
          expectedStdout: 'node1 node3',
          description: 'Health Check Eviction',
        },
      ],
      hiddenTestCases: [
        { stdin: '3\nnode1 1\nnode2 1\nnode3 1\nrequest\nrequest\nrequest', expectedStdout: 'node1 node2 node3', weight: 10 },
        { stdin: '2\nnodeA 1\nnodeB 1\nrequest\nrequest\nrequest\nrequest', expectedStdout: 'nodeA nodeB nodeA nodeB', weight: 10 },
        { stdin: '3\nnode1 3\nnode2 1\nnode3 2\nrequest\nrequest\nrequest\nrequest\nrequest\nrequest', expectedStdout: 'node1 node1 node1 node2 node3 node3', weight: 15 },
        { stdin: '2\nnode1 2\nnode2 1\nrequest\nrequest\nrequest', expectedStdout: 'node1 node1 node2', weight: 10 },
        { stdin: '3\nnode1 1\nnode2 1\nnode3 1\nfail node2\nrequest\nrequest', expectedStdout: 'node1 node3', weight: 10 },
        { stdin: '3\nnode1 1\nnode2 1\nnode3 1\nfail node2\nrequest\nrecover node2\nrequest', expectedStdout: 'node1 node2', weight: 10 },
        { stdin: '3\nnode1 2\nnode2 1\nnode3 1\nfail node1\nrequest\nrequest', expectedStdout: 'node2 node3', weight: 10 },
        { stdin: '2\nnode1 1\nnode2 1\nfail node1\nfail node2\nrequest', expectedStdout: 'NO_HEALTHY_NODES', weight: 15 },
        { stdin: '3\nnode1 1\nnode2 1\nnode3 1\nrequest\nfail node1\nrequest\nrequest', expectedStdout: 'node1 node2 node3', weight: 10 },
        { stdin: '2\nnode1 5\nnode2 5\nrequest\nrequest\nrequest\nrequest', expectedStdout: 'node1 node1 node1 node1', weight: 10 },
      ],
    },
  });

  // ─── Problem 5: LSM Tree MemTable & SSTable (Hard - Architect) ───────────
  await prisma.problem.upsert({
    where: { slug: 'lsm-tree' },
    update: {},
    create: {
      title: 'LSM-Tree MemTable & SSTable',
      slug: 'lsm-tree',
      tier: 'Architect',
      domain: 'cse',
      reward: 450,
      description: `## Problem Statement\nImplement a Log-Structured Merge-tree (LSM-Tree) MemTable with write-ahead logging (WAL) and SSTable flushing.`,
      publicTestCases: [
        { stdin: 'put k1 v1\nget k1', expectedStdout: 'v1', description: 'MemTable get' },
      ],
      hiddenTestCases: [
        { stdin: 'put k1 v1\nflush\nget k1', expectedStdout: 'v1', weight: 10 },
      ],
    },
  });

  // ─── Problem 6: Distributed Lock (Hard - Architect) ─────────────────────
  await prisma.problem.upsert({
    where: { slug: 'distributed-lock' },
    update: {},
    create: {
      title: 'Distributed Lock Manager (Redlock)',
      slug: 'distributed-lock',
      tier: 'Architect',
      domain: 'cse',
      reward: 450,
      description: `## Problem Statement\nImplement a Distributed Lock Manager with lease time and fence tokens.`,
      publicTestCases: [
        { stdin: 'acquire clientA lock1 10', expectedStdout: 'GRANTED', description: 'Acquire lock' },
      ],
      hiddenTestCases: [
        { stdin: 'acquire clientA lock1 10\nacquire clientB lock1 10', expectedStdout: 'GRANTED REJECTED', weight: 10 },
      ],
    },
  });

  // ─── Problem 7: Trie Autocomplete System (Medium - Builder) ─────────────
  await prisma.problem.upsert({
    where: { slug: 'trie-autocomplete' },
    update: {},
    create: {
      title: 'Trie Autocomplete System',
      slug: 'trie-autocomplete',
      tier: 'Builder',
      domain: 'cse',
      reward: 300,
      description: `## Problem Statement\nBuild a Trie data structure supporting prefix autocompletion and frequency ranking.`,
      publicTestCases: [
        { stdin: 'insert apple 5\ninsert app 10\nsearch ap', expectedStdout: 'app apple', description: 'Prefix search' },
      ],
      hiddenTestCases: [
        { stdin: 'insert code 8\ninsert coding 12\nsearch cod', expectedStdout: 'coding code', weight: 10 },
      ],
    },
  });

  // ─── Problem 8: Consistent Hashing Ring (Hard - Architect) ───────────────
  await prisma.problem.upsert({
    where: { slug: 'consistent-hashing' },
    update: {},
    create: {
      title: 'Consistent Hashing Ring',
      slug: 'consistent-hashing',
      tier: 'Architect',
      domain: 'cse',
      reward: 450,
      description: `## Problem Statement\nImplement a Consistent Hashing Ring with virtual nodes for distributed database partitioning.`,
      publicTestCases: [
        { stdin: 'add_node nodeA\nget_key key1', expectedStdout: 'nodeA', description: 'Single node hash' },
      ],
      hiddenTestCases: [
        { stdin: 'add_node nodeA\nadd_node nodeB\nget_key key1', expectedStdout: 'nodeA', weight: 10 },
      ],
    },
  });

  // ─── AI Generated Problems Seed ───────────────────────────────────────────
  const aiSeedsPath = path.join(__dirname, 'ai-seeds.json');
  if (fs.existsSync(aiSeedsPath)) {
    console.log('🤖 Found ai-seeds.json! Seeding previously exported AI problems...');
    try {
      const aiProblems = JSON.parse(fs.readFileSync(aiSeedsPath, 'utf-8'));
      for (const p of aiProblems) {
        await prisma.problem.upsert({
          where: { slug: p.slug },
          update: {},
          create: {
            title: p.title,
            slug: p.slug,
            tier: p.tier,
            domain: p.domain,
            reward: p.reward,
            description: p.description,
            publicTestCases: p.publicTestCases,
            hiddenTestCases: p.hiddenTestCases,
          }
        });
      }
      console.log(`✅ Seeded ${aiProblems.length} AI-generated problems.`);
    } catch (err) {
      console.error('⚠️ Failed to seed AI problems from ai-seeds.json:', err);
    }
  }

  console.log('✅ Seed complete — comprehensive problems and AI problems created.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
