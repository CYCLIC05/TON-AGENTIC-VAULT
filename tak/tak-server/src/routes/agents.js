"use strict";
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../db");
const { generateChallenge, verifySignature } = require("../middleware/verification");
const { NotFoundError, ConflictError } = require("../middleware/errorHandler");

const router = express.Router();

// ── GET /api/agents ──────────────────────────────────────────
router.get("/", (req, res) => {
    const agents = db.prepare("SELECT * FROM agents ORDER BY created_at DESC").all();
    agents.forEach(a => { a.capabilities = JSON.parse(a.capabilities); });
    res.json({ agents, total: agents.length });
});

// ── GET /api/agents/search ───────────────────────────────────
router.get("/search", (req, res) => {
    const { capability } = req.query;
    if (!capability) return res.status(400).json({ error: "capability query parameter is required" });

    const agents = db.prepare("SELECT * FROM agents WHERE capabilities LIKE ? ORDER BY created_at DESC").all(`%"${capability}"%`);
    agents.forEach(a => { a.capabilities = JSON.parse(a.capabilities); });
    res.json({ agents, total: agents.length });
});

// ── GET /api/agents/:id ──────────────────────────────────────
router.get("/:id", (req, res, next) => {
    const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(req.params.id);
    if (!agent) {
        return next(new NotFoundError("Agent not found"));
    }
    agent.capabilities = JSON.parse(agent.capabilities);
    res.json(agent);
});

// ── POST /api/agents ─────────────────────────────────────────
router.post("/", (req, res) => {
    const { name, description, capabilities = [], endpoint_url, status = "active", public_key, telegram_handle } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const id = `ag_${uuidv4().replace(/-/g, "").slice(0, 12)}`;
    try {
        db.prepare(
            "INSERT INTO agents (id, name, description, capabilities, endpoint_url, status, public_key, telegram_handle) VALUES (?,?,?,?,?,?,?,?)"
        ).run(id, name, description || null, JSON.stringify(capabilities), endpoint_url || null, status, public_key || null, telegram_handle || null);

        const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(id);
        agent.capabilities = JSON.parse(agent.capabilities);
        res.status(201).json(agent);
    } catch (err) {
        if (err.message.includes("UNIQUE")) return res.status(409).json({ error: "Agent name already exists" });
        throw err;
    }
});

// ── PUT /api/agents/:id ──────────────────────────────────────
router.put("/:id", (req, res) => {
    const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(req.params.id);
    if (!agent) return res.status(404).json({ error: "Agent not found" });

    const { name, description, capabilities, endpoint_url, status, public_key, telegram_handle } = req.body;
    db.prepare(
        `UPDATE agents SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      capabilities = COALESCE(?, capabilities),
      endpoint_url = COALESCE(?, endpoint_url),
      status = COALESCE(?, status),
      public_key = COALESCE(?, public_key),
      telegram_handle = COALESCE(?, telegram_handle)
    WHERE id = ?`
    ).run(
        name || null,
        description || null,
        capabilities ? JSON.stringify(capabilities) : null,
        endpoint_url || null,
        status || null,
        public_key || null,
        telegram_handle || null,
        req.params.id
    );

    const updated = db.prepare("SELECT * FROM agents WHERE id = ?").get(req.params.id);
    updated.capabilities = JSON.parse(updated.capabilities);
    res.json(updated);
});

// ── POST /api/agents/:id/verify ──────────────────────────────
router.post("/:id/verify", (req, res) => {
    const agent = db.prepare("SELECT * FROM agents WHERE id = ?").get(req.params.id);
    if (!agent) return res.status(404).json({ error: "Agent not found" });

    if (!agent.public_key) {
        return res.status(400).json({ error: "Agent has no public_key registered for verification" });
    }

    const { signature, challenge } = req.body;

    // If no signature provided, return a new challenge
    if (!signature) {
        const newChallenge = generateChallenge(agent.id);
        return res.json({ challenge: newChallenge });
    }

    if (!challenge) {
        return res.status(400).json({ error: "challenge is required when submitting a signature" });
    }

    const { valid, error } = verifySignature(agent.id, challenge, signature, agent.public_key);

    if (!valid) {
        return res.status(401).json({ error });
    }

    const now = new Date().toISOString();
    db.prepare("UPDATE agents SET verified_at = ? WHERE id = ?").run(now, agent.id);

    const updated = db.prepare("SELECT * FROM agents WHERE id = ?").get(agent.id);
    updated.capabilities = JSON.parse(updated.capabilities);
    res.json({ ...updated, message: "Verification successful" });
});

// ── DELETE /api/agents/:id ───────────────────────────────────
router.delete("/:id", (req, res) => {
    const result = db.prepare("DELETE FROM agents WHERE id = ?").run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: "Agent not found" });
    res.json({ deleted: req.params.id });
});

module.exports = router;
