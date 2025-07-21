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
        console.log('🔍 Match data structure in createMatchOverview:', {
            hasMatchData: !!matchData,
            hasMatchInfo: !!matchData?.matchInfo,
            hasMatch_info: !!matchData?.match_info,
            keys: matchData ? Object.keys(matchData) : []
        });
        
        // Handle both possible data structure formats
        const matchInfo = matchData.matchInfo || matchData.match_info;
        
        if (!matchInfo) {
            console.warn('⚠️ No match info found, using fallback data');
            return `
                <div class="bg-gray-800 rounded-lg p-6 mb-6">
                    <div class="flex flex-col md:flex-row justify-between items-center">
                        <div>
                            <h2 class="text-2xl font-bold text-cyan-400">Match ${matchData.matchId}</h2>
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
                        <h2 class="text-2xl font-bold text-cyan-400">Match ${matchData.matchId}</h2>
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
     * Create individual player cards with enhanced stats
     */
    createPlayerCard(player, teamColor) {
        const stats = player.statistics;
        const borderColor = teamColor === 'green' ? 'border-green-500/30' : 'border-red-500/30';
        const gradientFrom = teamColor === 'green' ? 'from-green-900/10' : 'from-red-900/10';
        
        if (!stats) {
            return `
                <div class="bg-gradient-to-br ${gradientFrom} to-gray-800 rounded-lg p-4 border ${borderColor}">
                    <div class="flex items-center justify-between mb-3">
                        <div>
                            <p class="font-semibold text-white">${player.displayName || `Player ${player.accountId}`}</p>
                            <p class="text-xs text-gray-400">Hero ${player.heroId}</p>
                        </div>
                    </div>
                    <p class="text-center text-gray-500">Loading stats...</p>
                </div>
            `;
        }

        const recentForm = stats.recentForm ? stats.recentForm.slice(0, 5).join(' ') : '';
        const winRateColor = stats.winRate >= 50 ? 'text-green-400' : 'text-red-400';

        return `
            <div class="bg-gradient-to-br ${gradientFrom} to-gray-800 rounded-lg p-3 border ${borderColor} hover:border-opacity-50 transition-all">
                <div class="flex items-center justify-between gap-4">
                    <!-- Player Info -->
                    <div class="flex-1 min-w-0">
                        <p class="font-semibold text-white truncate">${player.displayName || `Player ${player.accountId}`}</p>
                        <p class="text-xs text-gray-400">Hero ${player.heroId} • ${player.totalGames || 0} games</p>
                    </div>
                    
                    <!-- Stats Section -->
                    <div class="flex items-center gap-4 flex-shrink-0">
                        <!-- Win Rate -->
                        <div class="text-center">
                            <p class="text-lg font-bold ${winRateColor}">${stats.winRate}%</p>
                            <p class="text-xs text-gray-400">Win Rate</p>
                        </div>
                        
                        <!-- KDA -->
                        <div class="text-center">
                            <p class="text-lg font-bold text-cyan-400">${stats.averageKDA}</p>
                            <p class="text-xs text-gray-400">KDA</p>
                        </div>
                        
                        <!-- K/D -->
                        <div class="text-center">
                            <p class="text-sm font-semibold text-gray-300">${stats.averageKills}/<span class="text-red-400">${stats.averageDeaths}</span></p>
                            <p class="text-xs text-gray-400">K/D</p>
                        </div>
                        
                        <!-- Recent Form -->
                        ${recentForm ? `
                            <div class="text-center">
                                <p class="text-sm font-mono tracking-wider">${recentForm}</p>
                                <p class="text-xs text-gray-400">Form</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Create the main match analysis view
     */
    async renderMatchAnalysis(matchData, allPlayersData) {
        console.log('🎨 renderMatchAnalysis called with:', {
            hasMatchData: !!matchData,
            hasAllPlayersData: !!allPlayersData,
            matchId: matchData?.matchId || allPlayersData?.matchId
        });
        
        const container = document.getElementById('chartsContainer');
        
        if (!container) {
            console.error('❌ Charts container not found in DOM');
            throw new Error('Charts container not found');
        }
        
        console.log('🧹 Clearing existing content...');
        // Clear existing content
        container.innerHTML = '';
        container.classList.remove('hidden');
        
        console.log('📋 Creating match overview...');
        // Create match overview
        const overview = this.createMatchOverview(matchData);
        
        console.log('⚖️ Creating team comparison...', {
            team0Count: allPlayersData?.teams?.team0?.length || 0,
            team1Count: allPlayersData?.teams?.team1?.length || 0
        });
        // Create team comparison
        const teamComparison = this.createTeamComparison(
            allPlayersData.teams.team0,
            allPlayersData.teams.team1
        );
        
        console.log('🃏 Creating player cards...');
        // Create player cards for both teams
        const team0Cards = allPlayersData.teams.team0
            .sort((a, b) => a.playerSlot - b.playerSlot)
            .map((player, index) => {
                console.log(`📊 Creating card for Team 0 Player ${index + 1}:`, player.accountId);
                return this.createPlayerCard(player, 'green');
            })
            .join('');
            
        const team1Cards = allPlayersData.teams.team1
            .sort((a, b) => a.playerSlot - b.playerSlot)
            .map((player, index) => {
                console.log(`📊 Creating card for Team 1 Player ${index + 1}:`, player.accountId);
                return this.createPlayerCard(player, 'red');
            })
            .join('');
        
        console.log('🖼️ Rendering complete UI to container...');
        // Render the complete UI
        container.innerHTML = `
            ${overview}
            ${teamComparison}
            
            <!-- Players Section -->
            <div class="mb-8">
                <h3 class="text-2xl font-bold text-white mb-6">Player Performance Analysis</h3>
                
                <!-- Team 1 Players -->
                <div class="mb-8">
                    <h4 class="text-lg font-semibold text-green-400 mb-4">Team 1 - Winners</h4>
                    <div class="space-y-3">
                        ${team0Cards}
                    </div>
                </div>
                
                <!-- Team 2 Players -->
                <div>
                    <h4 class="text-lg font-semibold text-red-400 mb-4">Team 2</h4>
                    <div class="space-y-3">
                        ${team1Cards}
                    </div>
                </div>
            </div>
            
            <!-- Additional Stats Section -->
            <div class="bg-gray-800 rounded-lg p-6">
                <h3 class="text-xl font-bold text-white mb-4">Match Insights</h3>
                ${this.createMatchInsights(allPlayersData)}
            </div>
        `;
        
        console.log('📊 Creating interactive charts...');
        // Add interactive charts after rendering
        this.createInteractiveCharts(allPlayersData);
        
        console.log('✅ renderMatchAnalysis completed successfully');
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
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
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
}

// Export for use in other files
window.MatchAnalyzer = MatchAnalyzer;