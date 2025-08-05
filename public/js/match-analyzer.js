/**
 * Match Analyzer - Enhanced visualization for Deadlock match analysis
 */

import DeadlockAPIService from './deadlock-api-service.js';
import {
    HERO_ID_TO_NAME, 
    HERO_ID_TO_CLASS, 
    HERO_COLORS,
    getHeroName,
    getHeroClassName,
    getHeroColor
} from '../hero_mapping/hero-mappings.js';
import { accountIdToSteamId64 } from './bigint-utils.js';
import { getTopCounterItems, getTopWinRateItems, getTopEffectiveItems } from './item-recommendations.js';

// Match Analyzer Component
class MatchAnalyzer {
    constructor() {
        this.currentMatchData = null;
        this.playerStatsCache = new Map();
        this.heroCache = new Map(); // Cache for hero data
        this.apiService = new DeadlockAPIService(); // Initialize API service
    }

    async getHeroThumbnailUrl(heroId) {
        // Use the enhanced API service method that handles all fallbacks
        return await this.apiService.getHeroThumbnailUrl(heroId);
    }

    /**
     * Create the enhanced match overview section
     */
    createMatchOverview(matchData) {
        
        // Handle both possible data structure formats
        const matchInfo = matchData.matchInfo || matchData.match_info;
        
        // Fix: More robust match ID handling
        const matchId = matchData.matchId || matchData.match_id || matchData.id || 
                        matchInfo?.match_id || matchInfo?.id || 'Unknown';
        
        // If matchId is still 'Unknown', try to extract from the input field
        if (matchId === 'Unknown') {
            const inputValue = document.getElementById('matchIdInput')?.value;
            if (inputValue) {
                matchId = inputValue;
            }
        }
        
        if (!matchInfo) {
            return `
                <div class="bg-gray-800 rounded-lg p-6 mb-6">
                    <div class="flex flex-col md:flex-row justify-between items-center">
                        <div>
                            <h2 class="text-2xl font-bold text-cyan-400">Match ${matchId}</h2>
                            <p class="text-gray-400 mt-1">Duration: Unknown</p>
                        </div>
                        <div class="mt-4 md:mt-0 text-center">
                            <p class="text-sm text-gray-400">Winner</p>
                            <p class="text-2xl font-bold text-yellow-400">Unknown</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        const duration = Math.floor(matchInfo.duration_s / 60);
        const seconds = matchInfo.duration_s % 60;
        
        return `
            <div class="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-6 mb-6 shadow-lg">
                <div class="flex flex-col md:flex-row justify-between items-center">
                    <div>
                        <h2 class="text-3xl font-bold text-cyan-400 mb-2">Match ${matchId}</h2>
                        <p class="text-gray-300 text-lg">
                            <i class="fas fa-clock mr-2"></i>
                            Duration: ${duration}:${String(seconds).padStart(2, '0')}
                        </p>
                    </div>
                    <div class="mt-4 md:mt-0 text-center">
                        <p class="text-sm text-gray-400 uppercase tracking-wide">Winner</p>
                        <p class="text-3xl font-bold ${matchInfo.winning_team === 0 ? 'text-green-400' : 'text-red-400'} mt-1">
                            <i class="fas fa-trophy mr-2"></i>
                            ${matchInfo.winning_team === 0 ? 'Team 1' : 'Team 2'}
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create team statistics comparison cards
     */
    createTeamComparison(team0Stats, team1Stats) {
        const calculateTeamAverage = (teamStats, field) => {
            const values = teamStats.filter(p => p.statistics).map(p => p.statistics[field] || 0);
            return values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : 0;
        };

        const team0AvgWR = calculateTeamAverage(team0Stats, 'winRate');
        const team0AvgKDA = calculateTeamAverage(team0Stats, 'averageKDA');
        const team1AvgWR = calculateTeamAverage(team1Stats, 'winRate');
        const team1AvgKDA = calculateTeamAverage(team1Stats, 'averageKDA');

        return `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Team 1 Stats -->
                <div class="bg-gradient-to-br from-green-900/20 to-gray-800 rounded-lg p-6 border border-green-500/30">
                    <div class="team-header mb-4">
                        <h3 class="text-xl font-bold text-green-400">Team 1</h3>
                        <div class="team-stats text-sm text-gray-300 mt-1">
                            <span class="win-rate text-green-300 font-semibold">${team0AvgWR}% WR</span> • 
                            <span class="avg-kda text-cyan-300 font-semibold">${team0AvgKDA} KDA</span>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="text-center stat-display">
                            <p class="text-2xl font-bold text-green-400">${team0AvgWR}%</p>
                            <p class="text-xs text-gray-400 uppercase tracking-wide">Win Rate</p>
                        </div>
                        <div class="text-center stat-display">
                            <p class="text-2xl font-bold text-cyan-400">${team0AvgKDA}</p>
                            <p class="text-xs text-gray-400 uppercase tracking-wide">KDA Ratio</p>
                        </div>
                    </div>
                </div>

                <!-- Team 2 Stats -->
                <div class="bg-gradient-to-br from-red-900/20 to-gray-800 rounded-lg p-6 border border-red-500/30">
                    <div class="team-header mb-4">
                        <h3 class="text-xl font-bold text-red-400">Team 2</h3>
                        <div class="team-stats text-sm text-gray-300 mt-1">
                            <span class="win-rate text-red-300 font-semibold">${team1AvgWR}% WR</span> • 
                            <span class="avg-kda text-orange-300 font-semibold">${team1AvgKDA} KDA</span>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="text-center stat-display">
                            <p class="text-2xl font-bold text-red-400">${team1AvgWR}%</p>
                            <p class="text-xs text-gray-400 uppercase tracking-wide">Win Rate</p>
                        </div>
                        <div class="text-center stat-display">
                            <p class="text-2xl font-bold text-orange-400">${team1AvgKDA}</p>
                            <p class="text-xs text-gray-400 uppercase tracking-wide">KDA Ratio</p>
                        </div>
                    </div>
                </div>
            </div>
            <p class="text-xs text-gray-500 text-center mb-8">Statistics are averaged from each player's last 50 games.</p>
        `;
    }

    /**
     * Create Section 1: Game Stats (KDA, Damage, Healing)
     */
    async createGameStatsSection(team0Players, team1Players) {
        const gameStatsRows = await this.createGameStatsRows(team0Players, team1Players);
        const mobileCards = await this.createGameStatsCards(team0Players, team1Players);
        return `
            <section class="game-stats-section animate-fadeInUp bg-gray-800 rounded-lg p-6 mb-8">
                <h2 class="text-2xl font-bold text-white mb-6 text-center">🎮 Match Performance</h2>

                <!-- Desktop table -->
                <div class="hidden md:block">
                    <div class="grid grid-cols-2 gap-6 mb-4">
                        <div class="text-center">
                            <h3 class="text-lg font-semibold text-green-400">Team 1</h3>
                        </div>
                        <div class="text-center">
                            <h3 class="text-lg font-semibold text-red-400">Team 2</h3>
                        </div>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="border-b border-gray-600">
                                    <th class="player-column text-left py-3 px-2">Player</th>
                                    <th class="kda-column text-center py-3 px-2">K/D/A</th>
                                    <th class="damage-column text-center py-3 px-2">Damage</th>
                                    <th class="player-column text-left py-3 px-2 border-l border-gray-600">Player</th>
                                    <th class="kda-column text-center py-3 px-2">K/D/A</th>
                                    <th class="damage-column text-center py-3 px-2">Damage</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${gameStatsRows}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Mobile cards -->
                <div class="md:hidden space-y-4">
                    ${mobileCards}
                </div>
            </section>
        `;
    }

    /**
     * Create rows for the game stats table
     */
    async createGameStatsRows(team0Players, team1Players) {
        const maxPlayers = Math.max(team0Players.length, team1Players.length, 6);
        let rows = '';
        
        for (let i = 0; i < maxPlayers; i++) {
            const player0 = team0Players[i];
            const player1 = team1Players[i];

            const player0HeroImageUrl = player0 ? await this.getHeroThumbnailUrl(player0.heroId) : null;
            const player1HeroImageUrl = player1 ? await this.getHeroThumbnailUrl(player1.heroId) : null;

            console.log(`createGameStatsRows: Player 0 Hero ID: ${player0?.heroId}, Image URL: ${player0HeroImageUrl}`);
            console.log(`createGameStatsRows: Player 1 Hero ID: ${player1?.heroId}, Image URL: ${player1HeroImageUrl}`);
            
            rows += `
                <tr class="border-b border-gray-700 hover:bg-gray-700/30">
                    <!-- Team 1 Player -->
                    <td class="player-column player-name-cell py-3 px-2">
                        ${player0 ? `
                            <div class="flex items-center space-x-1">
                                <div class="hero-icon w-6 h-6 rounded overflow-hidden border" 
                                     style="border-color: ${this.getHeroColor(player0.heroId)};">
                                    ${player0.heroId && player0HeroImageUrl ? `<img src="${player0HeroImageUrl}" alt="${this.getHeroName(player0.heroId)}" class="w-full h-full object-cover">` : '<div class="w-full h-full bg-gradient-to-br flex items-center justify-center text-xs font-bold" style="background: linear-gradient(135deg, #374151, #1f2937);">?</div>'}
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-green-400 font-medium text-sm">${this.formatPlayerName(player0)}</span>
                                    ${player0.accountId && this.getSteamProfileUrl(player0.accountId) ? 
                                        `<a href="${this.getSteamProfileUrl(player0.accountId)}" target="_blank" rel="noopener noreferrer" class="text-xs text-cyan-400 hover:text-cyan-300 transition-colors" title="View Steam Profile">
                                            <i class="fab fa-steam"></i>
                                        </a>` : ''
                                    }
                                </div>
                            </div>
                        ` : '<span class="text-gray-500">Empty Slot</span>'}
                    </td>
                    <td class="kda-column numeric-cell py-3 px-2">
                        ${player0 ? `<span class="font-mono">${player0.kills || 0}/${player0.deaths || 0}/${player0.assists || 0}</span>` : '-'}
                    </td>
                    <td class="damage-column numeric-cell py-3 px-2">
                        ${player0 ? `<span class="performance-${this.getPerformanceLevel(player0.playerDamage || 0, 'damage')} stat-tooltip enhanced-stat" data-tooltip="${this.createStatTooltip(player0.playerDamage || 0, 'damage', this.formatPlayerName(player0))}">${this.formatNumber(player0.playerDamage || 0)}</span>` : '-'}
                    </td>
                    
                    <!-- Team 2 Player -->
                    <td class="player-column player-name-cell py-3 px-2 border-l border-gray-600">
                        ${player1 ? `
                            <div class="flex items-center space-x-1">
                                <div class="hero-icon w-6 h-6 rounded overflow-hidden border" 
                                     style="border-color: ${this.getHeroColor(player1.heroId)};">
                                    ${player1.heroId && player1HeroImageUrl ? `<img src="${player1HeroImageUrl}" alt="${this.getHeroName(player1.heroId)}" class="w-full h-full object-cover">` : '<div class="w-full h-full bg-gradient-to-br flex items-center justify-center text-xs font-bold" style="background: linear-gradient(135deg, #374151, #1f2937);">?</div>'}
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-red-400 font-medium text-sm">${this.formatPlayerName(player1)}</span>
                                    ${player1.accountId && this.getSteamProfileUrl(player1.accountId) ? 
                                        `<a href="${this.getSteamProfileUrl(player1.accountId)}" target="_blank" rel="noopener noreferrer" class="text-xs text-cyan-400 hover:text-cyan-300 transition-colors" title="View Steam Profile">
                                            <i class="fab fa-steam"></i>
                                        </a>` : ''
                                    }
                                </div>
                            </div>
                        ` : '<span class="text-gray-500">Empty Slot</span>'}
                    </td>
                    <td class="kda-column numeric-cell py-3 px-2">
                        ${player1 ? `<span class="font-mono">${player1.kills || 0}/${player1.deaths || 0}/${player1.assists || 0}</span>` : '-'}
                    </td>
                    <td class="damage-column numeric-cell py-3 px-2">
                        ${player1 ? `<span class="performance-${this.getPerformanceLevel(player1.playerDamage || 0, 'damage')} stat-tooltip enhanced-stat" data-tooltip="${this.createStatTooltip(player1.playerDamage || 0, 'damage', this.formatPlayerName(player1))}">${this.formatNumber(player1.playerDamage || 0)}</span>` : '-'}
                    </td>
                </tr>
            `;
        }
        
        return rows;
    }

    /**
     * Create a mobile friendly card layout for player stats
     */
    async createGameStatsCards(team0Players, team1Players) {
        const maxPlayers = Math.max(team0Players.length, team1Players.length, 6);
        let cards = '';

        for (let i = 0; i < maxPlayers; i++) {
            const player0 = team0Players[i];
            const player1 = team1Players[i];

            const card0 = player0 ? await this.createPerformanceCard(player0, 'green') : '';
            const card1 = player1 ? await this.createPerformanceCard(player1, 'red') : '';

            cards += `
                <div class="grid grid-cols-2 gap-4">
                    <div>${card0}</div>
                    <div>${card1}</div>
                </div>
            `;
        }

        return cards;
    }

    /**
     * Create a single performance card used on mobile
     */
    async createPerformanceCard(player, teamColor) {
        const heroImageUrl = await this.getHeroThumbnailUrl(player.heroId);
        const textColor = teamColor === 'green' ? 'text-green-400' : 'text-red-400';
        return `
            <div class="player-card team-${teamColor} rounded-lg p-2 flex items-center space-x-2">
                <div class="hero-icon w-8 h-8 rounded overflow-hidden border" style="border-color: ${this.getHeroColor(player.heroId)};">
                    ${player.heroId && heroImageUrl ? `<img src="${heroImageUrl}" alt="${this.getHeroName(player.heroId)}" class="w-full h-full object-cover">` : ''}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="font-semibold ${textColor} truncate">${this.formatPlayerName(player)}</p>
                    <p class="text-xs text-gray-300">K/D/A: ${player.kills || 0}/${player.deaths || 0}/${player.assists || 0}</p>
                    <p class="text-xs text-gray-300">Dmg: ${this.formatNumber(player.playerDamage || 0)}</p>
                </div>
            </div>
        `;
    }

    /**
     * Create Section 2: Lane Economics (Denies, Economics by Lane)
     */
    async createLaneEconomicsSection(team0Players, team1Players) {
        const laneEconomicsRows = await this.createLaneEconomicsRows(team0Players, team1Players);
        const mobileCards = await this.createLaneEconomicsCards(team0Players, team1Players);
        return `
            <section class="lane-economics-section animate-fadeInUp bg-gray-800 rounded-lg p-6 mb-8" style="animation-delay: 0.2s;">
                <h2 class="text-2xl font-bold text-white mb-6 text-center">💰 Lane Economics & Farm</h2>

                <!-- Lane Headers -->
                <div class="grid grid-cols-2 gap-6 mb-4">
                    <div class="text-center">
                        <h3 class="text-lg font-semibold text-green-400">Team 1</h3>
                    </div>
                    <div class="text-center">
                        <h3 class="text-lg font-semibold text-red-400">Team 2</h3>
                    </div>
                </div>
                
                <!-- Desktop table -->
                <div class="hidden md:block">
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="border-b border-gray-600">
                                    <th class="player-column text-left py-3 px-2">Player</th>
                                    <th class="networth-column text-right py-3 px-2">Net Worth</th>
                                    <th class="lasthits-column text-right py-3 px-2">Last Hits</th>
                                    <th class="denies-column text-right py-3 px-2">Denies</th>
                                    <th class="player-column text-left py-3 px-2 border-l border-gray-600">Player</th>
                                    <th class="networth-column text-right py-3 px-2">Net Worth</th>
                                    <th class="lasthits-column text-right py-3 px-2">Last Hits</th>
                                    <th class="denies-column text-right py-3 px-2">Denies</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${laneEconomicsRows}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Mobile cards -->
                <div class="md:hidden space-y-4">
                    ${mobileCards}
                </div>
                
                <!-- Lane Comparison Summary -->
                <div class="mt-6 pt-6 border-t border-gray-600">
                    ${this.createLaneComparisonSummary(team0Players, team1Players)}
                    <p class="text-xs text-gray-500 text-center mt-4">
                        Lane Economics &amp; Farm stats should be collected from the data before the first tower is destroyed on either side.
                    </p>
                </div>
            </section>
        `;
    }

    /**
     * Determine lane index from player slot
     */
    getLaneIndex(player) {
        if (!player || player.playerSlot === undefined) return 0;
        // Player slots are 1-6 for team 1 and 7-12 for team 2
        const normalizedSlot = (player.playerSlot - 1) % 6; // 0-5
        return Math.floor(normalizedSlot / 2); // 0,1,2 lanes
    }

    /**
     * Group players into lanes based on their slot
     */
    groupPlayersByLane(players) {
        const lanes = [[], [], []];
        players.forEach(player => {
            const laneIndex = this.getLaneIndex(player);
            lanes[laneIndex].push(player);
        });
        return lanes;
    }

    /**
     * Create rows for the lane economics table
     */
    async createLaneEconomicsRows(team0Players, team1Players) {
        const lanes0 = this.groupPlayersByLane(team0Players);
        const lanes1 = this.groupPlayersByLane(team1Players);
        const laneNames = ['Top Lane', 'Mid Lane', 'Bottom Lane'];
        let rows = '';

        for (let lane = 0; lane < laneNames.length; lane++) {
            rows += `
                <tr class="bg-gray-700/50">
                    <td colspan="8" class="text-center text-gray-400 font-semibold py-2">${laneNames[lane]}</td>
                </tr>
            `;

            const lanePlayers0 = lanes0[lane];
            const lanePlayers1 = lanes1[lane];
            const maxPlayers = Math.max(lanePlayers0.length, lanePlayers1.length, 2);

            for (let i = 0; i < maxPlayers; i++) {
                const player0 = lanePlayers0[i];
                const player1 = lanePlayers1[i];

                const player0HeroImageUrl = player0 ? await this.getHeroThumbnailUrl(player0.heroId) : null;
                const player1HeroImageUrl = player1 ? await this.getHeroThumbnailUrl(player1.heroId) : null;

                rows += `
                    <tr class="border-b border-gray-700 hover:bg-gray-700/30">
                        <!-- Team 1 Player -->
                        <td class="player-column player-name-cell py-3 px-2">
                            ${player0 ? `
                                <div class="flex items-center space-x-1">
                                    <div class="hero-icon w-6 h-6 rounded overflow-hidden border"
                                         style="border-color: ${this.getHeroColor(player0.heroId)};">
                                        ${player0.heroId && player0HeroImageUrl ? `<img src="${player0HeroImageUrl}" alt="${this.getHeroName(player0.heroId)}" class="w-full h-full object-cover">` : '<div class="w-full h-full bg-gradient-to-br flex items-center justify-center text-xs font-bold" style="background: linear-gradient(135deg, #374151, #1f2937);">?</div>'}
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-green-400 font-medium text-sm">${this.formatPlayerName(player0)}</span>
                                        ${player0.accountId && this.getSteamProfileUrl(player0.accountId) ?
                                            `<a href="${this.getSteamProfileUrl(player0.accountId)}" target="_blank" rel="noopener noreferrer" class="text-xs text-cyan-400 hover:text-cyan-300 transition-colors" title="View Steam Profile">
                                                <i class="fab fa-steam"></i>
                                            </a>` : ''
                                        }
                                    </div>
                                </div>
                            ` : '<span class="text-gray-500">Empty Slot</span>'}
                        </td>
                        <td class="networth-column numeric-cell py-3 px-2">
                            ${player0 ? `<span class="performance-${this.getPerformanceLevel(player0.netWorth || 0, 'networth')} stat-tooltip enhanced-stat" data-tooltip="${this.createStatTooltip(player0.netWorth || 0, 'networth', this.formatPlayerName(player0))}">${this.formatNetWorth(player0.netWorth || 0)}</span>` : '-'}
                        </td>
                        <td class="lasthits-column numeric-cell py-3 px-2">
                            ${player0 ? `<span class="performance-${this.getPerformanceLevel(player0.lastHits || 0, 'lasthits')} stat-tooltip enhanced-stat" data-tooltip="${this.createStatTooltip(player0.lastHits || 0, 'lasthits', this.formatPlayerName(player0))}">${this.formatTableNumber(player0.lastHits || 0)}</span>` : '-'}
                        </td>
                        <td class="denies-column numeric-cell py-3 px-2">
                            ${player0 ? `<span class="performance-${this.getPerformanceLevel(player0.denies || 0, 'denies')} stat-tooltip enhanced-stat" data-tooltip="${this.createStatTooltip(player0.denies || 0, 'denies', this.formatPlayerName(player0))}">${this.formatTableNumber(player0.denies || 0)}</span>` : '-'}
                        </td>

                        <!-- Team 2 Player -->
                        <td class="player-column player-name-cell py-3 px-2 border-l border-gray-600">
                            ${player1 ? `
                                <div class="flex items-center space-x-1">
                                    <div class="hero-icon w-6 h-6 rounded overflow-hidden border"
                                         style="border-color: ${this.getHeroColor(player1.heroId)};">
                                        ${player1.heroId && player1HeroImageUrl ? `<img src="${player1HeroImageUrl}" alt="${this.getHeroName(player1.heroId)}" class="w-full h-full object-cover">` : '<div class="w-full h-full bg-gradient-to-br flex items-center justify-center text-xs font-bold" style="background: linear-gradient(135deg, #374151, #1f2937);">?</div>'}
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-red-400 font-medium text-sm">${this.formatPlayerName(player1)}</span>
                                        ${player1.accountId && this.getSteamProfileUrl(player1.accountId) ?
                                            `<a href="${this.getSteamProfileUrl(player1.accountId)}" target="_blank" rel="noopener noreferrer" class="text-xs text-cyan-400 hover:text-cyan-300 transition-colors" title="View Steam Profile">
                                                <i class="fab fa-steam"></i>
                                            </a>` : ''
                                        }
                                    </div>
                                </div>
                            ` : '<span class="text-gray-500">Empty Slot</span>'}
                        </td>
                        <td class="networth-column numeric-cell py-3 px-2">
                            ${player1 ? `<span class="performance-${this.getPerformanceLevel(player1.netWorth || 0, 'networth')} stat-tooltip enhanced-stat" data-tooltip="${this.createStatTooltip(player1.netWorth || 0, 'networth', this.formatPlayerName(player1))}">${this.formatNetWorth(player1.netWorth || 0)}</span>` : '-'}
                        </td>
                        <td class="lasthits-column numeric-cell py-3 px-2">
                            ${player1 ? `<span class="performance-${this.getPerformanceLevel(player1.lastHits || 0, 'lasthits')} stat-tooltip enhanced-stat" data-tooltip="${this.createStatTooltip(player1.lastHits || 0, 'lasthits', this.formatPlayerName(player1))}">${this.formatTableNumber(player1.lastHits || 0)}</span>` : '-'}
                        </td>
                        <td class="denies-column numeric-cell py-3 px-2">
                            ${player1 ? `<span class="performance-${this.getPerformanceLevel(player1.denies || 0, 'denies')} stat-tooltip enhanced-stat" data-tooltip="${this.createStatTooltip(player1.denies || 0, 'denies', this.formatPlayerName(player1))}">${this.formatTableNumber(player1.denies || 0)}</span>` : '-'}
                        </td>
                    </tr>
                `;
            }
        }

        return rows;
    }

    /**
     * Create a mobile friendly card layout for lane economics
     */
    async createLaneEconomicsCards(team0Players, team1Players) {
        const lanes0 = this.groupPlayersByLane(team0Players);
        const lanes1 = this.groupPlayersByLane(team1Players);
        const laneNames = ['Top Lane', 'Mid Lane', 'Bottom Lane'];
        let cards = '';

        for (let lane = 0; lane < laneNames.length; lane++) {
            const lanePlayers0 = lanes0[lane];
            const lanePlayers1 = lanes1[lane];
            const maxPlayers = Math.max(lanePlayers0.length, lanePlayers1.length, 2);

            cards += `<h4 class="text-center text-gray-300 font-semibold">${laneNames[lane]}</h4>`;

            for (let i = 0; i < maxPlayers; i++) {
                const player0 = lanePlayers0[i];
                const player1 = lanePlayers1[i];

                const card0 = player0 ? await this.createLaneEconomicsCard(player0, 'green') : '';
                const card1 = player1 ? await this.createLaneEconomicsCard(player1, 'red') : '';

                cards += `
                    <div class="grid grid-cols-2 gap-4 mb-2">
                        <div>${card0}</div>
                        <div>${card1}</div>
                    </div>
                `;
            }
        }

        return cards;
    }

    /**
     * Create single lane economics card used on mobile
     */
    async createLaneEconomicsCard(player, teamColor) {
        const heroImageUrl = await this.getHeroThumbnailUrl(player.heroId);
        const textColor = teamColor === 'green' ? 'text-green-400' : 'text-red-400';
        return `
            <div class="player-card team-${teamColor} rounded-lg p-2 flex items-center space-x-2">
                <div class="hero-icon w-8 h-8 rounded overflow-hidden border" style="border-color: ${this.getHeroColor(player.heroId)};">
                    ${player.heroId && heroImageUrl ? `<img src="${heroImageUrl}" alt="${this.getHeroName(player.heroId)}" class="w-full h-full object-cover">` : ''}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="font-semibold ${textColor} truncate">${this.formatPlayerName(player)}</p>
                    <div class="text-xs text-gray-300 flex space-x-2">
                        <span>NW: ${this.formatNetWorth(player.netWorth || 0)}</span>
                        <span>LH: ${this.formatTableNumber(player.lastHits || 0)}</span>
                        <span>D: ${this.formatTableNumber(player.denies || 0)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create lane comparison summary
     */
    createLaneComparisonSummary(team0Players, team1Players) {
        const team0Stats = this.calculateTeamEconomics(team0Players);
        const team1Stats = this.calculateTeamEconomics(team1Players);
        
        return `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div class="bg-gray-700/50 rounded-lg p-4">
                    <h4 class="text-sm font-medium text-gray-400 mb-2">Total Net Worth</h4>
                    <div class="flex justify-center items-center space-x-4">
                        <span class="text-lg font-bold ${team0Stats.totalNetWorth > team1Stats.totalNetWorth ? 'text-green-400' : 'text-gray-300'}">
                            ${this.formatNumber(team0Stats.totalNetWorth)}
                        </span>
                        <span class="text-gray-500">vs</span>
                        <span class="text-lg font-bold ${team1Stats.totalNetWorth > team0Stats.totalNetWorth ? 'text-red-400' : 'text-gray-300'}">
                            ${this.formatNumber(team1Stats.totalNetWorth)}
                        </span>
                    </div>
                </div>
                
                <div class="bg-gray-700/50 rounded-lg p-4">
                    <h4 class="text-sm font-medium text-gray-400 mb-2">Total Last Hits</h4>
                    <div class="flex justify-center items-center space-x-4">
                        <span class="text-lg font-bold ${team0Stats.totalLastHits > team1Stats.totalLastHits ? 'text-green-400' : 'text-gray-300'}">
                            ${team0Stats.totalLastHits}
                        </span>
                        <span class="text-gray-500">vs</span>
                        <span class="text-lg font-bold ${team1Stats.totalLastHits > team0Stats.totalLastHits ? 'text-red-400' : 'text-gray-300'}">
                            ${team1Stats.totalLastHits}
                        </span>
                    </div>
                </div>
                
                <div class="bg-gray-700/50 rounded-lg p-4">
                    <h4 class="text-sm font-medium text-gray-400 mb-2">Total Denies</h4>
                    <div class="flex justify-center items-center space-x-4">
                        <span class="text-lg font-bold ${team0Stats.totalDenies > team1Stats.totalDenies ? 'text-green-400' : 'text-gray-300'}">
                            ${team0Stats.totalDenies}
                        </span>
                        <span class="text-gray-500">vs</span>
                        <span class="text-lg font-bold ${team1Stats.totalDenies > team0Stats.totalDenies ? 'text-red-400' : 'text-gray-300'}">
                            ${team1Stats.totalDenies}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Calculate team economics totals
     */
    calculateTeamEconomics(players) {
        return players.reduce((totals, player) => {
            if (player) {
                totals.totalNetWorth += player.netWorth || 0;
                totals.totalLastHits += player.lastHits || 0;
                totals.totalDenies += player.denies || 0;
            }
            return totals;
        }, {
            totalNetWorth: 0,
            totalLastHits: 0,
            totalDenies: 0
        });
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

        // Penalize teams with extreme KDA outliers using standard deviation
        const bigBrotherPenalty = (players) => {
            const values = players
                .filter(p => p.statistics)
                .map(p => p.statistics.averageKDA || 0);
            if (values.length === 0) return 0;
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
            const sd = Math.sqrt(variance);
            return Math.min(sd, 5); // cap the penalty
        };

        // Heavy penalty when a single player's KDA greatly exceeds all players on the other team
        const extremeKdaGapPenalty = (teamA, teamB) => {
            const getMax = team => {
                const values = team
                    .filter(p => p.statistics)
                    .map(p => p.statistics.averageKDA || 0);
                return values.length ? Math.max(...values) : 0;
            };
            const maxA = getMax(teamA);
            const maxB = getMax(teamB);
            const diff = Math.abs(maxA - maxB);
            return diff >= 0.5 ? diff * 20 : 0; // 0.5 gap or more is heavily penalized
        };

        const avgKDA0 = avg(team0Players, 'averageKDA');
        const avgKDA1 = avg(team1Players, 'averageKDA');
        const avgWR0 = avg(team0Players, 'winRate');
        const avgWR1 = avg(team1Players, 'winRate');

        const kdaDiff = Math.abs(avgKDA0 - avgKDA1);
        const wrDiff = Math.abs(avgWR0 - avgWR1);
        const avgDMG0 = avg(team0Players, 'damagePerMinute');
        const avgDMG1 = avg(team1Players, 'damagePerMinute');
        const avgNW0  = avg(team0Players, 'netWorthPerMinute');
        const avgNW1  = avg(team1Players, 'netWorthPerMinute');

        const stdPenalty = std(team0Players, 'kdaStdDev') + std(team1Players, 'kdaStdDev');
        const bbPenalty = bigBrotherPenalty(team0Players) + bigBrotherPenalty(team1Players);

        const dmgDiff = Math.abs(avgDMG0 - avgDMG1);
        const nwDiff  = Math.abs(avgNW0  - avgNW1);
        const kdaGapPenalty = extremeKdaGapPenalty(team0Players, team1Players);

        let score = 10;
        score -= kdaDiff * 14; // very sensitive to KDA difference

        if (score < 0) score = 0;
        if (score > 10) score = 10;
        return score.toFixed(1);
    }

    /**
     * Create Section 3: Historical Player Data (existing player cards)
     */
    async createHistoricalDataSection(team0Players, team1Players) {
        // Pad teams to 6 players if needed
        const team0Padded = [...team0Players];
        const team1Padded = [...team1Players];
        
        while (team0Padded.length < 6) {
            team0Padded.push(null);
        }
        while (team1Padded.length < 6) {
            team1Padded.push(null);
        }
        
        const team0CardPromises = team0Padded
            .slice(0, 6)
            .map(async (player, index) => {
                if (player) {
                    return await this.createHistoricalPlayerCard(player, 'green');
                } else {
                    return this.createEmptyPlayerSlot('green', index + 1);
                }
            });
            
        const team1CardPromises = team1Padded
            .slice(0, 6)
            .map(async (player, index) => {
                if (player) {
                    return await this.createHistoricalPlayerCard(player, 'red');
                } else {
                    return this.createEmptyPlayerSlot('red', index + 1);
                }
            });
        
        const team0Cards = (await Promise.all(team0CardPromises)).join('');
        const team1Cards = (await Promise.all(team1CardPromises)).join('');
        
        return `
            <section class="historical-data-section animate-fadeInUp bg-gray-800 rounded-lg p-6 mb-8" style="animation-delay: 0.4s;">
                <h2 class="text-2xl font-bold text-white mb-6 text-center">📊 Player Historical Performance</h2>

                <!-- Desktop: two column layout -->
                <div class="hidden lg:block">
                    <div class="teams-container">
                        <div class="teams-grid">
                            <div class="team-column">
                                <div class="team-header team-header-green">
                                    <h4 class="text-lg font-semibold text-green-400">Team 1 Historical Stats</h4>
                                </div>
                                <div class="team-cards player-stats-grid">
                                    ${team0Cards}
                                </div>
                            </div>
                            <div class="team-column">
                                <div class="team-header team-header-red">
                                    <h4 class="text-lg font-semibold text-red-400">Team 2 Historical Stats</h4>
                                </div>
                                <div class="team-cards player-stats-grid">
                                    ${team1Cards}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Mobile/tab layout -->
                <div class="teams-tabs lg:hidden" id="teamsContainer">
                    <div class="tab-buttons">
                        <button class="team-tab-btn team1-tab active" data-team="team1">Team 1</button>
                        <button class="team-tab-btn team2-tab" data-team="team2">Team 2</button>
                    </div>
                    <div class="tab-panels">
                        <div class="team-panel team1-panel active" data-team="team1">
                            <div class="team-cards player-stats-grid">
                                ${team0Cards}
                            </div>
                        </div>
                        <div class="team-panel team2-panel" data-team="team2">
                            <div class="team-cards player-stats-grid">
                                ${team1Cards}
                            </div>
                        </div>
                    </div>
                </div>

                <p class="text-xs text-gray-500 text-center mt-6">Statistics are averaged from each player's last 50 games.</p>
            </section>
        `;
    }

    /**
     * Create item effectiveness summary for a team
     */
    createItemEffectivenessSection(teamPlayers, enemyPlayers) {
        const enemyHeroes = enemyPlayers.map(p => p.heroId).filter(Boolean);
        const effectiveItems = new Set();
        enemyHeroes.forEach(id => {
            getTopCounterItems(id).forEach(item => effectiveItems.add(item));
        });

        const topItems = getTopEffectiveItems(enemyHeroes, 10);
        const topItemsList = topItems.map(item => {
            const icon = this.apiService.getItemAssetUrl(item);
            const name = this.formatItemName(item);
            return `<div class="flex items-center space-x-1 m-1">
                        <img src="${icon}" alt="${name}" class="w-6 h-6">
                        <span class="text-xs">${name}</span>
                    </div>`;
        }).join('');

        const rows = teamPlayers.map(player => {
            const items = player.items || [];
            const effCount = items.filter(i => effectiveItems.has(i)).length;
            const winRateItems = new Set(getTopWinRateItems(player.heroId));
            const winCount = items.filter(i => winRateItems.has(i)).length;
            return `
                <tr class="border-b border-gray-600">
                    <td class="py-2 px-2 text-left">${this.formatPlayerName(player)}</td>
                    <td class="py-2 px-2 text-center">${effCount}</td>
                    <td class="py-2 px-2 text-center">${winCount}</td>
                </tr>
            `;
        }).join('');

        const teamLabel = teamPlayers[0] && teamPlayers[0].team === 0 ? 'Team 1' : 'Team 2';

        return `
            <section class="item-effectiveness-section bg-gray-800 rounded-lg p-6 mb-8">
                <h2 class="text-2xl font-bold text-white mb-4 text-center">🛡️ Item Effectiveness - ${teamLabel}</h2>
                <div class="flex flex-wrap justify-center mb-4">
                    ${topItemsList}
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-600">
                                <th class="text-left py-2 px-2">Player</th>
                                <th class="text-center py-2 px-2">Vs Enemy Items</th>
                                <th class="text-center py-2 px-2">Hero Win Rate Items</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                </div>
            </section>
        `;
    }

    /**
     * Convert account ID to Steam ID
     */
    convertToSteamId(accountId) {
        if (!accountId) return null;
        try {
            return accountIdToSteamId64(accountId);
        } catch (error) {
            console.warn('Error converting to Steam ID:', error);
            return null;
        }
    }

    /**
     * Get hero name from hero ID
     */
    getHeroName(heroId) {
        return getHeroName(heroId);
    }

    /**
     * Get hero color from hero ID
     */
    getHeroColor(heroId) {
        return getHeroColor(heroId);
    }

    /**
     * Create Steam profile URL from account ID
     */
    getSteamProfileUrl(accountId) {
        const steamId = this.convertToSteamId(accountId);
        return steamId ? `https://steamcommunity.com/profiles/${steamId}` : null;
    }

    /**
     * Format player names consistently with length limits
     */
    formatPlayerName(player, maxLength = 12) {
        let name = 'Unknown';
        
        if (player.displayName && player.displayName !== `ID: ${player.accountId}`) {
            name = player.displayName.replace(/\\/g, '').trim();
        } else if (player.steamName) {
            name = player.steamName.replace(/\\/g, '').trim();
        } else if (player.playerName) {
            name = player.playerName.replace(/\\/g, '').trim();
        } else if (player.accountId) {
            name = player.accountId.toString();
        }
        
        // Truncate if too long and add ellipsis
        if (name.length > maxLength) {
            return name.substring(0, maxLength - 3) + '...';
        }
        
        return name;
    }

    /**
     * Format numbers for display (e.g., 12000 -> 12K)
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
     * Format net worth with proper number formatting and commas
     */
    formatNetWorth(value) {
        if (typeof value !== 'number' || isNaN(value)) return '0';
        return Math.round(value).toLocaleString();
    }

    /**
     * Format numeric values with consistent padding for table alignment
     */
    formatTableNumber(value) {
        if (typeof value !== 'number' || isNaN(value)) return '0';
        return Math.round(value).toString();
    }

    /**
     * Convert item ID to a human readable name
     */
    formatItemName(itemId) {
        if (!itemId) return '';
        return itemId.replace(/^item_/, '')
            .split('_')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
    }

    /**
     * Get performance level for a stat value
     */
    getPerformanceLevel(value, statType) {
        if (!value || value === 0) return 'poor';
        
        let excellentThreshold, goodThreshold, averageThreshold, poorThreshold;
        
        switch (statType) {
            case 'damage':
                excellentThreshold = 60000;
                goodThreshold = 40000;
                averageThreshold = 25000;
                poorThreshold = 15000;
                break;
            case 'healing':
                excellentThreshold = 20000;
                goodThreshold = 12000;
                averageThreshold = 7500;
                poorThreshold = 3000;
                break;
            case 'networth':
                excellentThreshold = 50000;
                goodThreshold = 35000;
                averageThreshold = 25000;
                poorThreshold = 15000;
                break;
            case 'lasthits':
                excellentThreshold = 500;
                goodThreshold = 350;
                averageThreshold = 250;
                poorThreshold = 150;
                break;
            case 'denies':
                excellentThreshold = 80;
                goodThreshold = 50;
                averageThreshold = 25;
                poorThreshold = 10;
                break;
            case 'winrate':
                excellentThreshold = 70;
                goodThreshold = 60;
                averageThreshold = 50;
                poorThreshold = 40;
                break;
            case 'kda':
                excellentThreshold = 4;
                goodThreshold = 3;
                averageThreshold = 2;
                poorThreshold = 1.5;
                break;
            default:
                return 'average';
        }
        
        if (value >= excellentThreshold) return 'excellent';
        if (value >= goodThreshold) return 'good';
        if (value >= averageThreshold) return 'average';
        if (value >= poorThreshold) return 'poor';
        return 'bad';
    }

    /**
     * Create tooltip text for stat values
     */
    createStatTooltip(value, statType, playerName = '') {
        const level = this.getPerformanceLevel(value, statType);
        const levelText = level.charAt(0).toUpperCase() + level.slice(1);
        
        switch (statType) {
            case 'damage':
                return `${levelText} player damage for ${playerName} (${this.formatNumber(value)})`;
            case 'healing':
                return `${levelText} healing output for ${playerName} (${this.formatNumber(value)})`;
            case 'networth':
                return `${levelText} net worth for ${playerName} ($${this.formatNetWorth(value)})`;
            case 'lasthits':
                return `${levelText} farming for ${playerName} (${value} last hits)`;
            case 'denies':
                return `${levelText} lane control for ${playerName} (${value} denies)`;
            default:
                return `${levelText} performance: ${value}`;
        }
    }

    /**
     * Create enhanced sparkline for recent form
     */
    createRecentFormSparkline(recentForm) {
        if (!recentForm || recentForm.length === 0) {
            return '<span class="text-xs text-gray-500">No data</span>';
        }
        
        const dots = recentForm.slice(0, 5).map(result => 
            `<div class="form-dot ${result === 'W' ? 'win' : 'loss'}" title="${result === 'W' ? 'Win' : 'Loss'}"></div>`
        ).join('');
        
        return `<div class="recent-form-sparkline">${dots}</div>`;
    }

    /**
     * Get CSS class for stat values based on performance level
     */
    getStatValueClass(value, statType) {
        if (!value || value === 0) return 'text-gray-400';
        
        let highThreshold, mediumThreshold;
        
        switch (statType) {
            case 'damage':
                highThreshold = 50000;
                mediumThreshold = 25000;
                break;
            case 'healing':
                highThreshold = 15000;
                mediumThreshold = 7500;
                break;
            case 'networth':
                highThreshold = 40000;
                mediumThreshold = 25000;
                break;
            case 'lasthits':
                highThreshold = 400;
                mediumThreshold = 250;
                break;
            case 'denies':
                highThreshold = 50;
                mediumThreshold = 25;
                break;
            default:
                return 'text-gray-300';
        }
        
        if (value >= highThreshold) {
            return 'stat-value-high';
        } else if (value >= mediumThreshold) {
            return 'stat-value-medium';
        } else {
            return 'stat-value-low';
        }
    }

    /**
     * Create historical player cards (renamed from createPlayerCard)
     */
    async createHistoricalPlayerCard(player, teamColor) {
        const stats = player.statistics;
        const textColor = teamColor === 'green' ? 'text-green-400' : 'text-red-400';
        
        const heroImageUrl = await this.getHeroThumbnailUrl(player.heroId);
        console.log(`createHistoricalPlayerCard: Player: ${this.formatPlayerName(player)}, Hero ID: ${player.heroId}, Image URL: ${heroImageUrl}`);

        if (!stats) {
            return `
                <div class="player-card team-${teamColor} rounded-lg sm:p-4 p-3 min-h-[160px] sm:min-h-[180px] flex flex-col justify-between">
                    <div class="flex items-center sm:space-x-3 space-x-2 mb-3">
                        <div class="hero-icon w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center flex-shrink-0 border border-gray-600">
                            <span class="text-sm sm:text-base font-bold text-gray-300">H${player.heroId}</span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h4 class="font-bold ${textColor} truncate text-sm sm:text-base">${this.formatPlayerName(player)}</h4>
                            <div class="stat-line text-xs sm:text-sm text-gray-300 mt-1">
                                <span><span class="label">K/D/A:</span> <span class="value">${player.kills || 0}/${player.deaths || 0}/${player.assists || 0}</span></span>
                                <span><span class="label">Dmg:</span> <span class="value">${this.formatNumber(player.playerDamage || 0)}</span></span>
                            </div>
                        </div>
                    </div>
                    <p class="text-center text-gray-500 text-xs sm:text-sm">Loading stats...</p>
                </div>
            `;
        }

        const recentForm = stats.recentForm || [];
        const formIndicators = recentForm.slice(0, 5).map(result => 
            `<span class="inline-block w-2 h-2 rounded-full ${result === 'W' ? 'bg-green-400' : 'bg-red-400'}"></span>`
        ).join(' ');
        
        const winRateLevel = this.getPerformanceLevel(stats.winRate, 'winrate');
        const kdaLevel = this.getPerformanceLevel(stats.averageKDA, 'kda');
        const winRateColor = `performance-${winRateLevel}`;
        const kdaColor = `performance-${kdaLevel}`;

        return `
            <div class="player-card team-${teamColor} rounded-lg sm:p-4 p-3 min-h-[160px] sm:min-h-[180px] flex flex-col justify-between transition-all duration-300 hover:transform hover:scale-105">
                <!-- Top: Player info with hero icon -->
                <div class="flex items-center sm:space-x-3 space-x-2 mb-3">
                    <div class="hero-icon w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden border flex-shrink-0" 
                         style="border-color: ${this.getHeroColor(player.heroId)};">
                        ${player.heroId && heroImageUrl ? `<img src="${heroImageUrl}" alt="${this.getHeroName(player.heroId)}" class="w-full h-full object-cover">` : '<div class="w-full h-full bg-gradient-to-br flex items-center justify-center text-sm font-bold" style="background: linear-gradient(135deg, #374151, #1f2937);">?</div>'}
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold ${textColor} truncate text-sm sm:text-base">${this.formatPlayerName(player)}</h4>
                        <div class="stat-line text-xs sm:text-sm text-gray-300 mt-1">
                            <span><span class="label">K/D/A:</span> <span class="value">${player.kills || 0}/${player.deaths || 0}/${player.assists || 0}</span></span>
                            <span><span class="label">Dmg:</span> <span class="value">${this.formatNumber(player.playerDamage || 0)}</span></span>
                        </div>
                        <p class="text-xs text-gray-500 hidden sm:block">${player.totalGames || 0} games</p>
                        ${player.accountId && this.getSteamProfileUrl(player.accountId) ?
                            `<a href="${this.getSteamProfileUrl(player.accountId)}" target="_blank" rel="noopener noreferrer" class="text-xs text-cyan-400 hover:text-cyan-300 transition-colors mt-1 items-center hidden sm:flex" title="Steam">
                                <i class="fab fa-steam mr-1"></i><span class="hidden md:inline">Profile</span>
                            </a>` : ''
                        }
                    </div>
                </div>
                
                <!-- Bottom: Stats grid with responsive sizing -->
                <div class="stats space-y-2 sm:space-y-3">
                    <!-- Primary stats row -->
                    <div class="grid grid-cols-2 gap-2 sm:gap-3 text-center">
                        <div class="bg-gray-700/50 rounded-lg p-2 sm:p-3">
                            <p class="text-lg sm:text-xl font-bold ${winRateColor} enhanced-stat">${stats.winRate}%</p>
                            <p class="text-xs text-gray-400 uppercase tracking-wide">Win Rate</p>
                        </div>
                        <div class="bg-gray-700/50 rounded-lg p-2 sm:p-3">
                            <p class="text-lg sm:text-xl font-bold ${kdaColor} enhanced-stat">${stats.averageKDA}</p>
                            <p class="text-xs text-gray-400 uppercase tracking-wide">KDA</p>
                        </div>
                    </div>
                    
                    <!-- Secondary stats row - combined for mobile -->
                    <div class="text-center text-xs sm:text-sm">
                        <p class="font-semibold text-cyan-400">${stats.averageKills}/${stats.averageDeaths}/${stats.averageAssists}</p>
                        <p class="text-xs text-gray-500">K/D/A Average</p>
                    </div>
                    
                    <!-- Recent form - simplified for mobile -->
                    <div class="text-center border-t border-gray-600 pt-2">
                        <div class="flex justify-center items-center">
                            ${this.createRecentFormSparkline(stats.recentForm)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create the main match analysis view
     */
    async renderMatchAnalysis(matchData, allPlayersData) {
        const container = document.getElementById('chartsContainer');
        
        if (!container) {
            throw new Error('Charts container not found');
        }
        
        // Clear existing content
        container.innerHTML = '';
        container.classList.remove('hidden');
        
        // Create match overview
        const overview = this.createMatchOverview(matchData);

        // Prepare team data for the new sections
        const team0Players = [...allPlayersData.teams.team0]
            .sort((a, b) => a.playerSlot - b.playerSlot);
        const team1Players = [...allPlayersData.teams.team1]
            .sort((a, b) => a.playerSlot - b.playerSlot);

        const fairness = this.calculateFairnessScore(team0Players, team1Players);
        const fairnessSection = `
            <div class="fairness-score text-center mb-6">
                Fairness Score: <span class="text-yellow-400 font-bold">${fairness}</span>/10
            </div>
        `;
        
        
        // Create the new three-section layout
        const gameStatsSection = await this.createGameStatsSection(team0Players, team1Players);
        const laneEconomicsSection = await this.createLaneEconomicsSection(team0Players, team1Players);
        const historicalDataSection = await this.createHistoricalDataSection(team0Players, team1Players);
        const itemSectionTeam0 = this.createItemEffectivenessSection(team0Players, team1Players);
        const itemSectionTeam1 = this.createItemEffectivenessSection(team1Players, team0Players);
        const teamComparison = this.createTeamComparison(team0Players, team1Players);

        const finalHTML = `
            ${overview}
            ${fairnessSection}
            ${teamComparison}
            ${gameStatsSection}
            ${laneEconomicsSection}
            ${historicalDataSection}
            ${itemSectionTeam0}
            ${itemSectionTeam1}
        `;
        
        container.innerHTML = finalHTML;
        
        // Add interactive charts after rendering
        this.createInteractiveCharts(allPlayersData);
        
        // Add mobile tab functionality
        this.initializeTeamTabs();


        
    }

    /**
     * Create match insights based on player statistics
     */
    createMatchInsights(allPlayersData) {
        const allPlayers = [...allPlayersData.teams.team0, ...allPlayersData.teams.team1]
            .filter(p => p.statistics);
        
        if (allPlayers.length === 0) return '<p class="text-gray-400">No player statistics available</p>';
        
        // Find best performers
        const highestWR = allPlayers.reduce((prev, current) => 
            (prev.statistics.winRate > current.statistics.winRate) ? prev : current
        );
        
        const highestKDA = allPlayers.reduce((prev, current) => 
            (prev.statistics.averageKDA > current.statistics.averageKDA) ? prev : current
        );
        
        const mostExperienced = allPlayers.reduce((prev, current) => 
            (prev.totalGames > current.totalGames) ? prev : current
        );
        
        return `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="text-center">
                    <p class="text-sm text-gray-400 mb-1">Highest Win Rate</p>
                    <p class="text-lg font-semibold text-white">${this.formatPlayerName(highestWR)}</p>
                    <p class="text-2xl font-bold text-green-400">${highestWR.statistics.winRate}%</p>
                </div>
                
                <div class="text-center">
                    <p class="text-sm text-gray-400 mb-1">Best KDA</p>
                    <p class="text-lg font-semibold text-white">${this.formatPlayerName(highestKDA)}</p>
                    <p class="text-2xl font-bold text-cyan-400">${highestKDA.statistics.averageKDA}</p>
                </div>
                
                <div class="text-center">
                    <p class="text-sm text-gray-400 mb-1">Most Experienced</p>
                    <p class="text-lg font-semibold text-white">${this.formatPlayerName(mostExperienced)}</p>
                    <p class="text-2xl font-bold text-yellow-400">${mostExperienced.totalGames} games</p>
                </div>
            </div>
            
            <!-- Interactive Charts Section -->
            <div class="mt-8">
                <h4 class="text-lg font-bold text-white mb-4">Statistical Analysis</h4>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="bg-gray-700 rounded-lg p-4">
                        <canvas id="winRateChart" width="400" height="300"></canvas>
                    </div>
                    <div class="bg-gray-700 rounded-lg p-4">
                        <canvas id="kdaComparisonChart" width="400" height="300"></canvas>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create interactive charts for detailed analysis
     */
    createInteractiveCharts(allPlayersData) {
        // Add a new section for charts
        const chartsSection = document.createElement('div');
        chartsSection.className = 'mt-8';
        chartsSection.innerHTML = `
            <div class="bg-gray-800 rounded-lg p-6">
                <h3 class="text-xl font-bold text-white mb-4">Statistical Comparison</h3>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <canvas id="winRateComparisonChart"></canvas>
                    </div>
                    <div>
                        <canvas id="kdaComparisonChart"></canvas>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('chartsContainer').appendChild(chartsSection);
        
        // Create the charts
        this.createWinRateComparisonChart(allPlayersData);
        this.createKDAComparisonChart(allPlayersData);
    }

    /**
     * Create win rate chart for progressive loading
     */
    createWinRateChart(allPlayersData) {
        const ctx = document.getElementById('winRateChart').getContext('2d');
        
        const team0Data = allPlayersData.teams.team0
            .filter(p => p.statistics)
            .map(p => p.statistics.winRate);
            
        const team1Data = allPlayersData.teams.team1
            .filter(p => p.statistics)
            .map(p => p.statistics.winRate);
        
        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: Array.from({length: Math.max(team0Data.length, team1Data.length, 6)}, (_, i) => `P${i + 1}`),
                datasets: [{
                    label: 'Team 1',
                    data: [...team0Data, ...Array(Math.max(0, Math.max(team0Data.length, team1Data.length, 6) - team0Data.length)).fill(0)],
                    borderColor: 'rgba(34, 197, 94, 0.8)',
                    backgroundColor: 'rgba(34, 197, 94, 0.2)',
                    pointBackgroundColor: 'rgba(34, 197, 94, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(34, 197, 94, 1)'
                }, {
                    label: 'Team 2',
                    data: [...team1Data, ...Array(Math.max(0, Math.max(team0Data.length, team1Data.length, 6) - team1Data.length)).fill(0)],
                    borderColor: 'rgba(239, 68, 68, 0.8)',
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    pointBackgroundColor: 'rgba(239, 68, 68, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(239, 68, 68, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Win Rate Comparison (%)',
                        color: '#fff'
                    },
                    legend: {
                        labels: {
                            color: '#fff'
                        }
                    }
                },
                scales: {
                    r: {
                        angleLines: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        pointLabels: {
                            color: '#fff'
                        },
                        ticks: {
                            color: '#fff',
                            backdropColor: 'transparent'
                        },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                }
            }
        });
    }

    /**
     * Create win rate comparison chart
     */
    createWinRateComparisonChart(allPlayersData) {
        const ctx = document.getElementById('winRateComparisonChart').getContext('2d');
        
        const team0Data = allPlayersData.teams.team0
            .filter(p => p.statistics)
            .map(p => p.statistics.winRate);
            
        const team1Data = allPlayersData.teams.team1
            .filter(p => p.statistics)
            .map(p => p.statistics.winRate);
        
        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: Array.from({length: Math.max(team0Data.length, team1Data.length, 6)}, (_, i) => `P${i + 1}`),
                datasets: [{
                    label: 'Team 1',
                    data: [...team0Data, ...Array(Math.max(0, Math.max(team0Data.length, team1Data.length, 6) - team0Data.length)).fill(0)],
                    borderColor: 'rgba(34, 197, 94, 0.8)',
                    backgroundColor: 'rgba(34, 197, 94, 0.2)',
                    pointBackgroundColor: 'rgba(34, 197, 94, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(34, 197, 94, 1)'
                }, {
                    label: 'Team 2',
                    data: [...team1Data, ...Array(Math.max(0, Math.max(team0Data.length, team1Data.length, 6) - team1Data.length)).fill(0)],
                    borderColor: 'rgba(239, 68, 68, 0.8)',
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    pointBackgroundColor: 'rgba(239, 68, 68, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(239, 68, 68, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Win Rate Comparison (%)',
                        color: '#fff'
                    },
                    legend: {
                        labels: {
                            color: '#fff'
                        }
                    }
                },
                scales: {
                    r: {
                        angleLines: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        pointLabels: {
                            color: '#fff'
                        },
                        ticks: {
                            color: '#fff',
                            backdropColor: 'transparent'
                        },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                }
            }
        });
    }

    /**
     * Create KDA comparison chart
     */
    createKDAComparisonChart(allPlayersData) {
        const ctx = document.getElementById('kdaComparisonChart').getContext('2d');
        
        const allPlayers = [...allPlayersData.teams.team0, ...allPlayersData.teams.team1]
            .filter(p => p.statistics)
            .sort((a, b) => b.statistics.averageKDA - a.statistics.averageKDA);
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: allPlayers.map(p => this.formatPlayerName(p)),
                datasets: [{
                    label: 'Average KDA',
                    data: allPlayers.map(p => p.statistics.averageKDA),
                    backgroundColor: allPlayers.map(p => 
                        p.team === 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'
                    ),
                    borderColor: allPlayers.map(p => 
                        p.team === 0 ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)'
                    ),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'KDA Ranking',
                        color: '#fff'
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#fff'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#fff',
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    }

    /**
     * Progressive loading implementation - shows match immediately then loads player data
     * @param {Object} matchMetadata - Initial match data with basic player info
     * @param {Object} apiService - API service for fetching additional data
     */
    async renderProgressiveMatchAnalysis(matchMetadata, apiService) {
        // Phase 1: Display match overview and basic player cards immediately
        const resultsDiv = document.getElementById('results');
        
        if (!resultsDiv) {
            throw new Error('Results div not found. Make sure there is a div with id="results" in the HTML.');
        }
        
        // Show results div
        resultsDiv.classList.remove('hidden');
        
        // Create initial structure with match info and improved spacing
        const initialContent = `
            <div class="p-6 space-y-8">
                <div id="match-overview">
                    ${this.createMatchOverview(matchMetadata)}
                </div>
                
                <div id="loading-status" class="bg-gray-700 rounded-lg p-4">
                    <div class="flex items-center space-x-3">
                        <div class="animate-spin h-5 w-5 border-2 border-cyan-400 border-t-transparent rounded-full"></div>
                        <span class="text-cyan-400">Loading detailed player statistics...</span>
                    </div>
                    <div id="progress-bar" class="progress-indicator w-full h-3 mt-3">
                        <div id="progress-fill" class="progress-fill h-full" style="width: 0%"></div>
                    </div>
                    <div id="progress-text" class="text-sm text-gray-400 mt-2">Preparing player data...</div>
                </div>
                
            </div>
        `;
        
        resultsDiv.innerHTML = initialContent;
        
        // Phase 2: Start fetching player statistics in background
        const players = matchMetadata.playersSummary;
        const totalPlayers = players.length;
        let completedPlayers = 0;
        
        // Create team structures
        const enhancedTeams = {
            team0: players.filter(p => p.team === 0),
            team1: players.filter(p => p.team === 1)
        };
        
        // Update progress
        const updateProgress = (completed, total, currentPlayer = null) => {
            const percentage = Math.round((completed / total) * 100);
            const progressFill = document.getElementById('progress-fill');
            const progressText = document.getElementById('progress-text');
            
            if (progressFill) progressFill.style.width = `${percentage}%`;
            if (progressText) {
                if (currentPlayer) {
                    progressText.textContent = `Loading ${currentPlayer} (${completed}/${total})`;
                } else if (completed === total) {
                    progressText.textContent = 'All player data loaded! Generating insights...';
                } else {
                    progressText.textContent = `${completed}/${total} players loaded`;
                }
            }
        };
        
        // Fetch player data with progressive updates
        const enhancedPlayersData = await Promise.all(
            players.map(async (player, index) => {
                try {
                    // Update progress
                    const playerName = player.displayName || `Player ${player.accountId}`;
                    updateProgress(completedPlayers, totalPlayers, playerName);
                    
                    // Add delay to avoid rate limiting and show progressive loading
                    if (index > 0) {
                        await new Promise(resolve => setTimeout(resolve, 800));
                    }
                    
                    // Fetch detailed player statistics
                    const playerStats = await apiService.getPlayerMatchHistory(player.accountId, 50, 0, true);
                    
                    const enhancedPlayer = {
                        ...player,
                        totalGames: playerStats.totalMatches || 0,
                        statistics: playerStats.statistics || {
                            winRate: 0,
                            averageKDA: 0,
                            averageKills: 0,
                            averageDeaths: 0,
                            averageAssists: 0,
                            recentForm: []
                        }
                    };
                    
                    // Update the specific player card
                    await this.updatePlayerCard(enhancedPlayer);
                    
                    completedPlayers++;
                    updateProgress(completedPlayers, totalPlayers);
                    
                    return enhancedPlayer;
                    
                } catch (error) {
                    completedPlayers++;
                    updateProgress(completedPlayers, totalPlayers);
                    
                    // Return player with basic data only
                    return {
                        ...player,
                        totalGames: 0,
                        statistics: {
                            winRate: 0,
                            averageKDA: 0,
                            averageKills: 0,
                            averageDeaths: 0,
                            averageAssists: 0,
                            recentForm: []
                        },
                        error: error.message
                    };
                }
            })
        );
        
        // Phase 3: Update team structures and comparisons
        
        const finalTeamData = {
            team0: enhancedPlayersData.filter(p => p.team === 0),
            team1: enhancedPlayersData.filter(p => p.team === 1)
        };
        
        
        // Team comparison will be rendered in the final layout
        
        // Phase 4: Generate final insights and render with new three-section layout
        
        const finalMatchData = {
            ...matchMetadata,
            teams: finalTeamData
        };
        
        // Hide loading status
        const loadingStatus = document.getElementById('loading-status');
        if (loadingStatus) {
            loadingStatus.style.opacity = '0';
            setTimeout(() => loadingStatus.remove(), 500);
        }
        
        // Now render the final layout using the main renderMatchAnalysis method
        // but targeting the results div instead of chartsContainer
        const resultsContainer = document.getElementById('results');
        
        if (resultsContainer) {
            // Temporarily change the container ID so renderMatchAnalysis targets the right place
            const originalId = resultsContainer.id;
            resultsContainer.id = 'chartsContainer';
            
            try {
                await this.renderMatchAnalysis(finalMatchData, { teams: finalTeamData, matchInfo: matchMetadata.match_info });
            } catch (renderError) {
                throw renderError;
            }
            
            // Restore original ID
            resultsContainer.id = originalId;
        }
        
    }
    
    /**
     * Create initial player cards with loading placeholders
     */
    async createInitialPlayerCards(players) {
        const team0 = players.filter(p => p.team === 0);
        const team1 = players.filter(p => p.team === 1);
        
        
        // Limit to 6 players per team
        const team0Limited = team0.slice(0, 6);
        const team1Limited = team1.slice(0, 6);
        
        // Pad teams to ensure 6 slots
        while (team0Limited.length < 6) {
            team0Limited.push(null);
        }
        while (team1Limited.length < 6) {
            team1Limited.push(null);
        }
        
        return `
            <div class="hidden lg:block">
                <div class="teams-container">
                    <div class="teams-grid">
                        <div class="team-column">
                            <div class="team-header team-header-green">
                                <h4 class="text-lg font-semibold text-green-400">Team 1</h4>
                            </div>
                            <div class="team-cards">
                                ${(await Promise.all(team0Limited.map((player, index) => player ? this.createLoadingPlayerCard(player, 'green') : Promise.resolve(this.createEmptyLoadingSlot('green', index + 1))))).join('')}
                            </div>
                        </div>
                        <div class="team-column">
                            <div class="team-header team-header-red">
                                <h4 class="text-lg font-semibold text-red-400">Team 2</h4>
                            </div>
                            <div class="team-cards">
                                ${(await Promise.all(team1Limited.map((player, index) => player ? this.createLoadingPlayerCard(player, 'red') : Promise.resolve(this.createEmptyLoadingSlot('red', index + 1))))).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="teams-tabs lg:hidden">
                <div class="tab-buttons">
                    <button class="team-tab-btn team1-tab active" data-team="team1">Team 1</button>
                    <button class="team-tab-btn team2-tab" data-team="team2">Team 2</button>
                </div>
                <div class="tab-panels">
                    <div class="team-panel team1-panel active" data-team="team1">
                        <div class="team-cards player-stats-grid">
                            ${(await Promise.all(team0Limited.map((player, index) => player ? this.createLoadingPlayerCard(player, 'green') : Promise.resolve(this.createEmptyLoadingSlot('green', index + 1))))).join('')}
                        </div>
                    </div>
                    <div class="team-panel team2-panel" data-team="team2">
                        <div class="team-cards player-stats-grid">
                            ${(await Promise.all(team1Limited.map((player, index) => player ? this.createLoadingPlayerCard(player, 'red') : Promise.resolve(this.createEmptyLoadingSlot('red', index + 1))))).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Create a loading placeholder player card with consistent layout
     */
    async createLoadingPlayerCard(player, teamColor) {
        const textColor = teamColor === 'green' ? 'text-green-400' : 'text-red-400';
        
        const heroImageUrl = await this.getHeroThumbnailUrl(player.heroId);

        return `
            <div id="player-card-${player.accountId}" class="player-card team-${teamColor} rounded-lg p-5 min-h-[200px] flex flex-col justify-between transition-all duration-300">
                <!-- Top: Player info with hero icon -->
                <div class="flex items-center space-x-4 mb-4">
                    <!-- Enhanced hero icon matching the final design -->
                    <div class="hero-icon w-16 h-16 rounded-lg overflow-hidden border flex-shrink-0" 
                         style="border-color: ${this.getHeroColor(player.heroId)};">
                        ${player.heroId && heroImageUrl ? `<img src="${heroImageUrl}" alt="${this.getHeroName(player.heroId)}" class="w-full h-full object-cover">` : '<div class="w-full h-full bg-gradient-to-br flex items-center justify-center text-lg font-bold" style="background: linear-gradient(135deg, #374151, #1f2937);">?</div>'}
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold ${textColor} truncate">${this.formatPlayerName(player)}</h4>
                        <div class="stat-line text-sm text-gray-300 mt-1">
                            <span><span class="label">K/D/A:</span> <span class="value">${player.kills || 0}/${player.deaths || 0}/${player.assists || 0}</span></span>
                        <span><span class="label">Dmg:</span> <span class="value">${this.formatNumber(player.playerDamage || 0)}</span></span>
                        </div>
                        <p class="text-xs text-gray-500">Loading...</p>
                    </div>
                </div>
                
                <!-- Bottom: Loading placeholder stats grid -->
                <div class="stats space-y-3">
                    <!-- Primary stats row with loading animation -->
                    <div class="grid grid-cols-2 gap-4 text-center">
                        <div class="bg-gray-700/50 rounded-lg p-3">
                            <div class="animate-pulse">
                                <div class="h-6 bg-gray-600 rounded w-12 mx-auto mb-1"></div>
                                <div class="h-3 bg-gray-700 rounded w-16 mx-auto"></div>
                            </div>
                        </div>
                        <div class="bg-gray-700/50 rounded-lg p-3">
                            <div class="animate-pulse">
                                <div class="h-6 bg-gray-600 rounded w-12 mx-auto mb-1"></div>
                                <div class="h-3 bg-gray-700 rounded w-16 mx-auto"></div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Secondary stats row -->
                    <div class="grid grid-cols-2 gap-4 text-center text-sm">
                        <div class="animate-pulse">
                            <div class="h-4 bg-gray-600 rounded w-10 mx-auto mb-1"></div>
                            <div class="h-3 bg-gray-700 rounded w-12 mx-auto"></div>
                        </div>
                        <div class="animate-pulse">
                            <div class="h-4 bg-gray-600 rounded w-8 mx-auto mb-1"></div>
                            <div class="h-3 bg-gray-700 rounded w-14 mx-auto"></div>
                        </div>
                    </div>
                    
                    <!-- Recent form placeholder -->
                    <div class="text-center border-t border-gray-600 pt-3">
                        <p class="text-xs text-gray-400 mb-2">Loading stats...</p>
                        <div class="flex justify-center items-center space-x-1">
                            <div class="animate-pulse flex space-x-1">
                                <div class="w-2 h-2 bg-gray-600 rounded-full"></div>
                                <div class="w-2 h-2 bg-gray-600 rounded-full"></div>
                                <div class="w-2 h-2 bg-gray-600 rounded-full"></div>
                                <div class="w-2 h-2 bg-gray-600 rounded-full"></div>
                                <div class="w-2 h-2 bg-gray-600 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Update a specific player card with loaded data
     */
    async updatePlayerCard(player) {
        const cardElement = document.getElementById(`player-card-${player.accountId}`);
        if (!cardElement) return;

        const teamColor = player.team === 0 ? 'green' : 'red';
        const newCardHTML = await this.createHistoricalPlayerCard(player, teamColor);
        
        // Create a temporary container to parse the new HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = newCardHTML;
        const newCard = tempDiv.firstElementChild;
        
        // Replace the old card with the new one
        cardElement.parentNode.replaceChild(newCard, cardElement);
        
        // Add a subtle animation to show the update
        newCard.style.opacity = '0';
        newCard.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            newCard.style.transition = 'all 0.3s ease';
            newCard.style.opacity = '1';
            newCard.style.transform = 'scale(1)';
        }, 50);
    }

    /**
     * Create an empty loading slot for missing players during initial load
     */
    createEmptyLoadingSlot(teamColor, slotNumber) {
        return `
            <div class="player-card team-${teamColor} rounded-lg p-5 min-h-[200px] flex flex-col justify-center items-center opacity-50">
                <div class="text-gray-500 text-center">
                    <p class="text-lg font-semibold mb-2">Player Slot ${slotNumber}</p>
                    <p class="text-sm">Empty</p>
                </div>
            </div>
        `;
    }

    /**
     * Create an empty player slot for missing players
     */
    createEmptyPlayerSlot(teamColor, slotNumber) {
        return `
            <div class="player-card team-${teamColor} rounded-lg p-5 min-h-[200px] flex flex-col justify-center items-center opacity-50">
                <div class="text-gray-500 text-center">
                    <p class="text-lg font-semibold mb-2">Player Slot ${slotNumber}</p>
                    <p class="text-sm">Empty</p>
                </div>
            </div>
        `;
    }

    /**
     * Initialize mobile team tab functionality
     */
    initializeTeamTabs() {
        const tabButtons = document.querySelectorAll('.team-tab-btn');
        const teamPanels = document.querySelectorAll('.team-panel');
        
        if (tabButtons.length === 0) return; // No tabs found
        
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const targetTeam = e.currentTarget.dataset.team;
                
                // Update button states
                tabButtons.forEach(btn => {
                    btn.classList.remove('active');
                });
                
                e.currentTarget.classList.add('active');
                
                // Update panel visibility
                teamPanels.forEach(panel => {
                    if (panel.dataset.team === targetTeam) {
                        panel.classList.add('active');
                    } else {
                        panel.classList.remove('active');
                    }
                });
            });
        });
    }

}

// Export for use in other files
window.MatchAnalyzer = MatchAnalyzer;