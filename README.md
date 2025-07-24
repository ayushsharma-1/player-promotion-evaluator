# Scopely Promotion Service

A REST microservice for selecting the most appropriate in-game promotion for players based on configurable business rules.

## 🎯 Overview

This service evaluates player attributes against a set of configurable rules defined in YAML and returns the best matching promotion. It includes comprehensive metrics tracking, hot-reloading capabilities, and extensibility hooks for advanced features.

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- npm 7+

### Installation & Running

```bash
# Clone and navigate to the project
cd scopely-promotion-service

# Install dependencies
npm install

# Start the service
npm start

# Or run in development mode with hot reload
npm run dev
```

The service will start on port 3000 by default. Visit http://localhost:3000 for API documentation.

## 📋 API Endpoints

### Core Endpoints

#### `POST /promotion`
Evaluate and return the best promotion for a player.

**Request Body:**
```json
{
  "player_id": "12345",
  "player_level": 25,
  "spend_tier": "medium",
  "country": "US",
  "days_since_last_purchase": 5,
  "days_since_last_login": 0,
  "total_spent": 99.99
}
```

**Response:**
```json
{
  "success": true,
  "promotion": {
    "id": "promo_1753369154704_w76bf",
    "name": "VIP Welcome Back Offer",
    "type": "discount",
    "value": 50,
    "currency": "gems",
    "reward": 1000,
    "description": "Welcome back VIP! 50% off next purchase + 1000 gems",
    "item_id": null,
    "discount": null,
    "timestamp": "2025-07-24T14:59:14.704Z",
    "rule_id": "vip_welcome_back"
  }
}
```

#### `GET /metrics`
Get service performance metrics.

**Query Parameters:**
- `detailed=true` - Include detailed performance analytics

**Response:**
```json
{
  "timestamp": "2025-07-24T15:30:00.000Z",
  "metrics": {
    "totalEvaluations": 1500,
    "hits": 1200,
    "misses": 300,
    "hitRate": "80.00%",
    "averageLatency": "45.32ms",
    "errors": 5,
    "rulesReloaded": 2,
    "uptime": "2h 15m 30s"
  }
}
```

#### `POST /reload-rules`
Hot-reload promotion rules from YAML configuration.

**Response:**
```json
{
  "success": true,
  "message": "Rules reloaded successfully",
  "previousCount": 6,
  "currentCount": 7,
  "reloadTime": "2025-07-24T15:30:00.000Z"
}
```

### Monitoring Endpoints

#### `GET /health`
Health check endpoint.

#### `GET /rules`
Get all loaded rules (admin endpoint).

#### `GET /config`
Get current configuration.

## 🛠 Configuration

### Rule Definition

Rules are defined in `config/promotion-rules.yaml`. Each rule contains:

- **id**: Unique identifier
- **name**: Human-readable name
- **priority**: Higher numbers = higher priority (1-100)
- **conditions**: Player attribute conditions
- **promotion**: Promotion payload to return

**Example Rule:**
```yaml
rules:
  - id: "vip_welcome_back"
    name: "VIP Welcome Back"
    priority: 100
    conditions:
      player_level:
        min: 50
      spend_tier: "vip"
      days_since_last_purchase:
        min: 7
        max: 30
      country:
        include: ["US", "CA", "GB", "AU"]
    promotion:
      type: "discount"
      value: 50
      currency: "gems"
      reward: 1000
      description: "Welcome back VIP! 50% off next purchase + 1000 gems"
```

### Condition Types

- **Range conditions**: `min`, `max`
- **List conditions**: `include`, `exclude`
- **Date conditions**: `after`, `before`
- **Exact match**: Direct value comparison

### Player Attributes

- `player_id`: String (optional)
- `player_level`: Number (required, min: 1)
- `spend_tier`: String (free|light|medium|heavy|vip|whale)
- `country`: String (2-letter country code)
- `days_since_last_purchase`: Number (optional)
- `days_since_last_login`: Number (optional)
- `days_since_registration`: Number (optional)
- `total_spent`: Number (optional)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Test Coverage

The test suite covers:
- ✅ Rule precedence and conflict resolution
- ✅ Player data validation edge cases
- ✅ Missing/invalid player attributes
- ✅ Unsupported country codes
- ✅ Performance timeouts and limits
- ✅ Metrics accuracy
- ✅ Error handling

## 📊 Performance & Scalability

### Edge Case Handling

1. **Conflicting Rules**: Higher priority rules win. Same priority uses first-match.
2. **Missing Attributes**: Rules fail gracefully if required attributes are missing.
3. **Invalid Data**: Comprehensive validation with detailed error messages.
4. **Large Rule Sets**: Configurable limits and timeouts prevent performance degradation.

### Performance Configuration

```yaml
performance:
  rule_cache_ttl: 300  # 5 minutes
  max_rules_per_evaluation: 100
  evaluation_timeout_ms: 500
```

### Built-in Protections

- Request rate limiting (100 req/min per IP)
- Evaluation timeouts (500ms default)
- Rule evaluation limits
- Memory usage controls

## 🔧 Extensibility Hooks

The service includes hooks for future features:

### 1. Weighted Randomness
```yaml
extensibility:
  weighted_randomness:
    enabled: false
```

When enabled, multiple matching rules can be randomly selected based on weights.

### 2. A/B Testing
```yaml
extensibility:
  ab_testing:
    enabled: false
```

When enabled, players can be bucketed into test groups for experimentation.

### 3. Time Windows
```yaml
extensibility:
  time_windows:
    enabled: false
```

When enabled, rules can have specific time windows for activation.

**Implementation locations:**
- `src/services/PromotionService.js` - `_checkABTesting()`, `_checkTimeWindows()`, `_selectWithWeightedRandomness()`

## 📁 Project Structure

```
scopely-promotion-service/
├── src/
│   ├── models/           # Data models (Player, Rule, Promotion)
│   ├── services/         # Business logic services
│   ├── controllers/      # HTTP request handlers  
│   ├── middleware/       # Express middleware
│   └── app.js           # Main application entry point
├── tests/               # Unit tests
├── config/              # YAML configuration files
├── package.json         # Node.js dependencies and scripts
└── README.md           # This file
```

## 🧱 Architecture Decisions

### Design Choices

1. **Node.js + Express**: Chosen for rapid development, excellent JSON/REST support, and strong ecosystem for microservices.

2. **In-Memory Rule Storage**: Rules are loaded at startup and cached in memory for fast evaluation. Hot-reloading allows updates without restart.

3. **Priority-Based Evaluation**: Rules are sorted by priority and evaluated in order. First match wins to ensure predictable behavior.

4. **Modular Architecture**: Clear separation between models, services, and controllers for maintainability and testability.

5. **YAML Configuration**: Human-readable format that's easy to edit and version control.

### Alternative Approaches Considered

1. **Database Storage**: Rejected due to added complexity and latency for a read-heavy workload.
2. **Redis Caching**: Not needed given in-memory storage approach.
3. **GraphQL**: REST was chosen for simplicity and wider tooling support.

### Trade-offs Made

1. **Memory vs. Persistence**: Rules stored in memory for speed, requiring hot-reload for updates.
2. **Simplicity vs. Features**: Started with core functionality, added extensibility hooks for future features.
3. **Performance vs. Flexibility**: Fixed evaluation order (priority-based) for predictable performance.

## 🤖 AI Tool Usage

This project was developed with assistance from GitHub Copilot:

- **Initial project structure**: Copilot suggested the modular architecture layout
- **YAML parsing logic**: Used Copilot suggestions for js-yaml integration patterns
- **Test structure**: Copilot helped generate comprehensive test cases for edge conditions
- **Express middleware**: Copilot suggested patterns for error handling and request logging
- **Documentation**: Copilot assisted with API documentation formatting and examples

All AI-generated code was reviewed, modified, and tested to ensure it met requirements and followed best practices.

## 🚧 Areas of Uncertainty

1. **Rule Conflict Resolution**: Implemented priority-based resolution, but weighted randomness could be better for some use cases.

2. **Performance Thresholds**: Current timeout (500ms) and rule limits (100) are conservative estimates that may need tuning based on real usage.

3. **Country Code Validation**: Currently accepts any 2-letter code. Could integrate with ISO country code validation library.

4. **Extensibility Implementation**: Hooks are in place but actual A/B testing and time window logic would need requirements clarification.

## 📊 Example Usage

### curl Examples

```bash
# Basic promotion evaluation
curl -X POST http://localhost:3000/promotion \
  -H "Content-Type: application/json" \
  -d '{
    "player_level": 25,
    "spend_tier": "medium", 
    "country": "US",
    "days_since_last_purchase": 5
  }'

# Get service metrics
curl http://localhost:3000/metrics?detailed=true

# Hot-reload rules
curl -X POST http://localhost:3000/reload-rules

# Health check
curl http://localhost:3000/health
```

### Postman Collection

A Postman collection is available at the root endpoint (GET /) with example requests for all endpoints.

## 🔍 Monitoring

The service provides comprehensive monitoring:

- **Real-time metrics** via `/metrics`
- **Health checks** via `/health` 
- **Request logging** to console
- **Error tracking** with stack traces in development

## 🚀 Deployment

### Environment Variables

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)

### Production Considerations

- Use process manager (PM2, Docker, etc.)
- Configure reverse proxy (nginx) for load balancing
- Set up log aggregation and monitoring
- Configure CORS for specific origins
- Implement authentication for admin endpoints

---

*Built with ❤️ for Scopely*
