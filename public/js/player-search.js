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
        this.fairnessCache = new Map(); // Cache match ID -> fairness score
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
        console.log('=== fetchPlayerRecentMatches START ===');
        console.log('Input steamId64:', steamId64, 'limit:', limit);
        try {
            // Check cache first
            const cacheKey = `matches:${steamId64}`;
            console.log('Checking cache with key:', cacheKey);
            console.log('Cache has key:', this.matchCache.has(cacheKey));
            
            if (this.matchCache.has(cacheKey)) {
                const cached = this.matchCache.get(cacheKey);
                const isValid = Date.now() - cached.timestamp < this.CACHE_TTL;
                console.log('Cache entry found. Age:', Date.now() - cached.timestamp, 'Valid:', isValid);
                
                if (isValid) {
                    console.log('Returning cached match data for:', steamId64);
                    console.log('Cached data preview:', {
                        matchCount: cached.data.matches?.length || 0,
                        totalMatches: cached.data.totalMatches,
                        timestamp: new Date(cached.timestamp).toISOString()
                    });
                    return cached.data;
                }
            }
            
            console.log('No valid cache found, making fresh API call');
            
            console.log(`Fetching recent matches for SteamID64: ${steamId64}`);
            
            // Convert SteamID64 to account ID for Deadlock API
            // SteamID64 to Account ID: subtract 76561197960265728
            const accountId = BigInt(steamId64) - BigInt('76561197960265728');
            console.log(`Converted to account ID: ${accountId}`);
            
            // Call the Deadlock API directly since we know the correct endpoint format
            const matchHistoryUrl = `https://api.deadlock-api.com/v1/players/${accountId}/match-history`;
            console.log('Fetching from:', matchHistoryUrl);
            console.log('Account ID being used:', accountId);
            
            let response, matchData;
            
            try {
                response = await fetch(matchHistoryUrl);
                console.log('Response status:', response.status, response.statusText);
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch match history: ${response.status} ${response.statusText}`);
                }
                
                matchData = await response.json();
                console.log('Match history response received');
                console.log('Response type:', typeof matchData);
                console.log('Is array:', Array.isArray(matchData));
                console.log('Match history response length:', matchData.length);
                console.log('First 3 matches:', matchData.slice(0, 3));
                console.log('Full response preview:', JSON.stringify(matchData).substring(0, 500));
                
                // Log structure of first match to understand data format
                if (matchData.length > 0) {
                    console.log('First match structure:', matchData[0]);
                    console.log('First match keys:', Object.keys(matchData[0]));
                    console.log('Match ID field value:', matchData[0].match_id);
                    console.log('Match ID type:', typeof matchData[0].match_id);
                } else {
                    console.log('No matches returned from API - empty array');
                }
            } catch (error) {
                console.error('Error fetching match history:', error);
                throw error;
            }
            
            if (!Array.isArray(matchData)) {
                throw new Error('Invalid match history response format');
            }
            
            // Debug the filtering step by step
            console.log('Before filtering - total matches:', matchData.length);
            const filteredMatches = matchData.filter((match, index) => {
                const hasMatchId = match.match_id && match.match_id !== '0';
                if (!hasMatchId) {
                    console.log(`Filtered out match ${index} with invalid ID:`, {
                        match_id: match.match_id,
                        match_id_type: typeof match.match_id,
                        has_match_id: !!match.match_id,
                        full_match: match
                    });
                }
                return hasMatchId;
            });
            console.log('After filtering - valid matches:', filteredMatches.length);
            
            // Process matches with the correct API response format
            const topMatches = filteredMatches.slice(0, limit);
            console.log(`Processing top ${limit} matches:`, topMatches.length);
            
            const validMatches = topMatches.map((match, index) => {
                console.log(`Processing match ${index + 1}:`, {
                    match_id: match.match_id,
                    hero_id: match.hero_id,
                    player_kills: match.player_kills,
                    match_result: match.match_result,
                    start_time: match.start_time
                });
                
                const resultValue = Number(match.match_result);

                // Determine the player's team. Different fields may be present
                // depending on the API version.
                let teamValue = null;
                if (match.team !== undefined) {
                    teamValue = Number(match.team);
                } else if (match.player_team !== undefined) {
                    teamValue = Number(match.player_team);
                } else if (match.player_slot !== undefined) {
                    teamValue = Number(match.player_slot) <= 6 ? 0 : 1;
                }

                // If we know the player's team, compare it against the winning
                // team to determine whether the player won.
                let isWin = null;
                if (teamValue !== null && !Number.isNaN(resultValue)) {
                    isWin = teamValue === resultValue;
                } else if (!Number.isNaN(resultValue)) {
                    // Fallback to treating 0 as a win if team information is
                    // missing. This preserves previous behaviour.
                    isWin = resultValue === 0;
                }

                return {
                    matchId: match.match_id,
                    heroId: match.hero_id,
                    heroName: getHeroName(match.hero_id),
                    heroColor: getHeroColor(match.hero_id),
                    kills: match.player_kills || 0,
                    deaths: match.player_deaths || 0,
                    assists: match.player_assists || 0,
                    result: isWin ? 'win' : 'loss',
                    startTime: new Date(match.start_time * 1000).toISOString(),
                    duration: match.match_duration_s || 0,
                    playerDamage: 0, // Not available in this endpoint
                    netWorth: match.net_worth || 0,
                    lastHits: match.last_hits || 0
                };
            }).sort((a, b) => new Date(b.startTime) - new Date(a.startTime)); // Sort by most recent
            
            console.log('Final processed matches:', validMatches.length);
            
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
     * Calculate overall fairness score comparing both teams
     */
    calculateFairnessScore(team0Players, team1Players) {
        const avg = (players, field) => {
            const values = players.filter(p => p.statistics).map(p => p.statistics[field] || 0);
            return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        };

        const std = (players, field) => {
            const values = players.filter(p => p.statistics).map(p => p.statistics[field] || 0);
            if (values.length === 0) return 0;
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
            return Math.sqrt(variance);
        };

        const bigBrotherPenalty = (players) => {
            const values = players.filter(p => p.statistics).map(p => p.statistics.averageKDA || 0);
            if (values.length === 0) return 0;
            const avgKda = values.reduce((a, b) => a + b, 0) / values.length;
            const maxKda = Math.max(...values);
            return maxKda - avgKda;
        };

        const avgKDA0 = avg(team0Players, 'averageKDA');
        const avgKDA1 = avg(team1Players, 'averageKDA');
        const avgWR0 = avg(team0Players, 'winRate');
        const avgWR1 = avg(team1Players, 'winRate');

        const kdaDiff = Math.abs(avgKDA0 - avgKDA1);
        const wrDiff = Math.abs(avgWR0 - avgWR1);
        const stdPenalty = std(team0Players, 'kdaStdDev') + std(team1Players, 'kdaStdDev');
        const bbPenalty = bigBrotherPenalty(team0Players) + bigBrotherPenalty(team1Players);

        let score = 100;
        score -= kdaDiff * 5;
        score -= wrDiff;
        score -= stdPenalty * 2;
        score -= bbPenalty * 3;

        if (score < 0) score = 0;
        if (score > 100) score = 100;
        return score.toFixed(1);
    }

    /**
     * Fetch fairness score for a match (with caching)
     */
    async fetchFairnessScore(matchId) {
        const cached = this.fairnessCache.get(matchId);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.score;
        }

        try {
            const data = await this.deadlockAPI.getAllPlayersFromMatch(matchId);
            if (!data || !data.teams) return null;
            const score = this.calculateFairnessScore(data.teams.team0, data.teams.team1);
            this.fairnessCache.set(matchId, { score, timestamp: Date.now() });
            return score;
        } catch (err) {
            console.error('Failed to fetch fairness score for', matchId, err);
            return null;
        }
    }

    /**
     * Create HTML for a match tab
     */
    async createMatchTab(matchData, index, isActive = false) {
        // Get hero image from API instead of local files
        const heroImageUrl = await this.deadlockAPI.getHeroThumbnailUrl(matchData.heroId);
        const kda = `${matchData.kills}/${matchData.deaths}/${matchData.assists}`;
        const resultClass = matchData.result === 'win' ? 'win-indicator' : 'loss-indicator';
        const resultIcon = matchData.result === 'win' ? '🏆' : '💀';
        const activeClass = isActive ? 'active' : '';

        // Get fairness score for the match
        const fairness = await this.fetchFairnessScore(matchData.matchId);
        const fairnessDisplay = fairness !== null ? fairness : 'N/A';

        // Format start time
        const matchDate = new Date(matchData.startTime);
        const timeAgo = this.getTimeAgo(matchDate);
        
        return `
            <div class="match-card ${activeClass}" data-match-id="${matchData.matchId}" data-index="${index}">
                <div class="match-card-header">
                    <div class="hero-section">
                        <div class="hero-avatar" style="border-color: ${matchData.heroColor};">
                            ${heroImageUrl ? `
                                <img src="${heroImageUrl}" alt="${matchData.heroName}" 
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                <div class="hero-fallback" style="display: none;">
                                    <span>${matchData.heroName?.substring(0, 2) || '?'}</span>
                                </div>
                            ` : `
                                <div class="hero-fallback" style="display: flex;">
                                    <span>${matchData.heroName?.substring(0, 2) || '?'}</span>
                                </div>
                            `}
                        </div>
                        <div class="hero-info">
                            <h4 class="hero-name">${matchData.heroName || 'Unknown'}</h4>
                            <p class="match-time">${timeAgo}</p>
                        </div>
                    </div>
                    <div class="header-right flex items-center gap-2">
                        <div class="fairness-badge" title="Fairness Score">${fairnessDisplay}</div>
                        <div class="match-result ${resultClass}">
                            <span class="result-icon">${resultIcon}</span>
                            <span class="result-text">${matchData.result?.toUpperCase() || 'N/A'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="match-card-stats">
                    <div class="stat-item">
                        <span class="stat-label">KDA</span>
                        <span class="stat-value">${kda}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Match ID</span>
                        <span class="stat-value">${matchData.matchId}</span>
                    </div>
                </div>
                
                <div class="match-card-action">
                    <span class="action-text">View Details</span>
                    <i class="fas fa-arrow-right"></i>
                </div>
            </div>
        `;
    }

    /**
     * Render player search results
     */
    async renderPlayerSearchResults(playerData, matchHistory) {
        console.log('=== renderPlayerSearchResults START ===');
        console.log('playerData:', playerData);
        console.log('matchHistory:', matchHistory);
        console.log('matchHistory.matches count:', matchHistory.matches?.length || 0);
        
        const playerInfoCard = document.getElementById('playerInfoCard');
        const matchTabsWrapper = document.getElementById('matchTabsWrapper');
        const playerSearchResults = document.getElementById('playerSearchResults');
        
        console.log('DOM elements found:', {
            playerInfoCard: !!playerInfoCard,
            matchTabsWrapper: !!matchTabsWrapper,
            playerSearchResults: !!playerSearchResults
        });
        
        if (!playerInfoCard || !matchTabsWrapper || !playerSearchResults) {
            console.error('Missing DOM elements');
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
        
        // Create match cards
        if (matchHistory.matches && matchHistory.matches.length > 0) {
            console.log('Creating match cards for', matchHistory.matches.length, 'matches');
            const cardPromises = matchHistory.matches.map(async (match, index) => {
                console.log(`Creating card ${index + 1}:`, match);
                return await this.createMatchTab(match, index, false); // No card active by default
            });
            const cardsHTML = (await Promise.all(cardPromises)).join('');
            
            console.log('Generated cards HTML length:', cardsHTML.length);
            console.log('Cards HTML preview:', cardsHTML.substring(0, 200));
            matchTabsWrapper.innerHTML = cardsHTML;
            console.log('Cards inserted into wrapper');
            
            // Add click event listeners to cards
            const matchCards = matchTabsWrapper.querySelectorAll('.match-card');
            console.log('Found match cards:', matchCards.length);
            matchCards.forEach((card, index) => {
                console.log(`Setting up event listener for card ${index}:`, card.dataset.matchId);
                card.addEventListener('click', (e) => {
                    // Remove active class from all cards
                    matchCards.forEach(c => c.classList.remove('active'));
                    // Add active class to clicked card
                    card.classList.add('active');
                    
                    // Store selected match for potential analysis
                    const matchId = card.dataset.matchId;
                    console.log('Match card selected:', matchId);
                    
                    // Update action button text to show it's ready for analysis
                    const actionButton = card.querySelector('.match-card-action .action-text');
                    if (actionButton) {
                        actionButton.textContent = 'Analyze Match';
                    }
                    
                    // Double-click to analyze immediately
                    let clickTimeout = card.dataset.clickTimeout;
                    if (clickTimeout) {
                        clearTimeout(clickTimeout);
                        card.dataset.clickTimeout = '';
                        // Double click - analyze immediately
                        if (matchId && window.handleMatchFromTab) {
                            console.log('Double-click detected - analyzing match:', matchId);
                            window.handleMatchFromTab(matchId);
                        }
                    } else {
                        // Single click - just select
                        card.dataset.clickTimeout = setTimeout(() => {
                            card.dataset.clickTimeout = '';
                        }, 300);
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
        console.log('Showing player search results section');
        playerSearchResults.classList.remove('hidden');
        console.log('playerSearchResults classList after removing hidden:', playerSearchResults.classList.toString());
        
        // Scroll to results
        console.log('Scrolling to results');
        playerSearchResults.scrollIntoView({ behavior: 'smooth' });
        
        console.log('=== renderPlayerSearchResults COMPLETE ===');
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
        console.log('All caches cleared');
    }
    
    /**
     * Clear just match cache (for debugging)
     */
    clearMatchCache() {
        this.matchCache.clear();
        console.log('Match cache cleared');
    }
}

// Export the class
export default PlayerSearch;

// Also create a singleton instance for easy access
export const playerSearch = new PlayerSearch();