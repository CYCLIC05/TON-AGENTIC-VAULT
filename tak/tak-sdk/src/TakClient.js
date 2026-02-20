/**
 * TAK Client — Simple SDK for Agent Coordination
 * 
 * Usage:
 * const tak = new TakClient('http://localhost:3000');
 * await tak.createRequest({...});
 */

class TakClient {
    constructor(baseUrl = 'http://localhost:3000', apiKey = null) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.apiKey = apiKey;
        this.schemaVersion = 'tak/0.1';
    }

    /**
     * Prepare request headers with auth and schema versioning
     */
    _headers() {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }
        return headers;
    }

    /**
     * Generate unique idempotency key
     */
    _idempotencyKey(prefix = 'req') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }

    /**
     * Make HTTP request with automatic schema versioning
     */
    async _request(method, path, body = null) {
        const url = `${this.baseUrl}${path}`;
        const options = {
            method,
            headers: this._headers()
        };

        if (body) {
            // Add schema_version and idempotency_key to all POST/PUT requests
            if (method === 'POST' || method === 'PUT') {
                body.schema_version = this.schemaVersion;
                if (!body.idempotency_key) {
                    const prefix = path.split('/')[2] || 'req';
                    body.idempotency_key = this._idempotencyKey(prefix);
                }
            }
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`[${response.status}] ${error.error || response.statusText}`);
        }
        return response.json();
    }

    // ===== AGENTS =====

    async getAgents() {
        return this._request('GET', '/api/agents');
    }

    async getAgent(agentId) {
        return this._request('GET', `/api/agents/${agentId}`);
    }

    async createAgent(data) {
        return this._request('POST', '/api/agents', data);
    }

    // ===== SERVICES =====

    async getServices() {
        return this._request('GET', '/api/services');
    }

    async getServicesByAgent(agentId) {
        return this._request('GET', `/api/services?agent_id=${agentId}`);
    }

    async createService(data) {
        return this._request('POST', '/api/services', data);
    }

    // ===== REQUESTS =====

    async getRequests() {
        return this._request('GET', '/api/requests');
    }

    async getRequest(requestId) {
        return this._request('GET', `/api/requests/${requestId}`);
    }

    async createRequest(data) {
        return this._request('POST', '/api/requests', data);
    }

    async getRequestOffers(requestId) {
        return this._request('GET', `/api/requests/${requestId}/offers`);
    }

    // ===== OFFERS =====

    async getOffers() {
        return this._request('GET', '/api/offers');
    }

    async getOffer(offerId) {
        return this._request('GET', `/api/offers/${offerId}`);
    }

    async createOffer(data) {
        return this._request('POST', '/api/offers', data);
    }

    async acceptOffer(offerId) {
        return this._request('PUT', `/api/offers/${offerId}`, { status: 'accepted' });
    }

    async rejectOffer(offerId) {
        return this._request('PUT', `/api/offers/${offerId}`, { status: 'rejected' });
    }

    // ===== DEALS =====

    async getDeals() {
        return this._request('GET', '/api/deals');
    }

    async getDeal(dealId) {
        return this._request('GET', `/api/deals/${dealId}`);
    }

    async createDeal(data) {
        return this._request('POST', '/api/deals', data);
    }

    async approveDeal(dealId) {
        return this._request('POST', `/api/deals/${dealId}/approve`, {});
    }

    async rejectDeal(dealId) {
        return this._request('POST', `/api/deals/${dealId}/reject`, {});
    }

    async executeDeal(dealId) {
        return this._request('POST', `/api/deals/${dealId}/execute`, {});
    }

    async cancelDeal(dealId) {
        return this._request('POST', `/api/deals/${dealId}/cancel`, {});
    }

    // ===== MESSAGES =====

    async getMessages(dealId) {
        return this._request('GET', `/api/deals/${dealId}/messages`);
    }

    async sendMessage(dealId, data) {
        return this._request('POST', `/api/deals/${dealId}/messages`, data);
    }

    // ===== HEALTH =====

    async health() {
        return this._request('GET', '/health');
    }
}

// Export for Node.js and Browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TakClient;
}
if (typeof window !== 'undefined') {
    window.TakClient = TakClient;
}
