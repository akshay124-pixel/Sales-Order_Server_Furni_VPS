const logger = require('../utils/logger');
const crypto = require('crypto');

/**
 * Express Middleware to log HTTP requests
 */
const httpLogger = (req, res, next) => {
    // Generate a unique Request ID (Correlation ID) for the request lifecycle
    const requestId = req.headers['x-request-id'] || crypto.randomBytes(4).toString('hex');
    req.requestId = requestId;

    // Expose request ID in response headers for client-side debugging
    res.setHeader('x-request-id', requestId);

    // Skip logging for health-check routes to avoid noise
    const skipRoutes = ['/health', '/api/health', '/favicon.ico'];
    if (skipRoutes.some(route => req.url.includes(route))) {
        return next();
    }

    const start = Date.now();

    // The 'finish' event is emitted when the response has been handed off to the OS
    res.on('finish', () => {
        const duration = Date.now() - start;
        const { method, url, ip } = req;
        const { statusCode } = res;

        const message = `${method} ${url} ${statusCode} - ${duration}ms`;

        const logData = {
            requestId,
            method,
            url,
            statusCode,
            duration: `${duration}ms`,
            ip,
            userAgent: req.headers['user-agent'],
        };

        // Log with appropriate level based on status code
        if (statusCode >= 500) {
            logger.error(message, logData);
        } else if (statusCode >= 400) {
            logger.warn(message, logData);
        } else {
            // Use 'http' level for internal request logging
            logger.http(message, logData);
        }
    });

    next();
};

module.exports = httpLogger;
