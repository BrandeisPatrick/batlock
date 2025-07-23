# Deadlock Match Analyzer

A web application to analyze team performance in Deadlock matches by comparing players' recent statistics.

## Features

- **Match Analysis**: Enter a match ID to compare team performance
- **Player Statistics**: View total matches played and win rates from last 50 games
- **Visual Charts**: Interactive charts showing team comparisons
- **Responsive Design**: Works on desktop and mobile devices

## Setup

### Option 1: Use Mock Data (Default)
The app works out of the box with mock data. To enable mock data, set `features.useMockData` to `true` in `api/api-config.js`.

### Option 2: Use Public API (Recommended)
The app is configured to use the public Deadlock API at `https://api.deadlock-api.com/api/v1` by default. This can be configured in `api/api-config.js`.

**Optional: Get Real Player Names**
To show actual Steam usernames instead of Steam IDs:
1. Get a Steam API key from [Steam Community](https://steamcommunity.com/dev/apikey)
2. In `api/api-config.js`, set `legacyAPI.steamAPIKey` to your Steam API key.

### Option 3: Alternative APIs

All API endpoints and feature flags are configured in `api/api-config.js`. You can modify `mainAPI.baseUrl`, `assetsAPI.baseUrl`, `streamkitAPI.baseUrl`, and `legacyAPI.baseUrl` to point to different API instances. You can also enable/disable features like `useEnhancedAPI`, `enableAssets`, etc., via the `features` object in `api/api-config.js`.

## Usage

1. Open `index.html` in your browser
2. Enter a match ID (e.g., "38069822" for real data, or "12345" for mock data)
3. Click "Analyze Match" to view team comparison charts

## API Configuration

All API endpoints, feature flags, and other API-related settings are centralized in `api/api-config.js`. This file allows you to configure:

- **Main API Endpoints**: `mainAPI.baseUrl` for the primary Deadlock API.
- **Assets API**: `assetsAPI.baseUrl` for hero icons, portraits, etc.
- **Streamkit API**: `streamkitAPI.baseUrl` for live match data overlays.
- **Legacy API**: `legacyAPI.baseUrl` and `legacyAPI.steamAPIKey` for backward compatibility and Steam profile name fetching.
- **Cache Settings**: `cache` object for API response caching.
- **Request Settings**: `request` object for timeouts and retries.
- **Feature Flags**: `features` object to enable/disable various functionalities like `useEnhancedAPI`, `enableAssets`, `useMockData`, etc.

## File Structure

```
├── index.html          # Main HTML file
├── styles.css          # Custom styles
├── config/
│   └── api-config.js   # Centralized API configuration
├── js/
│   ├── app.js          # Main application logic
│   ├── api.js          # API calls and data fetching
│   ├── ui.js           # DOM manipulation and charts
│   └── chart-plugins.js # Chart.js custom plugins
└── README.md           # This file
```

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Charts**: Chart.js
- **Fonts**: Inter (Google Fonts)

## Contributing

1. Fork the repository
2. Make your changes
3. Test with both mock and real data
4. Submit a pull request

## Notes

- The app handles API failures gracefully with automatic fallback to mock data
- Real match IDs can be found on sites like tracklock.gg
- Check browser console for detailed API request logs
- The Deadlock API is community-maintained and not official