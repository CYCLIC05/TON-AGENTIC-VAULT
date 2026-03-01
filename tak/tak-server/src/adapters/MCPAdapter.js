"use strict";


const EXECUTION_TYPES = ["ton_transfer", "jetton_transfer", "nft_transfer", "contract_call"];


const PAYLOAD_SCHEMAS = {
    ton_transfer: {
        required: ["to_address", "amount_nano"],
        optional: ["memo"],
    },
    jetton_transfer: {
        required: ["jetton_master", "to_address", "amount"],
        optional: ["memo"],
    },
    nft_transfer: {
        required: ["nft_address", "new_owner"],
        optional: [],
    },
    contract_call: {
        required: ["contract_address", "method"],
        optional: ["params"],
    },
};

class MCPAdapter {
    validate_payload(executionType, payload) {
        if (!EXECUTION_TYPES.includes(executionType)) {
            return {
                valid: false,
                errors: [`Unknown execution_type: '${executionType}'. Must be one of: ${EXECUTION_TYPES.join(", ")}`],
            };
        }

        if (!payload || typeof payload !== "object") {
            return { valid: false, errors: ["execution_payload must be a non-null object"] };
        }

        const schema = PAYLOAD_SCHEMAS[executionType];
        const errors = [];

        for (const field of schema.required) {
            if (payload[field] === undefined || payload[field] === null || payload[field] === "") {
                errors.push(`Missing required field '${field}' for ${executionType}`);
            }
        }

        // Check for unknown fields
        const allowedFields = [...schema.required, ...schema.optional];
        for (const key of Object.keys(payload)) {
            if (!allowedFields.includes(key)) {
                errors.push(`Unknown field '${key}' for ${executionType}. Allowed: ${allowedFields.join(", ")}`);
            }
        }

        // Type-specific validations
        if (executionType === "ton_transfer" && payload.amount_nano !== undefined) {
            if (!Number.isInteger(payload.amount_nano) || payload.amount_nano <= 0) {
                errors.push("amount_nano must be a positive integer (nanoTON)");
            }
        }

        if (executionType === "jetton_transfer" && payload.amount !== undefined) {
            if (typeof payload.amount !== "string" && !Number.isInteger(payload.amount)) {
                errors.push("amount must be a string or integer");
            }
        }

        return { valid: errors.length === 0, errors };
    }

    async execute_payment(deal, executionType, executionPayload) {
        throw new Error(
            "MCPAdapter.execute_payment() is abstract and not implemented.\n" +
            "Subclass MCPAdapter and provide a real implementation for your MCP backend."
        );
    }
}

MCPAdapter.EXECUTION_TYPES = EXECUTION_TYPES;
MCPAdapter.PAYLOAD_SCHEMAS = PAYLOAD_SCHEMAS;

module.exports = MCPAdapter;
