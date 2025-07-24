/**
 * Rule model representing a promotion rule with conditions
 */
class Rule {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.priority = data.priority || 0;
    this.conditions = data.conditions || {};
    this.promotion = data.promotion || {};
    
    // Extensibility hooks
    this.weight = data.weight || 1;  // For weighted randomness
    this.ab_bucket = data.ab_bucket || null;  // For A/B testing
    this.time_window = data.time_window || null;  // For time-based rules
  }

  /**
   * Evaluate if this rule matches the given player
   * @param {Player} player - Player to evaluate against
   * @returns {boolean} - True if player matches all conditions
   */
  matches(player) {
    try {
      return this._evaluateConditions(this.conditions, player);
    } catch (error) {
      console.error(`Error evaluating rule ${this.id}:`, error);
      return false;
    }
  }

  /**
   * Recursively evaluate conditions against player attributes
   * @private
   */
  _evaluateConditions(conditions, player) {
    for (const [field, condition] of Object.entries(conditions)) {
      if (!this._evaluateFieldCondition(field, condition, player)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Evaluate a specific field condition
   * @private
   */
  _evaluateFieldCondition(field, condition, player) {
    const playerValue = player[field];
    
    // Handle missing player attributes
    if (playerValue === undefined || playerValue === null) {
      // If condition is optional or has a default, continue
      if (condition.optional || condition.default !== undefined) {
        return true;
      }
      // Otherwise, condition fails
      return false;
    }

    // Handle different condition types
    if (typeof condition === 'object') {
      // Range conditions
      if (condition.min !== undefined && playerValue < condition.min) {
        return false;
      }
      if (condition.max !== undefined && playerValue > condition.max) {
        return false;
      }
      
      // Include/exclude lists
      if (condition.include && !condition.include.includes(playerValue)) {
        return false;
      }
      if (condition.exclude && condition.exclude.includes(playerValue)) {
        return false;
      }
      
      // Date conditions
      if (condition.after && playerValue <= condition.after) {
        return false;
      }
      if (condition.before && playerValue >= condition.before) {
        return false;
      }
      
      // Exact match
      if (condition.equals !== undefined && playerValue !== condition.equals) {
        return false;
      }
    } else {
      // Direct value comparison
      if (playerValue !== condition) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Create a promotion instance from this rule
   * @returns {Promotion} - Promotion instance
   */
  createPromotion() {
    const Promotion = require('./Promotion');
    return new Promotion({
      ...this.promotion,
      rule_id: this.id
    });
  }
}

module.exports = Rule;
