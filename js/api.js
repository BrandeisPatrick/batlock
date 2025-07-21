// API Configuration
const API_BASE_URL = 'https://api.deadlock-api.com/v1'; // Public API (legacy)
const STEAM_API_KEY = "F453D25B12877462957236A9D6D8CCD4"; // Steam API key for real player names
const USE_MOCK_DATA = false; // Set to true for development/testing

// Simple request tracking
let requestCount = 0;
const REQUEST_DELAY = 200; // Small delay to prevent overwhelming the API

// Initialize the new enhanced API service
let deadlockAPI = null;
const USE_ENHANCED_API = false; // Disable for now due to CORS and endpoint issues
try {
    if (typeof DeadlockAPIService !== 'undefined' && USE_ENHANCED_API) {
        deadlockAPI = new DeadlockAPIService();
    }
} catch (e) {
    console.log('DeadlockAPIService not loaded, using legacy API');
}

// Mock Data
const MOCK_MATCH_DATA = {
    players: [
        { steamId: 'player1', displayName: 'Ghost', team: 1 },
        { steamId: 'player2', displayName: 'Spectre', team: 1 },
        { steamId: 'player3', displayName: 'Viper', team: 1 },
        { steamId: 'player4', displayName: 'Phoenix', team: 1 },
        { steamId: 'player5', displayName: 'Jett', team: 1 },
        { steamId: 'player6', displayName: 'Sova', team: 2 },
        { steamId: 'player7', displayName: 'Sage', team: 2 },
        { steamId: 'player8', displayName: 'Raze', team: 2 },
        { steamId: 'player9', displayName: 'Breach', team: 2 },
        { steamId: 'player10', displayName: 'Omen', team: 2 },
    ]
};

const MOCK_PLAYER_MATCHES = {
    'player1': Array.from({ length: 50 }, () => ({ won: Math.random() > 0.45 })),
    'player2': Array.from({ length: 48 }, () => ({ won: Math.random() > 0.5 })),
    'player3': Array.from({ length: 50 }, () => ({ won: Math.random() > 0.55 })),
    'player4': Array.from({ length: 42 }, () => ({ won: Math.random() > 0.6 })),
    'player5': Array.from({ length: 50 }, () => ({ won: Math.random() > 0.48 })),
    'player6': Array.from({ length: 35 }, () => ({ won: Math.random() > 0.52 })),
    'player7': Array.from({ length: 50 }, () => ({ won: Math.random() > 0.7 })),
    'player8': Array.from({ length: 49 }, () => ({ won: Math.random() > 0.3 })),
    'player9': Array.from({ length: 50 }, () => ({ won: Math.random() > 0.51 })),
    'player10': Array.from({ length: 22 }, () => ({ won: Math.random() > 0.4 })),
};

// Steam Profile Name Fetching (using CORS proxy)
async function getSteamProfileName(steamId) {
    if (!STEAM_API_KEY) {
        return null; // Return null if no Steam API key is provided
    }
    
    try {
        // Convert 32-bit account ID to 64-bit Steam ID
        const steamId64 = (BigInt(steamId) + BigInt('76561197960265728')).toString();
        
        // Use CORS proxy to bypass browser restrictions
        const corsProxy = 'https://api.allorigins.win/raw?url=';
        const steamApiUrl = encodeURIComponent(
            `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamId64}`
        );
        
        const response = await fetch(`${corsProxy}${steamApiUrl}`);
        
        if (!response.ok) {
            throw new Error(`Steam API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.response && data.response.players && data.response.players.length > 0) {
            return data.response.players[0].personaname;
        }
        
        return null;
    } catch (error) {
        console.warn(`Failed to fetch Steam profile for ${steamId}:`, error.message);
        return null;
    }
}

// API Fetching Functions
async function getPlayersFromMatch(matchId) {
    if (USE_MOCK_DATA) {
        console.log(`Using mock data for match: ${matchId}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_MATCH_DATA.players;
    }

    // Try using the enhanced API service first
    if (deadlockAPI) {
        try {
            console.log(`Fetching match details using enhanced API for match: ${matchId}`);
            const matchData = await deadlockAPI.getMatchDetails(matchId);
            
            // Handle the actual API response structure
            const playerData = matchData?.match_info?.players || matchData?.match?.players || matchData?.players;
            if (playerData && playerData.length > 0) {
                const playerPromises = [];
                
                for (let i = 0; i < playerData.length; i++) {
                    const player = playerData[i];
                    
                    if (player.account_id) {
                        playerPromises.push(
                            (async () => {
                                const steamName = await getSteamProfileName(player.account_id);
                                return {
                                    steamId: player.account_id.toString(),
                                    displayName: steamName || player.player_name || `ID: ${player.account_id}`,
                                    team: player.team === 0 ? 1 : 2,
                                    slot: player.player_slot,
                                    heroId: player.hero_id,
                                    // Additional stats from enhanced API if available
                                    kills: player.kills,
                                    deaths: player.deaths,
                                    assists: player.assists,
                                    kda: player.kda,
                                    damagePerMinute: player.damagePerMinute,
                                    healingPerMinute: player.healingPerMinute,
                                    netWorthPerMinute: player.netWorthPerMinute,
                                    playerDamage: player.player_damage,
                                    healingOutput: player.healing_output,
                                    netWorth: player.net_worth
                                };
                            })()
                        );
                    }
                }
                
                const players = await Promise.all(playerPromises);
                console.log(`Successfully fetched ${players.length} players with enhanced data`);
                return players;
            }
        } catch (error) {
            console.warn('Enhanced API failed, falling back to legacy API:', error.message);
        }
    }

    console.log(`Fetching players for match: ${matchId}`);
    
    try {
        const response = await fetch(`${API_BASE_URL}/matches/${matchId}/metadata`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Parse the Deadlock API response structure
        const matchData = data.match_info || data.match || data;
        const players = [];
        
        // Extract players from the match data
        if (matchData.players && Array.isArray(matchData.players)) {
            const playerPromises = [];
            
            for (let i = 0; i < matchData.players.length; i++) {
                const player = matchData.players[i];
                
                // Only add players with valid account IDs
                if (player.account_id) {
                    playerPromises.push(
                        (async () => {
                            const steamName = await getSteamProfileName(player.account_id);
                            return {
                                steamId: player.account_id.toString(),
                                displayName: steamName || player.player_name || `ID: ${player.account_id}`,
                                team: player.team === 0 ? 1 : 2, // API uses 0 and 1, convert to 1 and 2
                                slot: player.player_slot,
                                heroId: player.hero_id || player.heroId
                            };
                        })()
                    );
                }
            }
            
            // Wait for all Steam profile names to be fetched
            const resolvedPlayers = await Promise.all(playerPromises);
            players.push(...resolvedPlayers);
        }
        
        if (players.length > 0) {
            console.log(`Successfully fetched ${players.length} players from API`);
            return players;
        }
        
        throw new Error('No players found in response');
        
    } catch (error) {
        console.warn(`Failed to fetch from API:`, error.message);
        console.log('API failed, using mock data');
        return MOCK_MATCH_DATA.players;
    }
}

async function getPlayerStats(playerId) {
    if (USE_MOCK_DATA) {
        console.log(`Using mock data for player: ${playerId}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        const matches = MOCK_PLAYER_MATCHES[playerId] || [];
        const total = matches.length;
        if (total === 0) return { steamId: playerId, total: 0, winRate: 0 };
       
        const wins = matches.filter(m => m.won).length;
        const winRate = total > 0 ? (wins / total) * 100 : 0;
       
        return { steamId: playerId, total, winRate: parseFloat(winRate.toFixed(1)) };
    }

    // Try using the enhanced API service first
    if (deadlockAPI) {
        try {
            console.log(`Fetching player stats using enhanced API for player: ${playerId}`);
            const playerData = await deadlockAPI.getPlayerMatchHistory(playerId, 50);
            
            if (playerData && playerData.statistics) {
                const stats = playerData.statistics;
                return {
                    steamId: playerId,
                    total: stats.totalMatches,
                    winRate: stats.winRate,
                    // Additional stats from enhanced API
                    averageKDA: stats.averageKDA,
                    averageKills: stats.averageKills,
                    averageDeaths: stats.averageDeaths,
                    averageAssists: stats.averageAssists,
                    recentForm: stats.recentForm,
                    heroStats: stats.heroStats
                };
            }
        } catch (error) {
            console.warn('Enhanced API failed, falling back to legacy API:', error.message);
        }
    }

    console.log(`Fetching matches for player: ${playerId}`);
    
    try {
        // Small delay to prevent overwhelming API
        if (requestCount > 0) {
            await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
        }
        requestCount++;
        
        const response = await fetch(`${API_BASE_URL}/players/${playerId}/match-history`);
        if (!response.ok) {
            if (response.status === 429) {
                // Rate limited - just return mock data silently
                console.warn(`Rate limited for player ${playerId}, using fallback data`);
                const matches = MOCK_PLAYER_MATCHES[playerId] || Array.from({ length: Math.floor(Math.random() * 30) + 20 }, () => ({ won: Math.random() > 0.5 }));
                const total = matches.length;
                const wins = matches.filter(m => m.won).length;
                const winRate = total > 0 ? (wins / total) * 100 : 0;
                return { steamId: playerId, total, winRate: parseFloat(winRate.toFixed(1)) };
            }
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }
        
        const data = await response.json();
        
        // Handle Deadlock API response structure
        const matches = Array.isArray(data) ? data : (data.matches || data.data || []);
        const total = Math.min(matches.length, 50); // Limit to last 50 matches
        
        if (total === 0) {
            return { steamId: playerId, total: 0, winRate: 0 };
        }
        
        // Take only the last 50 matches and count wins
        const recentMatches = matches.slice(0, 50);
        const wins = recentMatches.filter(m => m.match_result === 1).length;
        const winRate = total > 0 ? (wins / total) * 100 : 0;
        
        console.log(`Player ${playerId}: ${wins}/${total} wins (${winRate.toFixed(1)}%)`);
        return { steamId: playerId, total, winRate: parseFloat(winRate.toFixed(1)) };
        
    } catch (error) {
        console.warn(`Failed to fetch player stats from API:`, error.message);
        console.log(`API failed for player ${playerId}, using mock data`);
        const matches = MOCK_PLAYER_MATCHES[playerId] || [];
        const total = matches.length;
        if (total === 0) return { steamId: playerId, total: 0, winRate: 0 };
       
        const wins = matches.filter(m => m.won).length;
        const winRate = total > 0 ? (wins / total) * 100 : 0;
       
        return { steamId: playerId, total, winRate: parseFloat(winRate.toFixed(1)) };
    }
}