const DatabaseService = require('../services/DatabaseService');
const MetricsService = require('../services/MetricsService');

/**
 * Controller for admin endpoints (metrics, rules management)
 */
class AdminController {
  constructor() {
    this.databaseService = DatabaseService;
    this.metricsService = MetricsService;
  }

  /**
   * GET /metrics - Get service metrics and performance data
   */
  async getMetrics(req, res) {
    try {
      const detailed = req.query.detailed === 'true';
      
      const metrics = detailed 
        ? this.metricsService.getDetailedMetrics()
        : this.metricsService.getMetrics();
      
      res.json({
        timestamp: new Date().toISOString(),
        metrics
      });

    } catch (error) {
      console.error('Metrics retrieval error:', error);
      res.status(500).json({
        error: 'Failed to retrieve metrics'
      });
    }
  }

  /**
   * POST /reload-rules - Hot-reload promotion rules from YAML
   */
  async reloadRules(req, res) {
    try {
      const reloadResult = await this.databaseService.reloadRules();
      this.metricsService.recordRulesReload();
      
      res.json({
        success: true,
        message: 'Rules reloaded successfully',
        ...reloadResult
      });

    } catch (error) {
      console.error('Rules reload error:', error);
      res.status(500).json({
        error: 'Failed to reload rules',
        details: error.message
      });
    }
  }

  /**
   * GET /health - Health check endpoint
   */
  async getHealth(req, res) {
    try {
      const healthMetrics = this.metricsService.getHealthMetrics();
      const dbStats = this.databaseService.getStats();
      
      const health = {
        status: healthMetrics.status,
        timestamp: new Date().toISOString(),
        service: {
          status: healthMetrics.status,
          averageLatency: healthMetrics.averageLatency,
          errorRate: healthMetrics.errorRate,
          totalEvaluations: healthMetrics.totalEvaluations
        },
        database: {
          rulesLoaded: dbStats.totalRules,
          lastLoadTime: dbStats.lastLoadTime,
          configPath: dbStats.configPath
        },
        uptime: this.metricsService.getMetrics().uptime
      };

      const statusCode = healthMetrics.status === 'healthy' ? 200 : 
                        healthMetrics.status === 'degraded' ? 200 : 503;
      
      res.status(statusCode).json(health);

    } catch (error) {
      console.error('Health check error:', error);
      res.status(503).json({
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * GET /rules - Get all loaded rules (admin endpoint)
   */
  async getRules(req, res) {
    try {
      const rules = this.databaseService.getAllRules();
      const dbStats = this.databaseService.getStats();
      
      res.json({
        totalRules: rules.length,
        lastLoadTime: dbStats.lastLoadTime,
        rules: rules.map(rule => ({
          id: rule.id,
          name: rule.name,
          priority: rule.priority,
          conditions: rule.conditions,
          promotion: rule.promotion
        }))
      });

    } catch (error) {
      console.error('Rules retrieval error:', error);
      res.status(500).json({
        error: 'Failed to retrieve rules'
      });
    }
  }

  /**
   * GET /rules/:id - Get a specific rule by ID
   */
  async getRule(req, res) {
    try {
      const ruleId = req.params.id;
      const rule = this.databaseService.getRule(ruleId);
      
      if (!rule) {
        return res.status(404).json({
          error: 'Rule not found',
          ruleId
        });
      }
      
      res.json({
        id: rule.id,
        name: rule.name,
        priority: rule.priority,
        conditions: rule.conditions,
        promotion: rule.promotion,
        weight: rule.weight,
        ab_bucket: rule.ab_bucket,
        time_window: rule.time_window
      });

    } catch (error) {
      console.error('Rule retrieval error:', error);
      res.status(500).json({
        error: 'Failed to retrieve rule'
      });
    }
  }

  /**
   * POST /metrics/reset - Reset all metrics (admin endpoint)
   */
  async resetMetrics(req, res) {
    try {
      this.metricsService.resetMetrics();
      
      res.json({
        success: true,
        message: 'Metrics reset successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Metrics reset error:', error);
      res.status(500).json({
        error: 'Failed to reset metrics'
      });
    }
  }

  /**
   * GET /config - Get current configuration
   */
  async getConfig(req, res) {
    try {
      const config = {
        extensibility: this.databaseService.getExtensibilityConfig(),
        performance: this.databaseService.getPerformanceConfig(),
        database: this.databaseService.getStats()
      };
      
      res.json(config);

    } catch (error) {
      console.error('Config retrieval error:', error);
      res.status(500).json({
        error: 'Failed to retrieve configuration'
      });
    }
  }

  /**
   * POST /validate-config - Validate YAML configuration
   */
  async validateConfig(req, res) {
    try {
      const validation = this.databaseService.validateConfig();
      
      res.json({
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Config validation error:', error);
      res.status(500).json({
        error: 'Failed to validate configuration'
      });
    }
  }
}

module.exports = AdminController;
