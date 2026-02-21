const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: message,
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

const generalLimiter = createRateLimiter(
  15 * 60 * 1000,
  100,
  'Too many requests from this IP, please try again after 15 minutes'
);

const uploadLimiter = createRateLimiter(
  60 * 60 * 1000,
  5,
  'Too many upload attempts, please try again after an hour'
);

const analysisLimiter = createRateLimiter(
  5 * 60 * 1000,
  10,
  'Too many analysis requests, please try again after 5 minutes'
);

module.exports = {
  generalLimiter,
  uploadLimiter,
  analysisLimiter
};
