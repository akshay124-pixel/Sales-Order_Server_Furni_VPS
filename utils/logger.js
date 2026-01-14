const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

/**
 * Enterprise-Grade Logging System
 * 
 * Features:
 * - Environment based logging (Development vs Production)
 * - Pretty, colorized console output for Dev
 * - Structured JSON output for Prod (ELK/Datadog ready)
 * - Sensitive data masking (passwords, tokens, etc.)
 * - Daily log rotation (keeps 14 days)
 * - Error stack trace capture
 */

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Determine log level based on environment
const level = () => {
    const env = process.env.NODE_ENV || 'development';
    return env === 'development' ? 'debug' : 'info';
};

// Define colors for console output
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};
winston.addColors(colors);

/**
 * Mask sensitive information from logs
 * Targets common sensitive fields like password, token, etc.
 */
const maskFormat = winston.format((info) => {
    const sensitiveFields = ['password', 'token', 'secret', 'authorization', 'apiKey'];

    const mask = (obj) => {
        if (typeof obj !== 'object' || obj === null) return obj;

        const newObj = Array.isArray(obj) ? [] : { ...obj };
        for (const key in newObj) {
            if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                newObj[key] = '***MASKED***';
            } else if (typeof newObj[key] === 'object') {
                newObj[key] = mask(newObj[key]);
            }
        }
        return newObj;
    };

    // Mask main level message if it's an object, or metadata
    if (info.metadata) {
        info.metadata = mask(info.metadata);
    }

    return mask(info);
});

/**
 * Development Format: Human-readable, colorized, with timestamp
 */
const devFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.colorize({ all: true }),
    winston.format.printf((info) => {
        const { timestamp, level, message, stack, ...meta } = info;
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        const stackStr = stack ? `\n${stack}` : '';
        return `[${timestamp}] ${level}: ${message}${metaStr}${stackStr}`;
    })
);

/**
 * Production Format: Structured JSON for log aggregators
 */
const prodFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    maskFormat(),
    winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
    winston.format.json()
);

const isProduction = process.env.NODE_ENV === 'production';

// Configure transports
const transports = [
    // Always log to console
    new winston.transports.Console({
        format: isProduction ? prodFormat : devFormat,
    }),
];

// Add file transports if NOT in test environment
if (process.env.NODE_ENV !== 'test') {
    // Error logs only
    transports.push(
        new winston.transports.DailyRotateFile({
            filename: 'logs/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            level: 'error',
            format: prodFormat,
        })
    );

    // All logs combined
    transports.push(
        new winston.transports.DailyRotateFile({
            filename: 'logs/combined-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            format: prodFormat,
        })
    );
}

// Create the logger instance
const logger = winston.createLogger({
    level: level(),
    levels,
    transports,
    // Don't exit on handled exceptions
    exitOnError: false,
});

// Helper for capturing file/line in development (optional but useful)
// Usage: logger.debug('message', { caller: 'filename.js:line' })
// We'll mostly rely on standard winston patterns for now.

module.exports = logger;
