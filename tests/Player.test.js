const Player = require('../src/models/Player');

describe('Player Model', () => {
  describe('constructor', () => {
    test('should create player with only provided data (no defaults)', () => {
      const player = new Player();
      
      expect(player.player_id).toBeUndefined();
      expect(player.player_level).toBeUndefined();
      expect(player.spend_tier).toBeUndefined();
      expect(player.country).toBeUndefined();
      expect(player.days_since_last_purchase).toBeUndefined();
      expect(player.total_spent).toBeUndefined();
    });

    test('should create player with provided data', () => {
      const data = {
        player_id: '12345',
        player_level: 25,
        spend_tier: 'vip',
        country: 'CA',
        days_since_last_purchase: 7,
        total_spent: 99.99
      };
      
      const player = new Player(data);
      
      expect(player.player_id).toBe('12345');
      expect(player.player_level).toBe(25);
      expect(player.spend_tier).toBe('vip');
      expect(player.country).toBe('CA');
      expect(player.days_since_last_purchase).toBe(7);
      expect(player.total_spent).toBe(99.99);
    });
  });

  describe('validate', () => {
    test('should return no errors for valid player data', () => {
      const player = new Player({
        player_level: 25,
        spend_tier: 'medium',
        country: 'US',
        days_since_last_purchase: 5,
        total_spent: 50.0
      });
      
      const errors = player.validate();
      expect(errors).toHaveLength(0);
    });

    test('should return error for invalid player_level', () => {
      const player = new Player({ player_level: -1 });
      const errors = player.validate();
      
      expect(errors).toContain('player_level must be a positive number');
    });

    test('should return error for invalid spend_tier', () => {
      const player = new Player({ spend_tier: 'invalid' });
      const errors = player.validate();
      
      expect(errors).toContain('spend_tier must be one of: free, light, medium, heavy, vip, whale');
    });

    test('should return error for invalid country code', () => {
      const player = new Player({ country: 'USA' });
      const errors = player.validate();
      
      expect(errors).toContain('country must be a 2-letter country code');
    });

    test('should return error for negative total_spent', () => {
      const player = new Player({ total_spent: -10 });
      const errors = player.validate();
      
      expect(errors).toContain('total_spent must be a non-negative number');
    });

    test('should allow null days_since_last_purchase', () => {
      const player = new Player({ days_since_last_purchase: null });
      const errors = player.validate();
      
      expect(errors).not.toContain('days_since_last_purchase must be null or a non-negative number');
    });

    test('should return error for negative days_since_last_purchase', () => {
      const player = new Player({ days_since_last_purchase: -1 });
      const errors = player.validate();
      
      expect(errors).toContain('days_since_last_purchase must be null or a non-negative number');
    });

    test('should return multiple errors for multiple invalid fields', () => {
      const player = new Player({
        player_level: 0,
        spend_tier: 'invalid',
        country: 'INVALID',
        total_spent: -1
      });
      
      const errors = player.validate();
      expect(errors.length).toBeGreaterThan(1);
    });
  });
});
