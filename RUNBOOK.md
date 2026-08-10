# SkillProofAI — Operational Runbook & Client Deployment Guide

This document provides a comprehensive, step-by-step deployment guide, standard operating procedures (SOPs), role testing walkthroughs, and emergency playbooks for deploying and running SkillProofAI in client environments and demo setups.

---

## 📋 Table of Contents
1. [Prerequisites Checklist](#1-prerequisites-checklist)
2. [Step-by-Step Client Deployment Guide](#2-step-by-step-client-deployment-guide)
3. [Running the Application](#3-running-the-application)
4. [Verification & Health Checks](#4-verification--health-checks)
5. [Client Demo & Role Walkthrough Checklist](#5-client-demo--role-walkthrough-checklist)
6. [Maintenance & Migration SOPs](#6-maintenance--migration-sops)
7. [Emergency Playbooks](#7-emergency-playbooks)

---

## 1. Prerequisites Checklist

Ensure the client machine meets the following requirements prior to installation:

| Requirement | Supported Version / Specification | Notes |
| :--- | :--- | :--- |
| **Operating System** | Windows 10/11, macOS 12+, or Ubuntu 22.04 LTS | Tested on Windows PowerShell & Docker |
| **Node.js** | v18.0.0 or higher (v20 LTS recommended) | Check with `node -v` |
| **npm / uv** | npm v9+ (or `uv` for fast Python execution) | Check with `npm -v` |
| **Docker Desktop** | Docker Engine 24+ & Docker Compose v2.20+ | Docker daemon must be running |
| **Available Ports** | `5173` (Frontend), `5001` (API), `5439` (PostgreSQL), `6380` (Redis), `9000/9001` (MinIO) | Ensure no local services block these ports |

---

## 2. Step-by-Step Client Deployment Guide

Follow these exact terminal commands in order for a fresh installation.

### Step 2.1: Open Terminal & Navigate to Project
```powershell
cd C:\path\to\SkillProofAI-POC
```

### Step 2.2: Configure Environment Variables
Copy the default environment configuration file:
```powershell
# Windows PowerShell / CMD
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

### Step 2.3: Start Infrastructure Containers
Spin up PostgreSQL (with pgvector), Redis (with AOF persistence), and MinIO object storage:
```powershell
docker compose up -d
```
*Expected Output:*
```text
 ✔ Container talentforge-postgres-1 Running
 ✔ Container talentforge-redis-1    Running
```

### Step 2.4: Install Node.js Dependencies
Install dependencies across the monorepo (root, backend, frontend, worker):
```powershell
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install worker dependencies
cd worker
npm install
cd ..
```

### Step 2.5: Run Database Schema Migrations
Apply Prisma migrations and ensure all tables (including candidate hiring stages) are initialized:
```powershell
# 1. Generate Prisma Client
npx prisma generate --schema=backend/prisma/schema.prisma

# 2. Push schema to PostgreSQL
npx prisma db push --schema=backend/prisma/schema.prisma

# 3. (Windows option) Run the helper migration script for Shortlist table:
.\migrate-hiring-stage.bat
```

### Step 2.6: Seed Demo Database
Populate initial accounts (Students, Reviewers, Employers, Admin), badges, psychometric profiles, and 8 engineering problems:
```powershell
npm run seed --prefix backend
```

---

## 3. Running the Application

### Option A: One-Click Startup (Recommended for Demos)
On Windows environments, run the batch script to launch all background services:
```powershell
.\run-app.bat
```

### Option B: Manual Multi-Terminal Startup
If running on macOS/Linux or preferred for individual service logging, launch each in a separate terminal:

**Terminal 1 — Express API Backend (Port 5001):**
```powershell
cd backend
npm run dev
```

**Terminal 2 — BullMQ Code Autograder Worker:**
```powershell
cd worker
npm run dev
```

**Terminal 3 — React + Vite Frontend Client (Port 5173):**
```powershell
cd frontend
npm run dev
```

---

## 4. Verification & Health Checks

Verify all services are responsive:

1. **Frontend App**: Open [http://localhost:5173](http://localhost:5173) in your browser.
2. **Backend API Health**: Open [http://localhost:5001/api/health](http://localhost:5001/api/health) or run:
   ```powershell
   curl http://localhost:5001/api/health
   ```
   *Expected Response:* `{"status":"ok","timestamp":"..."}`
3. **Database Health**:
   ```powershell
   docker exec talentforge-postgres-1 psql -U talentforge -d talentforge -c "SELECT count(*) FROM \"User\";"
   ```
4. **Redis Cache Health**:
   ```powershell
   docker exec talentforge-redis-1 redis-cli -a redis_dev_secret ping
   ```
   *Expected Response:* `PONG`

---

## 5. Client Demo & Role Walkthrough Checklist

Use these credentials to demonstrate platform workflows to clients and stakeholders:

### Demo Credentials Overview
| Role | Email | Password | Primary Key Features to Show |
| :--- | :--- | :--- | :--- |
| **Employer / Recruiter** | `employer@talentforge.in` | `password123` | Talent Discovery, Smart Match AI, Interactive Candidate Stepper (`SHORTLISTED` → `OFFERED`), Calendly request, Employer Onboarding (`/employer-onboarding`) |
| **Student (CSE)** | `tkarthikeyan@gmail.com` | `password123` | Dashboard, Monaco Code Sandbox, AI Problem Generator, Behavioral Assessment Radar, Verified Badges |
| **Senior Reviewer** | `reviewer@talentforge.in` | `Reviewer123!` | Expert Review Queue, Monaco Read-Only Code Inspection, Approve/Reject Badge Flipping |
| **System Admin** | `admin@talentforge.in` | `Admin123!` | System Health Analytics, AI Model Adapter Switcher (Ollama/Claude/Gemini/Mock) |

### Step-by-Step Demo Flow

#### 1. Employer Recruiter Flow (`employer@talentforge.in` / `password123`)
1. **Login & Onboarding Wizard**: Log in as Employer. Navigate to **Hiring Profile** (`/employer-onboarding`) to edit engineering domain, target roles, Calendly link, and min-score slider.
2. **Talent Discovery (`/discover`)**:
   - Filter by score, domain, and verified badges.
   - Click **Smart Match AI** and paste a job description (e.g. *"Looking for a React developer with Python backend skills"*).
   - Inspect a candidate's profile drawer to view the 4-part score breakdown tooltip & behavioral radar chart.
   - Click **"Request Interview"** to send an automated interview request using the pre-filled Calendly URL.
3. **Candidate Hiring Pipeline Stepper (`/shortlist`)**:
   - Open **Shortlisted Talent** (`/shortlist`).
   - Interact with the **Horizontal Hiring Stepper** (`Discovered` → `Shortlisted` → `Verified` → `Interviewing` → `Offered`).
   - Click any step to persist the hiring status to the database in real-time.

#### 2. Student Workflow (`tkarthikeyan@gmail.com` / `password123`)
1. **Dashboard**: View aggregate score, verified skill badges, and active interview request notifications from employers.
2. **Code Sandbox (`/problems`)**:
   - Select a problem (e.g. "Two Sum" or flagship "Distributed Load Balancer").
   - Open Monaco Editor, write code, and click **Submit Code**.
   - Watch real-time BullMQ sandbox execution feedback (Correctness, Big-O Complexity, Style).
3. **AI Problem Generator**: Click **✨ Generate AI Problem** to create a custom problem on demand.
4. **Public Portfolio Export (`/p/:id`)**: View the public portfolio, export as PDF, or click **Share on LinkedIn**.

#### 3. Senior Reviewer Workflow (`reviewer@talentforge.in` / `Reviewer123!`)
1. Navigate to **Review Queue** (`/reviewer`).
2. Select an `AI_VERIFIED` submission, inspect the code in the read-only Monaco viewer.
3. Add a star rating and click **Approve** to upgrade the candidate badge to **`EXPERT_VERIFIED`**.

---

## 6. Maintenance & Migration SOPs

### Database Schema Updates
If new database columns are added, execute the migration script:
```powershell
.\migrate-hiring-stage.bat
```
Or manually run the SQL migration against the Docker container:
```powershell
docker exec -i talentforge-postgres-1 psql -U talentforge -d talentforge -c "ALTER TABLE \"Shortlist\" ADD COLUMN IF NOT EXISTS \"hiringStage\" TEXT NOT NULL DEFAULT 'SHORTLISTED'; ALTER TABLE \"Shortlist\" ADD COLUMN IF NOT EXISTS notes TEXT; ALTER TABLE \"Shortlist\" ADD COLUMN IF NOT EXISTS \"updatedAt\" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now();"
```

### Complete Database Reset & Re-seed
If test data becomes cluttered during client demonstrations:
```powershell
# 1. Reset database schema
npx prisma db push --force-reset --schema=backend/prisma/schema.prisma

# 2. Re-seed all demo accounts & problems
npm run seed --prefix backend
```

---

## 7. Emergency Playbooks

### LLM Provider Outage Playbook
If the local Ollama instance or external LLM service experiences latency or downtime:
1. The platform's `aiAdapterFactory` automatically falls back to `MockAdapter`.
2. Core code grading and sandbox execution are **unaffected** as they run locally in BullMQ using deterministic AST test runners.
3. To explicitly switch AI provider, edit `backend/.env`:
   ```env
   AI_PROVIDER="mock"
   ```
   Then restart the backend service.

### Docker Disk Space Cleanup
If host server disk usage exceeds 85%:
```powershell
docker system prune -af --volumes
```
