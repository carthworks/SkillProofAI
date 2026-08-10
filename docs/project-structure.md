# TalentForge POC Project Structure

This document describes the scaffold for the TalentForge proof of concept.

## Root
- `package.json` - yarn/npm workspace configuration for backend, frontend, and smart contracts
- `.gitignore` - ignore build artifacts, local env files, and node_modules
- `README.md` - project overview and startup instructions
- `docs/` - project documentation
- `backend/` - backend API service
- `frontend/` - React web application
- `sandbox/` - sandbox runner design and execution templates
- `smart-contracts/` - Solidity contract and deployment setup

## backend/
- `package.json` - backend dependencies and scripts
- `tsconfig.json` - TypeScript compiler settings
- `src/` - backend source code
  - `app.ts` - Express app entrypoint
  - `routes/` - API route definitions
    - `auth.ts` - authentication endpoints
    - `student.ts` - student profile and problem board

## frontend/
- `package.json` - frontend dependencies and scripts
- `tsconfig.json` - React TypeScript config
- `tsconfig.node.json` - Vite Node build config
- `vite.config.ts` - Vite development server and proxy
- `src/` - frontend source code
  - `main.tsx` - React app bootstrap
  - `App.tsx` - main application router
  - `pages/` - page components
    - `Home.tsx` - problem board sample
    - `Profile.tsx` - student profile sample

## sandbox/
- `README.md` - sandbox architecture and next steps
- `.env.example` - sandbox-specific runtime values
- later additions:
  - Dockerfiles for CSE and ECE sandbox containers
  - runner service templates for job dispatch

## smart-contracts/
- `package.json` - Hardhat setup for contract compilation and testing
- `hardhat.config.ts` - network and compiler configuration
- `contracts/` - Solidity smart contracts
  - `TalentForgeBadges.sol` - ERC-721 badge contract
- `scripts/` - deployment scripts
  - `deploy.ts` - contract deployment helper
- `test/` - smart contract tests
- `.env.example` - blockchain network credentials and keys

## Setup Notes
1. Copy each `*.env.example` to `.env` in its folder.
2. Replace placeholder values with real credentials.
3. Run `npm install` in each workspace or from root if using npm workspaces.
4. Start backend and frontend using the scripts defined in `package.json`.
