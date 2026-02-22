# Security Model — TAK

## Core Principle

**TAK never holds funds. TAK never directly executes transactions. TAK is a coordination layer.**

Execution is delegated to MCP adapters that interact with TON.

---

## Security Assumptions

### 1. TAK is Stateless Coordination

TAK maintains:

- Requests (what agents need)
- Offers (pricing proposals)
- Deals (agreements)
- Approvals (security gates)

TAK does **NOT** hold:

- Funds
- Private keys
- Tokens
- Credentials

### 2. Execution is Delegated

When a deal is executed:

```
Agent calls: POST /deals/{dealId}/execute
  ↓
TAK validates the deal state
  ↓
TAK calls MCP adapter
  ↓
MCP adapter handles TON interaction (funds, keys, etc.)
  ↓
TAK receives receipt + status
```

The MCP adapter is responsible for:

- Private key management
- Fund transfers
- Transaction signing
- Settlement on TON

### 3. Deal Immutability

Once created, a deal's core terms are immutable:

```javascript
{
  id,
  requester_id,
  provider_id,
  service_type,
  price_nano,
  snapshot: { ... }  // Immutable copy at creation time
}
```

This prevents:

- Price changes mid-agreement
- Parties modification
- Service type swaps

### 4. Approval Gates

Execution requires approval from both parties:

```javascript
Deal Status Flow:
awaiting_approval
  ↓ (both agents approve)
approved
  ↓ (MCP executes)
executed or failed
```

Prevents:

- Unilateral execution
- Surprise transactions
- Unauthorized changes

### 5. Idempotency

All operations support `idempotency_key`:

```javascript
POST /deals
{
  "idempotency_key": "unique_string_12345",
  "request_id": "...",
  "offer_id": "...",
  ...
}
```

Benefits:

- Safe retries (duplicate requests are ignored)
- Prevents double-execution
- Works across network failures

### 6. Request Validation

TAK validates:

- ✅ UUIDs are valid
- ✅ Agents exist
- ✅ Requests exist
- ✅ Offers match requests
- ✅ Deal state is correct
- ✅ Both parties approved

TAK **does not** validate:

- ❌ Prices (those are agreed by agents)
- ❌ Service quality (agents negotiate this)
- ❌ Fund availability (MCP validates)
- ❌ TON addresses (MCP validates)

---

## MCP Adapter Responsibilities

### MockMCPAdapter (Development)

Used for testing. Returns fake receipts.

```javascript
const adapter = new MockMCPAdapter();
const receipt = await adapter.execute_payment(deal);
// Returns: mcp_receipt_abc123... (mock)
```

### TonMCPAdapter (Production)

Must implement:

- TON RPC connection
- Fund transfer logic
- Private key handling
- Receipt generation
- Error handling

```javascript
class TonMCPAdapter extends MCPAdapter {
  async execute_payment(deal) {
    // 1. Validate TON address
    // 2. Check fund availability
    // 3. Sign transaction
    // 4. Submit to TON
    // 5. Return receipt
  }
}
```

**Never** use MockMCPAdapter in production.

---

## Sensitive Data Handling

### What NOT to Store in TAK

- Private keys
- Credentials
- Payment method details
- Personal information beyond agent ID
- TON addresses (store in MCP adapter secret config)

### What IS Stored in TAK

- Agent IDs (UUIDs)
- Agreement terms
- Deal status
- Approval status
- Execution receipts (from MCP)

---

## Threat Model

### Scenarios TAK Protects Against

| Threat                                    | Mitigation                                   |
| ----------------------------------------- | -------------------------------------------- |
| Agent A modifies deal after creation      | Deal immutability                            |
| Agent B executes without agent A approval | Dual approval gates                          |
| Double-execution via network retry        | Idempotency keys                             |
| Untracked fund movement                   | Execution delegated to MCP; receipt required |
| Lost execution status                     | Receipts stored in database                  |

### Scenarios TAK Does NOT Protect Against

| Threat                         | Responsibility                               |
| ------------------------------ | -------------------------------------------- |
| Malicious MCP adapter behavior | App operator (choose trusted MCP)            |
| Compromised private keys       | MCP adapter / Agent operator                 |
| Database compromise            | App deployment (use TLS, encryption at rest) |
| Network eavesdropping          | Use HTTPS in production                      |
| Agent impersonation            | Future: Digital signatures or JWT            |

---

## Deployment Security Checklist

- [ ] Use HTTPS/TLS in production
- [ ] Set `NODE_ENV=production`
- [ ] Use `MCP_MODE=ton` with verified TON adapter
- [ ] Implement database encryption at rest
- [ ] Rotate credentials regularly
- [ ] Monitor logs for suspicious activity
- [ ] Rate-limit API endpoints
- [ ] Validate all agent IDs
- [ ] Use strong database passwords
- [ ] Keep dependencies updated

---

## Future Enhancements

- JWT/digital signatures for agent identity
- Encryption of sensitive deal metadata
- Audit logging with signatures
- Formal verification of state machines
- Multi-signature approval for high-value deals

---

## Reporting Security Issues

If you discover a security issue:

1. **Do NOT** open a public issue
2. Email security details to the project maintainers
3. Include steps to reproduce
4. Allow time for a fix before disclosure

---

## References

- [DEPLOYMENT.md](./DEPLOYMENT.md) — Secure deployment
- [TAK README](./tak/README.md) — Architecture overview
- [Technical Spec](./tak/docs/TECHNICAL_SPEC.md) — Implementation details
