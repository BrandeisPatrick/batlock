# Deadlock Web Application Refactoring

## Overview
This document outlines the refactoring of the Deadlock Match Analyzer to integrate with the official Deadlock API tools ecosystem.

## New Features and Improvements

### 1. Enhanced API Service (`js/deadlock-api-service.js`)
- **Official API Integration**: Uses the official Deadlock API endpoints from `deadlock-api-rust`
- **Comprehensive Data Access**: 
  - Full match details with player statistics
  - Player profiles and match history
  - Leaderboard data
  - Hero builds and analytics
- **Built-in Caching**: 5-minute cache for API responses to reduce load
- **Enhanced Statistics**: KDA calculations, per-minute stats, performance ratings

### 2. Data Models (`js/data-models.js`)
- **MatchData**: Complete match information with team statistics
- **PlayerMatchData**: Detailed player performance metrics
  - Combat stats (K/D/A, damage, healing)
  - Economy stats (net worth, last hits)
  - Performance rating calculation
- **PlayerProfile**: Comprehensive player profiles with hero preferences

### 3. Enhanced UI Components (`js/enhanced-ui.js`)
- **Hero Assets Integration**: Display hero icons from `deadlock-api-assets`
- **Player Cards**: Rich player information display with:
  - Hero portraits
  - KDA ratios with color coding
  - Damage/healing per minute
  - Win rates
- **Team Summary Cards**: Aggregate team statistics
- **Performance Charts**: 
  - KDA comparison
  - Damage output comparison
  - Additional visualization options

### 4. Backward Compatibility
- Falls back to legacy API when enhanced features unavailable
- Maintains existing chart functionality
- Seamless integration with existing codebase

## API Endpoints Used

### From `deadlock-api-rust`:
- `/api/v1/matches/{matchId}` - Full match details
- `/api/v1/players/{playerId}/match-history` - Player match history
- `/api/v1/leaderboard` - Competitive rankings
- `/api/v1/analytics` - Game analytics
- `/api/v1/builds/{heroId}` - Hero build information

### From `deadlock-api-assets`:
- `/heroes/{heroId}/icon.png` - Hero icons
- `/heroes/{heroId}/portrait.png` - Hero portraits
- `/items/{itemId}.png` - Item icons

## Implementation Details

### Progressive Enhancement
The refactoring follows a progressive enhancement approach:
1. If enhanced API is available, use it for richer data
2. Display enhanced UI components when data supports it
3. Fall back to standard UI for basic data
4. Always maintain core functionality

### Caching Strategy
- 5-minute default cache for API responses
- 10-minute cache for match data
- 24-hour cache for static assets
- Cache can be cleared manually via API service

### Error Handling
- Graceful fallback to legacy API on failure
- Mock data support for development/testing
- User-friendly error messages
- Console logging for debugging

## Usage

### Basic Usage (No Changes Required)
The application maintains backward compatibility. Existing usage patterns continue to work:
```javascript
// Enter a match ID in the UI
// Click "Analyze Match"
// View results
```

### Enhanced Features (Automatic)
When using a match ID that returns enhanced data:
- Hero icons display automatically
- Additional statistics show in player cards
- Performance comparison charts appear
- Team summaries provide aggregate data

### Configuration
Edit `api/api-config.js` to:
- Enable/disable features
- Adjust cache timeouts
- Configure API endpoints
- Set feature flags

## Future Enhancements

### Planned Features:
1. **Player Profile Views**: Detailed player statistics page
2. **Match Timeline**: Visual representation of match progression
3. **Build Analysis**: Popular item builds and skill orders
4. **Live Match Tracking**: Real-time match updates
5. **Historical Trends**: Performance over time graphs

### Integration Opportunities:
1. **Streamkit Integration**: For streaming overlays
2. **Discord Bot**: Match analysis in Discord
3. **Mobile App**: React Native version
4. **Backend Service**: Using `deadlock-api-tools` microservices

## Development

### Adding New Features:
1. Check available data in `DeadlockAPIService`
2. Create/update data models as needed
3. Add UI components in `EnhancedUI`
4. Update `app.js` to utilize new features

### Testing:
- Set `USE_MOCK_DATA = true` in `api.js`
- Use feature flags in `api-config.js`
- Test fallback scenarios

## Resources

- [Deadlock API Tools](https://github.com/deadlock-api/deadlock-api-tools)
- [Deadlock API Rust](https://github.com/deadlock-api/deadlock-api-rust)
- [Deadlock API Assets](https://github.com/deadlock-api/deadlock-api-assets)
- [API Documentation](https://api.deadlock-api.com/docs)