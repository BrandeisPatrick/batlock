/**
 * Match Analyzer - Enhanced visualization for Deadlock match analysis
 */

// Match Analyzer Component
class MatchAnalyzer {
    constructor() {
        this.currentMatchData = null;
        this.playerStatsCache = new Map();
    }

    /**
     * Create the enhanced match overview section
     */
    createMatchOverview(matchData) {
        
        // Handle both possible data structure formats
        const matchInfo = matchData.matchInfo || matchData.match_info;
        
        // Fix 1: Robust match ID handling
        const matchId = matchData.matchId ?? matchData.id ?? 'Unknown';
        
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
            <div class="bg-gray-800 rounded-lg p-6 mb-6">
                <div class="flex flex-col md:flex-row justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-bold text-cyan-400">Match ${matchId}</h2>
                        <p class="text-gray-400 mt-1">Duration: ${duration}:${String(seconds).padStart(2, '0')}</p>
                    </div>
                    <div class="mt-4 md:mt-0 text-center">
                        <p class="text-sm text-gray-400">Winner</p>
                        <p class="text-2xl font-bold ${matchInfo.winning_team === 0 ? 'text-green-400' : 'text-red-400'}">
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
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <!-- Team 1 Stats -->
                <div class="bg-gradient-to-br from-green-900/20 to-gray-800 rounded-lg p-6 border border-green-500/30">
                    <h3 class="text-xl font-bold text-green-400 mb-4">Team 1 (Winners)</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="text-center">
                            <p class="text-3xl font-bold text-white">${team0AvgWR}%</p>
                            <p class="text-sm text-gray-400">Avg Win Rate</p>
                        </div>
                        <div class="text-center">
                            <p class="text-3xl font-bold text-white">${team0AvgKDA}</p>
                            <p class="text-sm text-gray-400">Avg KDA</p>
                        </div>
                    </div>
                </div>

                <!-- Team 2 Stats -->
                <div class="bg-gradient-to-br from-red-900/20 to-gray-800 rounded-lg p-6 border border-red-500/30">
                    <h3 class="text-xl font-bold text-red-400 mb-4">Team 2</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="text-center">
                            <p class="text-3xl font-bold text-white">${team1AvgWR}%</p>
                            <p class="text-sm text-gray-400">Avg Win Rate</p>
                        </div>
                        <div class="text-center">
                            <p class="text-3xl font-bold text-white">${team1AvgKDA}</p>
                            <p class="text-sm text-gray-400">Avg KDA</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create Section 1: Game Stats (KDA, Damage, Healing)
     */
    createGameStatsSection(team0Players, team1Players) {
        return `
            <section class="game-stats-section bg-gray-800 rounded-lg p-6 mb-8">
                <h2 class="text-2xl font-bold text-white mb-6 text-center">🎮 Match Performance</h2>
                
                <!-- Team Headers -->
                <div class="grid grid-cols-2 gap-6 mb-4">
                    <div class="text-center">
                        <h3 class="text-lg font-semibold text-green-400">Team 1</h3>
                    </div>
                    <div class="text-center">
                        <h3 class="text-lg font-semibold text-red-400">Team 2</h3>
                    </div>
                </div>
                
                <!-- Stats Table -->
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-600">
                                <th class="text-left py-3 px-2">Player</th>
                                <th class="text-center py-3 px-2">K/D/A</th>
                                <th class="text-center py-3 px-2">Damage</th>
                                <th class="text-center py-3 px-2">Healing</th>
                                <th class="text-center py-3 px-2 border-l border-gray-600">Player</th>
                                <th class="text-center py-3 px-2">K/D/A</th>
                                <th class="text-center py-3 px-2">Damage</th>
                                <th class="text-center py-3 px-2">Healing</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.createGameStatsRows(team0Players, team1Players)}
                        </tbody>
                    </table>
                </div>
            </section>
        `;
    }

    /**
     * Create rows for the game stats table
     */
    createGameStatsRows(team0Players, team1Players) {
        const maxPlayers = Math.max(team0Players.length, team1Players.length, 6);
        let rows = '';
        
        for (let i = 0; i < maxPlayers; i++) {
            const player0 = team0Players[i];
            const player1 = team1Players[i];
            
            rows += `
                <tr class="border-b border-gray-700 hover:bg-gray-700/30">
                    <!-- Team 1 Player -->
                    <td class="py-3 px-2">
                        ${player0 ? `
                            <div class="flex items-center space-x-2">
                                <div class="w-8 h-8 rounded bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-xs font-bold">
                                    H${player0.heroId || '?'}
                                </div>
                                <span class="text-green-400 font-medium">${player0.displayName || `Player ${player0.accountId}`}</span>
                            </div>
                        ` : '<span class="text-gray-500">Empty Slot</span>'}
                    </td>
                    <td class="text-center py-3 px-2">
                        ${player0 ? `<span class="font-mono">${player0.kills || 0}/${player0.deaths || 0}/${player0.assists || 0}</span>` : '-'}
                    </td>
                    <td class="text-center py-3 px-2 text-orange-400">
                        ${player0 ? `${this.formatNumber(player0.playerDamage || 0)}` : '-'}
                    </td>
                    <td class="text-center py-3 px-2 text-green-400">
                        ${player0 ? `${this.formatNumber(player0.healingOutput || 0)}` : '-'}
                    </td>
                    
                    <!-- Team 2 Player -->
                    <td class="py-3 px-2 border-l border-gray-600">
                        ${player1 ? `
                            <div class="flex items-center space-x-2">
                                <div class="w-8 h-8 rounded bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-xs font-bold">
                                    H${player1.heroId || '?'}
                                </div>
                                <span class="text-red-400 font-medium">${player1.displayName || `Player ${player1.accountId}`}</span>
                            </div>
                        ` : '<span class="text-gray-500">Empty Slot</span>'}
                    </td>
                    <td class="text-center py-3 px-2">
                        ${player1 ? `<span class="font-mono">${player1.kills || 0}/${player1.deaths || 0}/${player1.assists || 0}</span>` : '-'}
                    </td>
                    <td class="text-center py-3 px-2 text-orange-400">
                        ${player1 ? `${this.formatNumber(player1.playerDamage || 0)}` : '-'}
                    </td>
                    <td class="text-center py-3 px-2 text-green-400">
                        ${player1 ? `${this.formatNumber(player1.healingOutput || 0)}` : '-'}
                    </td>
                </tr>
            `;
        }
        
        return rows;
    }

    /**
     * Create Section 2: Lane Economics (Denies, Economics by Lane)
     */
    createLaneEconomicsSection(team0Players, team1Players) {
        return `
            <section class="lane-economics-section bg-gray-800 rounded-lg p-6 mb-8">
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
                
                <!-- Economics Table -->
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-600">
                                <th class="text-left py-3 px-2">Player</th>
                                <th class="text-center py-3 px-2">Net Worth</th>
                                <th class="text-center py-3 px-2">Last Hits</th>
                                <th class="text-center py-3 px-2">Denies</th>
                                <th class="text-center py-3 px-2 border-l border-gray-600">Player</th>
                                <th class="text-center py-3 px-2">Net Worth</th>
                                <th class="text-center py-3 px-2">Last Hits</th>
                                <th class="text-center py-3 px-2">Denies</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.createLaneEconomicsRows(team0Players, team1Players)}
                        </tbody>
                    </table>
                </div>
                
                <!-- Lane Comparison Summary -->
                <div class="mt-6 pt-6 border-t border-gray-600">
                    ${this.createLaneComparisonSummary(team0Players, team1Players)}
                </div>
            </section>
        `;
    }

    /**
     * Create rows for the lane economics table
     */
    createLaneEconomicsRows(team0Players, team1Players) {
        const maxPlayers = Math.max(team0Players.length, team1Players.length, 6);
        let rows = '';
        
        for (let i = 0; i < maxPlayers; i++) {
            const player0 = team0Players[i];
            const player1 = team1Players[i];
            
            rows += `
                <tr class="border-b border-gray-700 hover:bg-gray-700/30">
                    <!-- Team 1 Player -->
                    <td class="py-3 px-2">
                        ${player0 ? `
                            <div class="flex items-center space-x-2">
                                <div class="w-8 h-8 rounded bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-xs font-bold">
                                    H${player0.heroId || '?'}
                                </div>
                                <span class="text-green-400 font-medium">${player0.displayName || `Player ${player0.accountId}`}</span>
                            </div>
                        ` : '<span class="text-gray-500">Empty Slot</span>'}
                    </td>
                    <td class="text-center py-3 px-2 text-yellow-400">
                        ${player0 ? `$${this.formatNumber(player0.netWorth || 0)}` : '-'}
                    </td>
                    <td class="text-center py-3 px-2 text-blue-400">
                        ${player0 ? `${player0.lastHits || 0}` : '-'}
                    </td>
                    <td class="text-center py-3 px-2 text-purple-400">
                        ${player0 ? `${player0.denies || 0}` : '-'}
                    </td>
                    
                    <!-- Team 2 Player -->
                    <td class="py-3 px-2 border-l border-gray-600">
                        ${player1 ? `
                            <div class="flex items-center space-x-2">
                                <div class="w-8 h-8 rounded bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-xs font-bold">
                                    H${player1.heroId || '?'}
                                </div>
                                <span class="text-red-400 font-medium">${player1.displayName || `Player ${player1.accountId}`}</span>
                            </div>
                        ` : '<span class="text-gray-500">Empty Slot</span>'}
                    </td>
                    <td class="text-center py-3 px-2 text-yellow-400">
                        ${player1 ? `$${this.formatNumber(player1.netWorth || 0)}` : '-'}
                    </td>
                    <td class="text-center py-3 px-2 text-blue-400">
                        ${player1 ? `${player1.lastHits || 0}` : '-'}
                    </td>
                    <td class="text-center py-3 px-2 text-purple-400">
                        ${player1 ? `${player1.denies || 0}` : '-'}
                    </td>
                </tr>
            `;
        }
        
        return rows;
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
                            $${this.formatNumber(team0Stats.totalNetWorth)}
                        </span>
                        <span class="text-gray-500">vs</span>
                        <span class="text-lg font-bold ${team1Stats.totalNetWorth > team0Stats.totalNetWorth ? 'text-red-400' : 'text-gray-300'}">
                            $${this.formatNumber(team1Stats.totalNetWorth)}
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
     * Create Section 3: Historical Player Data (existing player cards)
     */
    createHistoricalDataSection(team0Players, team1Players) {
        // Pad teams to 6 players if needed
        const team0Padded = [...team0Players];
        const team1Padded = [...team1Players];
        
        while (team0Padded.length < 6) {
            team0Padded.push(null);
        }
        while (team1Padded.length < 6) {
            team1Padded.push(null);
        }
        
        const team0Cards = team0Padded
            .slice(0, 6)
            .map((player, index) => {
                if (player) {
                    return this.createHistoricalPlayerCard(player, 'green');
                } else {
                    return this.createEmptyPlayerSlot('green', index + 1);
                }
            })
            .join('');
            
        const team1Cards = team1Padded
            .slice(0, 6)
            .map((player, index) => {
                if (player) {
                    return this.createHistoricalPlayerCard(player, 'red');
                } else {
                    return this.createEmptyPlayerSlot('red', index + 1);
                }
            })
            .join('');
        
        return `
            <section class="historical-data-section mb-8">
                <h2 class="text-2xl font-bold text-white mb-6 text-center">📊 Player Historical Performance</h2>
                
                <!-- Two-column layout wrapper -->
                <div class="teams-container" id="teamsContainer">
                    <!-- Two-column grid layout -->
                    <div class="teams-grid">
                        <!-- Team 1 Column -->
                        <div class="team-column">
                            <div class="team-header team-header-green">
                                <h4 class="text-lg font-semibold text-green-400">
                                    Team 1 Historical Stats
                                </h4>
                            </div>
                            <div class="team-cards">
                                ${team0Cards}
                            </div>
                        </div>
                        
                        <!-- Team 2 Column -->
                        <div class="team-column">
                            <div class="team-header team-header-red">
                                <h4 class="text-lg font-semibold text-red-400">
                                    Team 2 Historical Stats
                                </h4>
                            </div>
                            <div class="team-cards">
                                ${team1Cards}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    /**
     * Format numbers for display (e.g., 12000 -> 12K)
     */
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    /**
     * Create historical player cards (renamed from createPlayerCard)
     */
    createHistoricalPlayerCard(player, teamColor) {
        const stats = player.statistics;
        const borderColor = teamColor === 'green' ? 'border-green-500/30' : 'border-red-500/30';
        const gradientFrom = teamColor === 'green' ? 'from-green-900/10' : 'from-red-900/10';
        const textColor = teamColor === 'green' ? 'text-green-400' : 'text-red-400';
        
        if (!stats) {
            return `
                <div class="player-card bg-gradient-to-br ${gradientFrom} to-gray-800 rounded-lg p-5 border ${borderColor} min-h-[200px] flex flex-col justify-between">
                    <div class="flex items-center space-x-4 mb-4">
                        <div class="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center flex-shrink-0 border border-gray-600">
                            <span class="text-lg font-bold text-gray-300">H${player.heroId}</span>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h4 class="font-bold ${textColor} truncate">${player.displayName || `Player ${player.accountId}`}</h4>
                            <p class="text-sm text-gray-400">Match: ${player.kills}/${player.deaths}/${player.assists}</p>
                        </div>
                    </div>
                    <p class="text-center text-gray-500">Loading stats...</p>
                </div>
            `;
        }

        const recentForm = stats.recentForm || [];
        const formIndicators = recentForm.slice(0, 5).map(result => 
            `<span class="inline-block w-2 h-2 rounded-full ${result === 'W' ? 'bg-green-400' : 'bg-red-400'}"></span>`
        ).join(' ');
        
        const winRateColor = stats.winRate >= 50 ? 'text-green-400' : 'text-red-400';
        const kdaColor = stats.averageKDA >= 3 ? 'text-green-400' : 
                        stats.averageKDA >= 2 ? 'text-yellow-400' : 'text-red-400';

        return `
            <div class="player-card bg-gradient-to-br ${gradientFrom} to-gray-800 rounded-lg p-5 border ${borderColor} min-h-[200px] flex flex-col justify-between transition-all duration-300 hover:transform hover:scale-105">
                <!-- Top: Player info with hero icon -->
                <div class="flex items-center space-x-4 mb-4">
                    <div class="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center flex-shrink-0 border border-gray-600">
                        <span class="text-lg font-bold text-gray-300">H${player.heroId}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold ${textColor} truncate">${player.displayName || `Player ${player.accountId}`}</h4>
                        <p class="text-sm text-gray-400">Match: ${player.kills}/${player.deaths}/${player.assists}</p>
                        <p class="text-xs text-gray-500">${player.totalGames || 0} total games</p>
                    </div>
                </div>
                
                <!-- Bottom: Stats grid with consistent spacing -->
                <div class="stats space-y-3">
                    <!-- Primary stats row -->
                    <div class="grid grid-cols-2 gap-4 text-center">
                        <div class="bg-gray-700/50 rounded-lg p-3">
                            <p class="text-xl font-bold ${winRateColor}">${stats.winRate}%</p>
                            <p class="text-xs text-gray-400">Win Rate</p>
                        </div>
                        <div class="bg-gray-700/50 rounded-lg p-3">
                            <p class="text-xl font-bold ${kdaColor}">${stats.averageKDA}</p>
                            <p class="text-xs text-gray-400">Avg KDA</p>
                        </div>
                    </div>
                    
                    <!-- Secondary stats row -->
                    <div class="grid grid-cols-2 gap-4 text-center text-sm">
                        <div>
                            <p class="font-semibold text-cyan-400">${stats.averageKills}/${stats.averageDeaths}</p>
                            <p class="text-xs text-gray-500">Avg K/D</p>
                        </div>
                        <div>
                            <p class="font-semibold text-yellow-400">${stats.averageAssists}</p>
                            <p class="text-xs text-gray-500">Avg Assists</p>
                        </div>
                    </div>
                    
                    <!-- Recent form -->
                    <div class="text-center border-t border-gray-600 pt-3">
                        <p class="text-xs text-gray-400 mb-2">Recent Form</p>
                        <div class="flex justify-center items-center space-x-1">
                            ${formIndicators || '<span class="text-xs text-gray-500">No data</span>'}
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
        
        
        // Create the new three-section layout
        const gameStatsSection = this.createGameStatsSection(team0Players, team1Players);
        const laneEconomicsSection = this.createLaneEconomicsSection(team0Players, team1Players);
        const historicalDataSection = this.createHistoricalDataSection(team0Players, team1Players);
        const teamComparison = this.createTeamComparison(team0Players, team1Players);
        
        container.innerHTML = `
            ${overview}
            ${teamComparison}
            ${gameStatsSection}
            ${laneEconomicsSection}
            ${historicalDataSection}
        `;
        
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
                    <p class="text-lg font-semibold text-white">${highestWR.displayName || `Player ${highestWR.accountId}`}</p>
                    <p class="text-2xl font-bold text-green-400">${highestWR.statistics.winRate}%</p>
                </div>
                
                <div class="text-center">
                    <p class="text-sm text-gray-400 mb-1">Best KDA</p>
                    <p class="text-lg font-semibold text-white">${highestKDA.displayName || `Player ${highestKDA.accountId}`}</p>
                    <p class="text-2xl font-bold text-cyan-400">${highestKDA.statistics.averageKDA}</p>
                </div>
                
                <div class="text-center">
                    <p class="text-sm text-gray-400 mb-1">Most Experienced</p>
                    <p class="text-lg font-semibold text-white">${mostExperienced.displayName || `Player ${mostExperienced.accountId}`}</p>
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
                labels: allPlayers.map(p => p.displayName || `Player ${p.accountId}`),
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
                    <div id="progress-bar" class="w-full bg-gray-600 rounded-full h-2 mt-3">
                        <div id="progress-fill" class="bg-cyan-400 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
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
                    this.updatePlayerCard(enhancedPlayer);
                    
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
                        }
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
            
            await this.renderMatchAnalysis(finalMatchData, { teams: finalTeamData, matchInfo: matchMetadata.match_info });
            
            // Restore original ID
            resultsContainer.id = originalId;
        }
        
    }
    
    /**
     * Create initial player cards with loading placeholders
     */
    createInitialPlayerCards(players) {
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
        
        // Two-column layout matching the main view
        return `
            <div class="teams-container">
                <!-- Desktop: Two-column grid layout -->
                <div class="teams-grid">
                    <!-- Team 1 Column -->
                    <div class="team-column">
                        <div class="team-header team-header-green">
                            <h4 class="text-lg font-semibold text-green-400">
                                Team 1
                            </h4>
                        </div>
                        <div class="team-cards">
                            ${team0Limited.map((player, index) => player ? this.createLoadingPlayerCard(player, 'green') : this.createEmptyLoadingSlot('green', index + 1)).join('')}
                        </div>
                    </div>
                    
                    <!-- Team 2 Column -->
                    <div class="team-column">
                        <div class="team-header team-header-red">
                            <h4 class="text-lg font-semibold text-red-400">
                                Team 2
                            </h4>
                        </div>
                        <div class="team-cards">
                            ${team1Limited.map((player, index) => player ? this.createLoadingPlayerCard(player, 'red') : this.createEmptyLoadingSlot('red', index + 1)).join('')}
                        </div>
                    </div>
                </div>
                
                <!-- Mobile: Tab navigation -->
                <div class="teams-tabs">
                    <div class="tab-buttons">
                        <button class="team-tab-btn team1-tab active" data-team="team1">
                            Team 1
                        </button>
                        <button class="team-tab-btn team2-tab" data-team="team2">
                            Team 2
                        </button>
                    </div>
                    <div class="tab-panels">
                        <div class="team-panel team1-panel active" data-team="team1">
                            <div class="team-cards">
                                ${team0Limited.map((player, index) => player ? this.createLoadingPlayerCard(player, 'green') : this.createEmptyLoadingSlot('green', index + 1)).join('')}
                            </div>
                        </div>
                        <div class="team-panel team2-panel" data-team="team2">
                            <div class="team-cards">
                                ${team1Limited.map((player, index) => player ? this.createLoadingPlayerCard(player, 'red') : this.createEmptyLoadingSlot('red', index + 1)).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Create a loading placeholder player card with consistent layout
     */
    createLoadingPlayerCard(player, teamColor) {
        const borderColor = teamColor === 'green' ? 'border-green-500/30' : 'border-red-500/30';
        const textColor = teamColor === 'green' ? 'text-green-400' : 'text-red-400';
        const gradientFrom = teamColor === 'green' ? 'from-green-900/10' : 'from-red-900/10';
        
        return `
            <div id="player-card-${player.accountId}" class="player-card bg-gradient-to-br ${gradientFrom} to-gray-800 rounded-lg p-5 border ${borderColor} min-h-[200px] flex flex-col justify-between transition-all duration-300">
                <!-- Top: Player info with hero icon -->
                <div class="flex items-center space-x-4 mb-4">
                    <!-- Enhanced hero icon matching the final design -->
                    <div class="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center flex-shrink-0 border border-gray-600">
                        <span class="text-lg font-bold text-gray-300">H${player.heroId}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold ${textColor} truncate">${player.displayName || `Player ${player.accountId}`}</h4>
                        <p class="text-sm text-gray-400">Match: ${player.kills}/${player.deaths}/${player.assists}</p>
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
    updatePlayerCard(player) {
        const cardElement = document.getElementById(`player-card-${player.accountId}`);
        if (!cardElement) return;
        
        const teamColor = player.team === 0 ? 'green' : 'red';
        const newCardHTML = this.createPlayerCard(player, teamColor);
        
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
        const borderColor = teamColor === 'green' ? 'border-green-500/30' : 'border-red-500/30';
        const gradientFrom = teamColor === 'green' ? 'from-green-900/10' : 'from-red-900/10';
        
        return `
            <div class="player-card bg-gradient-to-br ${gradientFrom} to-gray-800 rounded-lg p-5 border ${borderColor} min-h-[200px] flex flex-col justify-center items-center opacity-50">
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
        const borderColor = teamColor === 'green' ? 'border-green-500/30' : 'border-red-500/30';
        const gradientFrom = teamColor === 'green' ? 'from-green-900/10' : 'from-red-900/10';
        
        return `
            <div class="player-card bg-gradient-to-br ${gradientFrom} to-gray-800 rounded-lg p-5 border ${borderColor} min-h-[200px] flex flex-col justify-center items-center opacity-50">
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