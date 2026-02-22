# Deal State Machine — TAK

## Deal Lifecycle

A TAK deal follows a strict state machine to ensure security and auditability.

---

## States

### `awaiting_approval`

**Initial state after deal creation.**

- Deal is locked (immutable terms)
- Both parties can review the agreement
- Either party can approve or cancel
- No execution possible yet

**Transitions:**

- → `approved` (both parties approve)
- → `cancelled` (either party cancels)

### `approved`

**Both parties have approved execution.**

- Ready for MCP execution
- Can only be reached if both `payer` and `payee` approve
- No cancellation possible at this point
- MCP adapter is responsible for fund transfer

**Transitions:**

- → `executed` (MCP successfully completes transaction)
- → `failed` (MCP execution fails)

### `executed`

**Final success state.**

- MCP adapter completed the transaction
- Receipt from TON blockchain is stored
- Deal is settled
- No further transitions

**Properties:**

- `execution_receipt` — Hash from MCP/TON
- `executed_at` — Timestamp of execution

### `failed`

**Final failure state.**

- MCP adapter encountered an error
- No funds were transferred
- Deal cannot be re-executed
- Error details should be logged

**No further transitions.**

### `cancelled`

**Final cancellation state.**

- Deal was cancelled before approval
- Only possible from `awaiting_approval`
- No funds involved
- Both parties notified

**No further transitions.**

---

## State Diagram

```
┌──────────────────────────────────────────────────────────────┐
│  Deal Created (awaiting_approval)                            │
│  - Immutable deal terms                                      │
│  - Both parties review                                       │
└──────────────────────────────────────────────────────────────┘
         │
         ├─────────────────────────────┬──────────────────────────┐
         │                             │                          │
         ▼                             ▼                          ▼
    Both Approve              Either Cancels              (ERROR - shouldn't happen)
         │                             │
         ▼                             ▼
    ┌─────────────┐           ┌──────────────┐
    │  approved   │           │  cancelled   │ (final)
    └─────────────┘           └──────────────┘
         │
         │  MCP Executes
         │
         ├──────────────────────┬──────────────────────┐
         │                      │
         ▼                      ▼
    ┌─────────────┐      ┌──────────────┐
    │  executed   │      │   failed     │ (final)
    │ w/ receipt  │      │ w/ error log │
    └─────────────┘      └──────────────┘
    (final)
```

---

## Approval Model

### Single vs Dual Approval

**Current (v0.1):** Single approval

- Creator calls `POST /deals/{id}/approve`
- Transitions to `approved`

**Future Enhancement:** Dual approval

- Both `payer_agent_id` and `payee_agent_id` must approve
- State: `approvals: { payer: false, payee: false }`
- Transition to `approved` only when both are `true`

---

## API Endpoints & Transitions

### Create Deal (awaiting_approval)

```
POST /deals
{
  "request_id": "req_xyz",
  "offer_id": "offer_abc"
}
→ { id, status: "awaiting_approval", created_at, ... }
```

### Approve Deal (→ approved)

```
POST /deals/{id}/approve
{
  "agent_id": "agent_xyz"
}
→ { id, status: "approved", approved_at, ... }
```

### Execute Deal (→ executed or failed)

```
POST /deals/{id}/execute
{
  "agent_id": "agent_xyz"
}
→ { id, status: "executed", execution_receipt, executed_at, ... }
  OR
→ { status: "failed", error: "..." }
```

### Cancel Deal (→ cancelled)

```
PUT /deals/{id}
{
  "status": "cancelled"
}
→ { id, status: "cancelled", ... }
```

---

## Enforcement in Code

### State Validation

The router validates state transitions:

```javascript
// Approve endpoint
if (deal.status !== "awaiting_approval") {
  throw Error("Can only approve from awaiting_approval");
}

// Execute endpoint
if (deal.status !== "approved") {
  throw Error("Can only execute from approved");
}

// Cancel endpoint
if (deal.status !== "awaiting_approval") {
  throw Error("Can only cancel from awaiting_approval");
}
```

### Immutability

Deal terms are immutable once created:

```
deal.id               — Unique identifier (UUID)
deal.request_id       — What was requested (cannot change)
deal.offer_id         — What was offered (cannot change)
deal.payer_agent_id   — Who pays (cannot change)
deal.payee_agent_id   — Who receives (cannot change)
deal.amount_nano      — Price in nanoTON (cannot change)
```

Only `status` and metadata (`execution_receipt`, `executed_at`, etc.) change.

---

## Timestamps

| Field         | Set               | Purpose         |
| ------------- | ----------------- | --------------- |
| `created_at`  | Deal creation     | Audit trail     |
| `approved_at` | Approval endpoint | Approval time   |
| `executed_at` | MCP execution     | Settlement time |

---

## Error Handling

### Invalid State Transition

```json
{
  "error": "Cannot approve deal with status 'executed'",
  "current_status": "executed"
}
```

### Missing Authorization

```json
{
  "error": "Only payer or payee can approve"
}
```

### MCP Failure

```json
{
  "error": "MCP execution failed",
  "detail": "Fund transfer rejected by TON",
  "deal_status": "failed"
}
```

---

## Database Schema

```sql
CREATE TABLE deals (
  id                    TEXT PRIMARY KEY,
  request_id            TEXT NOT NULL,
  offer_id              TEXT NOT NULL,
  payer_agent_id        TEXT NOT NULL,
  payee_agent_id        TEXT NOT NULL,
  amount_nano           INTEGER NOT NULL,
  coordination_fee_nano INTEGER DEFAULT 0,
  status                TEXT NOT NULL DEFAULT 'awaiting_approval',
  execution_receipt     TEXT,
  executed_at           TEXT,
  approved_at           TEXT,
  created_at            TEXT NOT NULL DEFAULT (datetime('now'))
);
```

---

## Future Enhancements

- **Dual Approval** — Both parties must explicitly approve
- **Approval Signatures** — Cryptographic proof of approval
- **Expiration** — Deals auto-cancel after N days
- **Conditional Execution** — Execute only if conditions met
- **Rollback** — Reverse failed executions
