# TAK — TON Agent Kit

**Developer Infrastructure for Agent Coordination on TON**

---

## What Problem Does TAK Solve?

In the emerging **agent economy**, autonomous agents (AI bots, Telegram bots, data providers, trading algorithms) need to work together. Today, this requires:

- 🔧 Custom negotiation logic in every agent system
- 💰 Custom pricing and deal validation
- 📝 Custom state management for agreements
- 🔐 Custom security and approval workflows
- 🔗 Custom blockchain integration for settlement

**This is infrastructure being built 100 times in parallel.**

TAK solves this by providing the **standardized coordination layer** that all agent systems need.

---

## What is TAK?

**TAK (TON Agent Kit)** is a **developer infrastructure product** that provides:

1. **Standardized API** — For agents to find, negotiate, and execute service agreements
2. **JavaScript SDK** — For easy integration into agent applications
3. **State Machine** — Deal lifecycle management (discovery → negotiation → agreement → execution)
4. **Security Model** — Approval gates, fund safety, immutable deals

### The Architecture

```
Agent A                    Agent B
    │                          │
    └──────────────────────────┘
              ↓
         TAK (Off-chain Coordination)
         ├─ Service Discovery
         ├─ Pricing Negotiation
         ├─ Deal Management
         └─ Security Gates
              ↓
         MCP Adapter (Execution Bridge)
         ├─ MockMCPAdapter (Development)
         └─ TonMCPAdapter (Production)
              ↓
         TON Blockchain (Settlement)
         └─ Immutable Record
```

**Key Message:** `TAK coordinates. TON MCP executes. TAK never holds funds.`

---

## The Real Product

```
API/SDK = Product
UI = Demo
```

TAK consists of three core components:

### 1. **REST API** (6 Endpoints)

Agents call these endpoints to coordinate:

- `POST /agents` — Register agent identity
- `POST /requests` — Create a service request ("I need X service")
- `POST /offers` — Submit a pricing offer ("I'll provide X for Y price")
- `POST /offers/:id/accept` — Accept an offer
- `POST /deals` — Lock the agreement (immutable terms)
- `POST /deals/:id/approve` — Security gate (both parties must approve)
- `POST /deals/:id/execute` — Delegate to MCP for TON settlement

Each endpoint is documented in [OpenAPI spec](./tak/docs/openapi.yaml).

### 2. **JavaScript SDK** (`tak-sdk`)

Simple wrapper for the REST API:

```javascript
const TakClient = require("tak-sdk");
const tak = new TakClient("http://localhost:3000");

// 1. Create request
const request = await tak.createRequest({
  service_type: "price_feed",
  max_price_nano: 500000000,
});

// 2. Wait for offer
const offer = await tak.submitOffer({
  request_id: request.id,
  price_nano: 300000000,
});

// 3. Accept offer
await tak.acceptOffer(offer.id);

// 4. Create deal (lock terms)
const deal = await tak.createDeal({
  request_id: request.id,
  offer_id: offer.id,
});

// 5. Both parties approve
await tak.approveDeal(deal.id);

// 6. Execute on TON via MCP
const receipt = await tak.executeDeal(deal.id);
```

### 3. **MCP Adapter Architecture** (Execution)

TAK is **pluggable** — it doesn't execute transactions itself. Instead, it delegates to adapters:

- **MockMCPAdapter** — For development/testing (returns fake receipts)
- **TonMCPAdapter** — For production (real TON blockchain execution)

This separation is crucial: **TAK coordinates, MCP executes. TAK never touches funds.**

---

## Use Cases

TAK enables a **Machine-to-Machine Service Marketplace** on TON:

### 1. **AI Trading Agents**

- Agent A needs real-time price feeds
- Agent B provides market data
- TAK coordinates negotiation + settlement
- MCP/TON handles the transaction

### 2. **Data Provider Networks**

- Sensor network needs to sell telemetry
- Analytics service wants to buy data
- TAK negotiates volume, price, delivery
- MCP/TON settles payment

### 3. **Autonomous Service Chains**

- Telegram bot needs to call backend API
- Backend service offers usage tiers
- TAK manages agreement + rate limiting
- MCP/TON handles charges

### 4. **Decentralized Execution Markets**

- dApp needs off-chain computation
- Compute provider offers execution
- TAK coordinates matching + pricing
- MCP/TON settles fees

---

## How Agents Interact Through TAK

### Example: AI Agent Buying Market Data

```javascript
// === Agent A (Buyer) ===
const tak = new TakClient("http://api.tak.ton");

// 1. Create request
const request = await tak.createRequest({
  requester_agent_id: "ag_trader_001",
  service_type: "price_feed",
  requirements: { pairs: ["TON/USD", "TON/EUR"], updateFreq: "1min" },
  max_price_nano: 1000000000, // 1 TON max
});

// 2. Wait for offers
const offers = await tak.getOffers(request.id);
// Returns multiple offers from different data providers

// 3. Accept best offer
const bestOffer = offers.reduce((b, o) =>
  o.price_nano < b.price_nano ? o : b,
);
await tak.acceptOffer(bestOffer.id);

// 4. Create deal to lock terms
const deal = await tak.createDeal({
  request_id: request.id,
  offer_id: bestOffer.id,
  service_type: "price_feed",
});

// 5. Review deal
console.log({
  requester: deal.payer_agent_id,
  provider: deal.payee_agent_id,
  price: deal.amount_nano,
  status: deal.status, // 'awaiting_approval'
});

// 6. Approve (security gate)
await tak.approveDeal(deal.id);

// 7. Execute (delegates to MCP → TON)
const result = await tak.executeDeal(deal.id);
console.log("Settlement complete:", result.execution_receipt);

// === Agent B (Provider) ===
const providerTak = new TakClient("http://api.tak.ton");

// Listen for requests
const requests = await providerTak.getRequests();

// Submit offer
const offer = await providerTak.submitOffer({
  request_id: requests[0].id,
  provider_agent_id: "ag_dataop_001",
  price_nano: 750000000, // 0.75 TON
  terms: { deliveryMethod: "websocket_stream", uptime_sla: "99.5%" },
});

// Provider also approves before execution
await providerTak.approveDeal(deal.id);
```

---

## Deal Lifecycle (State Machine)

TAK enforces a strict deal lifecycle to prevent errors and fraud:

```
┌─────────────────────────────────────────┐
│ AWAITING_APPROVAL (initial state)       │
│ - Deal is locked (terms immutable)     │
│ - Both parties review                   │
│ - Either party can cancel               │
└─────────────────────────────────────────┘
           ↓                ↓
        APPROVE          CANCEL
           ↓                ↓
    ┌──────────────┐  ┌──────────────┐
    │  APPROVED    │  │  CANCELLED   │
    │ (final)      │  │  (final)     │
    └──────────────┘  └──────────────┘
           ↓
      EXECUTE via MCP
           ↓
       ┌──────────────┬──────────────┐
       ↓              ↓
    EXECUTED       FAILED
    (final)        (final)
```

**Details:** See [DEAL_LIFECYCLE.md](./tak/docs/DEAL_LIFECYCLE.md)

---

## Key Properties

### 1. **TAK Never Holds Funds**

- TAK stores deal terms (off-chain)
- Execution delegated to MCP adapter (TON blockchain)
- No private keys in TAK system
- No token contracts required

### 2. **Deals Are Immutable**

Once created, deal terms cannot change:

- Payer, payee, amount, service type are locked
- Prevents price manipulation
- Prevents party swaps
- Ensures predictability

### 3. **Approval Gates**

Both parties must explicitly approve before execution:

- Prevents unilateral transaction triggering
- Security checkpoint
- Clear audit trail
- Can be extended to multi-sig

### 4. **Idempotent Operations**

Every request includes `idempotency_key`:

- Safe retries (duplicate requests ignored)
- Works across network failures
- Prevents double-execution
- Production-grade safety

### 5. **Pluggable Execution**

MCP adapter abstraction allows:

- Development testing with MockMCPAdapter
- Production TON execution with TonMCPAdapter
- Future: Ethereum, Solana, other chains
- Clean separation of concerns

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/Ton.git
cd Ton

# Install root dependencies
npm install

# Install TAK SDK
cd tak/tak-sdk
npm install

# Install TAK Server
cd ../tak-server
npm install

# Return to root
cd ../..

# Start the server (development mode)
npm run dev
```

Server runs on `http://localhost:3000`

---

## Installation & Integration

### As an NPM Package (Production)

```bash
npm install tak-sdk
```

### Local Development

```bash
cd tak/tak-server
npm install
npm run dev
```

### Using Docker (Future)

```bash
docker run -p 3000:3000 -e MCP_MODE=mock tak:latest
```

---

## Testing Your Setup

### 1. Create an Agent

```bash
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test_agent_1",
    "agent_type": "requester"
  }'
```

### 2. Create a Request

```bash
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "requester_agent_id": "ag_xxx",
    "service_query": "need price feed data",
    "max_price_nano": 1000000000
  }'
```

### 3. Check Results

```bash
curl http://localhost:3000/api/deals
```

**See detailed examples in:** [examples/](./tak/examples/)

---

## Documentation

| Document                                       | Purpose                             |
| ---------------------------------------------- | ----------------------------------- |
| [TAK Core README](./tak/README.md)             | Full technical reference            |
| [OpenAPI Spec](./tak/docs/openapi.yaml)        | Complete API specification          |
| [Deal Lifecycle](./tak/docs/DEAL_LIFECYCLE.md) | State machine documentation         |
| [Security Model](./SECURITY.md)                | Security assumptions & threat model |
| [Deployment Guide](./DEPLOYMENT.md)            | Production deployment               |
| [Contributing Guide](./CONTRIBUTING.md)        | How to contribute                   |

---

## Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=sqlite.db

# MCP Adapter (mock for dev, ton for production)
MCP_MODE=mock
# MCP_MODE=ton
# TON_RPC_URL=https://toncenter.com/api/v2/jsonRPC
# TON_API_KEY=your_key
# TON_WALLET_ADDRESS=your_address
```

**MCP Modes:**

- `mock` — MockMCPAdapter (development/testing, safe, returns fake receipts)
- `ton` — TonMCPAdapter (production, requires TON configuration)

---

## Project Structure

```
Ton/
├── README.md                           ← You are here
├── SECURITY.md                         ← Security model
├── DEPLOYMENT.md                       ← Production deployment
├── CONTRIBUTING.md                     ← How to contribute
├── LICENSE                             ← MIT License
├── .env.example                        ← Configuration template
├── .gitignore
├── assets/                             ← Demo materials
├── examples/                           ← Code examples
│   ├── quickstart.js
│   ├── example_node_client.js
│   └── demo_flow_runner.js
└── tak/
    ├── README.md                       ← TAK technical docs
    ├── docs/
    │   ├── openapi.yaml                ← API specification
    │   ├── DEAL_LIFECYCLE.md           ← State machine
    │   ├── PRODUCT_DEFINITION.md
    │   ├── TECHNICAL_SPEC.md
    │   ├── API.md
    │   └── api-reference.md
    ├── tak-sdk/                        ← JavaScript SDK
    │   ├── package.json
    │   └── src/
    │       ├── index.js
    │       └── TakClient.js
    └── tak-server/                     ← REST API Server
        ├── package.json
        └── src/
            ├── index.js
            ├── db.js
            ├── seed.js
            ├── adapters/
            │   ├── MCPAdapter.js
            │   ├── MockMCPAdapter.js
            │   └── TonMCPAdapter.js    ← Production (TON)
            └── routes/
                ├── agents.js
                ├── requests.js
                ├── offers.js
                ├── deals.js
                ├── services.js
                └── messages.js
```

---

## Development Workflow

### 1. **Start Development Server**

```bash
cd tak/tak-server
npm run dev
```

The server auto-reloads on code changes.

### 2. **Run Examples**

```bash
cd tak/examples
node quickstart.js              # Quick example
node example_node_client.js     # Full workflow
node demo_flow_runner.js        # Demo scenario
```

### 3. **Run Tests**

```bash
cd tak/tak-server
npm test
```

### 4. **Database**

The database is SQLite (portable, no setup required):

```bash
# Located at: tak/tak-server/tak.db
# Clear database and reseed
npm run seed
```

---

## API Endpoints

TAK provides 6 core endpoints. See [OpenAPI spec](./tak/docs/openapi.yaml) for details:

### Agent Management

- `POST /api/agents` — Register an agent
- `GET /api/agents` — List all agents

### Service Discovery

- `POST /api/requests` — Create a service request
- `GET /api/requests` — List requests

### Pricing Negotiation

- `POST /api/offers` — Submit a pricing offer
- `POST /api/offers/:id/accept` — Accept an offer

### Deal Management

- `POST /api/deals` — Create a deal (lock terms)
- `GET /api/deals` — List deals
- `POST /api/deals/:id/approve` — Approve execution
- `POST /api/deals/:id/execute` — Execute on TON via MCP

---

## Security & Safety

### Core Principles

1. **TAK Never Holds Funds**
   - All deal terms are stored off-chain
   - Execution delegated to MCP (TON blockchain)
   - No private keys ever in TAK

2. **Deals Are Immutable**
   - Once created, terms cannot change
   - Prevents fraud and disputes
   - Full audit trail

3. **Approval Gates**
   - Both parties must approve before execution
   - Prevents unauthorized transactions
   - Clear consent model

4. **Idempotency**
   - All operations support `idempotency_key`
   - Safe to retry failed requests
   - Prevents double-execution

**See [SECURITY.md](./SECURITY.md) for complete threat model and security analysis.**

---

## MCP Adapter

TAK delegates execution to MCP adapters. Two implementations provided:

### MockMCPAdapter (Development)

```javascript
// For development/testing
const adapter = new MockMCPAdapter();
const receipt = await adapter.execute_payment(deal);
// Returns: mcp_receipt_abc123... (fake)
```

Safe for development. Returns fake receipts.

### TonMCPAdapter (Production)

```javascript
// For production TON execution
const adapter = new TonMCPAdapter({
  rpcUrl: process.env.TON_RPC_URL,
  apiKey: process.env.TON_API_KEY,
  walletAddress: process.env.TON_WALLET_ADDRESS,
});

const receipt = await adapter.execute_payment(deal);
// Returns: transaction hash from TON
```

Requires TON configuration. Executes real transactions.

**MCP mode is configured via environment:**

```bash
# Development (default)
MCP_MODE=mock

# Production
MCP_MODE=ton
```

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for:

- How to report issues
- How to submit code
- Development setup
- Areas for contribution

**Key areas for contribution:**

- TonMCPAdapter implementation (production TON integration)
- API enhancements (new endpoints, validation)
- SDK features (additional wrapper methods)
- Documentation improvements
- Test coverage
- Examples and guides

---

## Deployment

For production deployment, see [DEPLOYMENT.md](./DEPLOYMENT.md):

- Local setup
- Secure configuration
- Performance tuning
- Monitoring
- Docker support (coming)

---

## Support & Resources

### Documentation

- [Core README](./tak/README.md)
- [Technical Spec](./tak/docs/TECHNICAL_SPEC.md)
- [API Reference](./tak/docs/api-reference.md)
- [Deal Lifecycle](./tak/docs/DEAL_LIFECYCLE.md)

### Examples

- [quickstart.js](./tak/examples/quickstart.js) — Basic workflow
- [example_node_client.js](./tak/examples/example_node_client.js) — Full example
- [demo_flow_runner.js](./tak/examples/demo_flow_runner.js) — Demo scenario

### Getting Help

1. Check documentation above
2. Review [Security Model](./SECURITY.md)
3. Check [API Spec](./tak/docs/openapi.yaml)
4. Open an issue on GitHub

---

## Roadmap

### v0.1 (Current)

- ✅ Core API (agents, requests, offers, deals)
- ✅ MockMCPAdapter (development)
- ✅ State machine (deal lifecycle)
- ✅ Idempotency support

### v0.2 (Planned)

- Dual-approval for high-value deals
- Deal expiration & cancellation improvements
- Enhanced error handling
- Performance optimizations

### v0.3+

- JWT authentication
- GraphQL endpoints (alternative to REST)
- Multi-sig approval
- Formal state machine verification
- Docker deployment

---

## License

MIT License — see [LICENSE](./LICENSE)

**Summary:** You're free to use, modify, and distribute TAK for any purpose (commercial or personal).

---

## The Vision

TAK enables the **Agent Economy on TON**:

- Agents discover services through standardized discovery
- Agents negotiate pricing through common workflows
- Agents form secure agreements without custom code
- Agents execute safely via TON MCP without holding funds

**TAK is the coordination layer that makes it all possible.**

---

## Questions?

- **API Details:** See [OpenAPI Spec](./tak/docs/openapi.yaml)
- **Security:** See [Security Model](./SECURITY.md)
- **Integration:** See [examples/](./tak/examples/)
- **Contributing:** See [Contributing Guide](./CONTRIBUTING.md)
- **Deployment:** See [Deployment Guide](./DEPLOYMENT.md)

**Made with ❤️ for the TON community**
