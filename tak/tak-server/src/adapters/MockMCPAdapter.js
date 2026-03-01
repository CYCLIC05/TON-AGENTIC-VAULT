"use strict";
/**
 * TAK — MockMCPAdapter
 *
 * Development adapter. Returns structured mock receipts matching
 * the production format so code paths are identical.
 */
const MCPAdapter = require("./MCPAdapter");
const { v4: uuidv4 } = require("uuid");

class MockMCPAdapter extends MCPAdapter {
    constructor() {
        super();
        this.name = "MockMCPAdapter";
        console.log("[TAK] MCP adapter: MockMCPAdapter (dev — returns mock receipts)");
    }

    /**
     * @param {Object} deal
     * @param {string} executionType
     * @param {Object} executionPayload
     * @returns {Promise<{ receipt: string, tx_hash: string, execution_type: string, status: string, timestamp: string }>}
     */
    async execute_payment(deal, executionType, executionPayload) {
        // Simulate network delay
        await new Promise(r => setTimeout(r, 120));

        const mockHash = `mock_tx_${uuidv4().replace(/-/g, "").slice(0, 16)}`;
        const receipt = `mcp_receipt_${uuidv4().replace(/-/g, "").slice(0, 16)}`;
        const now = new Date().toISOString();

        console.log(
            `[MockMCPAdapter] execute_payment(deal=${deal.id}, type=${executionType || "legacy"}) → ${receipt}`
        );

        return {
            receipt,
            tx_hash: mockHash,
            execution_type: executionType || "ton_transfer",
            status: "confirmed",
            timestamp: now,
        };
    }
}

module.exports = MockMCPAdapter;
