/**
 * DeadlockAPIService - Enhanced API service using official Deadlock API endpoints
 * Provides comprehensive access to match data, player profiles, leaderboards, and assets
 */

// Import hero mappings for better asset handling
import { getHeroClassName, getHeroName } from '../hero_mapping/hero-mappings.js';

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
     * Fetch Steam profile names for players
     */
    async fetchSteamNames(players) {
        const playersWithNames = [];
        
        for (const player of players) {
            const playerCopy = { ...player };
            
            try {
                // Convert 32-bit account ID to 64-bit Steam ID
                const steamId64 = (BigInt(player.accountId) + BigInt('76561197960265728')).toString();
                
                // Use Vercel serverless function
                const response = await fetch(`/api/steam-user?steamids=${steamId64}`);
                
                if (response.ok) {
                    const data = await response.json();
                    
                    if (data.response && data.response.players && data.response.players.length > 0) {
                        const steamPlayer = data.response.players[0];
                        playerCopy.displayName = steamPlayer.personaname;
                        playerCopy.steamName = steamPlayer.personaname;
                        console.log(`Fetched Steam name for ${player.accountId}: ${steamPlayer.personaname}`);
                    }
                }
            } catch (error) {
                console.log(`Could not fetch Steam name for ${player.accountId}:`, error);
            }
            
            playersWithNames.push(playerCopy);
        }
        
        return playersWithNames;
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
                    healingOutput: finalStats.healing_output || player.healing_output || 0,
                    // Add player name if available
                    playerName: player.player_name || player.name || null
                };
                return playerData;
            });
            
            data.playersSummary = players;
            
            // Fetch Steam names for all players
            console.log('Fetching Steam names for players...');
            data.playersSummary = await this.fetchSteamNames(players);
            
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
     * Get Steam user info from our serverless function
     * @param {string[]} steamIds - Array of Steam IDs
     * @returns {Promise<Object>} Steam user data
     */
    async getSteamUsers(steamIds) {
        // Use the serverless function to bypass CORS and hide API key
        const url = `/api/steam-user?steamids=${steamIds.join(',')}`;
        
        // This endpoint is not cached as it's a proxy
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Steam user API failed: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Failed to fetch Steam user data:", error);
            return null;
        }
    }

    /**
     * Get all hero data and cache it.
     * @returns {Promise<Object[]>} Array of hero data objects.
     */
    async getAllHeroes() {
        const url = `${this.assetsUrl}/v2/heroes`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get hero asset URL by hero ID
     * @param {number} heroId - The hero ID
     * @returns {Promise<string>} Asset URL for the hero's card image.
     */
    async getHeroCardAssetUrlById(heroId) {
        const heroClassName = getHeroClassName(heroId);
        if (!heroClassName) {
            console.warn(`Unknown hero ID: ${heroId}`);
            return null;
        }
        return await this.getHeroCardAssetUrl(heroClassName);
    }

    /**
     * Get hero asset URL by class name
     * @param {string} heroClassName - The hero's class name (e.g., 'hero_atlas' for Abrams)
     * @returns {Promise<string>} Asset URL for the hero's card image.
     */
    async getHeroCardAssetUrl(heroClassName) {
        try {
            const allHeroes = await this.getAllHeroes();
            const hero = allHeroes.find(h => h.class_name === heroClassName);
            
            if (hero && hero.images && hero.images.icon_hero_card) {
                return hero.images.icon_hero_card;
            }
            
            // Try alternative image properties if main one doesn't exist
            if (hero && hero.images) {
                const alternativeImages = [
                    hero.images.card,
                    hero.images.portrait,
                    hero.images.icon,
                    hero.images.thumbnail
                ];
                
                for (const imgUrl of alternativeImages) {
                    if (imgUrl) return imgUrl;
                }
            }
            
            // Extract slug from class name for fallback URL
            const slug = heroClassName.replace('hero_', '');
            return `${this.assetsUrl}/heroes/${slug}/card.png`;
            
        } catch (error) {
            console.warn(`Error fetching hero asset for ${heroClassName}:`, error);
            // Extract slug from class name for fallback URL
            const slug = heroClassName.replace('hero_', '');
            return `${this.assetsUrl}/heroes/${slug}/card.png`;
        }
    }

    /**
     * Get hero thumbnail URL with fallback strategy
     * Uses local hero thumbnails due to persistent API issues
     * @param {number} heroId - The hero ID
     * @returns {Promise<string|null>} - Image URL or null for text fallback
     */
    async getHeroThumbnailUrl(heroId) {
        // Skip API calls entirely due to persistent CORS issues
        // Use local thumbnails directly for better performance
        return this.getLocalHeroThumbnailUrl(heroId);
    }

    /**
     * Get local hero thumbnail URL by hero ID
     * @param {number} heroId - The hero ID to get thumbnail for
     * @returns {string|null} - Local thumbnail URL or null if not found
     */
    getLocalHeroThumbnailUrl(heroId) {
        const heroClassName = getHeroClassName(heroId);
        if (!heroClassName) {
            return null;
        }
        
        return `/downloads/hero_thumbnails/${heroClassName}.png`;
    }

    /**
     * Get hero asset URL by class name
     * @param {string} heroClassName - The hero's class name (e.g., 'hero_atlas' for Abrams)
     * @returns {Promise<string>} Asset URL for the hero's card image.
     */
    async getHeroCardAssetUrl(heroClassName) {
        try {
            const allHeroes = await this.getAllHeroes();
            const hero = allHeroes.find(h => h.class_name.toLowerCase() === heroClassName.toLowerCase()); // Case-insensitive comparison
            
            let imageUrl = null;

            if (hero && hero.images) {
                if (hero.images.icon_hero_card) {
                    imageUrl = hero.images.icon_hero_card;
                } else {
                    const alternativeImages = [
                        hero.images.card,
                        hero.images.portrait,
                        hero.images.icon,
                        hero.images.thumbnail
                    ];
                    
                    for (const imgUrl of alternativeImages) {
                        if (imgUrl) {
                            imageUrl = imgUrl;
                            break;
                        }
                    }
                }
            }
            
            // Fallback to constructed URL if no image found in API response
            if (!imageUrl) {
                const slug = heroClassName.replace('hero_', '');
                imageUrl = `${this.assetsUrl}/heroes/${slug}/card.png`;
            }
            
            console.log("Resolved hero image for", heroClassName, "->", imageUrl);
            return imageUrl;
            
        } catch (error) {
            console.warn(`Error fetching hero asset for ${heroClassName}:`, error);
            // Extract slug from class name for fallback URL
            const slug = heroClassName.replace('hero_', '');
            const fallbackUrl = `${this.assetsUrl}/heroes/${slug}/card.png`;
            console.log("Resolved hero image for", heroClassName, "->", fallbackUrl, "(from error fallback)");
            return fallbackUrl;
        }
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
            const matchResult = Number(match.match_result); // 1 = win, 0 = loss
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
export default DeadlockAPIService;