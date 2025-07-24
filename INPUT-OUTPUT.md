# Input-Output Documentation

This document demonstrates the Scopely Promotion Service API behavior with various input scenarios and their corresponding outputs.

## API Endpoint: `POST /promotion`

### Test Case 1: VIP Player Welcome Back
**Input:**
```json
{
  "player_id": "vip_12345",
  "player_level": 55,
  "spend_tier": "vip",
  "country": "US",
  "days_since_last_purchase": 10,
  "total_spent": 500.00
}
```

**Output:**
```json
{
  "success": true,
  "promotion": {
    "id": null,
    "name": "",
    "type": "discount",
    "value": 50,
    "currency": "gems",
    "reward": 1000,
    "description": "Welcome back VIP! 50% off next purchase + 1000 gems",
    "item_id": null,
    "discount": null,
    "timestamp": "2025-07-24T10:40:40.998Z",
    "rule_id": "vip_welcome_back"
  }
}
```

---

### Test Case 2: New Player Boost
**Input:**
```json
{
  "player_id": "new_67890",
  "player_level": 5,
  "spend_tier": "free",
  "country": "CA",
  "days_since_registration": 1
}
```

**Output:**
```json
{
  "success": true,
  "promotion": {
    "id": null,
    "name": "",
    "type": "bonus",
    "value": 100,
    "currency": "coins",
    "reward": 5000,
    "description": "New player boost: 5000 coins + 100% XP bonus",
    "item_id": null,
    "discount": null,
    "timestamp": "2025-07-24T10:41:15.123Z",
    "rule_id": "new_player_boost"
  }
}
```

---

### Test Case 3: Big Spender Exclusive
**Input:**
```json
{
  "player_id": "whale_99999",
  "player_level": 75,
  "spend_tier": "whale",
  "country": "JP",
  "total_spent": 2500.00
}
```

**Output:**
```json
{
  "success": true,
  "promotion": {
    "id": null,
    "name": "",
    "type": "exclusive_item",
    "value": 0,
    "currency": "coins",
    "reward": 0,
    "description": "Exclusive legendary weapon for our biggest supporters",
    "item_id": "legendary_sword",
    "discount": null,
    "timestamp": "2025-07-24T10:41:45.567Z",
    "rule_id": "big_spender_exclusive"
  }
}
```

---

### Test Case 4: Regular Player (Default Promotion)
**Input:**
```json
{
  "player_id": "regular_11111",
  "player_level": 30,
  "spend_tier": "medium",
  "country": "FR",
  "days_since_last_purchase": 1
}
```

**Output:**
```json
{
  "success": true,
  "promotion": {
    "id": null,
    "name": "",
    "type": "daily",
    "value": 10,
    "currency": "coins",
    "reward": 100,
    "description": "Daily login bonus: 100 coins",
    "item_id": null,
    "discount": null,
    "timestamp": "2025-07-24T10:42:10.891Z",
    "rule_id": "default_daily"
  }
}
```

---

### Test Case 5: Regional Holiday Special (US Player in July)
**Input:**
```json
{
  "player_id": "us_player_456",
  "player_level": 25,
  "spend_tier": "light",
  "country": "US",
  "current_date": "2025-07-15"
}
```

**Output:**
```json
{
  "success": true,
  "promotion": {
    "id": null,
    "name": "",
    "type": "limited_time",
    "value": 0,
    "currency": "coins",
    "reward": 0,
    "description": "Summer special: 25% off all items",
    "item_id": null,
    "discount": 25,
    "timestamp": "2025-07-24T10:42:35.234Z",
    "rule_id": "regional_holiday"
  }
}
```

---

### Test Case 6: Comeback Offer
**Input:**
```json
{
  "player_id": "comeback_789",
  "player_level": 35,
  "spend_tier": "medium",
  "country": "GB",
  "days_since_last_login": 21
}
```

**Output:**
```json
{
  "success": true,
  "promotion": {
    "id": null,
    "name": "",
    "type": "comeback",
    "value": 30,
    "currency": "gems",
    "reward": 500,
    "description": "We miss you! Come back for 500 gems + 30% bonus",
    "item_id": null,
    "discount": null,
    "timestamp": "2025-07-24T10:43:00.567Z",
    "rule_id": "comeback_offer"
  }
}
```

---

## Error Cases

### Test Case 7: Invalid Player Data
**Input:**
```json
{
  "player_level": -1,
  "spend_tier": "invalid_tier",
  "country": "INVALID"
}
```

**Output:**
```json
{
  "success": true,
  "promotion": null,
  "message": "No matching promotion found"
}
```

---

### Test Case 8: Missing Required Fields
**Input:**
```json
{
  "player_id": "incomplete_player"
}
```

**Output:**
```json
{
  "success": true,
  "promotion": null,
  "message": "No matching promotion found"
}
```

---

### Test Case 9: Malformed JSON
**Input:**
```json
{ invalid json structure
```

**Output:**
```json
{
  "error": "Invalid JSON in request body"
}
```

---

## Validation Endpoint: `POST /validate-player`

### Test Case 10: Valid Player Data
**Input:**
```json
{
  "player_level": 25,
  "spend_tier": "medium",
  "country": "US",
  "days_since_last_purchase": 5
}
```

**Output:**
```json
{
  "valid": true,
  "errors": [],
  "sanitizedData": {
    "player_id": null,
    "player_level": 25,
    "spend_tier": "medium",
    "country": "US",
    "days_since_last_purchase": 5,
    "days_since_last_login": 0,
    "days_since_registration": null,
    "total_spent": 0,
    "current_date": null
  }
}
```

---

### Test Case 11: Invalid Player Data
**Input:**
```json
{
  "player_level": -1,
  "spend_tier": "invalid_tier",
  "country": "INVALID",
  "total_spent": -50
}
```

**Output:**
```json
{
  "valid": false,
  "errors": [
    "player_level must be a positive number",
    "spend_tier must be one of: free, light, medium, heavy, vip, whale",
    "country must be a 2-letter country code",
    "total_spent must be a non-negative number"
  ],
  "sanitizedData": null
}
```

---

## Monitoring Endpoints

### Health Check: `GET /health`
**Output:**
```json
{
  "status": "healthy",
  "timestamp": "2025-07-24T10:44:00.000Z",
  "service": {
    "status": "healthy",
    "averageLatency": 45.32,
    "errorRate": 0.02,
    "totalEvaluations": 1500
  },
  "database": {
    "rulesLoaded": 6,
    "lastLoadTime": "2025-07-24T10:36:33.600Z",
    "configPath": "/home/ayush-1/Desktop/Scopely/config/promotion-rules.yaml"
  },
  "uptime": "0h 7m 30s"
}
```

---

### Basic Metrics: `GET /metrics`
**Output:**
```json
{
  "timestamp": "2025-07-24T10:44:30.000Z",
  "metrics": {
    "totalEvaluations": 1500,
    "hits": 1200,
    "misses": 300,
    "hitRate": "80.00%",
    "averageLatency": "45.32ms",
    "errors": 5,
    "rulesReloaded": 2,
    "uptime": "0h 8m 0s"
  }
}
```

---

### Detailed Metrics: `GET /metrics?detailed=true`
**Output:**
```json
{
  "timestamp": "2025-07-24T10:45:00.000Z",
  "metrics": {
    "totalEvaluations": 1500,
    "hits": 1200,
    "misses": 300,
    "hitRate": "80.00%",
    "averageLatency": "45.32ms",
    "errors": 5,
    "rulesReloaded": 2,
    "uptime": "0h 8m 30s"
  },
  "performance": {
    "latencyPercentiles": {
      "p50": "35ms",
      "p90": "75ms",
      "p95": "120ms",
      "p99": "250ms"
    },
    "recentEvaluations": 100,
    "averageLatencyTrend": "stable"
  },
  "ruleUsage": {
    "vip_welcome_back": 150,
    "new_player_boost": 400,
    "big_spender_exclusive": 50,
    "regional_holiday": 200,
    "comeback_offer": 100,
    "default_daily": 300
  },
  "errorBreakdown": {
    "validationErrors": 3,
    "timeoutErrors": 1,
    "ruleEvaluationErrors": 1
  }
}
```

---

## Administration Endpoints

### Get All Rules: `GET /rules`
**Output:**
```json
{
  "rules": [
    {
      "id": "vip_welcome_back",
      "name": "VIP Welcome Back",
      "priority": 100,
      "conditions": {
        "player_level": { "min": 50 },
        "spend_tier": "vip",
        "days_since_last_purchase": { "min": 7, "max": 30 },
        "country": { "include": ["US", "CA", "GB", "AU"] }
      },
      "promotion": {
        "type": "discount",
        "value": 50,
        "currency": "gems",
        "reward": 1000,
        "description": "Welcome back VIP! 50% off next purchase + 1000 gems"
      }
    },
    {
      "id": "new_player_boost",
      "name": "New Player Boost",
      "priority": 90,
      "conditions": {
        "player_level": { "max": 10 },
        "days_since_registration": { "max": 3 }
      },
      "promotion": {
        "type": "bonus",
        "value": 100,
        "currency": "coins",
        "reward": 5000,
        "description": "New player boost: 5000 coins + 100% XP bonus"
      }
    }
  ],
  "totalRules": 6,
  "lastUpdated": "2025-07-24T10:36:33.600Z"
}
```

---

### Hot Reload Rules: `POST /reload-rules`
**Output:**
```json
{
  "success": true,
  "message": "Rules reloaded successfully",
  "previousCount": 6,
  "currentCount": 6,
  "reloadTime": "2025-07-24T10:45:30.000Z"
}
```

---

### Get Configuration: `GET /config`
**Output:**
```json
{
  "extensibility": {
    "weighted_randomness": { "enabled": false },
    "ab_testing": { "enabled": false },
    "time_windows": { "enabled": false }
  },
  "performance": {
    "rule_cache_ttl": 300,
    "max_rules_per_evaluation": 100,
    "evaluation_timeout_ms": 500
  },
  "rulesCount": 6,
  "configPath": "/home/ayush-1/Desktop/Scopely/config/promotion-rules.yaml",
  "lastLoaded": "2025-07-24T10:36:33.600Z"
}
```

---

## Rule Evaluation Logic

### Priority Resolution Examples

**Scenario**: Player matches multiple rules
- Player Level: 55, Spend Tier: "vip", Country: "US", Days Since Last Purchase: 10

**Matching Rules** (in priority order):
1. `vip_welcome_back` (Priority: 100) ✅ **SELECTED**
2. `regional_holiday` (Priority: 80) - Would match but lower priority
3. `default_daily` (Priority: 10) - Would match but lowest priority

**Result**: VIP Welcome Back promotion is returned due to highest priority.

---

**Scenario**: No specific rules match
- Player Level: 15, Spend Tier: "light", Country: "DE"

**Matching Rules**:
1. `default_daily` (Priority: 10) ✅ **SELECTED** (fallback rule)

**Result**: Daily Login Bonus promotion is returned as fallback.

---

## Performance Metrics Examples

### Typical Response Times
- **Fast Path** (cached rules, simple conditions): 15-25ms
- **Standard Path** (multiple rule evaluation): 35-50ms
- **Complex Path** (many rules, complex conditions): 75-120ms
- **Timeout Threshold**: 500ms (configurable)

### Error Scenarios
- **Validation Errors**: ~5% of requests (invalid player data)
- **Timeout Errors**: <0.1% of requests (complex rule sets)
- **Rule Evaluation Errors**: <0.1% of requests (malformed rules)

---

*Last Updated: July 24, 2025*
*Service Version: 1.0.0*
