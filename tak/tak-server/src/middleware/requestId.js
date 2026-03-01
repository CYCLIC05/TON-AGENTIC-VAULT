"use strict";

const { v4: uuidv4 } = require("uuid");

function requestId(req, res, next) {
    const reqId = req.headers["x-request-id"] || `req_${uuidv4().replace(/-/g, "").slice(0, 16)}`;
    const traceId = req.headers["x-trace-id"] || `trace_${uuidv4().replace(/-/g, "").slice(0, 16)}`;

    req.requestId = reqId;
    req.traceId = traceId;

    res.setHeader("X-Request-Id", reqId);
    res.setHeader("X-Trace-Id", traceId);

    next();
}

module.exports = requestId;
