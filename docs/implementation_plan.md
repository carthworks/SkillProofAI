# Implementation Plan: TalentForge Core POC Initialization & Foundation

This plan outlines the steps to initialize the TalentForge Proof of Concept (POC) codebase, covering the repository setup, core database migrations, user authentication, and basic api schemas.

## User Review Required

> [!IMPORTANT]
> **Tech Stack Alignment**
> The provided execution documents specify a **Node.js + Express** backend and a **React.js + Tailwind CSS** frontend. We will follow this tech stack to construct the monolithic or multi-folder repository, initializing backend and frontend projects.
>
> **Database Selection**
> We are using **PostgreSQL** as the primary relational database, and **Redis** for worker queues (BullMQ) and session/auth token storage.

---

## Open Questions

> [!WARNING]
> 1. **Codebase Structure:** Should we initialize this as a Turborepo/npm workspaces monorepo, or as simple decoupled subdirectories (`/backend`, `/frontend`, `/smart-contracts`)?
> 2. **Authentication Flow:** Are we executing local email-password registration/login first, or do you want OAuth (Google/GitHub/Microsoft) integrated immediately in the first milestone?
> 3. **Smart Contracts Language:** The ECE roadmap suggests a Solidity contract on Polygon. Do you want to use Hardhat or Foundry to compile and test the contracts in the `/smart-contracts` workspace?

---

## Proposed Changes

We will create a multi-workspace structure under the root directory:
* `backend/` - Node.js + Express, Prisma/pg, TypeScript
* `frontend/` - React, Vite/Next.js, Monaco Editor, Tailwind CSS
* `smart-contracts/` - Solidity, Hardhat/Foundry

---

### Project Initialization & Repository Setup

#### [NEW] [package.json](file:///c:/Users/tkart/Dev/talentForge/poc/package.json)
Create root level workspaces config or dependency definitions.

#### [NEW] [.gitignore](file:///c:/Users/tkart/Dev/talentForge/poc/.gitignore)
Standard gitignore pattern covering `node_modules`, `.env`, build artifacts, and local configurations.

---

### Backend Components (Week 1–3)

We will initialize the Express.js API project inside `backend/` with basic configurations.

#### [NEW] [backend/package.json](file:///c:/Users/tkart/Dev/talentForge/poc/backend/package.json)
Define scripts (`dev`, `build`, `start`), dependencies (`express`, `cors`, `pg`, `jsonwebtoken`, `bcrypt`, `dotenv`, `bullmq`, `ioredis`), and devDependencies (`typescript`, `@types/node`, `@types/express`, `tsx`).

#### [NEW] [backend/tsconfig.json](file:///c:/Users/tkart/Dev/talentForge/poc/backend/tsconfig.json)
Configure TypeScript options optimized for Node.js.

#### [NEW] [backend/src/app.ts](file:///c:/Users/tkart/Dev/talentForge/poc/backend/src/app.ts)
Initialize express app, CORS, JSON parser, base routes, and Sentry middleware configurations.

#### [NEW] [backend/src/config/db.ts](file:///c:/Users/tkart/Dev/talentForge/poc/backend/src/config/db.ts)
Database connection pool using `pg` or Prisma initialization.

#### [NEW] [backend/src/models/](file:///c:/Users/tkart/Dev/talentForge/poc/backend/src/models/)
Add database schemas or models for:
* `User` (Authentication, Profile, Domain selection: CSE/ECE, Tier status: 1-5, Wallet Address, XP score)
* `Project` (Title, Tier required, Brief, Acceptance Criteria, XP/Stipend payouts)
* `Submission` (S3 path, code execution output, quality score, test results, blockchain transaction hash)
* `PsychometricProfile` (Logical, Detail, Persistence, Learning velocity, extraversion indices)

#### [NEW] [backend/src/routes/auth.ts](file:///c:/Users/tkart/Dev/talentForge/poc/backend/src/routes/auth.ts)
Implement endpoints for `/auth/register`, `/auth/login`, and `/auth/me` with JWT logic.

#### [NEW] [backend/src/routes/psychometric.ts](file:///c:/Users/tkart/Dev/talentForge/poc/backend/src/routes/psychometric.ts)
Implement `/students/psychometric/start`, `/students/psychometric/submit` skeleton routes and calculation engine.

---

### Smart Contracts (Week 1)

#### [NEW] [smart-contracts/contracts/TalentForgeBadges.sol](file:///c:/Users/tkart/Dev/talentForge/poc/smart-contracts/contracts/TalentForgeBadges.sol)
Initialize the Solidity contract for ERC-721 NFT badges.

---

## Verification Plan

### Automated Tests
* We will set up Jest/Vitest for unit tests in `/backend` and `/frontend`.
* Commands to run:
  ```bash
  npm run test --prefix backend
  ```

### Manual Verification
* Execute API requests using Postman or cURL to verify signup, login, and user profile retrieval:
  ```bash
  curl -X POST http://localhost:5000/api/auth/register \
       -H "Content-Type: application/json" \
       -d '{"email":"student@college.edu","password":"SecurePassword123","name":"Student Name","domain":"cse"}'
  ```
* Connect to local PostgreSQL to verify tables creation and index mappings.
