/**
 * Promotion model representing a promotion offer
 */
class Promotion {
  constructor(data = {}) {
    // Always generate a unique ID, ignore any ID from data
    this.id = this._generateUniqueId();
    this.name = data.name;
    this.type = data.type;
    this.value = data.value;
    this.currency = data.currency;
    this.reward = data.reward;
    this.description = data.description;
    this.item_id = data.item_id;
    this.discount = data.discount;
    
    // Metadata
    this.timestamp = new Date().toISOString();
    this.rule_id = data.rule_id;
  }

  /**
   * Generate a unique promotion ID
   * @private
   */
  _generateUniqueId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 8);
    const uuid = Math.random().toString(36).substr(2, 4);
    return `promo_${timestamp}_${random}_${uuid}`;
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
