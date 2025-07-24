/**
 * Metrics service for tracking API usage and performance
 * Stores metrics in memory with thread-safe operations
 */
class MetricsService {
  constructor() {
    this.metrics = {
      totalEvaluations: 0,
      hits: 0,           // Evaluations that returned a promotion
      misses: 0,         // Evaluations that returned null
      totalLatency: 0,   // Sum of all evaluation times in ms
      errors: 0,         // Number of evaluation errors
      lastResetTime: new Date(),
      rulesReloaded: 0,
      averageLatency: 0
    };
    
    // Recent performance data for analysis
    this.recentEvaluations = [];
    this.maxRecentEntries = 1000;
  }

  /**
   * Record a promotion evaluation
   * @param {number} latencyMs - Time taken for evaluation in milliseconds
   * @param {boolean} hasPromotion - Whether a promotion was returned
   * @param {string} ruleId - ID of the matching rule (if any)
   */
  recordEvaluation(latencyMs, hasPromotion, ruleId = null) {
    this.metrics.totalEvaluations++;
    this.metrics.totalLatency += latencyMs;
    
    if (hasPromotion) {
      this.metrics.hits++;
    } else {
      this.metrics.misses++;
    }
    
    // Update average latency
    this.metrics.averageLatency = this.metrics.totalLatency / this.metrics.totalEvaluations;
    
    // Store recent evaluation data
    this.recentEvaluations.push({
      timestamp: new Date(),
      latencyMs,
      hasPromotion,
      ruleId
    });
    
    // Keep only recent entries
    if (this.recentEvaluations.length > this.maxRecentEntries) {
      this.recentEvaluations.shift();
    }
  }

  /**
   * Record an evaluation error
   * @param {Error} error - The error that occurred
   */
  recordError(error) {
    this.metrics.errors++;
    console.error('Evaluation error recorded:', error.message);
  }

  /**
   * Record a rules reload operation
   */
  recordRulesReload() {
    this.metrics.rulesReloaded++;
  }

  /**
   * Get current metrics snapshot
   * @returns {Object} - Current metrics data
   */
  getMetrics() {
    const hitRate = this.metrics.totalEvaluations > 0 
      ? (this.metrics.hits / this.metrics.totalEvaluations * 100).toFixed(2)
      : 0;

    return {
      totalEvaluations: this.metrics.totalEvaluations,
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      hitRate: `${hitRate}%`,
      averageLatency: `${this.metrics.averageLatency.toFixed(2)}ms`,
      errors: this.metrics.errors,
      rulesReloaded: this.metrics.rulesReloaded,
      lastResetTime: this.metrics.lastResetTime,
      uptime: this._getUptime()
    };
  }

  /**
   * Get detailed performance analytics
   * @returns {Object} - Detailed performance data
   */
  getDetailedMetrics() {
    const baseMetrics = this.getMetrics();
    
    // Calculate percentiles from recent evaluations
    const recentLatencies = this.recentEvaluations.map(e => e.latencyMs).sort((a, b) => a - b);
    const percentiles = this._calculatePercentiles(recentLatencies);
    
    // Rule usage statistics
    const ruleUsage = this._getRuleUsageStats();
    
    return {
      ...baseMetrics,
      performancePercentiles: percentiles,
      ruleUsageStats: ruleUsage,
      recentEvaluationsCount: this.recentEvaluations.length,
      errorRate: this.metrics.totalEvaluations > 0 
        ? `${(this.metrics.errors / this.metrics.totalEvaluations * 100).toFixed(2)}%`
        : '0%'
    };
  }

  /**
   * Reset all metrics
   */
  resetMetrics() {
    this.metrics = {
      totalEvaluations: 0,
      hits: 0,
      misses: 0,
      totalLatency: 0,
      errors: 0,
      lastResetTime: new Date(),
      rulesReloaded: 0,
      averageLatency: 0
    };
    
    this.recentEvaluations = [];
    console.log('Metrics reset at', new Date().toISOString());
  }

  /**
   * Calculate latency percentiles
   * @private
   */
  _calculatePercentiles(latencies) {
    if (latencies.length === 0) {
      return { p50: 0, p90: 0, p95: 0, p99: 0 };
    }
    
    const getPercentile = (arr, percentile) => {
      const index = Math.ceil(arr.length * percentile / 100) - 1;
      return arr[Math.max(0, index)];
    };
    
    return {
      p50: getPercentile(latencies, 50),
      p90: getPercentile(latencies, 90),
      p95: getPercentile(latencies, 95),
      p99: getPercentile(latencies, 99)
    };
  }

  /**
   * Get rule usage statistics
   * @private
   */
  _getRuleUsageStats() {
    const ruleUsage = {};
    
    for (const evaluation of this.recentEvaluations) {
      if (evaluation.ruleId) {
        ruleUsage[evaluation.ruleId] = (ruleUsage[evaluation.ruleId] || 0) + 1;
      }
    }
    
    // Sort by usage count
    const sortedRules = Object.entries(ruleUsage)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10); // Top 10 rules
    
    return {
      mostUsedRules: sortedRules.map(([ruleId, count]) => ({ ruleId, count })),
      totalRulesUsed: Object.keys(ruleUsage).length
    };
  }

  /**
   * Get service uptime
   * @private
   */
  _getUptime() {
    const uptimeMs = Date.now() - this.metrics.lastResetTime.getTime();
    const uptimeSeconds = Math.floor(uptimeMs / 1000);
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;
    
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  /**
   * Get metrics for health check
   * @returns {Object} - Health check data
   */
  getHealthMetrics() {
    const recentErrors = this.recentEvaluations
      .filter(e => Date.now() - e.timestamp.getTime() < 60000) // Last 1 minute
      .length;
    
    const avgLatency = this.metrics.averageLatency;
    const errorRate = this.metrics.totalEvaluations > 0 
      ? this.metrics.errors / this.metrics.totalEvaluations
      : 0;
    
    return {
      status: this._determineHealthStatus(avgLatency, errorRate),
      averageLatency: avgLatency,
      errorRate: errorRate,
      recentErrors,
      totalEvaluations: this.metrics.totalEvaluations
    };
  }

  /**
   * Determine service health status
   * @private
   */
  _determineHealthStatus(avgLatency, errorRate) {
    if (errorRate > 0.1 || avgLatency > 1000) {
      return 'unhealthy';
    } else if (errorRate > 0.05 || avgLatency > 500) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }
}

// Export singleton instance
module.exports = new MetricsService();
