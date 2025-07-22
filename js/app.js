// Initialize match analyzer
let matchAnalyzer = null;

try {
    if (typeof MatchAnalyzer !== 'undefined') {
        matchAnalyzer = new MatchAnalyzer();
    } else {
    }
} catch (e) {
}

// Check if enhanced styles are loading

// Event Listeners
fetchButton.addEventListener('click', handleFetchData);
matchIdInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') handleFetchData();
});

// Main Logic
async function handleFetchData() {
    let matchId = matchIdInput.value.trim();
    if (!matchId) {
        matchId = '38069822'; // Use default match ID when input is empty
        matchIdInput.value = matchId; // Update the input field to show the default value
    }

    showLoader(true);
    showError(null);

    try {
        let enhancedSucceeded = false;
        
        // Use progressive loading with match analyzer if available
        if (matchAnalyzer && deadlockAPI) {
            
            try {
                // Get match metadata first (fast)
                const matchMetadata = await deadlockAPI.getMatchMetadata(matchId);
                
                if (matchMetadata && matchMetadata.playersSummary && matchMetadata.playersSummary.length > 0) {
                    
                    // If no damage/healing data, fetch detailed match data
                    const hasStats = matchMetadata.playersSummary.some(p => p.playerDamage > 0);
                    
                    if (!hasStats) {
                        try {
                            const fullMatchData = await deadlockAPI.getMatchDetails(matchId);
                            if (fullMatchData && fullMatchData.match_info) {
                                matchMetadata.match_info = fullMatchData.match_info;
                                matchMetadata.playersSummary = fullMatchData.playersSummary;
                            }
                        } catch (detailError) {
                            // Could not fetch detailed match data
                        }
                    }
                    
                    // Hide loader and show initial content immediately
                    showLoader(false);
                    
                    // Start progressive loading
                    await matchAnalyzer.renderProgressiveMatchAnalysis(matchMetadata, deadlockAPI);
                    enhancedSucceeded = true;
                } else {
                    // No player data received, falling back to standard method
                }
            } catch (enhancedError) {
                // Enhanced match analysis failed, falling back to standard method
            }
        } else {
            // Enhanced components not available
        }
        
        // Show error if enhanced method didn't succeed
        if (!enhancedSucceeded) {
            showError('Failed to load match data with enhanced analysis. Please try again.');
        }

    } catch (error) {
        showError(`Failed to fetch data. ${error.message}. Displaying mock data as a fallback.`);
        
        // Try match analyzer with mock data first if available
        if (matchAnalyzer && MOCK_MATCH_DATA) {
            try {
                
                // Create enhanced mock data structure
                const enhancedMockData = {
                    matchId: 'mock-match-123',
                    match_info: {
                        duration_s: 1800, // 30 minutes
                        winning_team: 0,
                        game_mode: 1
                    },
                    teams: {
                        team0: MOCK_MATCH_DATA.players.filter(p => p.team === 0).map((p, i) => ({
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
                        team1: MOCK_MATCH_DATA.players.filter(p => p.team === 1).map((p, i) => ({
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
            } catch (mockError) {
                showError('Failed to display match data. Please refresh and try again.');
            }
        } else {
            showError('Match analyzer not available. Please refresh the page.');
        }
    } finally {
        showLoader(false);
    }
}

