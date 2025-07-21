// Initialize enhanced UI if available
let enhancedUI = null;
let matchUI = null;
try {
    if (typeof EnhancedUI !== 'undefined') {
        enhancedUI = new EnhancedUI();
    }
    if (typeof MatchUI !== 'undefined') {
        matchUI = new MatchUI();
    }
} catch (e) {
    console.log('Enhanced UI components not loaded, using standard UI');
}

// Event Listeners
fetchButton.addEventListener('click', handleFetchData);
matchIdInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') handleFetchData();
});

// Main Logic
async function handleFetchData() {
    const matchId = matchIdInput.value.trim();
    if (!matchId) {
        showError('Please enter a Match ID.');
        return;
    }

    showLoader(true);
    showError(null);
    hideCharts();

    try {
        let enhancedSucceeded = false;
        
        // Use enhanced API if available
        if (matchUI && deadlockAPI) {
            console.log('🎯 Using enhanced match analysis...');
            console.log('📋 MatchUI available:', !!matchUI);
            console.log('🔌 DeadlockAPI available:', !!deadlockAPI);
            console.log('🎮 Match ID:', matchId);
            
            try {
                console.log('📡 Step 1: Fetching match metadata...');
                
                // Get complete match data with all player stats
                const allPlayersData = await deadlockAPI.getAllPlayersFromMatch(matchId, 50);
                
                console.log('📊 Step 2: Match data received:', {
                    hasData: !!allPlayersData,
                    playersCount: allPlayersData?.players?.length || 0,
                    teams: {
                        team0: allPlayersData?.teams?.team0?.length || 0,
                        team1: allPlayersData?.teams?.team1?.length || 0
                    }
                });
                
                if (allPlayersData && allPlayersData.players.length > 0) {
                    console.log('🎨 Step 3: Rendering match analysis UI...');
                    await matchUI.renderMatchAnalysis(allPlayersData, allPlayersData);
                    console.log('✅ Enhanced match analysis completed successfully');
                    enhancedSucceeded = true;
                } else {
                    console.warn('⚠️ No player data received, falling back to standard method');
                }
            } catch (enhancedError) {
                console.error('❌ Enhanced match analysis failed:', enhancedError);
                console.error('🔍 Error details:', {
                    message: enhancedError.message,
                    stack: enhancedError.stack,
                    name: enhancedError.name
                });
                console.log('🔄 Falling back to standard method...');
            }
        } else {
            console.log('⚙️ Enhanced components not available:', {
                matchUI: !!matchUI,
                deadlockAPI: !!deadlockAPI
            });
        }
        
        // Only use fallback if enhanced method didn't succeed
        if (!enhancedSucceeded) {
            console.log('🔄 Using fallback method...');
            const players = await getPlayersFromMatch(matchId);
           
            if (!players || players.length === 0) {
                showError(`No players found for Match ID: ${matchId}. Displaying mock data.`);
                await processAndDisplayStats(MOCK_MATCH_DATA.players);
                return;
            }
           
            await processAndDisplayStats(players);
        }

    } catch (error) {
        console.error('Error fetching data:', error);
        showError(`Failed to fetch data. ${error.message}. Displaying mock data as a fallback.`);
        
        // Try enhanced UI with mock data first if available
        if (matchUI && MOCK_MATCH_DATA) {
            try {
                console.log('🎯 Using enhanced UI with mock data...');
                
                // Create enhanced mock data structure
                const enhancedMockData = {
                    matchId: 'mock-match-123',
                    match_info: {
                        duration_s: 1800, // 30 minutes
                        winning_team: 0,
                        game_mode: 1
                    },
                    teams: {
                        team0: MOCK_MATCH_DATA.players.filter(p => p.team === 1).map((p, i) => ({
                            accountId: p.steamId,
                            displayName: p.displayName,
                            playerSlot: i,
                            team: 0,
                            heroId: i + 1,
                            kills: Math.floor(Math.random() * 10) + 5,
                            deaths: Math.floor(Math.random() * 8) + 2,
                            assists: Math.floor(Math.random() * 12) + 8,
                            totalGames: Math.floor(Math.random() * 500) + 100,
                            statistics: {
                                winRate: Math.floor(Math.random() * 40) + 40,
                                averageKDA: Math.round((Math.random() * 2 + 2) * 100) / 100,
                                averageKills: Math.round((Math.random() * 4 + 6) * 10) / 10,
                                averageDeaths: Math.round((Math.random() * 3 + 4) * 10) / 10,
                                averageAssists: Math.round((Math.random() * 5 + 8) * 10) / 10,
                                recentForm: ['W', 'L', 'W', 'W', 'L'].slice(0, 5)
                            }
                        })),
                        team1: MOCK_MATCH_DATA.players.filter(p => p.team === 2).map((p, i) => ({
                            accountId: p.steamId,
                            displayName: p.displayName,
                            playerSlot: i + 6,
                            team: 1,
                            heroId: i + 7,
                            kills: Math.floor(Math.random() * 8) + 3,
                            deaths: Math.floor(Math.random() * 10) + 4,
                            assists: Math.floor(Math.random() * 10) + 6,
                            totalGames: Math.floor(Math.random() * 400) + 150,
                            statistics: {
                                winRate: Math.floor(Math.random() * 35) + 35,
                                averageKDA: Math.round((Math.random() * 1.5 + 2) * 100) / 100,
                                averageKills: Math.round((Math.random() * 3 + 5) * 10) / 10,
                                averageDeaths: Math.round((Math.random() * 4 + 5) * 10) / 10,
                                averageAssists: Math.round((Math.random() * 4 + 7) * 10) / 10,
                                recentForm: ['L', 'W', 'L', 'L', 'W'].slice(0, 5)
                            }
                        }))
                    }
                };
                
                await matchUI.renderMatchAnalysis(enhancedMockData, enhancedMockData);
                console.log('✅ Enhanced UI with mock data completed');
            } catch (mockError) {
                console.error('❌ Enhanced UI with mock data failed:', mockError);
                // Only use old display if enhanced UI fails completely
                await processAndDisplayStats(MOCK_MATCH_DATA.players);
            }
        } else {
            await processAndDisplayStats(MOCK_MATCH_DATA.players);
        }
    } finally {
        showLoader(false);
    }
}

async function processAndDisplayStats(players) {
    console.log('📊 processAndDisplayStats called with enhanced UI available:', !!matchUI);
    
    const team1 = players.filter(p => p.team === 1);
    const team2 = players.filter(p => p.team === 2);
   
    // Process players in parallel (faster) with error handling
    const team1Stats = await Promise.all(
        team1.map(async (player) => {
            try {
                return await getPlayerStats(player.steamId);
            } catch (error) {
                console.warn(`Failed to get stats for ${player.steamId}:`, error.message);
                return { steamId: player.steamId, total: 0, winRate: 0 };
            }
        })
    );
    
    const team2Stats = await Promise.all(
        team2.map(async (player) => {
            try {
                return await getPlayerStats(player.steamId);
            } catch (error) {
                console.warn(`Failed to get stats for ${player.steamId}:`, error.message);
                return { steamId: player.steamId, total: 0, winRate: 0 };
            }
        })
    );
   
    // Merge player data with stats
    const team1PlayersWithStats = team1.map((player, index) => ({
        ...player,
        ...team1Stats[index]
    }));
    const team2PlayersWithStats = team2.map((player, index) => ({
        ...player,
        ...team2Stats[index]
    }));
   
    // Check if we have enhanced data (KDA, damage, etc.)
    const hasEnhancedData = players.some(p => p.kda !== undefined || p.damagePerMinute !== undefined);
   
    if (hasEnhancedData && enhancedUI) {
        // Use enhanced UI for richer visualization
        const container = document.getElementById('chartsContainer');
        container.innerHTML = ''; // Clear existing content
        container.classList.remove('hidden');
        
        // Create team summary cards
        const summaryContainer = document.createElement('div');
        summaryContainer.className = 'grid grid-cols-1 md:grid-cols-2 gap-6 mb-8';
        
        // Calculate team stats if available
        const team1TotalStats = team1PlayersWithStats.reduce((acc, p) => ({
            totalKills: acc.totalKills + (p.kills || 0),
            totalDeaths: acc.totalDeaths + (p.deaths || 0),
            totalAssists: acc.totalAssists + (p.assists || 0),
            totalDamage: acc.totalDamage + (p.playerDamage || 0),
            totalHealing: acc.totalHealing + (p.healingOutput || 0),
            averageKDA: acc.averageKDA + (p.kda || 0)
        }), { totalKills: 0, totalDeaths: 0, totalAssists: 0, totalDamage: 0, totalHealing: 0, averageKDA: 0 });
        team1TotalStats.averageKDA = team1TotalStats.averageKDA / team1.length;
        
        const team2TotalStats = team2PlayersWithStats.reduce((acc, p) => ({
            totalKills: acc.totalKills + (p.kills || 0),
            totalDeaths: acc.totalDeaths + (p.deaths || 0),
            totalAssists: acc.totalAssists + (p.assists || 0),
            totalDamage: acc.totalDamage + (p.playerDamage || 0),
            totalHealing: acc.totalHealing + (p.healingOutput || 0),
            averageKDA: acc.averageKDA + (p.kda || 0)
        }), { totalKills: 0, totalDeaths: 0, totalAssists: 0, totalDamage: 0, totalHealing: 0, averageKDA: 0 });
        team2TotalStats.averageKDA = team2TotalStats.averageKDA / team2.length;
        
        summaryContainer.appendChild(enhancedUI.createTeamSummaryCard(1, team1PlayersWithStats, team1TotalStats));
        summaryContainer.appendChild(enhancedUI.createTeamSummaryCard(2, team2PlayersWithStats, team2TotalStats));
        container.appendChild(summaryContainer);
        
        // Create player cards for each team
        const playersContainer = document.createElement('div');
        playersContainer.className = 'grid grid-cols-1 md:grid-cols-2 gap-6 mb-8';
        
        const team1Container = document.createElement('div');
        team1Container.innerHTML = '<h3 class="text-lg font-bold text-blue-400 mb-3">Team 1 Players</h3>';
        team1PlayersWithStats.forEach(player => {
            team1Container.appendChild(enhancedUI.createPlayerCard(player));
        });
        
        const team2Container = document.createElement('div');
        team2Container.innerHTML = '<h3 class="text-lg font-bold text-orange-400 mb-3">Team 2 Players</h3>';
        team2PlayersWithStats.forEach(player => {
            team2Container.appendChild(enhancedUI.createPlayerCard(player));
        });
        
        playersContainer.appendChild(team1Container);
        playersContainer.appendChild(team2Container);
        container.appendChild(playersContainer);
        
        // Display performance comparison charts
        enhancedUI.displayPlayerPerformance([...team1PlayersWithStats, ...team2PlayersWithStats]);
    }
   
    // Only display standard charts if enhanced UI is not available
    if (!matchUI) {
        console.log('📊 Using standard chart display (enhanced UI not available)');
        const team1Labels = team1.map(p => p.displayName);
        const team2Labels = team2.map(p => p.displayName);
       
        const team1MatchesData = team1Stats.map(s => s ? s.total : 0);
        const team2MatchesData = team2Stats.map(s => s ? s.total : 0);
        const team1WinRateData = team1Stats.map(s => s ? s.winRate : 0);
        const team2WinRateData = team2Stats.map(s => s ? s.winRate : 0);

        displayCharts(
            team1Labels,
            team2Labels,
            team1MatchesData,
            team2MatchesData,
            team1WinRateData,
            team2WinRateData
        );
    } else {
        console.log('🎨 Skipping standard chart display (enhanced UI available)');
    }
}