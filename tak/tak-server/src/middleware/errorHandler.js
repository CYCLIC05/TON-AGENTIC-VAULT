"use strict";


class TAKError extends Error {
    constructor(message, statusCode = 500, errorCode = "INTERNAL_ERROR") {
        super(message);
        this.name = "TAKError";
        this.statusCode = statusCode;
        this.errorCode = errorCode;
    }
}

class ValidationError extends TAKError {
    constructor(message) {
        super(message, 400, "VALIDATION_ERROR");
        this.name = "ValidationError";
    }
}

class NotFoundError extends TAKError {
    constructor(message) {
        super(message, 404, "NOT_FOUND");
        this.name = "NotFoundError";
    }
}

class ConflictError extends TAKError {
    constructor(message) {
        super(message, 409, "CONFLICT");
        this.name = "ConflictError";
    }
}

class AuthenticationError extends TAKError {
    constructor(message) {
        super(message, 401, "AUTHENTICATION_ERROR");
        this.name = "AuthenticationError";
    }
}

class ForbiddenError extends TAKError {
    constructor(message) {
        super(message, 403, "FORBIDDEN");
        this.name = "ForbiddenError";
    }
}


function errorHandler(err, req, res, _next) {
    const traceId = req.traceId || "unknown";
    const statusCode = err.statusCode || 500;
    const errorCode = err.errorCode || "INTERNAL_ERROR";

    if (statusCode >= 500) {
        console.error(`[TAK Error] [${traceId}]`, err);
    }

    res.status(statusCode).json({
        error_code: errorCode,
        message: err.message || "Internal server error",
        trace_id: traceId,
    });
}

module.exports = {
    TAKError,
    ValidationError,
    NotFoundError,
    ConflictError,
    AuthenticationError,
    ForbiddenError,
    errorHandler,
};
