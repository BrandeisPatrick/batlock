/**
 * DeadlockAPIService - Enhanced API service using official Deadlock API endpoints
 * Provides comprehensive access to match data, player profiles, leaderboards, and assets
 */
class DeadlockAPIService {
    constructor() {
        // Use v1 endpoints which are actually available
        this.baseUrl = 'https://api.deadlock-api.com/v1';
        this.assetsUrl = 'https://assets.deadlock-api.com';
        // Use CORS proxy for browser requests
        this.corsProxy = 'https://api.allorigins.win/raw?url=';
        this.headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.rateLimitDelay = 12000; // 12 seconds between requests to avoid rate limit
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
            await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
        }
        this.lastRequestTime = Date.now();

        try {
            // Use CORS proxy for browser requests
            const proxiedUrl = `${this.corsProxy}${encodeURIComponent(url)}`;
            const response = await fetch(proxiedUrl, {
                ...options,
                headers: this.headers
            });

            if (!response.ok) {
                // Check for rate limit error
                if (response.status === 429) {
                    console.warn('Rate limit hit, waiting before retry...');
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
            console.error('API fetch error:', error);
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
     * @returns {Promise<Object>} Player match history
     */
    async getPlayerMatchHistory(playerId, limit = 50, offset = 0) {
        const url = `${this.baseUrl}/players/${playerId}/match-history?limit=${limit}&offset=${offset}`;
        const data = await this.fetchWithCache(url);
        
        // Calculate additional statistics
        if (data && data.matches) {
            const stats = this.calculatePlayerStats(data.matches);
            data.statistics = stats;
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
            // Win/loss tracking
            if (match.match_result === 1) {
                stats.wins++;
            } else {
                stats.losses++;
            }

            // Recent form (last 10 matches)
            if (index < 10) {
                stats.recentForm.push(match.match_result === 1 ? 'W' : 'L');
            }

            // KDA tracking
            totalKills += match.kills || 0;
            totalDeaths += match.deaths || 0;
            totalAssists += match.assists || 0;

            // Hero-specific stats
            const heroId = match.hero_id;
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
                if (match.match_result === 1) {
                    stats.heroStats[heroId].wins++;
                } else {
                    stats.heroStats[heroId].losses++;
                }
                stats.heroStats[heroId].totalKills += match.kills || 0;
                stats.heroStats[heroId].totalDeaths += match.deaths || 0;
                stats.heroStats[heroId].totalAssists += match.assists || 0;
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