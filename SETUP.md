# Deadlock Match Analyzer - Setup Instructions

## Quick Start

1. **Open the application:**
   - Simply open `index.html` in your web browser

2. **Enter a match ID:**
   - Use any valid Deadlock match ID (e.g., `38069822`)
   - Click "Analyze Match"

3. **Wait for results:**
   - The application will fetch player data (may take up to 2 minutes due to API rate limits)
   - Results will display charts comparing team performance

## Features

- **Team Performance Comparison**: Win rates and total matches played
- **Player Statistics**: Individual player performance metrics
- **Rate Limiting**: Automatic handling of API limitations
- **Fallback Support**: Uses mock data if API fails
- **Responsive Design**: Works on desktop and mobile

## Development

### Local CSS Build (Optional)
The application now uses local Tailwind CSS instead of CDN:

```bash
# Install dependencies
npm install

# Build CSS for production
npm run build-css-prod

# Watch CSS changes during development
npm run build-css
```

### API Configuration
Edit `js/api.js` to modify:
- `USE_MOCK_DATA`: Set to `true` for testing
- `USE_ENHANCED_API`: Set to `true` when enhanced API is available
- Rate limiting settings

## Troubleshooting

### Slow Loading
- The application respects API rate limits (5 requests per minute)
- Player data is fetched sequentially to avoid rate limiting
- Wait time is displayed in the loading message

### No Data
- Try a different match ID
- Check browser console for errors
- Application will fall back to mock data if API fails

### Styling Issues
- Ensure `styles.css` is present and properly linked
- Run `npm run build-css-prod` to regenerate CSS if needed

## Technical Details

### API Endpoints Used
- `https://api.deadlock-api.com/v1/matches/{id}/metadata` - Match player data
- `https://api.deadlock-api.com/v1/players/{id}/match-history` - Player statistics

### Rate Limiting
- 5 requests per 60 seconds
- 12-second delays between requests
- Automatic retry on rate limit errors

### Browser Compatibility
- Modern browsers with ES6+ support
- Tested on Chrome, Firefox, Safari, Edge

## File Structure

```
deadlock_web/
├── index.html              # Main application
├── styles.css              # Compiled Tailwind CSS
├── js/
│   ├── api.js              # API integration
│   ├── app.js              # Main application logic
│   ├── ui.js               # Chart rendering
│   ├── chart-plugins.js    # Custom chart components
│   ├── deadlock-api-service.js  # Enhanced API service
│   ├── data-models.js      # Data structures
│   └── enhanced-ui.js      # Enhanced UI components
├── config/
│   └── api-config.js       # API configuration
├── src/
│   └── input.css           # Tailwind source
├── package.json            # Dependencies
├── tailwind.config.js      # Tailwind configuration
├── REFACTORING.md          # Refactoring documentation
└── SETUP.md               # This file
```