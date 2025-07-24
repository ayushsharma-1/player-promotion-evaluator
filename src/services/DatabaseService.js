const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Rule = require('../models/Rule');

/**
 * In-memory database service for managing promotion rules
 * Handles loading, caching, and hot-reloading of rules from YAML
 */
class DatabaseService {
  constructor() {
    this.rules = new Map(); // Map<string, Rule>
    this.lastLoadTime = null;
    this.configPath = path.join(__dirname, '../../config/promotion-rules.yaml');
    this.config = null;
  }

  /**
   * Initialize the database by loading rules from YAML
   */
  async initialize() {
    try {
      await this.loadRules();
      console.log(`Database initialized with ${this.rules.size} rules`);
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Load rules from YAML configuration file
   */
  async loadRules() {
    try {
      const configContent = fs.readFileSync(this.configPath, 'utf8');
      this.config = yaml.load(configContent);
      
      this.rules.clear();
      
      if (this.config.rules && Array.isArray(this.config.rules)) {
        for (const ruleData of this.config.rules) {
          const rule = new Rule(ruleData);
          this.rules.set(rule.id, rule);
        }
      }
      
      this.lastLoadTime = new Date();
      console.log(`Loaded ${this.rules.size} rules from configuration`);
      
    } catch (error) {
      console.error('Error loading rules:', error);
      throw new Error(`Failed to load rules: ${error.message}`);
    }
  }

  /**
   * Hot-reload rules without restarting the service
   */
  async reloadRules() {
    const previousCount = this.rules.size;
    await this.loadRules();
    console.log(`Rules reloaded: ${previousCount} -> ${this.rules.size}`);
    return {
      previousCount,
      currentCount: this.rules.size,
      reloadTime: this.lastLoadTime
    };
  }

  /**
   * Get all rules sorted by priority (highest first)
   * @returns {Rule[]} - Array of rules sorted by priority
   */
  getAllRules() {
    return Array.from(this.rules.values())
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get a specific rule by ID
   * @param {string} ruleId - Rule identifier
   * @returns {Rule|null} - Rule instance or null if not found
   */
  getRule(ruleId) {
    return this.rules.get(ruleId) || null;
  }

  /**
   * Get database statistics
   * @returns {Object} - Statistics about the database
   */
  getStats() {
    return {
      totalRules: this.rules.size,
      lastLoadTime: this.lastLoadTime,
      configPath: this.configPath,
      extensibilityConfig: this.config?.extensibility || {},
      performanceConfig: this.config?.performance || {}
    };
  }

  /**
   * Validate configuration file format
   * @returns {Object} - Validation results
   */
  validateConfig() {
    const errors = [];
    const warnings = [];
    
    if (!this.config) {
      errors.push('No configuration loaded');
      return { valid: false, errors, warnings };
    }
    
    if (!this.config.rules || !Array.isArray(this.config.rules)) {
      errors.push('Rules must be an array');
    } else {
      // Validate individual rules
      for (let i = 0; i < this.config.rules.length; i++) {
        const rule = this.config.rules[i];
        const ruleErrors = this._validateRule(rule, i);
        errors.push(...ruleErrors);
      }
      
      // Check for duplicate rule IDs
      const ruleIds = this.config.rules.map(r => r.id).filter(Boolean);
      const duplicates = ruleIds.filter((id, index) => ruleIds.indexOf(id) !== index);
      if (duplicates.length > 0) {
        errors.push(`Duplicate rule IDs found: ${duplicates.join(', ')}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate a single rule
   * @private
   */
  _validateRule(rule, index) {
    const errors = [];
    
    if (!rule.id) {
      errors.push(`Rule at index ${index} missing required 'id' field`);
    }
    
    if (typeof rule.priority !== 'number') {
      errors.push(`Rule '${rule.id || index}' must have numeric priority`);
    }
    
    if (!rule.promotion || typeof rule.promotion !== 'object') {
      errors.push(`Rule '${rule.id || index}' must have promotion object`);
    }
    
    return errors;
  }

  /**
   * Get configuration for extensibility features
   */
  getExtensibilityConfig() {
    return this.config?.extensibility || {};
  }

  /**
   * Get performance configuration
   */
  getPerformanceConfig() {
    return this.config?.performance || {
      rule_cache_ttl: 300,
      max_rules_per_evaluation: 100,
      evaluation_timeout_ms: 500
    };
  }
}

// Export singleton instance
module.exports = new DatabaseService();
