"use strict";
/**
 * TAK — Database layer (SQLite via better-sqlite3)
 * All prices stored as INTEGER nanoTON. No floats anywhere.
 */
const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "tak.db");

const db = new Database(DB_PATH);

// Enable WAL for better concurrent read performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ─────────────────────────────────────────────────────────────
//  Schema
// ─────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS agents (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL UNIQUE,
    description     TEXT,
    capabilities    TEXT NOT NULL DEFAULT '[]',   -- JSON array stored as text
    endpoint_url    TEXT,
    public_key      TEXT,                         -- Ed25519 public key (hex)
    telegram_handle TEXT,
    verified_at     TEXT,                         -- ISO timestamp of last verification
    status          TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','disabled')),
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS services (
    id               TEXT PRIMARY KEY,
    agent_id         TEXT NOT NULL REFERENCES agents(id),
    service_name     TEXT NOT NULL,
    description      TEXT,
    tags             TEXT NOT NULL DEFAULT '[]',   -- JSON array for searchability
    base_price_nano  INTEGER NOT NULL,             -- nanoTON, always integer
    unit             TEXT NOT NULL DEFAULT 'per request',
    created_at       TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS requests (
    id                   TEXT PRIMARY KEY,
    requester_agent_id   TEXT NOT NULL REFERENCES agents(id),
    service_query        TEXT NOT NULL,
    max_price_nano       INTEGER NOT NULL,       -- nanoTON ceiling
    status               TEXT NOT NULL DEFAULT 'open'
                           CHECK(status IN ('open','closed','cancelled')),
    created_at           TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS offers (
    id                  TEXT PRIMARY KEY,
    request_id          TEXT NOT NULL REFERENCES requests(id),
    provider_agent_id   TEXT NOT NULL REFERENCES agents(id),
    price_nano          INTEGER NOT NULL,        -- nanoTON, must be <= max
    terms               TEXT,
    status              TEXT NOT NULL DEFAULT 'pending'
                          CHECK(status IN ('pending','accepted','rejected')),
    created_at          TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS deals (
    id                    TEXT PRIMARY KEY,
    request_id            TEXT NOT NULL REFERENCES requests(id),
    offer_id              TEXT NOT NULL REFERENCES offers(id),
    payer_agent_id        TEXT NOT NULL REFERENCES agents(id),
    payee_agent_id        TEXT NOT NULL REFERENCES agents(id),
    amount_nano           INTEGER NOT NULL,
    coordination_fee_nano INTEGER NOT NULL DEFAULT 0,
    execution_type        TEXT CHECK(execution_type IN ('ton_transfer','jetton_transfer','nft_transfer','contract_call')),
    execution_payload     TEXT,                       -- JSON payload validated per type
    status                TEXT NOT NULL DEFAULT 'awaiting_approval'
                            CHECK(status IN ('awaiting_approval','approved','executed','failed','cancelled')),
    execution_receipt     TEXT,
    tx_hash               TEXT,                       -- real blockchain tx hash
    executed_at           TEXT,
    approved_at           TEXT,
    rejected_at           TEXT,
    created_at            TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS deal_events (
    id          TEXT PRIMARY KEY,
    deal_id     TEXT NOT NULL REFERENCES deals(id),
    event_type  TEXT NOT NULL,
    old_status  TEXT,
    new_status  TEXT,
    actor       TEXT,
    metadata    TEXT,                              -- JSON
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id             TEXT PRIMARY KEY,
    from_agent_id  TEXT NOT NULL REFERENCES agents(id),
    to_agent_id    TEXT NOT NULL REFERENCES agents(id),
    message        TEXT NOT NULL,
    created_at     TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

module.exports = db;
