const Rule = require('../src/models/Rule');
const Player = require('../src/models/Player');

describe('Rule Model', () => {
  describe('constructor', () => {
    test('should create rule with default values', () => {
      const rule = new Rule();
      
      expect(rule.id).toBeNull();
      expect(rule.name).toBe('');
      expect(rule.priority).toBe(0);
      expect(rule.conditions).toEqual({});
      expect(rule.promotion).toEqual({});
      expect(rule.weight).toBe(1);
    });

    test('should create rule with provided data', () => {
      const data = {
        id: 'test_rule',
        name: 'Test Rule',
        priority: 100,
        conditions: { player_level: { min: 10 } },
        promotion: { type: 'bonus', value: 100 }
      };
      
      const rule = new Rule(data);
      
      expect(rule.id).toBe('test_rule');
      expect(rule.name).toBe('Test Rule');
      expect(rule.priority).toBe(100);
      expect(rule.conditions).toEqual({ player_level: { min: 10 } });
      expect(rule.promotion).toEqual({ type: 'bonus', value: 100 });
    });
  });

  describe('matches', () => {
    test('should match player with no conditions', () => {
      const rule = new Rule({ conditions: {} });
      const player = new Player({ player_level: 25 });
      
      expect(rule.matches(player)).toBe(true);
    });

    test('should match player meeting minimum level condition', () => {
      const rule = new Rule({
        conditions: { player_level: { min: 10 } }
      });
      const player = new Player({ player_level: 25 });
      
      expect(rule.matches(player)).toBe(true);
    });

    test('should not match player below minimum level', () => {
      const rule = new Rule({
        conditions: { player_level: { min: 30 } }
      });
      const player = new Player({ player_level: 25 });
      
      expect(rule.matches(player)).toBe(false);
    });

    test('should match player meeting maximum level condition', () => {
      const rule = new Rule({
        conditions: { player_level: { max: 30 } }
      });
      const player = new Player({ player_level: 25 });
      
      expect(rule.matches(player)).toBe(true);
    });

    test('should not match player above maximum level', () => {
      const rule = new Rule({
        conditions: { player_level: { max: 20 } }
      });
      const player = new Player({ player_level: 25 });
      
      expect(rule.matches(player)).toBe(false);
    });

    test('should match player in level range', () => {
      const rule = new Rule({
        conditions: { player_level: { min: 20, max: 30 } }
      });
      const player = new Player({ player_level: 25 });
      
      expect(rule.matches(player)).toBe(true);
    });

    test('should match player with included country', () => {
      const rule = new Rule({
        conditions: { country: { include: ['US', 'CA', 'GB'] } }
      });
      const player = new Player({ country: 'US' });
      
      expect(rule.matches(player)).toBe(true);
    });

    test('should not match player with excluded country', () => {
      const rule = new Rule({
        conditions: { country: { exclude: ['US', 'CA'] } }
      });
      const player = new Player({ country: 'US' });
      
      expect(rule.matches(player)).toBe(false);
    });

    test('should match player with exact spend tier', () => {
      const rule = new Rule({
        conditions: { spend_tier: 'vip' }
      });
      const player = new Player({ spend_tier: 'vip' });
      
      expect(rule.matches(player)).toBe(true);
    });

    test('should not match player with different spend tier', () => {
      const rule = new Rule({
        conditions: { spend_tier: 'vip' }
      });
      const player = new Player({ spend_tier: 'free' });
      
      expect(rule.matches(player)).toBe(false);
    });

    test('should match complex conditions', () => {
      const rule = new Rule({
        conditions: {
          player_level: { min: 20, max: 50 },
          spend_tier: 'vip',
          country: { include: ['US', 'CA'] },
          days_since_last_purchase: { min: 1, max: 30 }
        }
      });
      
      const player = new Player({
        player_level: 35,
        spend_tier: 'vip',
        country: 'US',
        days_since_last_purchase: 15
      });
      
      expect(rule.matches(player)).toBe(true);
    });

    test('should not match if one condition fails', () => {
      const rule = new Rule({
        conditions: {
          player_level: { min: 20 },
          spend_tier: 'vip',
          country: 'US'
        }
      });
      
      const player = new Player({
        player_level: 35,
        spend_tier: 'free', // This fails
        country: 'US'
      });
      
      expect(rule.matches(player)).toBe(false);
    });

    test('should handle missing player attributes gracefully', () => {
      const rule = new Rule({
        conditions: { days_since_last_purchase: { min: 7 } }
      });
      
      const player = new Player({
        player_level: 25,
        days_since_last_purchase: null
      });
      
      expect(rule.matches(player)).toBe(false);
    });

    test('should handle date conditions', () => {
      const rule = new Rule({
        conditions: {
          current_date: {
            after: '2025-01-01',
            before: '2025-12-31'
          }
        }
      });
      
      const player = new Player({
        current_date: '2025-07-24'
      });
      
      expect(rule.matches(player)).toBe(true);
    });
  });

  describe('createPromotion', () => {
    test('should create promotion from rule data', () => {
      const rule = new Rule({
        id: 'test_rule',
        promotion: {
          type: 'bonus',
          value: 100,
          currency: 'gems',
          description: 'Test promotion'
        }
      });
      
      const promotion = rule.createPromotion();
      
      expect(promotion.type).toBe('bonus');
      expect(promotion.value).toBe(100);
      expect(promotion.currency).toBe('gems');
      expect(promotion.description).toBe('Test promotion');
      expect(promotion.rule_id).toBe('test_rule');
    });
  });
});
