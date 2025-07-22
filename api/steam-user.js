/**
 * Vercel serverless function to fetch Steam user data
 * Bypasses CORS restrictions and keeps API key secure
 */
export default async function handler(req, res) {
  // Enable CORS for all origins (adjust as needed)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { steamids } = req.query;
  
  if (!steamids) {
    return res.status(400).json({ 
      error: 'steamids parameter required',
      example: '/api/steam-user?steamids=76561197960361544'
    });
  }
  
  // Check if Steam API key is configured
  if (!process.env.STEAM_API_KEY) {
    return res.status(500).json({ 
      error: 'Steam API key not configured' 
    });
  }
  
  try {
    // Fetch data from Steam API
    const steamApiUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steamids}`;
    
    const response = await fetch(steamApiUrl, {
      headers: {
        'User-Agent': 'Deadlock-Match-Analyzer/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Steam API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Add caching headers to reduce API calls
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    
    // Return the Steam API response
    res.status(200).json(data);
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch Steam data',
      details: error.message 
    });
  }
}