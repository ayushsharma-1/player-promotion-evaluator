const PromotionService = require('../services/PromotionService');

/**
 * Controller for promotion-related endpoints
 */
class PromotionController {
  constructor() {
    this.promotionService = new PromotionService();
  }

  /**
   * POST /promotion - Evaluate and return the best promotion for a player
   */
  async evaluatePromotion(req, res) {
    try {
      const playerData = req.body;
      
      // Validate request body
      if (!playerData || typeof playerData !== 'object') {
        return res.status(400).json({
          error: 'Invalid request body. Expected player data object.',
          example: {
            player_id: "12345",
            player_level: 25,
            spend_tier: "medium",
            country: "US",
            days_since_last_purchase: 5
          }
        });
      }

      // Evaluate promotion
      const promotion = await this.promotionService.evaluatePromotion(playerData);
      
      if (promotion) {
        res.json({
          success: true,
          promotion: promotion.toJSON()
        });
      } else {
        res.json({
          success: true,
          promotion: null,
          message: 'No matching promotion found'
        });
      }

    } catch (error) {
      console.error('Promotion evaluation error:', error);
      
      if (error.message.includes('validation')) {
        res.status(400).json({
          error: 'Player data validation failed',
          details: error.message
        });
      } else if (error.message.includes('timeout')) {
        res.status(408).json({
          error: 'Promotion evaluation timeout',
          details: 'Evaluation took too long to complete'
        });
      } else {
        res.status(500).json({
          error: 'Internal server error during promotion evaluation'
        });
      }
    }
  }

  /**
   * POST /validate-player - Validate player data without evaluation
   */
  async validatePlayer(req, res) {
    try {
      const playerData = req.body;
      const validation = this.promotionService.validatePlayerData(playerData);
      
      res.json({
        valid: validation.valid,
        errors: validation.errors,
        sanitizedData: validation.valid ? validation.sanitizedData : null
      });

    } catch (error) {
      console.error('Player validation error:', error);
      res.status(500).json({
        error: 'Internal server error during validation'
      });
    }
  }

  /**
   * GET /promotion/status - Get promotion service status
   */
  async getStatus(req, res) {
    try {
      const status = this.promotionService.getStatus();
      res.json({
        service: 'promotion-service',
        status: 'active',
        ...status
      });
    } catch (error) {
      console.error('Status retrieval error:', error);
      res.status(500).json({
        error: 'Failed to retrieve service status'
      });
    }
  }
}

module.exports = PromotionController;
