/**
 * Middleware for logging HTTP requests
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  // Log request
  console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;
    console.log(`[${timestamp}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    originalEnd.apply(this, args);
  };
  
  next();
};

/**
 * Middleware for handling errors
 */
const errorHandler = (err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(500).json({
    error: 'Internal server error',
    ...(isDevelopment && { details: err.message, stack: err.stack })
  });
};

/**
 * Middleware for handling 404 routes
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
    availableEndpoints: [
      'POST /promotion',
      'GET /metrics',
      'POST /reload-rules',
      'GET /health',
      'GET /rules',
      'GET /rules/:id'
    ]
  });
};

/**
 * Middleware for rate limiting (basic implementation)
 */
const rateLimiter = (() => {
  const requests = new Map(); // IP -> { count, resetTime }
  const WINDOW_MS = 60 * 1000; // 1 minute
  const MAX_REQUESTS = 100; // requests per window
  
  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    
    if (!requests.has(ip)) {
      requests.set(ip, { count: 1, resetTime: now + WINDOW_MS });
      return next();
    }
    
    const record = requests.get(ip);
    
    if (now > record.resetTime) {
      // Reset window
      record.count = 1;
      record.resetTime = now + WINDOW_MS;
      return next();
    }
    
    if (record.count >= MAX_REQUESTS) {
      return res.status(429).json({
        error: 'Too many requests',
        resetTime: new Date(record.resetTime).toISOString()
      });
    }
    
    record.count++;
    next();
  };
})();

/**
 * Middleware for validating JSON content type
 */
const validateJsonContentType = (req, res, next) => {
  if (req.method === 'POST' && !req.is('application/json')) {
    return res.status(400).json({
      error: 'Content-Type must be application/json for POST requests'
    });
  }
  next();
};

/**
 * Middleware for CORS headers
 */
const corsHandler = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
};

module.exports = {
  requestLogger,
  errorHandler,
  notFoundHandler,
  rateLimiter,
  validateJsonContentType,
  corsHandler
};
