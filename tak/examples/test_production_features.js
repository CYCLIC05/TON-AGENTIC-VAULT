const TAK = require("../tak-sdk/src/index.js");
const nacl = require("tweetnacl");
const crypto = require("crypto");
const db = require("../tak-server/src/db.js");

const tak = new TAK({ baseUrl: "http://localhost:3000" });

async function runTests() {
    console.log("=== TAK Production Features Test ===");

    try {
        // 1. Health check
        console.log("\n1. Testing Health Endpoint...");
        const health = await tak.health();
        console.assert(health.status === "ok", "Health check failed");
        console.log("Health OK:", health.version);

        // 2. Agent Verification (Ed25519)
        console.log("\n2. Testing Agent Verification...");
        const keyPair = nacl.sign.keyPair();
        const publicKeyHex = Buffer.from(keyPair.publicKey).toString("hex");
        const secretKeyHex = Buffer.from(keyPair.secretKey).toString("hex");

        const agent1 = await tak.createAgent({
            name: "TestAgent_" + Math.random().toString(36).substr(2, 5),
            capabilities: ["verify_test", "swap"],
            public_key: publicKeyHex
        });
        console.log("Created agent:", agent1.id);

        // Request challenge
        const challengeRes = await tak.verifyAgent(agent1.id, null, null);
        console.log("Received challenge:", challengeRes.challenge);

        // Sign challenge
        const messageBytes = new TextEncoder().encode(challengeRes.challenge);
        const signatureBytes = nacl.sign.detached(messageBytes, keyPair.secretKey);
        const signatureHex = Buffer.from(signatureBytes).toString("hex");

        // Submit signature
        const verifyRes = await tak.verifyAgent(agent1.id, signatureHex, challengeRes.challenge);
        console.assert(verifyRes.verified_at != null, "Agent verification failed");
        console.log("Agent verified at:", verifyRes.verified_at);

        // 3. Search Agents
        console.log("\n3. Testing Agent Search...");
        const searchRes = await tak.searchAgents({ capability: "verify_test" });
        console.assert(searchRes.total >= 1, "Agent search failed");
        console.log("Found agents with 'verify_test':", searchRes.total);

        // 4. TON Execution & Deal Events (Happy path)
        console.log("\n4. Testing TON Execution Path...");
        const agent2 = await tak.createAgent({
            name: "TestProvider_" + Math.random().toString(36).substr(2, 5),
            capabilities: ["swap"]
        });

        const service = await tak.publishService({
            agent_id: agent2.id,
            service_name: "Mock Swap",
            base_price_nano: 1000000000
        });

        const request = await tak.createRequest({
            requester_agent_id: agent1.id,
            service_query: "swap something",
            max_price_nano: 1000000000
        });

        const offer = await tak.submitOffer({
            request_id: request.id,
            provider_agent_id: agent2.id,
            price_nano: 500000000
        });

        await tak.acceptOffer(offer.id);

        console.log("Creating deal with execution payload...");
        const deal = await tak.createDeal({
            request_id: request.id,
            offer_id: offer.id,
            execution_type: "ton_transfer",
            execution_payload: {
                to_address: "EQD__________________________________________0vo",
                amount_nano: 500000000,
                memo: "TAK test transfer"
            }
        });

        console.log("Deal created:", deal.id);
        console.assert(deal.execution_type === "ton_transfer", "Execution type not saved");

        await tak.approveDeal(deal.id);
        const executeRes = await tak.executeDeal(deal.id);
        console.assert(executeRes.status === "executed", "Deal execution failed");
        console.log("Deal executed successfully. Receipt:", JSON.parse(executeRes.execution_receipt).tx_hash || executeRes.execution_receipt);

        // Check deal events
        console.log("\n5. Checking Deal Events...");
        const events = db.prepare("SELECT * FROM deal_events WHERE deal_id = ? ORDER BY created_at ASC").all(deal.id);
        console.log(`Found ${events.length} events for deal:`, events.map(e => e.new_status));
        console.assert(events.length >= 3, "Missing deal events (created, approved, executed)");

        // 6. Error handling / trace ID
        console.log("\n6. Testing Error Envelope & Trace IDs...");
        try {
            await tak.getAgent("non_existent_id");
            console.error("Should have failed!");
        } catch (err) {
            console.assert(err.status === 404, "Wrong status");
            console.assert(err.body.error_code === "NOT_FOUND" || err.body.error, "Missing error code formatting");
            console.assert(err.body.trace_id != null, "Missing trace_id in error");
            console.log("Correctly caught error. Trace ID:", err.body.trace_id);
        }

        console.log("\n✅ All integration tests passed!");

    } catch (err) {
        console.error("❌ Test failed:");
        console.error(err);
        if (err.body) console.error("Response body:", err.body);
    }
}

runTests();
