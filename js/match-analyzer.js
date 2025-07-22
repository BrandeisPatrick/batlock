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
        
        // Fix 1: Robust match ID handling
        const matchId = matchData.matchId ?? matchData.id ?? 'Unknown';
        
        if (!matchInfo) {
            console.warn('⚠️ No match info found, using fallback data');
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
     * Create individual player cards with enhanced stats and consistent layout
     */
    createPlayerCard(player, teamColor) {
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

        // Fix 3: Unified card heights and consistent padding
        return `
            <div class="player-card bg-gradient-to-br ${gradientFrom} to-gray-800 rounded-lg p-5 border ${borderColor} min-h-[200px] flex flex-col justify-between transition-all duration-300 hover:transform hover:scale-105">
                <!-- Top: Player info with hero icon -->
                <div class="flex items-center space-x-4 mb-4">
                    <!-- Fix 5: Enhanced hero icon placeholder (ready for actual icons) -->
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
        // Create player cards for both teams, expecting 6 players each
        const team0Cards = allPlayersData.teams.team0
            .sort((a, b) => a.playerSlot - b.playerSlot)
            .slice(0, 6) // Ensure exactly 6 players
            .map((player, index) => {
                console.log(`📊 Creating card for Team 0 Player ${index + 1}:`, player.accountId);
                return this.createPlayerCard(player, 'green');
            })
            .join('');
            
        const team1Cards = allPlayersData.teams.team1
            .sort((a, b) => a.playerSlot - b.playerSlot)
            .slice(0, 6) // Ensure exactly 6 players
            .map((player, index) => {
                console.log(`📊 Creating card for Team 1 Player ${index + 1}:`, player.accountId);
                return this.createPlayerCard(player, 'red');
            })
            .join('');
        
        console.log('🖼️ Rendering complete UI to container...');
        // MODIFIED: Tailored grid for 6 players per team (2 columns, 3 rows per team on md screens)
        container.innerHTML = `
            ${overview}
            ${teamComparison}
            
            <!-- Players Section -->
            <div class="mb-8">
                <h3 class="text-2xl font-bold text-white mb-6">Player Performance Analysis</h3>
                
                <!-- Fix 2 & 4: Flex container for teams with 3-column grid -->
                <div class="flex flex-col lg:flex-row gap-6">
                    <!-- Team 1 Players -->
                    <div class="flex-1">
                        <h4 class="text-lg font-semibold text-green-400 mb-4">Team 1 - Winners</h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                            ${team0Cards}
                        </div>
                    </div>
                    
                    <!-- Team 2 Players -->
                    <div class="flex-1">
                        <h4 class="text-lg font-semibold text-red-400 mb-4">Team 2</h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                            ${team1Cards}
                        </div>
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
        console.log('🚀 Starting progressive match analysis...');
        
        // Phase 1: Display match overview and basic player cards immediately
        const resultsDiv = document.getElementById('results');
        
        if (!resultsDiv) {
            throw new Error('Results div not found. Make sure there is a div with id="results" in the HTML.');
        }
        
        // Show results div and hide fallback charts
        resultsDiv.classList.remove('hidden');
        const chartsContainer = document.getElementById('chartsContainer');
        if (chartsContainer) chartsContainer.classList.add('hidden');
        
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
                
                <div id="player-cards-section">
                    <h3 class="text-2xl font-bold text-white mb-6">Player Performance Analysis</h3>
                    <div id="team-sections">
                        ${this.createInitialPlayerCards(matchMetadata.playersSummary)}
                    </div>
                </div>
                
                <div id="team-comparison" class="hidden">
                    <!-- Team comparison will be updated as data loads -->
                </div>
                
                <div id="match-insights" class="hidden">
                    <!-- Match insights will appear once all data is loaded -->
                </div>
            </div>
        `;
        
        resultsDiv.innerHTML = initialContent;
        console.log('✅ Phase 1: Initial display rendered');
        
        // Phase 2: Start fetching player statistics in background
        console.log('📊 Phase 2: Starting background data fetching...');
        
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
                    console.log(`📊 Loading data for player ${index + 1}/${totalPlayers}: ${player.accountId}`);
                    
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
                    
                    console.log(`✅ Loaded data for player ${completedPlayers}/${totalPlayers}`);
                    return enhancedPlayer;
                    
                } catch (error) {
                    console.warn(`⚠️ Failed to load data for player ${player.accountId}:`, error.message);
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
        console.log('🔄 Phase 3: Updating team comparisons...');
        
        const finalTeamData = {
            team0: enhancedPlayersData.filter(p => p.team === 0).slice(0, 6), // Limit to 6 players
            team1: enhancedPlayersData.filter(p => p.team === 1).slice(0, 6)  // Limit to 6 players
        };
        
        // Update team comparison
        document.getElementById('team-comparison').innerHTML = this.createTeamComparison(finalTeamData.team0, finalTeamData.team1);
        document.getElementById('team-comparison').classList.remove('hidden');
        
        // Phase 4: Generate final insights and charts
        console.log('📈 Phase 4: Generating insights and charts...');
        
        const finalMatchData = {
            ...matchMetadata,
            teams: finalTeamData
        };
        
        const insights = this.createMatchInsights({ teams: finalTeamData });
        document.getElementById('match-insights').innerHTML = insights;
        document.getElementById('match-insights').classList.remove('hidden');
        
        // Hide loading status
        const loadingStatus = document.getElementById('loading-status');
        if (loadingStatus) {
            loadingStatus.style.opacity = '0';
            setTimeout(() => loadingStatus.remove(), 500);
        }
        
        // Create charts
        setTimeout(() => {
            try {
                this.createWinRateChart(finalMatchData);
                this.createKDAComparisonChart(finalMatchData);
            } catch (chartError) {
                console.warn('⚠️ Chart creation error:', chartError.message);
            }
        }, 1000);
        
        console.log('🎉 Progressive match analysis completed!');
    }
    
    /**
     * Create initial player cards with loading placeholders
     */
    createInitialPlayerCards(players) {
        const team0 = players.filter(p => p.team === 0).slice(0, 6); // Limit to 6 players
        const team1 = players.filter(p => p.team === 1).slice(0, 6); // Limit to 6 players
        
        // Fix 2 & 4: Flex container for teams with 3-column grid
        return `
            <div class="flex flex-col lg:flex-row gap-6">
                <div class="flex-1">
                    <h4 class="text-lg font-semibold text-green-400 mb-4">Team 1 (${team0.length} players)</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        ${team0.map(player => this.createLoadingPlayerCard(player, 'green')).join('')}
                    </div>
                </div>
                
                <div class="flex-1">
                    <h4 class="text-lg font-semibold text-red-400 mb-4">Team 2 (${team1.length} players)</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        ${team1.map(player => this.createLoadingPlayerCard(player, 'red')).join('')}
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
}

// Export for use in other files
window.MatchAnalyzer = MatchAnalyzer;