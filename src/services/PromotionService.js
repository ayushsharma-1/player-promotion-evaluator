const Player = require('../models/Player');
const Rule = require('../models/Rule');
const DatabaseService = require('./DatabaseService');
const MetricsService = require('./MetricsService');

/**
 * Core promotion evaluation service
 * Handles business logic for selecting appropriate promotions
 */
class PromotionService {
  constructor() {
    this.databaseService = DatabaseService;
    this.metricsService = MetricsService;
  }

  /**
   * Evaluate and select the best promotion for a player
   * @param {Object} playerData - Player attributes
   * @returns {Object|null} - Selected promotion or null if no match
   */
  async evaluatePromotion(playerData) {
    const startTime = Date.now();
    let selectedPromotion = null;
    let matchingRuleId = null;

    try {
      // Create and validate player instance
      const player = new Player(playerData);
      const validationErrors = player.validate();
      
      if (validationErrors.length > 0) {
        throw new Error(`Player validation failed: ${validationErrors.join(', ')}`);
      }

      // Get performance configuration
      const perfConfig = this.databaseService.getPerformanceConfig();
      const timeoutMs = perfConfig.evaluation_timeout_ms || 500;
      
      // Evaluate with timeout
      const evaluationPromise = this._evaluateWithTimeout(player, timeoutMs);
      const result = await evaluationPromise;
      
      if (result) {
        selectedPromotion = result.promotion;
        matchingRuleId = result.ruleId;
      }

    } catch (error) {
      console.error('Promotion evaluation error:', error);
      this.metricsService.recordError(error);
      
      // Return null for client errors, throw for server errors
      if (error.message.includes('validation') || error.message.includes('timeout')) {
        selectedPromotion = null;
      } else {
        throw error;
      }
    } finally {
      // Record metrics
      const latency = Date.now() - startTime;
      this.metricsService.recordEvaluation(latency, !!selectedPromotion, matchingRuleId);
    }

    return selectedPromotion;
  }

  /**
   * Evaluate promotion with timeout protection
   * @private
   */
  async _evaluateWithTimeout(player, timeoutMs) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Promotion evaluation timeout'));
      }, timeoutMs);

      try {
        const result = this._evaluatePromotionSync(player);
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Synchronous promotion evaluation logic
   * @private
   */
  _evaluatePromotionSync(player) {
    // Get all rules sorted by priority
    const rules = this.databaseService.getAllRules();
    
    if (rules.length === 0) {
      console.warn('No rules available for evaluation');
      return null;
    }

    // Performance limit check
    const perfConfig = this.databaseService.getPerformanceConfig();
    const maxRules = perfConfig.max_rules_per_evaluation || 100;
    const rulesToEvaluate = rules.slice(0, maxRules);

    // Find the first matching rule (highest priority wins)
    for (const rule of rulesToEvaluate) {
      try {
        if (this._evaluateRule(rule, player)) {
          console.log(`Player ${player.player_id} matched rule: ${rule.id}`);
          const promotion = rule.createPromotion();
          return { promotion, ruleId: rule.id };
        }
      } catch (error) {
        console.error(`Error evaluating rule ${rule.id}:`, error);
        // Continue to next rule rather than failing completely
        continue;
      }
    }

    console.log(`No matching promotion found for player ${player.player_id}`);
    return null;
  }

  /**
   * Evaluate a single rule against a player
   * @private
   */
  _evaluateRule(rule, player) {
    // Basic rule matching
    if (!rule.matches(player)) {
      return false;
    }

    // Extensibility hook: A/B Testing
    if (!this._checkABTesting(rule, player)) {
      return false;
    }

    // Extensibility hook: Time Windows
    if (!this._checkTimeWindows(rule, player)) {
      return false;
    }

    return true;
  }

  /**
   * Extensibility hook: A/B Testing evaluation
   * @private
   */
  _checkABTesting(rule, player) {
    const extensibilityConfig = this.databaseService.getExtensibilityConfig();
    
    if (!extensibilityConfig.ab_testing?.enabled) {
      return true; // A/B testing disabled, pass through
    }

    // TODO: Implement A/B bucket logic
    // Example implementation:
    // if (rule.ab_bucket && player.ab_bucket !== rule.ab_bucket) {
    //   return false;
    // }
    
    console.log('A/B testing hook: would check player bucket against rule bucket');
    return true;
  }

  /**
   * Extensibility hook: Time Windows evaluation
   * @private
   */
  _checkTimeWindows(rule, player) {
    const extensibilityConfig = this.databaseService.getExtensibilityConfig();
    
    if (!extensibilityConfig.time_windows?.enabled) {
      return true; // Time windows disabled, pass through
    }

    // TODO: Implement time window logic
    // Example implementation:
    // if (rule.time_window) {
    //   const currentHour = new Date().getHours();
    //   if (currentHour < rule.time_window.start || currentHour > rule.time_window.end) {
    //     return false;
    //   }
    // }
    
    console.log('Time windows hook: would check current time against rule time window');
    return true;
  }

  /**
   * Extensibility hook: Weighted Randomness selection
   * This would be used when multiple rules match and we want to randomly select one
   * @private
   */
  _selectWithWeightedRandomness(matchingRules) {
    const extensibilityConfig = this.databaseService.getExtensibilityConfig();
    
    if (!extensibilityConfig.weighted_randomness?.enabled) {
      // Return highest priority rule (first in sorted array)
      return matchingRules[0];
    }

    // TODO: Implement weighted random selection
    // Example implementation:
    // const totalWeight = matchingRules.reduce((sum, rule) => sum + rule.weight, 0);
    // const random = Math.random() * totalWeight;
    // let currentWeight = 0;
    // 
    // for (const rule of matchingRules) {
    //   currentWeight += rule.weight;
    //   if (random <= currentWeight) {
    //     return rule;
    //   }
    // }
    
    console.log('Weighted randomness hook: would randomly select from matching rules');
    return matchingRules[0];
  }

  /**
   * Handle conflicting rules by priority and additional criteria
   * @param {Rule[]} conflictingRules - Rules that match the same player
   * @returns {Rule} - Selected rule
   */
  resolveConflictingRules(conflictingRules) {
    if (conflictingRules.length === 0) {
      return null;
    }

    if (conflictingRules.length === 1) {
      return conflictingRules[0];
    }

    // Sort by priority (highest first)
    conflictingRules.sort((a, b) => b.priority - a.priority);

    // If same priority, use additional criteria
    const highestPriority = conflictingRules[0].priority;
    const samePriorityRules = conflictingRules.filter(r => r.priority === highestPriority);

    if (samePriorityRules.length === 1) {
      return samePriorityRules[0];
    }

    // Handle same-priority conflicts
    console.log(`Conflict detected: ${samePriorityRules.length} rules with priority ${highestPriority}`);
    
    // Use weighted randomness if enabled, otherwise first rule wins
    return this._selectWithWeightedRandomness(samePriorityRules);
  }

  /**
   * Validate player data and return sanitized version
   * @param {Object} playerData - Raw player data
   * @returns {Object} - Validation result
   */
  validatePlayerData(playerData) {
    try {
      const player = new Player(playerData);
      const errors = player.validate();
      
      return {
        valid: errors.length === 0,
        errors,
        sanitizedData: player
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error.message],
        sanitizedData: null
      };
    }
  }

  /**
   * Get service status and configuration
   * @returns {Object} - Service status
   */
  getStatus() {
    return {
      rulesLoaded: this.databaseService.getAllRules().length,
      lastRulesUpdate: this.databaseService.getStats().lastLoadTime,
      extensibilityConfig: this.databaseService.getExtensibilityConfig(),
      performanceConfig: this.databaseService.getPerformanceConfig()
    };
  }
}

module.exports = PromotionService;
