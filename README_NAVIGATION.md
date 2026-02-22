# README Navigation Guide

## Quick Navigation to Key Sections

### For First-Time Readers

Start here and read in order:

1. **[What Problem Does TAK Solve?](#what-problem-does-tak-solve)** — Understand the gap
2. **[What is TAK?](#what-is-tak)** — Learn what TAK provides
3. **[Quick Start](#quick-start)** — Get running in 5 minutes

### For Developers Evaluating TAK

Read these sections:

1. **[What Problem Does TAK Solve?](#what-problem-does-tak-solve)** — Does it solve my problem?
2. **[How Agents Interact Through TAK](#how-agents-interact-through-tak)** — Real code examples
3. **[API Endpoints](#api-endpoints)** — What can I do?
4. **[Installation & Integration](#installation--integration)** — How do I integrate?

### For Teams Planning Integration

Focus on:

1. **[Use Cases](#use-cases)** — Does my use case fit?
2. **[Deal Lifecycle (State Machine)](#deal-lifecycle-state-machine)** — How do deals work?
3. **[Environment Configuration](#environment-configuration)** — How do I set it up?
4. **[Deployment](#deployment)** — Production considerations
5. **[Security & Safety](#security--safety)** — Safety guarantees

### For Contributors

Study:

1. **[Project Structure](#project-structure)** — Where is everything?
2. **[Development Workflow](#development-workflow)** — How to develop locally
3. **[Contributing](#contributing)** — How to submit changes
4. **[MCP Adapter](#mcp-adapter)** — How to implement features

### For DevOps/Production

See:

1. **[Environment Configuration](#environment-configuration)** — Vars needed
2. **[MCP Adapter](#mcp-adapter)** — Production vs development
3. **[Security & Safety](#security--safety)** — Security model
4. **[Deployment](#deployment)** — Production setup

---

## Section Overview

| Section                      | Purpose                   | Length     | Read Time |
| ---------------------------- | ------------------------- | ---------- | --------- |
| What Problem Does TAK Solve? | Context & motivation      | ~200 words | 3 min     |
| What is TAK?                 | Architecture & components | ~300 words | 5 min     |
| The Real Product             | Detailed breakdown        | ~400 words | 6 min     |
| Use Cases                    | Real-world applications   | ~300 words | 5 min     |
| How Agents Interact          | Full working example      | ~400 words | 7 min     |
| Deal Lifecycle               | State machine             | ~150 words | 3 min     |
| Key Properties               | Safety guarantees         | ~200 words | 3 min     |
| Quick Start                  | Installation              | ~100 words | 2 min     |
| Installation & Integration   | Full setup                | ~200 words | 4 min     |
| Testing Your Setup           | Verification              | ~150 words | 3 min     |
| Documentation                | Links                     | ~150 words | 2 min     |
| Environment Configuration    | Setup guide               | ~150 words | 3 min     |
| Project Structure            | Directory map             | ~200 words | 3 min     |
| Development Workflow         | Dev setup                 | ~200 words | 4 min     |
| API Endpoints                | Endpoint list             | ~150 words | 2 min     |
| Security & Safety            | Safety model              | ~200 words | 3 min     |
| MCP Adapter                  | Architecture              | ~250 words | 4 min     |
| Contributing                 | How to help               | ~100 words | 2 min     |
| Deployment                   | Production                | ~50 words  | 1 min     |
| Support & Resources          | Help                      | ~100 words | 2 min     |
| Roadmap                      | Future plans              | ~100 words | 2 min     |
| License                      | Legal                     | ~50 words  | 1 min     |
| The Vision                   | Mission                   | ~50 words  | 1 min     |

**Total reading time: ~60 minutes for complete README**

---

## Key Takeaways by Audience

### Project Evaluators

> TAK is infrastructure for the agent economy. It solves the **coordination problem** (how agents find, negotiate, and agree on services). It's not a consumer app or a blockchain—it's the **coordination layer** between agents and blockchain settlement.

### Prospective Users

> TAK enables agents to coordinate using one standard workflow instead of building custom logic. Start with the quick start (2 min), review use cases (does your scenario fit?), then integrate using the SDK.

### Developers

> The API is simple (6 endpoints). States are well-defined (deal lifecycle). Security is explicit (approval gates, immutability). MCP adapter abstraction supports mock (dev) and production (TON) modes.

### Operations

> Use MockMCPAdapter for development. Switch to TonMCPAdapter for production (requires TON configuration). All configuration via environment variables. Database is SQLite (self-contained).

---

## Finding Specific Information

### "How do I..."

| Question                           | Section                                                                            |
| ---------------------------------- | ---------------------------------------------------------------------------------- |
| ...get started?                    | [Quick Start](#quick-start)                                                        |
| ...integrate TAK into my agent?    | [Installation & Integration](#installation--integration) or [examples/](examples/) |
| ...understand deal safety?         | [Security & Safety](#security--safety)                                             |
| ...deploy to production?           | [Deployment](#deployment)                                                          |
| ...contribute code?                | [Contributing](#contributing)                                                      |
| ...see a real example?             | [How Agents Interact Through TAK](#how-agents-interact-through-tak)                |
| ...understand the API?             | [API Endpoints](#api-endpoints) or [OpenAPI Spec](./tak/docs/openapi.yaml)         |
| ...set up development environment? | [Development Workflow](#development-workflow)                                      |
| ...use TonMCPAdapter?              | [MCP Adapter](#mcp-adapter)                                                        |
| ...learn about deal states?        | [Deal Lifecycle](#deal-lifecycle-state-machine)                                    |

### "Tell me about..."

| Topic             | Section                                 |
| ----------------- | --------------------------------------- |
| Architecture      | [What is TAK?](#what-is-tak)            |
| Use cases         | [Use Cases](#use-cases)                 |
| Security model    | [SECURITY.md](./SECURITY.md)            |
| API endpoints     | [API Endpoints](#api-endpoints)         |
| MCP adapter       | [MCP Adapter](#mcp-adapter)             |
| Project structure | [Project Structure](#project-structure) |
| Roadmap           | [Roadmap](#roadmap)                     |

---

## Document Cross-References

### Main README points to:

- **[Core README](./tak/README.md)** — Technical details
- **[OpenAPI Spec](./tak/docs/openapi.yaml)** — API specification
- **[Deal Lifecycle](./tak/docs/DEAL_LIFECYCLE.md)** — State machine details
- **[Security Model](./SECURITY.md)** — Threat analysis
- **[Deployment Guide](./DEPLOYMENT.md)** — Production setup
- **[Contributing Guide](./CONTRIBUTING.md)** — How to contribute
- **[examples/](./tak/examples/)** — Code examples

### Use This Matrix to Find Information:

```
What I Want to Know → Document → Section
─────────────────────────────────────────────────────
Understanding TAK → README → What is TAK?
Using the API → OpenAPI spec → Endpoints
Securing deals → SECURITY.md → Core Principle
Deploying → DEPLOYMENT.md → Setup
Deal workflow → DEAL_LIFECYCLE.md → State Machine
Contributing → CONTRIBUTING.md → How to Contribute
```

---

## Quick Command Reference

### Getting Started

```bash
git clone <repo>
cd Ton
npm install
cd tak/tak-sdk && npm install
cd ../tak-server && npm install
cd ../..
npm run dev
```

### Testing

```bash
# Create agent
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{"name":"test1","agent_type":"requester"}'

# List all deals
curl http://localhost:3000/api/deals
```

### Examples

```bash
node tak/examples/quickstart.js
node tak/examples/example_node_client.js
node tak/examples/demo_flow_runner.js
```

### Configuration

```bash
cp .env.example .env
# Edit .env as needed
# MCP_MODE=mock (development)
# MCP_MODE=ton (production, requires config)
```

---

## Emoji Guide in README

- 🔧 Technical feature/component
- 💰 Pricing/cost related
- 📝 Documentation/notes
- 🔐 Security feature
- 🔗 Blockchain integration
- ⚡ Speed/performance
- ✅ Completed item
- ❌ Not included
- 📁 File/folder reference
- 📖 Documentation link
- 🎪 Use case
- 🏗️ Architecture
- 🚀 Future/coming soon

---

## Document Metrics

- **Total lines:** 536 (vs 262 before)
- **Code examples:** 8
- **Diagrams:** 3 (ASCII)
- **External links:** 15+
- **Sections:** 20+
- **Use cases:** 4

---

## How to Use This Guide

1. **New visitor?** Start with "For First-Time Readers"
2. **Evaluating TAK?** Follow "For Developers Evaluating TAK"
3. **Looking for something specific?** Use "Finding Specific Information"
4. **Cross-referencing?** See "Document Cross-References"
5. **Getting help?** Try "How do I..." or "Tell me about..."

---

## Feedback

If you find:

- A section unclear → [Create an issue](https://github.com/)
- A missing use case → [Submit PR](https://github.com/)
- A broken link → [Report bug](https://github.com/)
- An improvement → [Open discussion](https://github.com/)

---

**Last updated:** February 22, 2026  
**README version:** v0.2 (improved)  
**Maintained by:** TAK Contributors
