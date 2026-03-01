"use strict";

const nacl = require("tweetnacl");
const { v4: uuidv4 } = require("uuid");

// In-memory challenge store with TTL (5 minutes)
const challenges = new Map();
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

function generateChallenge(agentId) {
    const nonce = Buffer.from(nacl.randomBytes(32)).toString("hex");
    const challenge = `tak-verify:${agentId}:${nonce}`;

    challenges.set(agentId, {
        challenge,
        createdAt: Date.now(),
    });

    // Auto-expire after TTL
    setTimeout(() => challenges.delete(agentId), CHALLENGE_TTL_MS);

    return challenge;
}

function verifySignature(agentId, challenge, signatureHex, publicKeyHex) {
    // Check challenge exists and matches
    const stored = challenges.get(agentId);
    if (!stored) {
        return { valid: false, error: "No pending challenge. Request a new one first." };
    }
    if (stored.challenge !== challenge) {
        return { valid: false, error: "Challenge mismatch." };
    }

    // Check TTL
    if (Date.now() - stored.createdAt > CHALLENGE_TTL_MS) {
        challenges.delete(agentId);
        return { valid: false, error: "Challenge expired. Request a new one." };
    }

    try {
        const messageBytes = new TextEncoder().encode(challenge);
        const signatureBytes = Buffer.from(signatureHex, "hex");
        const publicKeyBytes = Buffer.from(publicKeyHex, "hex");

        if (signatureBytes.length !== 64) {
            return { valid: false, error: "Invalid signature length. Must be 64 bytes (hex-encoded)." };
        }
        if (publicKeyBytes.length !== 32) {
            return { valid: false, error: "Invalid public key length. Must be 32 bytes (hex-encoded)." };
        }

        const valid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);

        if (valid) {
            // Consume the challenge so it can't be reused
            challenges.delete(agentId);
        }

        return { valid };
    } catch (err) {
        return { valid: false, error: `Verification failed: ${err.message}` };
    }
}

module.exports = {
    generateChallenge,
    verifySignature,
};
