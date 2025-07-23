/**
 * Vercel serverless function to fetch Steam user data
 * Bypasses CORS restrictions and keeps API key secure
 */
export default async function handler(req, res) {
  console.log('=== API FUNCTION CALLED ===');
  console.log('Method:', req.method);
  console.log('Query params:', req.query);
  
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
  
  const { steamids, vanityurl, player_name } = req.query;
  console.log('Extracted params - steamids:', steamids, 'vanityurl:', vanityurl, 'player_name:', player_name);
  let finalVanityUrl = vanityurl || player_name;

  console.log('Received request:', { steamids, vanityurl, player_name });

  if (!steamids && !finalVanityUrl) {
    console.log('Missing parameters: steamids or finalVanityUrl');
    return res.status(400).json({ 
      error: 'steamids, vanityurl, or player_name parameter required',
      examples: {
        steamids: '/api/steam-user?steamids=76561197960361544',
        vanityurl: '/api/steam-user?vanityurl=username',
        player_name: '/api/steam-user?player_name=PlayerName'
      }
    });
  }
  
  // Check if Steam API key is configured
  if (!process.env.STEAM_API_KEY) {
    console.error('STEAM_API_KEY not configured!');
    return res.status(500).json({ 
      error: 'Steam API key not configured' 
    });
  }

  // If a player_name is provided and Google API keys are available, use Google Search
  if (player_name && process.env.GOOGLE_API_KEY && process.env.GOOGLE_CSE_ID) {
    console.log('=== GOOGLE CUSTOM SEARCH DEBUG START ===');
    console.log('Attempting Google Custom Search for player_name:', player_name);
    console.log('GOOGLE_API_KEY present:', !!process.env.GOOGLE_API_KEY);
    console.log('GOOGLE_CSE_ID present:', !!process.env.GOOGLE_CSE_ID);
    console.log('GOOGLE_API_KEY length:', process.env.GOOGLE_API_KEY?.length || 0);
    console.log('GOOGLE_CSE_ID value:', process.env.GOOGLE_CSE_ID);

    try {
      const googleSearchUrl = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_CSE_ID}&q=${encodeURIComponent(player_name + ' site:steamcommunity.com')}`;
      console.log('Google Search URL:', googleSearchUrl);
      const searchResponse = await fetch(googleSearchUrl);
      console.log('Google Search Response Status:', searchResponse.status);
      const searchData = await searchResponse.json();
      console.log('Google Search Data (first 2 items):', JSON.stringify(searchData.items ? searchData.items.slice(0, 2) : searchData, null, 2));

      if (searchData.items && searchData.items.length > 0) {
        const steamProfileUrl = searchData.items[0].link;
        console.log('Found Steam Profile URL from Google Search:', steamProfileUrl);
        const vanityMatch = steamProfileUrl.match(/steamcommunity\.com\/id\/([^\/]+)/);
        if (vanityMatch && vanityMatch[1]) {
          finalVanityUrl = vanityMatch[1];
          console.log('Extracted vanity URL:', finalVanityUrl);
        } else {
          const profileMatch = steamProfileUrl.match(/steamcommunity\.com\/profiles\/([^\/]+)/);
          if (profileMatch && profileMatch[1]) {
            steamids = profileMatch[1];
            finalVanityUrl = null; // Unset vanity url to proceed with steamid
            console.log('Extracted SteamID64:', steamids);
          }
        }
      } else {
        console.log('No relevant items found in Google Search results.');
      }
    } catch (e) {
      console.error('Google Search API call failed:', e.message, e.stack);
      console.log('=== GOOGLE CUSTOM SEARCH DEBUG END (FAILED) ===');
      // Proceed with the original vanity/player name if search fails
    }
    console.log('=== GOOGLE CUSTOM SEARCH DEBUG END ===');
  } else {
    console.log('=== GOOGLE CUSTOM SEARCH SKIPPED ===');
    console.log('player_name provided:', !!player_name);
    console.log('GOOGLE_API_KEY present:', !!process.env.GOOGLE_API_KEY);
    console.log('GOOGLE_CSE_ID present:', !!process.env.GOOGLE_CSE_ID);
    if (player_name && !process.env.GOOGLE_API_KEY) {
      console.log('Missing GOOGLE_API_KEY - player name search will not work');
    }
    if (player_name && !process.env.GOOGLE_CSE_ID) {
      console.log('Missing GOOGLE_CSE_ID - player name search will not work');
    }
    if (player_name && (!process.env.GOOGLE_API_KEY || !process.env.GOOGLE_CSE_ID)) {
      console.log('Player name search not available - returning 404 for display name searches');
      return res.status(404).json({
        error: 'Player not found',
        message: `Display name search requires Google Custom Search API configuration. Please use Steam ID or vanity URL instead.`,
        searchTerm: player_name
      });
    }
  }
  
  try {
    let finalSteamIds = steamids;
    
    console.log('=== FINAL PROCESSING START ===');
    console.log('finalVanityUrl:', finalVanityUrl);
    console.log('steamids:', steamids);
    console.log('finalSteamIds:', finalSteamIds);
    
    // If vanityurl is provided, resolve it to Steam ID first
    if (finalVanityUrl) {
      console.log('Attempting to resolve vanity URL:', finalVanityUrl);
      const vanityApiUrl = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${process.env.STEAM_API_KEY}&vanityurl=${encodeURIComponent(finalVanityUrl)}`;
      console.log('Steam Vanity API URL:', vanityApiUrl);
      
      const vanityResponse = await fetch(vanityApiUrl, {
        headers: {
          'User-Agent': 'Deadlock-Match-Analyzer/1.0'
        }
      });
      console.log('Steam Vanity API Response Status:', vanityResponse.status);
      
      if (!vanityResponse.ok) {
        const errorText = await vanityResponse.text();
        console.error('Steam Vanity API Error Response Body:', errorText);
        throw new Error(`Steam Vanity API returned ${vanityResponse.status}: ${vanityResponse.statusText}`);
      }
      
      const vanityData = await vanityResponse.json();
      console.log('Steam Vanity API Data:', JSON.stringify(vanityData, null, 2));
      
      if (vanityData.response.success !== 1) {
        console.log('Vanity URL resolution failed: success is not 1');
        return res.status(404).json({
          error: 'Player not found',
          message: 'No Steam user found with that vanity URL',
          vanityurl: finalVanityUrl
        });
      }
      
      finalSteamIds = vanityData.response.steamid;
      console.log('Resolved SteamID from vanity URL:', finalSteamIds);
      
      // If only resolving vanity URL, return the Steam ID and Deadlock account ID
      if (!steamids) {
        const deadlockAccountId = (BigInt(finalSteamIds) - BigInt('76561197960265728')).toString();
        console.log('Returning resolved vanity URL data:', { resolved: true, vanityurl: finalVanityUrl, steamid: finalSteamIds, deadlockAccountId });
        
        return res.status(200).json({
          resolved: true,
          vanityurl: finalVanityUrl,
          steamid: finalSteamIds,
          deadlockAccountId: deadlockAccountId
        });
      }
    }
    
    // Fetch player summaries from Steam API
    const steamApiUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${finalSteamIds}`;
    console.log('Fetching player summaries from Steam API URL:', steamApiUrl);
    
    const response = await fetch(steamApiUrl, {
      headers: {
        'User-Agent': 'Deadlock-Match-Analyzer/1.0'
      }
    });
    console.log('Steam Player Summaries API Response Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Steam Player Summaries API Error Response Body:', errorText);
      throw new Error(`Steam API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Steam Player Summaries API Data (players array length):', data.response && data.response.players ? data.response.players.length : 'N/A');
    
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
    console.log('Returning final Steam API response.');
    console.log('=== FINAL PROCESSING END (SUCCESS) ===');
    res.status(200).json(data);
    
  } catch (error) {
    console.error('Caught error in main try-catch block:', error.message, error.stack);
    console.log('=== FINAL PROCESSING END (ERROR) ===');
    
    // If no steam IDs were found and this was a player_name search, return 404
    if (player_name && !steamids && !finalVanityUrl) {
      console.log('Player name search failed - returning 404');
      res.status(404).json({ 
        error: 'Player not found',
        message: `No Steam user found with display name "${player_name}"`,
        details: error.message 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to fetch Steam data',
        details: error.message 
      });
    }
  }
}