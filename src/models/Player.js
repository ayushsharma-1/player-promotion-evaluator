/**
 * Player model representing player attributes used for promotion evaluation
 */
class Player {
  constructor(data = {}) {
    this.player_id = data.player_id;
    this.player_level = data.player_level;
    this.spend_tier = data.spend_tier; // free, light, medium, heavy, vip, whale
    this.country = data.country;
    this.days_since_last_purchase = data.days_since_last_purchase;
    this.days_since_last_login = data.days_since_last_login;
    this.days_since_registration = data.days_since_registration;
    this.total_spent = data.total_spent;
    this.current_date = data.current_date;
    
    // Extensibility hooks for future features
    this.ab_bucket = data.ab_bucket;
    this.geo_region = data.geo_region;
    this.device_type = data.device_type;
    this.session_count = data.session_count;
  }

  /**
   * Validate player data for required fields and data types
   */
  validate() {
    const errors = [];
    
    if (typeof this.player_level !== 'number' || this.player_level < 1) {
      errors.push('player_level must be a positive number');
    }
    
    if (!['free', 'light', 'medium', 'heavy', 'vip', 'whale'].includes(this.spend_tier)) {
      errors.push('spend_tier must be one of: free, light, medium, heavy, vip, whale');
    }
    
    if (typeof this.country !== 'string' || this.country.length !== 2) {
      errors.push('country must be a 2-letter country code');
    }
    
    if (this.days_since_last_purchase !== null && 
        (typeof this.days_since_last_purchase !== 'number' || this.days_since_last_purchase < 0)) {
      errors.push('days_since_last_purchase must be null or a non-negative number');
    }
    
    if (typeof this.total_spent !== 'number' || this.total_spent < 0) {
      errors.push('total_spent must be a non-negative number');
    }
    
    return errors;
  }
}

module.exports = Player;
