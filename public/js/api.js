import API_CONFIG from '../config/api-config.js';
import DeadlockAPIService from './deadlock-api-service.js';

// Simple request tracking
let requestCount = 0;
const REQUEST_DELAY = 200; // Small delay to prevent overwhelming the API

// Initialize the new enhanced API service
let deadlockAPI = new DeadlockAPIService();

// Steam Profile Name Fetching (using Vercel serverless function)
async function getSteamProfileName(steamId) {
    try {
        // Convert 32-bit account ID to 64-bit Steam ID
        const steamId64 = (BigInt(steamId) + BigInt('76561197960265728')).toString();
        
        // Use Vercel serverless function instead of CORS proxy
        const response = await fetch(`/api/steam-user?steamids=${steamId64}`);
        
        if (!response.ok) {
            // If it's a 500 error, it might be API key not configured
            if (response.status === 500) {
                const errorData = await response.json().catch(() => ({}));
                if (errorData.error?.includes('API key not configured')) {
                    // Steam API key not configured in Vercel, return null silently
                    return null;
                }
            }
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.response && data.response.players && data.response.players.length > 0) {
            return data.response.players[0].personaname;
        }
        
        return null;
    } catch (error) {
        // Fallback silently for better UX - will show account ID instead
        return null;
    }
}

// API Fetching Functions
async function getPlayersFromMatch(matchId) {
    if (API_CONFIG.features.useMockData) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_MATCH_DATA.players;
    }

    // Try using the enhanced API service first
    if (deadlockAPI) {
        try {
            const matchData = await deadlockAPI.getMatchMetadata(matchId);
            
            // Handle the actual API response structure
            const playerData = matchData?.match_info?.players || matchData?.playersSummary;
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
                                    team: player.team,
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
                return players;
            }
        } catch (error) {
            console.error("Error in getPlayersFromMatch:", error);
            throw error; // Rethrow the error if the enhanced API fails
        }
    }
}

async function getPlayerStats(playerId) {
    if (API_CONFIG.features.useMockData) {
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
            // Use only_stored_history=true to bypass rate limits
            const playerData = await deadlockAPI.getPlayerMatchHistory(playerId, 50, 0, true);
            
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
                    kdaStdDev: stats.kdaStdDev,
                    recentForm: stats.recentForm,
                    heroStats: stats.heroStats,
                    matchesAnalyzed: playerData.matchesAnalyzed
                };
            }
        } catch (error) {
            console.error("Error in getPlayerStats:", error);
            throw error; // Rethrow the error if the enhanced API fails
        }
    }
}

// Make global API functions available
window.getSteamProfileName = getSteamProfileName;
window.getPlayersFromMatch = getPlayersFromMatch;
window.getPlayerStats = getPlayerStats;
window.deadlockAPI = deadlockAPI;