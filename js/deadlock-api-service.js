/**
 * DeadlockAPIService - Enhanced API service using official Deadlock API endpoints
 * Provides comprehensive access to match data, player profiles, leaderboards, and assets
 */
class DeadlockAPIService {
    constructor() {
        // Use v1 endpoints which are actually available
        this.baseUrl = 'https://api.deadlock-api.com/v1';
        this.assetsUrl = 'https://assets.deadlock-api.com';
        // No CORS proxy needed - API has proper CORS headers!
        this.headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.rateLimitDelay = 1000; // 1 second between requests (reduced for testing)
        this.lastRequestTime = 0;
    }

    /**
     * Generic fetch wrapper with error handling and caching
     */
    async fetchWithCache(url, options = {}) {
        
        const cacheKey = url;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        // Rate limiting
        const timeSinceLastRequest = Date.now() - this.lastRequestTime;
        if (timeSinceLastRequest < this.rateLimitDelay) {
            const waitTime = this.rateLimitDelay - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        this.lastRequestTime = Date.now();

        try {
            // Direct API call - no CORS proxy needed!
            // The API has proper CORS headers (Access-Control-Allow-Origin: *)
            const response = await fetch(url, {
                ...options,
                headers: this.headers
            });


            if (!response.ok) {
                // Check for rate limit error
                if (response.status === 429) {
                    await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
                }
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            // Cache successful responses
            this.cache.set(cacheKey, {
                data: data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get detailed match information including all player stats
     * @param {string} matchId - The match ID
     * @returns {Promise<Object>} Complete match details
     */
    async getMatchDetails(matchId) {
        // Use the metadata endpoint which is actually available
        const url = `${this.baseUrl}/matches/${matchId}/metadata`;
        const data = await this.fetchWithCache(url);
        
        // Transform match data to include additional calculated stats
        if (data && data.match_info && data.match_info.players) {
            data.match_info.players = data.match_info.players.map(player => ({
                ...player,
                kda: this.calculateKDA(player.kills, player.deaths, player.assists),
                damagePerMinute: this.calculatePerMinute(player.player_damage, data.match_info.duration_s),
                healingPerMinute: this.calculatePerMinute(player.healing_output, data.match_info.duration_s),
                netWorthPerMinute: this.calculatePerMinute(player.net_worth, data.match_info.duration_s)
            }));
        }
        
        return data;
    }

    /**
     * Get comprehensive player profile with statistics
     * @param {string} playerId - The player's Steam ID
     * @returns {Promise<Object>} Player profile data
     */
    async getPlayerProfile(playerId) {
        const url = `${this.baseUrl}/players/${playerId}`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get player match history with pagination
     * @param {string} playerId - The player's Steam ID
     * @param {number} limit - Number of matches to fetch (default: 50)
     * @param {number} offset - Offset for pagination (default: 0)
     * @param {boolean} onlyStoredHistory - Use ClickHouse stored data to bypass rate limits (default: true)
     * @returns {Promise<Object>} Player match history
     */
    async getPlayerMatchHistory(playerId, limit = 50, offset = 0, onlyStoredHistory = true) {
        let url = `${this.baseUrl}/players/${playerId}/match-history?limit=${limit}&offset=${offset}`;
        
        // Add only_stored_history parameter to bypass rate limiting
        if (onlyStoredHistory) {
            url += '&only_stored_history=true';
        }
        
        const data = await this.fetchWithCache(url);
        
        // Handle both array and object response formats
        const matches = Array.isArray(data) ? data : (data.matches || []);
        
        // Calculate additional statistics
        if (matches.length > 0) {
            const stats = this.calculatePlayerStats(matches);
            
            // Return consistent format
            return {
                matches: matches,
                statistics: stats,
                totalMatches: matches.length,
                matchesAnalyzed: Math.min(matches.length, limit)
            };
        }
        
        return data;
    }

    /**
     * Get match metadata including all player information
     * @param {string} matchId - The match ID
     * @returns {Promise<Object>} Match metadata with player details
     */
    async getMatchMetadata(matchId) {
        const url = `${this.baseUrl}/matches/${matchId}/metadata`;
        const data = await this.fetchWithCache(url);
        
        if (data && data.match_info && data.match_info.players) {
            // Extract player IDs and basic info
            const players = data.match_info.players.map((player, index) => {
                // More robust stats extraction
                const finalStats = player.stats && player.stats.length > 0 
                    ? player.stats[player.stats.length - 1] 
                    : player; // Fallback to player object itself if no stats array
                
                const playerData = {
                    accountId: player.account_id,
                    playerSlot: player.player_slot,
                    team: player.player_slot <= 6 ? 0 : 1, // Fix: API uses 1-12, so slots 1-6 = team 0, slots 7-12 = team 1
                    heroId: player.hero_id,
                    kills: finalStats.kills || player.kills || 0,
                    deaths: finalStats.deaths || player.deaths || 0,
                    assists: finalStats.assists || player.assists || 0,
                    netWorth: finalStats.net_worth || player.net_worth || 0,
                    lastHits: finalStats.creep_kills || player.last_hits || 0,
                    denies: finalStats.denies || player.denies || 0,
                    heroLevel: finalStats.level || player.level || 0,
                    // Add player damage and healing
                    playerDamage: finalStats.player_damage || player.player_damage || 0,
                    healingOutput: finalStats.healing_output || player.healing_output || 0
                };
                return playerData;
            });
            
            data.playersSummary = players;
            
        }
        
        return data;
    }

    /**
     * Get leaderboard data
     * @param {string} region - Region code (optional)
     * @param {number} limit - Number of entries (default: 100)
     * @returns {Promise<Object>} Leaderboard data
     */
    async getLeaderboard(region = null, limit = 100) {
        let url = `${this.baseUrl}/leaderboard?limit=${limit}`;
        if (region) {
            url += `&region=${region}`;
        }
        return await this.fetchWithCache(url);
    }

    /**
     * Get statistics for all players in a match
     * @param {string} matchId - The match ID
     * @param {number} matchHistoryLimit - Number of past matches to analyze per player (default: 50)
     * @returns {Promise<Object>} All players' statistics from the match
     */
    async getAllPlayersFromMatch(matchId, matchHistoryLimit = 50) {
        try {
            // First get match metadata to get all player IDs
            const matchData = await this.getMatchMetadata(matchId);
            
            if (!matchData || !matchData.playersSummary) {
                throw new Error('Could not retrieve match data');
            }
            
            const players = matchData.playersSummary;
            
            const allPlayerStats = [];
            
            // Fetch stats for each player with minimal delay
            for (let i = 0; i < players.length; i++) {
                const player = players[i];
                
                try {
                    const playerStats = await this.getPlayerMatchHistory(
                        player.accountId, 
                        matchHistoryLimit, 
                        0, 
                        true // Use only_stored_history to bypass rate limits
                    );
                    
                    allPlayerStats.push({
                        ...player,
                        statistics: playerStats.statistics,
                        totalGames: playerStats.totalMatches
                    });
                    
                    // Small delay to be polite to the server
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                    allPlayerStats.push({
                        ...player,
                        error: error.message
                    });
                }
            }
            
            const result = {
                matchId,
                matchInfo: matchData.match_info,
                players: allPlayerStats,
                teams: {
                    team0: allPlayerStats.filter(p => p.team === 0),
                    team1: allPlayerStats.filter(p => p.team === 1)
                }
            };
            
            return result;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Get hero/build information
     * @param {string} heroId - The hero ID
     * @returns {Promise<Object>} Hero build data
     */
    async getHeroBuild(heroId) {
        const url = `${this.baseUrl}/builds/${heroId}`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get analytics data
     * @param {Object} params - Query parameters for analytics
     * @returns {Promise<Object>} Analytics data
     */
    async getAnalytics(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = `${this.baseUrl}/analytics${queryString ? '?' + queryString : ''}`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get hero asset URL
     * @param {string} heroId - The hero ID
     * @param {string} assetType - Type of asset (icon, portrait, ability)
     * @returns {string} Asset URL
     */
    getHeroAssetUrl(heroId, assetType = 'icon') {
        return `${this.assetsUrl}/heroes/${heroId}/${assetType}.png`;
    }

    /**
     * Get item asset URL
     * @param {string} itemId - The item ID
     * @returns {string} Asset URL
     */
    getItemAssetUrl(itemId) {
        return `${this.assetsUrl}/items/${itemId}.png`;
    }

    /**
     * Calculate KDA ratio
     */
    calculateKDA(kills, deaths, assists) {
        const kda = deaths === 0 ? kills + assists : (kills + assists) / deaths;
        return Math.round(kda * 100) / 100;
    }

    /**
     * Calculate per-minute statistics
     */
    calculatePerMinute(value, durationSeconds) {
        if (!durationSeconds || durationSeconds === 0) return 0;
        const minutes = durationSeconds / 60;
        return Math.round((value / minutes) * 10) / 10;
    }

    /**
     * Calculate player statistics from match history
     */
    calculatePlayerStats(matches) {
        if (!matches || matches.length === 0) return null;

        const stats = {
            totalMatches: matches.length,
            wins: 0,
            losses: 0,
            winRate: 0,
            averageKills: 0,
            averageDeaths: 0,
            averageAssists: 0,
            averageKDA: 0,
            heroStats: {},
            recentForm: []
        };

        let totalKills = 0;
        let totalDeaths = 0;
        let totalAssists = 0;

        matches.forEach((match, index) => {
            // Support both API response formats
            const kills = match.player_kills || match.kills || 0;
            const deaths = match.player_deaths || match.deaths || 0;
            const assists = match.player_assists || match.assists || 0;
            const matchResult = match.match_result;
            const heroId = match.hero_id;
            
            // Win/loss tracking
            if (matchResult === 1) {
                stats.wins++;
            } else {
                stats.losses++;
            }

            // Recent form (last 10 matches)
            if (index < 10) {
                stats.recentForm.push(matchResult === 1 ? 'W' : 'L');
            }

            // KDA tracking
            totalKills += kills;
            totalDeaths += deaths;
            totalAssists += assists;

            // Hero-specific stats
            if (heroId) {
                if (!stats.heroStats[heroId]) {
                    stats.heroStats[heroId] = {
                        matches: 0,
                        wins: 0,
                        losses: 0,
                        winRate: 0,
                        totalKills: 0,
                        totalDeaths: 0,
                        totalAssists: 0
                    };
                }
                
                stats.heroStats[heroId].matches++;
                if (matchResult === 1) {
                    stats.heroStats[heroId].wins++;
                } else {
                    stats.heroStats[heroId].losses++;
                }
                stats.heroStats[heroId].totalKills += kills;
                stats.heroStats[heroId].totalDeaths += deaths;
                stats.heroStats[heroId].totalAssists += assists;
            }
        });

        // Calculate averages
        stats.winRate = Math.round((stats.wins / stats.totalMatches) * 100);
        stats.averageKills = Math.round((totalKills / stats.totalMatches) * 10) / 10;
        stats.averageDeaths = Math.round((totalDeaths / stats.totalMatches) * 10) / 10;
        stats.averageAssists = Math.round((totalAssists / stats.totalMatches) * 10) / 10;
        stats.averageKDA = this.calculateKDA(totalKills, totalDeaths, totalAssists);

        // Calculate hero win rates
        Object.keys(stats.heroStats).forEach(heroId => {
            const heroStat = stats.heroStats[heroId];
            heroStat.winRate = Math.round((heroStat.wins / heroStat.matches) * 100);
            heroStat.averageKDA = this.calculateKDA(
                heroStat.totalKills,
                heroStat.totalDeaths,
                heroStat.totalAssists
            );
        });

        return stats;
    }

    /**
     * Clear the cache
     */
    clearCache() {
        this.cache.clear();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeadlockAPIService;
}