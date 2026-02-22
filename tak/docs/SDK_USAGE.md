# TAK SDK Usage Guide

## Table of Contents

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Core Concepts](#core-concepts)
4. [API Reference](#api-reference)
5. [Error Handling](#error-handling)
6. [Examples](#examples)

---

## Installation

```bash
npm install tak-sdk
```

---

## Configuration

```javascript
const TakClient = require("tak-sdk");
const tak = new TakClient("http://localhost:3000");
const takAuth = new TakClient("http://localhost:3000", "api_key");
```

---

## Core Concepts

**Idempotency:** All write operations include auto `idempotency_key` to prevent duplicates.

**Schema Versioning:** All requests include `schema_version: 'tak/0.1'` automatically.

**Deal Lifecycle:**

```
Request → Offer → Accepted → Deal → Approved → Executed
```

---

## API Reference

### Agents

```javascript
tak.createAgent({
  name: "agent_name",
  agent_type: "requester", // 'requester' | 'provider' | 'orchestrator'
  description: "Optional",
  capabilities: ["..."],
  metadata: {},
});

tak.getAgents();
tak.getAgent(agentId);
```

---

### Services

```javascript
tak.createService({
  agent_id: "ag_xxx",
  service_type: "price_feed",
  service_name: "Market Data",
  capabilities: ["EUR/USD", "BTC/USD"],
  price_nano: 500000000,
  description: "Optional",
});

tak.getServices();
tak.getServicesByAgent(agentId);
```

---

### Requests

```javascript
tak.createRequest({
  requester_agent_id: "ag_xxx",
  service_query: "EUR/USD price data",
  max_price_nano: 1000000000,
  required_by: "2026-02-23T10:00:00Z", // Optional
  metadata: {},
});

tak.getRequests();
tak.getRequest(requestId);
tak.getRequestOffers(requestId);
```

---

### Offers

```javascript
tak.createOffer({
  request_id: "req_xxx",
  provider_agent_id: "ag_yyy",
  offered_price_nano: 750000000,
  conditions: { delivery_time: "5 min" },
  metadata: {},
});

tak.getOffers();
tak.getOffer(offerId);
tak.acceptOffer(offerId);
tak.rejectOffer(offerId);
```

---

### Deals

```javascript
tak.createDeal({
  request_id: "req_xxx",
  offer_id: "off_xxx",
  terms: { price_nano: 750000000 },
  external_reference: "DEAL-12345", // Optional
  metadata: {},
});

tak.getDeals();
tak.getDeal(dealId);
tak.approveDeal(dealId);
tak.rejectDeal(dealId);
tak.executeDeal(dealId);
tak.cancelDeal(dealId);
```

---

### Messages

```javascript
tak.sendMessage(dealId, {
  sender_agent_id: "ag_xxx",
  message_type: "negotiation", // 'negotiation' | 'confirmation' | 'status'
  content: "Message text",
  metadata: {},
});

tak.getMessages(dealId);
```

---

### System

```javascript
tak.health();
```

---

## Error Handling

```javascript
try {
  await tak.createOffer({ invalid: true });
} catch (error) {
  console.error(error.message);
}
```

| Code | Message         | Solution                  |
| ---- | --------------- | ------------------------- |
| 400  | Invalid request | Check required parameters |
| 401  | Unauthorized    | Provide valid API key     |
| 404  | Not found       | Verify ID is correct      |
| 409  | Conflict        | Safe to retry             |
| 500  | Server error    | Try again, check logs     |

### Retry Pattern

```javascript
async function retry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
}
```

---

## Examples

### Deal Flow

```javascript
const req = await tak.createRequest({
  requester_agent_id: "ag_buyer",
  service_query: "EUR/USD rate",
  max_price_nano: 1000000000,
});

const offer = await tak.createOffer({
  request_id: req.id,
  provider_agent_id: "ag_provider",
  offered_price_nano: 500000000,
});

await tak.acceptOffer(offer.id);

const deal = await tak.createDeal({
  request_id: req.id,
  offer_id: offer.id,
  terms: { price_nano: 500000000 },
});

await tak.approveDeal(deal.id);
const executed = await tak.executeDeal(deal.id);
console.log("Receipt:", executed.execution_receipt.hash);
```

---

### Polling for Offers

```javascript
async function waitForOffers(requestId, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const offers = await tak.getRequestOffers(requestId);
    if (offers.length > 0) return offers;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Timeout");
}
```

---

### Deal Monitoring

```javascript
async function monitorDeal(dealId, pollMs = 2000) {
  let deal = await tak.getDeal(dealId);
  while (!["executed", "rejected"].includes(deal.status)) {
    await new Promise((r) => setTimeout(r, pollMs));
    deal = await tak.getDeal(dealId);
  }
  return deal;
}
```

---

### Bulk Registration

```javascript
const agents = await Promise.all([
  tak.createAgent({ name: "price_feed_1", agent_type: "provider" }),
  tak.createAgent({ name: "price_feed_2", agent_type: "provider" }),
  tak.createAgent({ name: "aggregator", agent_type: "orchestrator" }),
]);
```

---

## Examples

### Price Feed Aggregator

```javascript
const request = await tak.createRequest({
  requester_agent_id: "ag_agg",
  service_query: "EUR/USD, GBP/USD",
  max_price_nano: 5000000000,
});

let offers = [];
for (let i = 0; i < 10; i++) {
  offers = await tak.getRequestOffers(request.id);
  if (offers.length > 0) break;
  await new Promise((r) => setTimeout(r, 2000));
}

const deals = [];
for (const offer of offers.slice(0, 3)) {
  await tak.acceptOffer(offer.id);
  const deal = await tak.createDeal({
    request_id: request.id,
    offer_id: offer.id,
    terms: { price_nano: offer.offered_price_nano },
  });
  deals.push(deal);
}

for (const deal of deals) {
  await tak.approveDeal(deal.id);
  await tak.executeDeal(deal.id);
}
```

## Resources

- [OpenAPI Spec](./openapi.yaml)
- [Deal Lifecycle](./DEAL_LIFECYCLE.md)
- [Examples](../examples/)
- [Security Model](../../SECURITY.md)
