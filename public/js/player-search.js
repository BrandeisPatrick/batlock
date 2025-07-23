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
                // Vanity URL
                return { type: 'vanity', value: identifier };
            } else if (type === 'profiles') {
                // Steam ID 64
                return { type: 'steamid', value: identifier };
            }
        }
        
        // Check if it looks like a Steam ID 64 (17 digits starting with 7656119)
        if (/^7656119\d{10}$/.test(trimmed)) {
            return { type: 'steamid', value: trimmed };
        }
        
        // Otherwise, treat as vanity URL
        return { type: 'vanity', value: trimmed };
    }

    /**
     * Search for a player using Steam name or profile URL
     */
    async searchPlayer(query) {
        try {
            const parsed = this.parsePlayerInput(query);
            
            // Check cache first
            const cacheKey = `${parsed.type}:${parsed.value}`;
            if (this.playerCache.has(cacheKey)) {
                const cached = this.playerCache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.CACHE_TTL) {
                    return cached.data;
                }
            }
            
            let steamResponse;
            
            if (parsed.type === 'vanity') {
                // Resolve vanity URL to Steam ID and get Deadlock account ID
                const response = await fetch(`/api/steam-user?vanityurl=${encodeURIComponent(parsed.value)}`);
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Player not found');
                }
                
                steamResponse = await response.json();
                
                if (!steamResponse.resolved) {
                    throw new Error('Failed to resolve Steam profile');
                }
                
                // Get full player profile
                const profileResponse = await fetch(`/api/steam-user?steamids=${steamResponse.steamid}`);
                if (profileResponse.ok) {
                    const profileData = await profileResponse.json();
                    if (profileData.response && profileData.response.players && profileData.response.players.length > 0) {
                        steamResponse.playerData = profileData.response.players[0];
                    }
                }
                
            } else if (parsed.type === 'steamid') {
                // Direct Steam ID lookup
                const response = await fetch(`/api/steam-user?steamids=${parsed.value}`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch Steam profile');
                }
                
                const data = await response.json();
                
                if (!data.response || !data.response.players || data.response.players.length === 0) {
                    throw new Error('Steam profile not found');
                }
                
                const player = data.response.players[0];
                steamResponse = {
                    resolved: true,
                    steamid: player.steamid,
                    deadlockAccountId: player.deadlockAccountId,
                    playerData: player
                };
            }
            
            // Cache the result
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
     * Fetch recent matches for a player
     */
    async fetchPlayerRecentMatches(accountId, limit = 20) {
        try {
            // Check cache first
            const cacheKey = `matches:${accountId}`;
            if (this.matchCache.has(cacheKey)) {
                const cached = this.matchCache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.CACHE_TTL) {
                    return cached.data;
                }
            }
            
            // Fetch match history from Deadlock API
            const matchHistory = await this.deadlockAPI.getPlayerMatchHistory(accountId, limit, 0, true);
            
            if (!matchHistory || !matchHistory.matches) {
                throw new Error('No match history found');
            }
            
            // Filter matches to get ones with valid match IDs and process them
            const validMatches = matchHistory.matches
                .filter(match => match.matchId && match.matchId !== '0')
                .slice(0, 5) // Get top 5 recent matches
                .map(match => ({
                    matchId: match.matchId,
                    heroId: match.heroId,
                    heroName: getHeroName(match.heroId),
                    heroColor: getHeroColor(match.heroId),
                    kills: match.kills || 0,
                    deaths: match.deaths || 0,
                    assists: match.assists || 0,
                    result: match.result || 'unknown', // 'win', 'loss', or 'unknown'
                    startTime: match.startTime,
                    duration: match.duration,
                    playerDamage: match.playerDamage || 0,
                    netWorth: match.netWorth || 0,
                    lastHits: match.lastHits || 0
                }))
                .sort((a, b) => new Date(b.startTime) - new Date(a.startTime)); // Sort by most recent
            
            const result = {
                matches: validMatches,
                totalMatches: matchHistory.totalMatches || 0,
                statistics: matchHistory.statistics || {}
            };
            
            // Cache the result
            this.matchCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });
            
            return result;
            
        } catch (error) {
            console.error('Error fetching player matches:', error);
            throw error;
        }
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
                    <p class="text-gray-400">Steam ID: ${playerData.steamid}</p>
                    <p class="text-gray-400">Deadlock ID: ${playerData.deadlockAccountId}</p>
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