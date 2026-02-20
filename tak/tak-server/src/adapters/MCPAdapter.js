"use strict";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TAK — MCP ADAPTER ARCHITECTURE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * TAK handles coordination. MCP handles execution.
 *
 * Data Flow:
 *   1. Agents negotiate deal via TAK API
 *   2. Deal reaches "approved" state
 *   3. TAK calls MCPAdapter.execute_payment()
 *   4. Adapter delegates to MCP layer
 *   5. Receipt returned to deal record
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ARCHITECTURE DIAGRAM
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   TAK API Server (this process)
 *   ├─ /api/requests
 *   ├─ /api/offers
 *   ├─ /api/deals
 *   └─ /api/deals/:id/execute
 *      │
 *      ▼
 *      MCPAdapter (pluggable)
 *      ├─ MockMCPAdapter   ← Development: returns fake receipts
 *      └─ TONMCPAdapter    ← Production: calls real TON blockchain
 *         │
 *         ▼
 *         TON Network
 *         └─ Settlement layer
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * KEY PRINCIPLE: TAK NEVER HOLDS FUNDS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * TAK is purely a coordination layer:
 *   ✓ Creates deal records (immutable snapshots)
 *   ✓ Enforces approval gates
 *   ✓ Triggers MCP execution
 *   ✗ Never sends transactions directly
 *   ✗ Never holds TON or jettons
 *   ✗ Never validates wallet balances
 *
 * All execution is delegated to MCPAdapter subclasses.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * IMPLEMENTING A CUSTOM ADAPTER
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Example: Connecting to the real TON network
 *
 *   class TONMCPAdapter extends MCPAdapter {
 *       constructor(config) {
 *           super();
 *           this.tonProvider = config.tonProvider;  // TonClient from ton.js
 *           this.executorWallet = config.wallet;    // Agent executor account
 *       }
 *
 *       async execute_payment(deal) {
 *           // 1. Create transaction from deal parameters
 *           const tx = {
 *               to: deal.payee_agent_id,    // Recipient agent address
 *               amount: deal.amount_nano,   // In nanoTON
 *               payload: {
 *                   deal_id: deal.id,
 *                   service: deal.service_query,
 *                   approval_timestamp: Date.now()
 *               }
 *           };
 *
 *           // 2. Send via TON blockchain
 *           const receipt = await this.tonProvider.sendTransaction(tx);
 *
 *           // 3. Return hash for deal record
 *           return receipt.hash;
 *       }
 *   }
 *
 *   // Inject into TAK server
 *   const adapter = new TONMCPAdapter(tonConfig);
 *   app.set("mcpAdapter", adapter);
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

class MCPAdapter {
    /**
     * Execute a payment for a deal
     *
     * Called by TAK after deal receives approval.
     * This method is responsible for:
     *   1. Transferring funds from payer to payee
     *   2. Returning a receipt/hash for proof
     *   3. Throwing an error if execution fails
     *
     * @param {Object} deal - Deal record from database
     * @param {string} deal.id - Deal ID
     * @param {string} deal.payer_agent_id - Buyer/payer agent address
     * @param {string} deal.payee_agent_id - Seller/payee agent address
     * @param {number} deal.amount_nano - Payment amount in nanoTON (integer)
     * @param {string} deal.request_id - Original request ID
     * @param {string} deal.offer_id - Accepted offer ID
     * @param {string} deal.status - Deal state (should be "approved" on call)
     *
     * @returns {Promise<string>} - Receipt hash/ID from MCP layer
     *
     * @throws {Error} If payment fails for any reason
     */
    async execute_payment(deal) {
        throw new Error(
            "MCPAdapter.execute_payment() is abstract and not implemented.\n" +
            "Subclass MCPAdapter and provide a real implementation for your MCP backend.\n" +
            "Example: class TONMCPAdapter extends MCPAdapter { ... }"
        );
    }
}

module.exports = MCPAdapter;
