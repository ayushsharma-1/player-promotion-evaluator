const MetricsService = require('../src/services/MetricsService');

describe('MetricsService', () => {
  beforeEach(() => {
    // Reset metrics before each test
    MetricsService.resetMetrics();
  });

  describe('recordEvaluation', () => {
    test('should record successful evaluation with promotion', () => {
      MetricsService.recordEvaluation(100, true, 'test_rule');
      
      const metrics = MetricsService.getMetrics();
      
      expect(metrics.totalEvaluations).toBe(1);
      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(0);
      expect(parseFloat(metrics.averageLatency)).toBe(100);
    });

    test('should record failed evaluation without promotion', () => {
      MetricsService.recordEvaluation(50, false);
      
      const metrics = MetricsService.getMetrics();
      
      expect(metrics.totalEvaluations).toBe(1);
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(1);
      expect(parseFloat(metrics.averageLatency)).toBe(50);
    });

    test('should calculate correct average latency', () => {
      MetricsService.recordEvaluation(100, true, 'rule1');
      MetricsService.recordEvaluation(200, false);
      MetricsService.recordEvaluation(300, true, 'rule2');
      
      const metrics = MetricsService.getMetrics();
      
      expect(metrics.totalEvaluations).toBe(3);
      expect(metrics.hits).toBe(2);
      expect(metrics.misses).toBe(1);
      expect(parseFloat(metrics.averageLatency)).toBe(200); // (100 + 200 + 300) / 3
    });

    test('should calculate correct hit rate', () => {
      MetricsService.recordEvaluation(100, true, 'rule1');
      MetricsService.recordEvaluation(100, true, 'rule2');
      MetricsService.recordEvaluation(100, false);
      MetricsService.recordEvaluation(100, false);
      
      const metrics = MetricsService.getMetrics();
      
      expect(metrics.hitRate).toBe('50.00%'); // 2 hits out of 4 evaluations
    });

    test('should maintain recent evaluations with limit', () => {
      // Record more than the limit (assuming maxRecentEntries is 1000)
      for (let i = 0; i < 1005; i++) {
        MetricsService.recordEvaluation(10, i % 2 === 0, `rule_${i}`);
      }
      
      const detailedMetrics = MetricsService.getDetailedMetrics();
      
      expect(detailedMetrics.recentEvaluationsCount).toBeLessThanOrEqual(1000);
      expect(detailedMetrics.totalEvaluations).toBe(1005);
    });
  });

  describe('recordError', () => {
    test('should record errors', () => {
      const error = new Error('Test error');
      MetricsService.recordError(error);
      
      const metrics = MetricsService.getMetrics();
      
      expect(metrics.errors).toBe(1);
    });

    test('should accumulate errors', () => {
      MetricsService.recordError(new Error('Error 1'));
      MetricsService.recordError(new Error('Error 2'));
      MetricsService.recordError(new Error('Error 3'));
      
      const metrics = MetricsService.getMetrics();
      
      expect(metrics.errors).toBe(3);
    });
  });

  describe('recordRulesReload', () => {
    test('should record rules reload', () => {
      MetricsService.recordRulesReload();
      
      const metrics = MetricsService.getMetrics();
      
      expect(metrics.rulesReloaded).toBe(1);
    });
  });

  describe('getMetrics', () => {
    test('should return basic metrics', () => {
      MetricsService.recordEvaluation(100, true, 'rule1');
      MetricsService.recordEvaluation(200, false);
      MetricsService.recordError(new Error('Test error'));
      MetricsService.recordRulesReload();
      
      const metrics = MetricsService.getMetrics();
      
      expect(metrics).toHaveProperty('totalEvaluations', 2);
      expect(metrics).toHaveProperty('hits', 1);
      expect(metrics).toHaveProperty('misses', 1);
      expect(metrics).toHaveProperty('hitRate', '50.00%');
      expect(metrics).toHaveProperty('averageLatency', '150.00ms');
      expect(metrics).toHaveProperty('errors', 1);
      expect(metrics).toHaveProperty('rulesReloaded', 1);
      expect(metrics).toHaveProperty('lastResetTime');
      expect(metrics).toHaveProperty('uptime');
    });

    test('should handle zero evaluations', () => {
      const metrics = MetricsService.getMetrics();
      
      expect(metrics.totalEvaluations).toBe(0);
      expect(metrics.hitRate).toBe('0%');
      expect(metrics.averageLatency).toBe('0.00ms');
    });
  });

  describe('getDetailedMetrics', () => {
    test('should return detailed metrics with percentiles', () => {
      // Record evaluations with various latencies
      [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].forEach((latency, index) => {
        MetricsService.recordEvaluation(latency, index % 2 === 0, `rule_${index}`);
      });
      
      const detailedMetrics = MetricsService.getDetailedMetrics();
      
      expect(detailedMetrics).toHaveProperty('performancePercentiles');
      expect(detailedMetrics.performancePercentiles).toHaveProperty('p50');
      expect(detailedMetrics.performancePercentiles).toHaveProperty('p90');
      expect(detailedMetrics.performancePercentiles).toHaveProperty('p95');
      expect(detailedMetrics.performancePercentiles).toHaveProperty('p99');
      
      expect(detailedMetrics).toHaveProperty('ruleUsageStats');
      expect(detailedMetrics).toHaveProperty('errorRate');
      expect(detailedMetrics).toHaveProperty('recentEvaluationsCount', 10);
    });

    test('should return rule usage statistics', () => {
      MetricsService.recordEvaluation(100, true, 'popular_rule');
      MetricsService.recordEvaluation(100, true, 'popular_rule');
      MetricsService.recordEvaluation(100, true, 'popular_rule');
      MetricsService.recordEvaluation(100, true, 'rare_rule');
      
      const detailedMetrics = MetricsService.getDetailedMetrics();
      const ruleStats = detailedMetrics.ruleUsageStats;
      
      expect(ruleStats.mostUsedRules[0]).toEqual({
        ruleId: 'popular_rule',
        count: 3
      });
      expect(ruleStats.mostUsedRules[1]).toEqual({
        ruleId: 'rare_rule',
        count: 1
      });
      expect(ruleStats.totalRulesUsed).toBe(2);
    });

    test('should calculate error rate', () => {
      MetricsService.recordEvaluation(100, true, 'rule1');
      MetricsService.recordEvaluation(100, false);
      MetricsService.recordError(new Error('Test error'));
      
      const detailedMetrics = MetricsService.getDetailedMetrics();
      
      expect(detailedMetrics.errorRate).toBe('50.00%'); // 1 error out of 2 evaluations
    });
  });

  describe('getHealthMetrics', () => {
    test('should return healthy status for good performance', () => {
      MetricsService.recordEvaluation(10, true, 'rule1');
      MetricsService.recordEvaluation(20, true, 'rule2');
      
      const healthMetrics = MetricsService.getHealthMetrics();
      
      expect(healthMetrics.status).toBe('healthy');
      expect(healthMetrics.averageLatency).toBe(15);
      expect(healthMetrics.errorRate).toBe(0);
    });

    test('should return degraded status for moderate performance issues', () => {
      // High latency but low error rate
      MetricsService.recordEvaluation(600, true, 'rule1');
      MetricsService.recordEvaluation(700, true, 'rule2');
      
      const healthMetrics = MetricsService.getHealthMetrics();
      
      expect(healthMetrics.status).toBe('degraded');
    });

    test('should return unhealthy status for poor performance', () => {
      // Very high latency
      MetricsService.recordEvaluation(1200, true, 'rule1');
      MetricsService.recordEvaluation(1300, false);
      
      const healthMetrics = MetricsService.getHealthMetrics();
      
      expect(healthMetrics.status).toBe('unhealthy');
    });

    test('should return unhealthy status for high error rate', () => {
      // High error rate
      for (let i = 0; i < 10; i++) {
        MetricsService.recordEvaluation(50, i < 2, 'rule1'); // 80% error rate
        if (i >= 2) {
          MetricsService.recordError(new Error('Test error'));
        }
      }
      
      const healthMetrics = MetricsService.getHealthMetrics();
      
      expect(healthMetrics.status).toBe('unhealthy');
    });
  });

  describe('resetMetrics', () => {
    test('should reset all metrics to initial state', () => {
      // Record some data
      MetricsService.recordEvaluation(100, true, 'rule1');
      MetricsService.recordError(new Error('Test error'));
      MetricsService.recordRulesReload();
      
      // Reset
      MetricsService.resetMetrics();
      
      const metrics = MetricsService.getMetrics();
      
      expect(metrics.totalEvaluations).toBe(0);
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);
      expect(metrics.averageLatency).toBe('0.00ms');
      expect(metrics.errors).toBe(0);
      expect(metrics.rulesReloaded).toBe(0);
    });
  });
});
