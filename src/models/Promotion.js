/**
 * Promotion model representing a promotion offer
 */
class Promotion {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.type = data.type || 'bonus';
    this.value = data.value || 0;
    this.currency = data.currency || 'coins';
    this.reward = data.reward || 0;
    this.description = data.description || '';
    this.item_id = data.item_id || null;
    this.discount = data.discount || null;
    
    // Metadata
    this.timestamp = new Date().toISOString();
    this.rule_id = data.rule_id || null;
  }

  /**
   * Convert promotion to JSON response format
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      value: this.value,
      currency: this.currency,
      reward: this.reward,
      description: this.description,
      item_id: this.item_id,
      discount: this.discount,
      timestamp: this.timestamp,
      rule_id: this.rule_id
    };
  }
}

module.exports = Promotion;
