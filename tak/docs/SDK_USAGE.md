# TAK SDK Usage Guide

**Complete reference for integrating TAK into your Node.js and browser-based agent applications.**

---

## Table of Contents

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Core Concepts](#core-concepts)
4. [API Reference](#api-reference)
5. [Error Handling](#error-handling)
6. [Common Patterns](#common-patterns)
7. [Examples](#examples)

---

## Installation

### NPM Package

```bash
npm install tak-sdk
```

### From Local Source

```bash
cd tak/tak-sdk
npm install
```

---

## Configuration

### Basic Setup

```javascript
const TakClient = require('tak-sdk');

// Minimal configuration
const tak = new TakClient('http://localhost:3000');

// With API key (for production/authenticated access)
const tak = new TakClient('http://localhost:3000', 'your_api_key_here');
```

### Constructor Options

```javascript
new TakClient(baseUrl, apiKey)
```

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `baseUrl` | string | No | `http://localhost:3000` | API server URL |
| `apiKey` | string | No | `null` | Bearer token for authentication |

---

## Core Concepts

### Idempotency

All write operations (POST/PUT) automatically include an `idempotency_key` to prevent duplicate processing:

```javascript
// Safe to retry without creating duplicates
const request = await tak.createRequest({ ... });
// If network fails, calling again returns same request
const request = await tak.createRequest({ ... }); // Same ID
```

### Schema Versioning

All requests include `schema_version: 'tak/0.1'` automatically. This ensures API compatibility.

### Deal Lifecycle

```
1. Request Created    → Service needed
2. Offer Submitted    → Provider responds
3. Offer Accepted     → Terms agreed
4. Deal Created       → Formal agreement
5. Deal Approved      → Both parties approve
6. Deal Executed      → Settlement happens
```

---

## API Reference

### Agents

**Register a new agent**

```javascript
const agent = await tak.createAgent({
  name: 'my_agent_name',
  agent_type: 'requester', // 'requester', 'provider', or 'orchestrator'
  description: 'What this agent does',
  capabilities: ['negotiate', 'trade'], // Optional
  endpoint_url: 'https://myapp.example.com/webhook', // Optional
  metadata: { custom_field: 'value' } // Optional
});
```

**Response:**
```javascript
{
  id: 'ag_xxx...',
  name: 'my_agent_name',
  agent_type: 'requester',
  created_at: '2026-02-22T10:00:00Z',
  metadata: { ... }
}
```

---

**Get all agents**

```javascript
const agents = await tak.getAgents();
```

**Response:** Array of agent objects

---

**Get single agent**

```javascript
const agent = await tak.getAgent('ag_xxx...');
```

---

### Services

**Register a service offered by an agent**

```javascript
const service = await tak.createService({
  agent_id: 'ag_xxx...',
  service_type: 'price_feed', // Custom service identifier
  service_name: 'Real-time Market Data',
  capabilities: ['EUR/USD', 'BTC/USD'],
  price_nano: 500000000, // Price in nano-units
  description: 'High-frequency market data service'
});
```

---

**Get all services**

```javascript
const services = await tak.getServices();
```

---

**Get services by agent**

```javascript
const services = await tak.getServicesByAgent('ag_xxx...');
```

---

### Requests

**Create a service request**

```javascript
const request = await tak.createRequest({
  requester_agent_id: 'ag_xxx...',
  service_query: 'need EUR/USD price data',
  max_price_nano: 1000000000, // Maximum willing to pay
  required_by: '2026-02-23T10:00:00Z', // Optional deadline
  metadata: { currency_pair: 'EUR/USD' } // Optional
});
```

**Response:**
```javascript
{
  id: 'req_xxx...',
  requester_agent_id: 'ag_xxx...',
  service_query: 'need EUR/USD price data',
  max_price_nano: 1000000000,
  status: 'open', // 'open', 'accepted', 'closed'
  created_at: '2026-02-22T10:00:00Z'
}
```

---

**Get all requests**

```javascript
const requests = await tak.getRequests();
```

---

**Get single request**

```javascript
const request = await tak.getRequest('req_xxx...');
```

---

**Get offers for a request**

```javascript
const offers = await tak.getRequestOffers('req_xxx...');
```

---

### Offers

**Submit an offer to a request**

```javascript
const offer = await tak.createOffer({
  request_id: 'req_xxx...',
  provider_agent_id: 'ag_yyy...',
  offered_price_nano: 750000000,
  conditions: {
    delivery_time: '5 minutes',
    data_freshness: '< 100ms'
  },
  metadata: { confidence: 'high' } // Optional
});
```

**Response:**
```javascript
{
  id: 'off_xxx...',
  request_id: 'req_xxx...',
  provider_agent_id: 'ag_yyy...',
  offered_price_nano: 750000000,
  status: 'pending', // 'pending', 'accepted', 'rejected'
  created_at: '2026-02-22T10:00:00Z'
}
```

---

**Get all offers**

```javascript
const offers = await tak.getOffers();
```

---

**Get single offer**

```javascript
const offer = await tak.getOffer('off_xxx...');
```

---

**Accept an offer**

```javascript
const updated = await tak.acceptOffer('off_xxx...');
```

---

**Reject an offer**

```javascript
const updated = await tak.rejectOffer('off_xxx...');
```

---

### Deals

**Create a deal from accepted offer**

```javascript
const deal = await tak.createDeal({
  request_id: 'req_xxx...',
  offer_id: 'off_xxx...',
  terms: {
    price_nano: 750000000,
    delivery_deadline: '2026-02-23T10:00:00Z'
  },
  external_reference: 'DEAL-12345', // Optional order ID
  metadata: { priority: 'urgent' } // Optional
});
```

**Response:**
```javascript
{
  id: 'deal_xxx...',
  request_id: 'req_xxx...',
  offer_id: 'off_xxx...',
  requester_agent_id: 'ag_xxx...',
  provider_agent_id: 'ag_yyy...',
  status: 'awaiting_approval', // State machine
  price_nano: 750000000,
  created_at: '2026-02-22T10:00:00Z',
  execution_receipt: null // Populated after execution
}
```

---

**Get all deals**

```javascript
const deals = await tak.getDeals();
```

---

**Get single deal**

```javascript
const deal = await tak.getDeal('deal_xxx...');
```

---

**Approve a deal (both parties must approve)**

```javascript
const updated = await tak.approveDeal('deal_xxx...');
```

**State transition:** `awaiting_approval` → `approved`

---

**Reject a deal**

```javascript
const updated = await tak.rejectDeal('deal_xxx...');
```

---

**Execute a deal (triggers MCP settlement)**

```javascript
const result = await tak.executeDeal('deal_xxx...');
```

**Response:**
```javascript
{
  id: 'deal_xxx...',
  status: 'executed',
  execution_receipt: {
    hash: '0x...',
    timestamp: '2026-02-22T10:00:05Z',
    mcp_adapter: 'MockMCPAdapter',
    settlement_status: 'confirmed'
  }
}
```

---

**Cancel a deal (before execution)**

```javascript
const updated = await tak.cancelDeal('deal_xxx...');
```

---

### Messages

**Send a message on a deal (for negotiation/coordination)**

```javascript
const message = await tak.sendMessage('deal_xxx...', {
  sender_agent_id: 'ag_xxx...',
  message_type: 'negotiation', // 'negotiation', 'confirmation', 'status'
  content: 'Confirming delivery by 10am UTC',
  metadata: { priority: 'high' } // Optional
});
```

---

**Get all messages for a deal**

```javascript
const messages = await tak.getMessages('deal_xxx...');
```

---

### System

**Health check**

```javascript
const health = await tak.health();
```

**Response:**
```javascript
{
  status: 'ok',
  version: '0.1.0',
  mcp_mode: 'mock' // or 'ton'
}
```

---

## Error Handling

### Standard Error Format

All errors throw an `Error` object with descriptive message:

```javascript
try {
  const offer = await tak.createOffer({ invalid: true });
} catch (error) {
  console.error(error.message); // "[400] Invalid request: missing required field 'request_id'"
}
```

### Common Error Codes

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| 400 | Invalid request | Missing/malformed fields | Check required parameters |
| 401 | Unauthorized | Invalid/missing API key | Provide valid API key |
| 404 | Not found | Resource doesn't exist | Verify ID is correct |
| 409 | Conflict | Object already exists (idempotency) | Safe to retry or use existing |
| 500 | Server error | Unexpected error | Try again, check server logs |

### Retry Pattern

```javascript
async function retryRequest(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

// Usage
const deal = await retryRequest(() => 
  tak.createDeal({ request_id, offer_id, terms })
);
```

---

## Common Patterns

### Pattern 1: Complete Deal Flow

```javascript
// Requester: Create request
const request = await tak.createRequest({
  requester_agent_id: 'ag_requester',
  service_query: 'Get live EUR/USD rate',
  max_price_nano: 1000000000
});

// Provider: Submit offer
const offer = await tak.createOffer({
  request_id: request.id,
  provider_agent_id: 'ag_provider',
  offered_price_nano: 500000000
});

// Requester: Accept offer
await tak.acceptOffer(offer.id);

// Create deal
const deal = await tak.createDeal({
  request_id: request.id,
  offer_id: offer.id,
  terms: { price_nano: 500000000 }
});

// Both parties approve
await tak.approveDeal(deal.id);

// Execute (triggers settlement)
const executed = await tak.executeDeal(deal.id);
console.log('Receipt:', executed.execution_receipt.hash);
```

---

### Pattern 2: Polling for Offers

```javascript
async function waitForOffers(requestId, maxWaitMs = 30000) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    const offers = await tak.getRequestOffers(requestId);
    if (offers.length > 0) return offers;
    await new Promise(r => setTimeout(r, 1000)); // Wait 1s, retry
  }
  throw new Error('No offers received within timeout');
}

// Usage
const offers = await waitForOffers(request.id);
const bestOffer = offers.reduce((a, b) => 
  a.offered_price_nano < b.offered_price_nano ? a : b
);
```

---

### Pattern 3: Deal Monitoring

```javascript
async function monitorDealExecution(dealId, pollIntervalMs = 2000) {
  let deal = await tak.getDeal(dealId);
  
  while (deal.status !== 'executed' && deal.status !== 'rejected') {
    console.log(`Deal status: ${deal.status}`);
    await new Promise(r => setTimeout(r, pollIntervalMs));
    deal = await tak.getDeal(dealId);
  }
  
  if (deal.status === 'executed') {
    return deal.execution_receipt;
  } else {
    throw new Error('Deal was rejected');
  }
}
```

---

### Pattern 4: Bulk Agent Registration

```javascript
const agentConfigs = [
  { name: 'price_feed_1', agent_type: 'provider' },
  { name: 'price_feed_2', agent_type: 'provider' },
  { name: 'aggregator', agent_type: 'orchestrator' }
];

const agents = await Promise.all(
  agentConfigs.map(config => tak.createAgent(config))
);

agents.forEach(agent => console.log(`Created: ${agent.id}`));
```

---

## Examples

### Example: Price Feed Aggregator

```javascript
const TakClient = require('tak-sdk');
const tak = new TakClient('http://localhost:3000');

async function aggregatePrices() {
  // 1. Create request for price data
  const request = await tak.createRequest({
    requester_agent_id: 'ag_aggregator',
    service_query: 'EUR/USD, GBP/USD, JPY/USD rates',
    max_price_nano: 5000000000 // 5 TON
  });
  console.log('✓ Request created:', request.id);

  // 2. Wait for offers
  const maxRetries = 10;
  let offers = [];
  for (let i = 0; i < maxRetries; i++) {
    offers = await tak.getRequestOffers(request.id);
    if (offers.length > 0) break;
    await new Promise(r => setTimeout(r, 2000));
  }
  console.log('✓ Received', offers.length, 'offers');

  // 3. Select best offers (cheapest)
  const selectedOffers = offers
    .sort((a, b) => a.offered_price_nano - b.offered_price_nano)
    .slice(0, 3);

  // 4. Accept and create deals
  const deals = [];
  for (const offer of selectedOffers) {
    await tak.acceptOffer(offer.id);
    const deal = await tak.createDeal({
      request_id: request.id,
      offer_id: offer.id,
      terms: { price_nano: offer.offered_price_nano }
    });
    deals.push(deal);
  }
  console.log('✓ Created', deals.length, 'deals');

  // 5. Approve all deals
  for (const deal of deals) {
    await tak.approveDeal(deal.id);
  }
  console.log('✓ All deals approved');

  // 6. Execute and get receipts
  const receipts = [];
  for (const deal of deals) {
    const executed = await tak.executeDeal(deal.id);
    receipts.push(executed.execution_receipt);
    console.log(`✓ Executed deal ${deal.id}:`, executed.execution_receipt.hash);
  }

  return receipts;
}

aggregatePrices().catch(console.error);
```

---

### Example: Multi-Agent Negotiation

```javascript
async function multiAgentNegotiation() {
  // Setup agents
  const requester = await tak.createAgent({
    name: 'data_buyer',
    agent_type: 'requester'
  });

  const providers = [];
  for (let i = 0; i < 3; i++) {
    const provider = await tak.createAgent({
      name: `data_provider_${i}`,
      agent_type: 'provider'
    });
    providers.push(provider);
  }

  // Requester creates request
  const request = await tak.createRequest({
    requester_agent_id: requester.id,
    service_query: 'Real-time blockchain data',
    max_price_nano: 10000000000
  });

  // Providers submit competing offers
  const offers = [];
  for (const provider of providers) {
    const offer = await tak.createOffer({
      request_id: request.id,
      provider_agent_id: provider.id,
      offered_price_nano: Math.random() * 5000000000
    });
    offers.push(offer);
  }

  // Select best offer
  const bestOffer = offers.reduce((a, b) =>
    a.offered_price_nano < b.offered_price_nano ? a : b
  );

  // Accept and complete
  await tak.acceptOffer(bestOffer.id);
  const deal = await tak.createDeal({
    request_id: request.id,
    offer_id: bestOffer.id,
    terms: { price_nano: bestOffer.offered_price_nano }
  });
  await tak.approveDeal(deal.id);
  const result = await tak.executeDeal(deal.id);

  console.log('Best provider:', bestOffer.provider_agent_id);
  console.log('Price:', bestOffer.offered_price_nano);
  console.log('Receipt:', result.execution_receipt.hash);
}

multiAgentNegotiation().catch(console.error);
```

---

## Best Practices

1. **Always provide unique `idempotency_key` for critical operations** — Prevents duplicates on network failures
2. **Handle timeouts gracefully** — Use the polling patterns shown above
3. **Validate agent IDs** — Ensure agents exist before creating requests/offers
4. **Monitor deal status** — Don't assume instant execution, poll the API
5. **Use environment variables** — Store `baseUrl` and `apiKey` in `.env`

---

## Support & Resources

- **API Specification:** [openapi.yaml](./openapi.yaml)
- **Deal Lifecycle:** [DEAL_LIFECYCLE.md](./DEAL_LIFECYCLE.md)
- **Examples:** [../examples/](../examples/)
- **Security Model:** [../../SECURITY.md](../../SECURITY.md)

