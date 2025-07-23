/**
 * Player Search Module - Handle player search functionality for Deadlock Match Analyzer
 */

import DeadlockAPIService from './deadlock-api-service.js';
import { getHeroName, getHeroColor } from '../hero_mapping/hero-mappings.js';

class PlayerSearch {
    constructor() {
        this.deadlockAPI = new DeadlockAPIService();
        this.playerCache = new Map(); // Cache player name -> account ID mappings
        this.matchCache = new Map(); // Cache account ID -> recent matches (5 min TTL)
        this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Parse Steam input to extract vanity URL or Steam ID
     */
    parsePlayerInput(input) {
        const trimmed = input.trim();
        
        // Check if it's a full Steam profile URL
        const steamProfileRegex = /steamcommunity\.com\/(id|profiles)\/([^\/\?]+)/i;
        const match = trimmed.match(steamProfileRegex);
        
        if (match) {
            const [, type, identifier] = match;
            if (type === 'id') {
                // Vanity URL (e.g., steamcommunity.com/id/vanityName/)
                return { type: 'vanity', value: identifier };
            } else if (type === 'profiles') {
                // Direct SteamID64 (e.g., steamcommunity.com/profiles/76561198148166542/)
                return { type: 'steamid64', value: identifier };
            }
        }
        
        // Check if it looks like a Steam ID 64 (17 digits starting with 7656119)
        if (/^7656119\d{10}$/.test(trimmed)) {
            return { type: 'steamid64', value: trimmed };
        }
        
        // Process username/vanity URL
        let processedValue = trimmed;
        
        // Remove common URL prefixes if user pasted them accidentally
        processedValue = processedValue.replace(/^https?:\/\/(www\.)?steamcommunity\.com\/(id\/)?/i, '');
        
        // Otherwise, treat as vanity URL that needs resolution
        return { type: 'vanity', value: processedValue };
    }

    /**
     * Search for a player using Steam profile URL or vanity name
     */
    async searchPlayer(query) {
        try {
            const parsed = this.parsePlayerInput(query);
            const cacheKey = `${parsed.type}:${parsed.value}`;

            if (this.playerCache.has(cacheKey)) {
                const cached = this.playerCache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.CACHE_TTL) {
                    return cached.data;
                }
            }

            let steamResponse;
            let steamId64 = null;

            // If we have a direct SteamID64, use it directly
            if (parsed.type === 'steamid64') {
                steamId64 = parsed.value;
                console.log('Using direct SteamID64:', steamId64);
                
                // Get Steam profile info
                const response = await fetch(`/api/steam-user?steamids=${encodeURIComponent(steamId64)}`);
                if (response.ok) {
                    steamResponse = await response.json();
                    if (steamResponse.response && steamResponse.response.players && steamResponse.response.players.length > 0) {
                        steamResponse.playerData = steamResponse.response.players[0];
                        steamResponse.resolved = true;
                        steamResponse.steamid = steamId64;
                        steamResponse.deadlockAccountId = steamId64; // Use SteamID64 for Deadlock API calls
                    }
                }
            }
            // For vanity URLs, resolve to SteamID64 first
            else if (parsed.type === 'vanity') {
                console.log('Resolving vanity URL:', parsed.value);
                
                try {
                    // Step 1: Resolve vanity URL to SteamID64
                    const vanityResponse = await fetch(`/api/steam-user?vanityurl=${encodeURIComponent(parsed.value)}`);
                    if (vanityResponse.ok) {
                        const vanityData = await vanityResponse.json();
                        if (vanityData.resolved && vanityData.steamid) {
                            steamId64 = vanityData.steamid;
                            console.log('Resolved vanity URL to SteamID64:', steamId64);
                            
                            // Step 2: Get Steam profile info
                            const profileResponse = await fetch(`/api/steam-user?steamids=${steamId64}`);
                            if (profileResponse.ok) {
                                steamResponse = await profileResponse.json();
                                if (steamResponse.response && steamResponse.response.players && steamResponse.response.players.length > 0) {
                                    steamResponse.playerData = steamResponse.response.players[0];
                                    steamResponse.resolved = true;
                                    steamResponse.steamid = steamId64;
                                    steamResponse.deadlockAccountId = steamId64; // Use SteamID64 for Deadlock API calls
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.warn('Vanity URL resolution failed:', error);
                }
            }

            // If all searches failed, throw error
            if (!steamResponse || !steamResponse.resolved || !steamId64) {
                throw new Error(`Steam profile "${query}" not found. Please check the profile URL or vanity name and try again.`);
            }

            // Store the resolved SteamID64 for future use
            steamResponse.steamId64 = steamId64;

            this.playerCache.set(cacheKey, {
                data: steamResponse,
                timestamp: Date.now()
            });

            return steamResponse;

        } catch (error) {
            console.error('Player search error:', error);
            throw error;
        }
    }

    /**
     * Fetch recent matches for a player using SteamID64
     * Since the Deadlock API doesn't have direct player match endpoints,
     * we'll use the existing DeadlockAPIService method which uses match history
     */
    async fetchPlayerRecentMatches(steamId64, limit = 5) {
        try {
            // Check cache first
            const cacheKey = `matches:${steamId64}`;
            if (this.matchCache.has(cacheKey)) {
                const cached = this.matchCache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.CACHE_TTL) {
                    return cached.data;
                }
            }
            
            console.log(`Fetching recent matches for SteamID64: ${steamId64}`);
            
            // Convert SteamID64 to account ID for Deadlock API
            // SteamID64 to Account ID: subtract 76561197960265728
            const accountId = BigInt(steamId64) - BigInt('76561197960265728');
            console.log(`Converted to account ID: ${accountId}`);
            
            // Call the Deadlock API directly since we know the correct endpoint format
            const matchHistoryUrl = `https://api.deadlock-api.com/v1/players/${accountId}/match-history`;
            console.log('Fetching from:', matchHistoryUrl);
            
            const response = await fetch(matchHistoryUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch match history: ${response.status} ${response.statusText}`);
            }
            
            const matchData = await response.json();
            console.log('Match history response:', matchData);
            
            if (!Array.isArray(matchData)) {
                throw new Error('Invalid match history response format');
            }
            
            // Process matches with the correct API response format
            const validMatches = matchData
                .filter(match => match.match_id && match.match_id !== '0')
                .slice(0, limit) // Get top matches based on limit
                .map(match => ({
                    matchId: match.match_id,
                    heroId: match.hero_id,
                    heroName: getHeroName(match.hero_id),
                    heroColor: getHeroColor(match.hero_id),
                    kills: match.player_kills || 0,
                    deaths: match.player_deaths || 0,
                    assists: match.player_assists || 0,
                    result: match.match_result === 1 ? 'win' : 'loss',
                    startTime: new Date(match.start_time * 1000).toISOString(),
                    duration: match.match_duration_s || 0,
                    playerDamage: 0, // Not available in this endpoint
                    netWorth: match.net_worth || 0,
                    lastHits: match.last_hits || 0
                }))
                .sort((a, b) => new Date(b.startTime) - new Date(a.startTime)); // Sort by most recent
            
            const result = {
                matches: validMatches,
                totalMatches: matchData.length,
                statistics: this.calculateBasicStats(validMatches)
            };
            
            // Cache the result
            this.matchCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });
            
            console.log(`Successfully processed ${validMatches.length} matches`);
            return result;
            
        } catch (error) {
            console.error('Error fetching player matches:', error);
            throw error;
        }
    }

    /**
     * Calculate basic statistics from match data
     */
    calculateBasicStats(matches) {
        if (!matches || matches.length === 0) {
            return {
                winRate: 0,
                averageKDA: 0,
                averageKills: 0,
                averageDamage: 0
            };
        }

        const wins = matches.filter(m => m.result === 'win').length;
        const totalKills = matches.reduce((sum, m) => sum + (m.kills || 0), 0);
        const totalDeaths = matches.reduce((sum, m) => sum + (m.deaths || 0), 0);
        const totalAssists = matches.reduce((sum, m) => sum + (m.assists || 0), 0);
        const totalDamage = matches.reduce((sum, m) => sum + (m.playerDamage || 0), 0);

        return {
            winRate: Math.round((wins / matches.length) * 100),
            averageKDA: totalDeaths > 0 ? Math.round(((totalKills + totalAssists) / totalDeaths) * 100) / 100 : totalKills + totalAssists,
            averageKills: Math.round((totalKills / matches.length) * 10) / 10,
            averageDamage: Math.round(totalDamage / matches.length)
        };
    }

    /**
     * Create HTML for a match tab
     */
    createMatchTab(matchData, index, isActive = false) {
        const heroImageUrl = `/downloads/hero_thumbnails/hero_${matchData.heroName?.toLowerCase() || 'unknown'}.png`;
        const kda = `${matchData.kills}/${matchData.deaths}/${matchData.assists}`;
        const resultClass = matchData.result === 'win' ? 'win-indicator' : 'loss-indicator';
        const resultIcon = matchData.result === 'win' ? '🏆' : '💀';
        const activeClass = isActive ? 'active' : '';
        
        // Format start time
        const matchDate = new Date(matchData.startTime);
        const timeAgo = this.getTimeAgo(matchDate);
        
        return `
            <div class="match-tab ${activeClass}" data-match-id="${matchData.matchId}" data-index="${index}">
                <div class="tab-hero-section">
                    <div class="tab-hero-icon" style="border-color: ${matchData.heroColor};">
                        <img src="${heroImageUrl}" alt="${matchData.heroName}" 
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="hero-fallback" style="display: none;">
                            <span>${matchData.heroName?.substring(0, 2) || '?'}</span>
                        </div>
                    </div>
                    <div class="tab-match-info">
                        <div class="tab-hero-name">${matchData.heroName || 'Unknown'}</div>
                        <div class="tab-match-time">${timeAgo}</div>
                    </div>
                </div>
                
                <div class="tab-stats-section">
                    <div class="tab-kda">${kda}</div>
                    <div class="tab-result ${resultClass}">
                        ${resultIcon} ${matchData.result?.toUpperCase() || 'N/A'}
                    </div>
                </div>
                
                <div class="tab-click-indicator">
                    <i class="fas fa-chevron-right"></i>
                </div>
            </div>
        `;
    }

    /**
     * Render player search results
     */
    renderPlayerSearchResults(playerData, matchHistory) {
        const playerInfoCard = document.getElementById('playerInfoCard');
        const matchTabsWrapper = document.getElementById('matchTabsWrapper');
        const playerSearchResults = document.getElementById('playerSearchResults');
        
        if (!playerInfoCard || !matchTabsWrapper || !playerSearchResults) {
            throw new Error('Required DOM elements not found');
        }
        
        // Create player info card
        const steamProfile = playerData.playerData || {};
        const stats = matchHistory.statistics || {};
        
        playerInfoCard.innerHTML = `
            <div class="flex items-center space-x-4 mb-4">
                <div class="player-avatar">
                    <img src="${steamProfile.avatarfull || steamProfile.avatarmedium || '/defaults/default-avatar.png'}" 
                         alt="Player Avatar" class="w-16 h-16 rounded-lg">
                </div>
                <div class="flex-1">
                    <h3 class="text-xl font-bold text-white">${steamProfile.personaname || 'Unknown Player'}</h3>
                    <p class="text-gray-400">Steam ID: ${playerData.steamId64 || playerData.steamid}</p>
                    <p class="text-gray-400">Profile: <a href="https://steamcommunity.com/profiles/${playerData.steamId64 || playerData.steamid}" target="_blank" class="text-blue-400 hover:underline">View Steam Profile</a></p>
                </div>
                <div class="text-right">
                    <div class="text-2xl font-bold text-cyan-400">${matchHistory.totalMatches || 0}</div>
                    <div class="text-xs text-gray-400">Total Games</div>
                </div>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div class="bg-gray-700/50 rounded-lg p-3">
                    <div class="text-lg font-bold text-green-400">${stats.winRate || 0}%</div>
                    <div class="text-xs text-gray-400">Win Rate</div>
                </div>
                <div class="bg-gray-700/50 rounded-lg p-3">
                    <div class="text-lg font-bold text-blue-400">${stats.averageKDA || 0}</div>
                    <div class="text-xs text-gray-400">Avg KDA</div>
                </div>
                <div class="bg-gray-700/50 rounded-lg p-3">
                    <div class="text-lg font-bold text-yellow-400">${stats.averageKills || 0}</div>
                    <div class="text-xs text-gray-400">Avg Kills</div>
                </div>
                <div class="bg-gray-700/50 rounded-lg p-3">
                    <div class="text-lg font-bold text-purple-400">${this.formatNumber(stats.averageDamage || 0)}</div>
                    <div class="text-xs text-gray-400">Avg Damage</div>
                </div>
            </div>
        `;
        
        // Create match tabs
        if (matchHistory.matches && matchHistory.matches.length > 0) {
            const tabsHTML = matchHistory.matches
                .map((match, index) => this.createMatchTab(match, index, index === 0))
                .join('');
            
            matchTabsWrapper.innerHTML = tabsHTML;
            
            // Add click event listeners to tabs
            const matchTabs = matchTabsWrapper.querySelectorAll('.match-tab');
            matchTabs.forEach(tab => {
                tab.addEventListener('click', (e) => {
                    // Remove active class from all tabs
                    matchTabs.forEach(t => t.classList.remove('active'));
                    // Add active class to clicked tab
                    tab.classList.add('active');
                    
                    // Get match ID and trigger match analysis
                    const matchId = tab.dataset.matchId;
                    if (matchId && window.handleMatchFromTab) {
                        window.handleMatchFromTab(matchId);
                    }
                });
            });
        } else {
            matchTabsWrapper.innerHTML = `
                <div class="text-center py-8 text-gray-400">
                    <p>No recent matches found for this player.</p>
                    <p class="text-sm mt-2">The player may not have played recently or their match history is private.</p>
                </div>
            `;
        }
        
        // Show the results section
        playerSearchResults.classList.remove('hidden');
        
        // Scroll to results
        playerSearchResults.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Format numbers for display
     */
    formatNumber(num) {
        if (typeof num !== 'number' || isNaN(num)) return '0';
        
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1).replace('.0', '') + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1).replace('.0', '') + 'K';
        }
        return Math.round(num).toString();
    }

    /**
     * Get human-readable time ago string
     */
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 60) {
            return `${diffMins}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else {
            return `${diffDays}d ago`;
        }
    }

    /**
     * Clear all caches
     */
    clearCache() {
        this.playerCache.clear();
        this.matchCache.clear();
    }
}

// Export the class
export default PlayerSearch;

// Also create a singleton instance for easy access
export const playerSearch = new PlayerSearch();