const express = require('express');
const DatabaseService = require('./services/DatabaseService');
const PromotionController = require('./controllers/PromotionController');
const AdminController = require('./controllers/AdminController');
const {
  requestLogger,
  errorHandler,
  notFoundHandler,
  rateLimiter,
  validateJsonContentType,
  corsHandler
} = require('./middleware');

/**
 * Scopely Promotion Service
 * REST microservice for in-game promotion selection based on configurable business rules
 */
class PromotionServiceApp {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.promotionController = new PromotionController();
    this.adminController = new AdminController();
  }

  /**
   * Initialize the application
   */
  async initialize() {
    try {
      // Initialize database service
      await DatabaseService.initialize();
      
      // Setup middleware
      this.setupMiddleware();
      
      // Setup routes
      this.setupRoutes();
      
      // Setup error handling
      this.setupErrorHandling();
      
      console.log('✅ Promotion service initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize promotion service:', error);
      throw error;
    }
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // CORS support
    this.app.use(corsHandler);
    
    // Trust proxy for accurate IP addresses
    this.app.set('trust proxy', true);
    
    // Parse JSON bodies
    this.app.use(express.json({ limit: '1mb' }));
    
    // Request logging
    this.app.use(requestLogger);
    
    // Rate limiting
    this.app.use(rateLimiter);
    
    // Validate JSON content type for POST requests
    this.app.use(validateJsonContentType);
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', this.adminController.getHealth.bind(this.adminController));
    
    // Core promotion evaluation endpoint
    this.app.post('/promotion', this.promotionController.evaluatePromotion.bind(this.promotionController));
    
    // Player data validation endpoint
    this.app.post('/validate-player', this.promotionController.validatePlayer.bind(this.promotionController));
    
    // Promotion service status
    this.app.get('/promotion/status', this.promotionController.getStatus.bind(this.promotionController));
    
    // Metrics endpoint
    this.app.get('/metrics', this.adminController.getMetrics.bind(this.adminController));
    
    // Rules management endpoints
    this.app.post('/reload-rules', this.adminController.reloadRules.bind(this.adminController));
    this.app.get('/rules', this.adminController.getRules.bind(this.adminController));
    this.app.get('/rules/:id', this.adminController.getRule.bind(this.adminController));
    
    // Configuration endpoints
    this.app.get('/config', this.adminController.getConfig.bind(this.adminController));
    this.app.post('/validate-config', this.adminController.validateConfig.bind(this.adminController));
    
    // Admin endpoints
    this.app.post('/metrics/reset', this.adminController.resetMetrics.bind(this.adminController));
    
    // Root endpoint with API documentation
    this.app.get('/', this.getApiDocumentation.bind(this));
  }

  /**
   * Setup error handling middleware
   */
  setupErrorHandling() {
    // 404 handler
    this.app.use(notFoundHandler);
    
    // Global error handler
    this.app.use(errorHandler);
  }

  /**
   * Start the server
   */
  async start() {
    try {
      await this.initialize();
      
      this.server = this.app.listen(this.port, () => {
        console.log(`🚀 Promotion service running on port ${this.port}`);
        console.log(`📖 API documentation: http://localhost:${this.port}/`);
        console.log(`💓 Health check: http://localhost:${this.port}/health`);
        console.log(`📊 Metrics: http://localhost:${this.port}/metrics`);
      });
      
      // Graceful shutdown handling
      this.setupGracefulShutdown();
      
    } catch (error) {
      console.error('Failed to start promotion service:', error);
      process.exit(1);
    }
  }

  /**
   * Setup graceful shutdown handling
   */
  setupGracefulShutdown() {
    const shutdown = (signal) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
      
      if (this.server) {
        this.server.close((err) => {
          if (err) {
            console.error('Error during server shutdown:', err);
            process.exit(1);
          }
          
          console.log('✅ Server shut down gracefully');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    };
    
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }

  /**
   * API documentation endpoint
   */
  getApiDocumentation(req, res) {
    const baseUrl = `http://${req.get('host')}`;
    
    res.json({
      service: 'Scopely Promotion Service',
      version: '1.0.0',
      description: 'REST microservice for in-game promotion selection based on configurable business rules',
      endpoints: {
        core: {
          'POST /promotion': {
            description: 'Evaluate and return the best promotion for a player',
            parameters: {
              player_id: 'string (optional)',
              player_level: 'number (required)',
              spend_tier: 'string (free|light|medium|heavy|vip|whale)',
              country: 'string (2-letter country code)',
              days_since_last_purchase: 'number (optional)',
              days_since_last_login: 'number (optional)',
              total_spent: 'number (optional)'
            },
            example: `curl -X POST ${baseUrl}/promotion -H "Content-Type: application/json" -d '{"player_level": 25, "spend_tier": "medium", "country": "US", "days_since_last_purchase": 5}'`
          },
          'POST /validate-player': {
            description: 'Validate player data without evaluation',
            example: `curl -X POST ${baseUrl}/validate-player -H "Content-Type: application/json" -d '{"player_level": 25, "spend_tier": "medium", "country": "US"}'`
          }
        },
        monitoring: {
          'GET /health': {
            description: 'Health check endpoint',
            example: `curl ${baseUrl}/health`
          },
          'GET /metrics': {
            description: 'Get service metrics and performance data',
            parameters: { detailed: 'boolean (optional)' },
            example: `curl ${baseUrl}/metrics?detailed=true`
          }
        },
        administration: {
          'POST /reload-rules': {
            description: 'Hot-reload promotion rules from YAML',
            example: `curl -X POST ${baseUrl}/reload-rules`
          },
          'GET /rules': {
            description: 'Get all loaded rules',
            example: `curl ${baseUrl}/rules`
          },
          'GET /config': {
            description: 'Get current configuration',
            example: `curl ${baseUrl}/config`
          }
        }
      },
      extensibilityHooks: {
        weightedRandomness: 'Multiple matching rules can be weighted for random selection',
        abTesting: 'Players can be bucketed into test groups for A/B testing',
        timeWindows: 'Rules can have specific time windows for activation'
      },
      documentation: {
        readme: 'See README.md for detailed setup and usage instructions',
        tests: 'Run `npm test` to execute unit tests',
        development: 'Run `npm run dev` for development with hot reload'
      }
    });
  }
}

// Start the application if this file is run directly
if (require.main === module) {
  const app = new PromotionServiceApp();
  app.start();
}

module.exports = PromotionServiceApp;
