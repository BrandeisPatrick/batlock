# Deadlock Match Analyzer

A web application to analyze team performance in Deadlock matches by comparing players' recent statistics.

## Features

- **Match Analysis**: Enter a match ID to compare team performance
- **Player Statistics**: View total matches played and win rates from last 50 games
- **Visual Charts**: Interactive charts showing team comparisons
- **Responsive Design**: Works on desktop and mobile devices

## Setup

### Option 1: Use Mock Data (Default)
The app works out of the box with mock data. Simply open `index.html` in your browser.

### Option 2: Use Public API (Recommended)
The app is configured to use the public Deadlock API at `https://api.deadlock-api.com/v1` automatically.

**Optional: Get Real Player Names**
To show actual Steam usernames instead of Steam IDs:
1. Get a Steam API key from [Steam Community](https://steamcommunity.com/dev/apikey)
2. In `js/api.js`, set: `const STEAM_API_KEY = "your_steam_api_key_here";`

### Option 3: Alternative APIs

If Tracker Network adds Deadlock support:
- Sign up at https://tracker.gg/developers
- Update API endpoints in `js/api.js`

## Usage

1. Open `index.html` in your browser
2. Enter a match ID (e.g., "38069822" for real data, or "12345" for mock data)
3. Click "Analyze Match" to view team comparison charts

## API Configuration

The app supports multiple data sources:

1. **Public API** (`https://api.deadlock-api.com/v1`) - Community-hosted API
2. **Mock Data** - Fallback for development and testing

## File Structure

```
├── index.html          # Main HTML file
├── styles.css          # Custom styles
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