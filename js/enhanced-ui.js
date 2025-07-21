/**
 * Enhanced UI components for displaying Deadlock match data with hero assets and additional stats
 */

class EnhancedUI {
    constructor() {
        this.deadlockAPI = typeof DeadlockAPIService !== 'undefined' ? new DeadlockAPIService() : null;
        this.chartsInitialized = false;
        this.charts = {};
    }

    /**
     * Create player card with hero image and stats
     */
    createPlayerCard(player) {
        const heroImageUrl = this.deadlockAPI ? 
            this.deadlockAPI.getHeroAssetUrl(player.heroId, 'icon') : 
            '';

        const card = document.createElement('div');
        card.className = 'bg-gray-700 rounded-lg p-4 mb-2 flex items-center justify-between hover:bg-gray-600 transition-colors';
        
        card.innerHTML = `
            <div class="flex items-center space-x-3">
                ${heroImageUrl ? `
                    <img src="${heroImageUrl}" alt="${player.heroName || 'Hero'}" 
                         class="w-10 h-10 rounded-full border-2 border-gray-600"
                         onerror="this.style.display='none'">
                ` : ''}
                <div>
                    <p class="font-medium text-white">${player.displayName}</p>
                    ${player.heroName ? `<p class="text-sm text-gray-400">${player.heroName}</p>` : ''}
                </div>
            </div>
            <div class="flex items-center space-x-4 text-sm">
                ${player.kda !== undefined ? `
                    <div class="text-center">
                        <p class="text-gray-400">KDA</p>
                        <p class="font-bold ${this.getKDAColor(player.kda)}">${player.kda.toFixed(2)}</p>
                    </div>
                ` : ''}
                ${player.kills !== undefined ? `
                    <div class="text-center">
                        <p class="text-gray-400">K/D/A</p>
                        <p class="font-medium">${player.kills}/${player.deaths}/${player.assists}</p>
                    </div>
                ` : ''}
                ${player.damagePerMinute !== undefined ? `
                    <div class="text-center">
                        <p class="text-gray-400">DPM</p>
                        <p class="font-medium text-orange-400">${player.damagePerMinute}</p>
                    </div>
                ` : ''}
                <div class="text-center">
                    <p class="text-gray-400">Matches</p>
                    <p class="font-medium">${player.total || 0}</p>
                </div>
                <div class="text-center">
                    <p class="text-gray-400">Win Rate</p>
                    <p class="font-bold ${this.getWinRateColor(player.winRate)}">${player.winRate || 0}%</p>
                </div>
            </div>
        `;
        
        return card;
    }

    /**
     * Create team summary card
     */
    createTeamSummaryCard(teamNumber, players, teamStats) {
        const card = document.createElement('div');
        card.className = `bg-gray-800 rounded-lg p-6 mb-6 border-2 ${teamNumber === 1 ? 'border-blue-600' : 'border-orange-600'}`;
        
        const avgWinRate = players.reduce((sum, p) => sum + (p.winRate || 0), 0) / players.length;
        const totalMatches = players.reduce((sum, p) => sum + (p.total || 0), 0);
        
        card.innerHTML = `
            <h3 class="text-xl font-bold mb-4 ${teamNumber === 1 ? 'text-blue-400' : 'text-orange-400'}">
                Team ${teamNumber} Summary
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                    <p class="text-gray-400 text-sm">Avg Win Rate</p>
                    <p class="text-2xl font-bold ${this.getWinRateColor(avgWinRate)}">${avgWinRate.toFixed(1)}%</p>
                </div>
                <div>
                    <p class="text-gray-400 text-sm">Total Matches</p>
                    <p class="text-2xl font-bold">${totalMatches}</p>
                </div>
                ${teamStats ? `
                    <div>
                        <p class="text-gray-400 text-sm">Team KDA</p>
                        <p class="text-2xl font-bold ${this.getKDAColor(teamStats.averageKDA)}">${teamStats.averageKDA.toFixed(2)}</p>
                    </div>
                    <div>
                        <p class="text-gray-400 text-sm">Total Damage</p>
                        <p class="text-2xl font-bold text-orange-400">${(teamStats.totalDamage / 1000).toFixed(1)}k</p>
                    </div>
                ` : ''}
            </div>
        `;
        
        return card;
    }

    /**
     * Create enhanced statistics chart
     */
    createEnhancedChart(canvasId, chartType, data, options = {}) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }
        
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#9CA3AF',
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(31, 41, 55, 0.9)',
                    titleColor: '#F3F4F6',
                    bodyColor: '#D1D5DB',
                    borderColor: '#4B5563',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y || context.parsed.x || context.parsed;
                            return `${label}: ${value}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#9CA3AF'
                    },
                    grid: {
                        color: 'rgba(75, 85, 99, 0.3)'
                    }
                },
                y: {
                    ticks: {
                        color: '#9CA3AF'
                    },
                    grid: {
                        color: 'rgba(75, 85, 99, 0.3)'
                    }
                }
            }
        };
        
        this.charts[canvasId] = new Chart(ctx, {
            type: chartType,
            data: data,
            options: { ...defaultOptions, ...options }
        });
        
        return this.charts[canvasId];
    }

    /**
     * Display player performance comparison
     */
    displayPlayerPerformance(players) {
        const container = document.getElementById('chartsContainer');
        
        // Create performance comparison section
        const perfSection = document.createElement('div');
        perfSection.className = 'bg-gray-800 p-6 rounded-lg shadow-lg mb-8';
        perfSection.innerHTML = `
            <h2 class="text-2xl font-semibold text-center mb-6">Player Performance Comparison</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <canvas id="kdaComparisonChart"></canvas>
                </div>
                <div>
                    <canvas id="damageComparisonChart"></canvas>
                </div>
            </div>
        `;
        
        container.appendChild(perfSection);
        
        // Prepare data for charts
        const team1Players = players.filter(p => p.team === 1);
        const team2Players = players.filter(p => p.team === 2);
        
        // KDA Comparison Chart
        if (players.some(p => p.kda !== undefined)) {
            this.createEnhancedChart('kdaComparisonChart', 'bar', {
                labels: [...team1Players.map(p => p.displayName), ...team2Players.map(p => p.displayName)],
                datasets: [{
                    label: 'KDA Ratio',
                    data: [...team1Players.map(p => p.kda || 0), ...team2Players.map(p => p.kda || 0)],
                    backgroundColor: [
                        ...team1Players.map(() => 'rgba(59, 130, 246, 0.8)'),
                        ...team2Players.map(() => 'rgba(251, 146, 60, 0.8)')
                    ],
                    borderColor: [
                        ...team1Players.map(() => 'rgb(59, 130, 246)'),
                        ...team2Players.map(() => 'rgb(251, 146, 60)')
                    ],
                    borderWidth: 2
                }]
            }, {
                plugins: {
                    title: {
                        display: true,
                        text: 'Kill/Death/Assist Ratio',
                        color: '#F3F4F6'
                    }
                }
            });
        }
        
        // Damage Per Minute Chart
        if (players.some(p => p.damagePerMinute !== undefined)) {
            this.createEnhancedChart('damageComparisonChart', 'bar', {
                labels: [...team1Players.map(p => p.displayName), ...team2Players.map(p => p.displayName)],
                datasets: [{
                    label: 'Damage Per Minute',
                    data: [...team1Players.map(p => p.damagePerMinute || 0), ...team2Players.map(p => p.damagePerMinute || 0)],
                    backgroundColor: [
                        ...team1Players.map(() => 'rgba(59, 130, 246, 0.8)'),
                        ...team2Players.map(() => 'rgba(251, 146, 60, 0.8)')
                    ],
                    borderColor: [
                        ...team1Players.map(() => 'rgb(59, 130, 246)'),
                        ...team2Players.map(() => 'rgb(251, 146, 60)')
                    ],
                    borderWidth: 2
                }]
            }, {
                plugins: {
                    title: {
                        display: true,
                        text: 'Average Damage Output Per Minute',
                        color: '#F3F4F6'
                    }
                }
            });
        }
    }

    /**
     * Get color based on KDA value
     */
    getKDAColor(kda) {
        if (kda >= 4) return 'text-green-400';
        if (kda >= 2.5) return 'text-yellow-400';
        if (kda >= 1.5) return 'text-orange-400';
        return 'text-red-400';
    }

    /**
     * Get color based on win rate
     */
    getWinRateColor(winRate) {
        if (winRate >= 60) return 'text-green-400';
        if (winRate >= 50) return 'text-yellow-400';
        if (winRate >= 40) return 'text-orange-400';
        return 'text-red-400';
    }

    /**
     * Clear all charts
     */
    clearCharts() {
        Object.values(this.charts).forEach(chart => chart.destroy());
        this.charts = {};
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedUI;
}