// Initialize match analyzer
let matchAnalyzer = null;
try {
    if (typeof MatchAnalyzer !== 'undefined') {
        matchAnalyzer = new MatchAnalyzer();
    }
} catch (e) {
    console.log('Match analyzer not loaded, using standard UI');
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
        
        // Use match analyzer if available
        if (matchAnalyzer && deadlockAPI) {
            console.log('🎯 Using enhanced match analysis...');
            console.log('📋 MatchAnalyzer available:', !!matchAnalyzer);
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
                    await matchAnalyzer.renderMatchAnalysis(allPlayersData, allPlayersData);
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
                matchAnalyzer: !!matchAnalyzer,
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
        
        // Try match analyzer with mock data first if available
        if (matchAnalyzer && MOCK_MATCH_DATA) {
            try {
                console.log('🎯 Using match analyzer with mock data...');
                
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
                
                await matchAnalyzer.renderMatchAnalysis(enhancedMockData, enhancedMockData);
                console.log('✅ Match analyzer with mock data completed');
            } catch (mockError) {
                console.error('❌ Match analyzer with mock data failed:', mockError);
                // Only use old display if match analyzer fails completely
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
    console.log('📊 processAndDisplayStats called with match analyzer available:', !!matchAnalyzer);
    
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
   
    // Note: Enhanced data visualization is handled by the main MatchAnalyzer flow
    // This function is only used for basic fallback display
   
    // Only display standard charts if match analyzer is not available
    if (!matchAnalyzer) {
        console.log('📊 Using standard chart display (match analyzer not available)');
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
        console.log('🎨 Skipping standard chart display (match analyzer available)');
    }
}