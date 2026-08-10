# TalentForge POC: Team Structure, Effort, and Skills Breakdown

Based on the CSE and ECE Proof of Concept (POC) blueprints, launching the MVP requires a structured, multi-disciplinary engineering and product team. Below is the comprehensive breakdown of the development effort, required roles, headcount, and specific skillsets.

---

## 1. Team Allocation & Headcount (10-Week Sprint)
The optimal team size is **8.5 Headcount** for a **10-week sprint**. Below is the resource allocation based on the parallel execution of the CSE and ECE platforms.

| Role | Headcount | Monthly Budget (INR) | Primary Responsibility |
| :--- | :---: | :---: | :--- |
| **Full-Stack Engineers** | 3.0 | ₹6,00,000 | Core API, Database integration, Auth flow, React frontend dashboards, and WebSockets. |
| **Specialized Sandbox Engineers** | 1.0 | ₹2,00,000 | **CSE:** Docker sandboxing, compile-time/runtime isolates.<br>**ECE:** SPICE simulators, PySpice, ngspice, and schematic parsers. |
| **DevOps / Infrastructure** | 1.0 | ₹1,50,000 | AWS account management, S3 storage pipelines, Kubernetes clustering, CI/CD, and Sentry/DataDog monitoring. |
| **Product Manager** | 1.0 | ₹1,00,000 | PRD updates, task prioritization, company partner outreach, user research feedback loop. |
| **UI/UX Designer** | 1.0 | ₹80,000 | Web editor custom IDE themes, interactive circuit diagram previews, and gamification slider flows. |
| **QA / Tester** | 1.0 | ₹60,000 | Edge-case test suites, validation logic, system boundary limits, and automation testing. |
| **Community Manager** | 0.5 | ₹25,000 | Discord community moderation, leaderboard verification, student onboarding, and support. |
| **TOTAL** | **8.5** | **₹11,15,000** | **10-Week Personnel Budget: ~₹28,00,000 (CSE) to ₹38,00,000 (ECE)** |

---

## 2. Core Skill Matrix Required

### A. Core Software Development (Full-Stack Engineers)
* **Frontend Languages & Frameworks:** React.js, Tailwind CSS, TypeScript, HTML5/CSS3.
* **IDE Component Integration:** Integration of Monaco Editor (configuring themes, linting rules, language configurations).
* **Backend Engines:** Node.js, Express.js (REST API design, routing, middleware).
* **Database Management:** PostgreSQL (relational DB design, schema indexes, query optimization) and Redis (caching, pub/sub, queue storage).
* **Real-time Synchronization:** Socket.io / WebSockets (for live streaming compiler logs/terminal output to the UI).

### B. Core Infrastructure & Sandbox (DevOps & Sandbox Engineers)
* **Containerization & Isolation:** Advanced Docker (creating rootless containers, memory/CPU limit flags, file system bounds using read-only structures, and `tmpfs` mounts).
* **Orchestration:** Kubernetes (GKE or EKS) for dynamic scaling of sandbox worker nodes under high submission loads.
* **Queuing Systems:** BullMQ or RabbitMQ (managing async, high-availability runner queues).
* **Security & Auditing:** Static code analysis rules, syscall restriction layers (`seccomp`, `apparmor`), and secure file exchange protocols.
* **Cloud Infrastructure:** AWS Services (EC2 compute, RDS PostgreSQL, S3 storage buckets, IAM security policies).

### C. Domain-Specific Skills (Sandbox Specialists)
#### For Computer Science (CSE)
* **Multi-Language Runtimes:** Deep configuration knowledge of Python, Java, C++, JS, Go, and Rust runtime compilers.
* **Algorithmic Complexity Analysis:** Python AST parsing (Abstract Syntax Tree) to dynamically score code logic complexity and estimate Big O runtime bounds.
* **Plagiarism Auditing:** MOSS (Measure of Software Similarity) API integration.

#### For Electronics (ECE)
* **Circuit Simulators:** Expert integration of SPICE netlist syntax solvers (`ngspice`, `LTSpice`).
* **Python Simulation Bindings:** Python wrappers for hardware interfaces (`PySpice`, `numpy`, `scipy`).
* **CAD/Schematic Parsers:** Parsers to read Proteus schematic (`.ckt`) XML binaries, LTSpice schematic files (`.asc`), and standard SPICE netlist syntax (`.cir`).

### D. Blockchain / Web3 Integration
* **Smart Contracts:** Solidity development for custom ERC-721 token mechanics.
* **Token Deployments:** Experience deploying code to Ethereum-compatible layer 2 networks (Polygon Mumbai/Amoy testnets).
* **Web3 Onboarding Platforms:** Integration of passwordless wallets (Torus Wallet SDK, Aadhaar-linked wallets) to bypass Web3 barrier of entry for typical college students.

---

## 3. Total Development Effort Estimate
* **Total Time Duration:** 10 Weeks (70 Days) from kickoff to launch.
* **Total Engineering Effort:** 
  * 5 core engineers (3 Full-Stack, 1 Sandbox, 1 DevOps) working 40 hours/week.
  * $5 \times 40 \times 10 = \mathbf{2,000 \text{ Engineering Person-Hours}}$ total.
  * Adding QA, design, and PM, total project execution represents **~3,400 Total Person-Hours**.
