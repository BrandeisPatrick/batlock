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
  
  const { steamids, vanityurl } = req.query;
  
  if (!steamids && !vanityurl) {
    return res.status(400).json({ 
      error: 'steamids or vanityurl parameter required',
      examples: {
        steamids: '/api/steam-user?steamids=76561197960361544',
        vanityurl: '/api/steam-user?vanityurl=username'
      }
    });
  }
  
  // Check if Steam API key is configured
  if (!process.env.STEAM_API_KEY) {
    return res.status(500).json({ 
      error: 'Steam API key not configured' 
    });
  }
  
  try {
    let finalSteamIds = steamids;
    
    // If vanityurl is provided, resolve it to Steam ID first
    if (vanityurl) {
      const vanityApiUrl = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${process.env.STEAM_API_KEY}&vanityurl=${encodeURIComponent(vanityurl)}`;
      
      const vanityResponse = await fetch(vanityApiUrl, {
        headers: {
          'User-Agent': 'Deadlock-Match-Analyzer/1.0'
        }
      });
      
      if (!vanityResponse.ok) {
        throw new Error(`Steam Vanity API returned ${vanityResponse.status}: ${vanityResponse.statusText}`);
      }
      
      const vanityData = await vanityResponse.json();
      
      if (vanityData.response.success !== 1) {
        return res.status(404).json({
          error: 'Player not found',
          message: 'No Steam user found with that vanity URL',
          vanityurl: vanityurl
        });
      }
      
      finalSteamIds = vanityData.response.steamid;
      
      // If only resolving vanity URL, return the Steam ID and Deadlock account ID
      if (!steamids) {
        const deadlockAccountId = (BigInt(finalSteamIds) - BigInt('76561197960265728')).toString();
        
        return res.status(200).json({
          resolved: true,
          vanityurl: vanityurl,
          steamid: finalSteamIds,
          deadlockAccountId: deadlockAccountId
        });
      }
    }
    
    // Fetch player summaries from Steam API
    const steamApiUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${finalSteamIds}`;
    
    const response = await fetch(steamApiUrl, {
      headers: {
        'User-Agent': 'Deadlock-Match-Analyzer/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Steam API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Add Deadlock account ID to the response if we have player data
    if (data.response && data.response.players && data.response.players.length > 0) {
      data.response.players.forEach(player => {
        if (player.steamid) {
          player.deadlockAccountId = (BigInt(player.steamid) - BigInt('76561197960265728')).toString();
        }
      });
    }
    
    // Add caching headers to reduce API calls
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    
    // Return the Steam API response with Deadlock account IDs
    res.status(200).json(data);
    
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch Steam data',
      details: error.message 
    });
  }
}