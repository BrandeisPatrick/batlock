// Initialize match analyzer
let matchAnalyzer = null;

try {
    if (typeof MatchAnalyzer !== 'undefined') {
        matchAnalyzer = new MatchAnalyzer();
        console.log('✅ MatchAnalyzer initialized successfully');
    } else {
        console.warn('⚠️ MatchAnalyzer class not available');
    }
} catch (e) {
    console.error('❌ Error initializing MatchAnalyzer:', e.message);
}

// Check if enhanced styles are loading
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎨 Checking CSS loading...');
    const testElement = document.createElement('div');
    testElement.className = 'glass-effect';
    document.body.appendChild(testElement);
    const computedStyle = window.getComputedStyle(testElement);
    const hasBackdropFilter = computedStyle.backdropFilter !== 'none';
    document.body.removeChild(testElement);
    console.log('🎨 Enhanced CSS loaded:', hasBackdropFilter ? 'YES' : 'NO');
    
    console.log('🌐 Available global objects:', {
        MatchAnalyzer: typeof MatchAnalyzer,
        DeadlockAPIService: typeof DeadlockAPIService,
        deadlockAPI: typeof deadlockAPI,
        Chart: typeof Chart
    });
});

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
            console.log('🎯 Using progressive match analysis...');
            console.log('📋 MatchAnalyzer available:', !!matchAnalyzer);
            console.log('🔌 DeadlockAPI available:', !!deadlockAPI);
            console.log('🎮 Match ID:', matchId);
            console.log('🧩 MatchAnalyzer methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(matchAnalyzer)));
            console.log('🔧 DeadlockAPI methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(deadlockAPI)));
            
            try {
                console.log('📡 Step 1: Fetching match metadata for immediate display...');
                
                // Get match metadata first (fast)
                const matchMetadata = await deadlockAPI.getMatchMetadata(matchId);
                
                console.log('📊 Step 2: Match metadata received:', {
                    hasData: !!matchMetadata,
                    playersCount: matchMetadata?.playersSummary?.length || 0,
                    matchInfo: !!matchMetadata?.match_info
                });
                
                if (matchMetadata && matchMetadata.playersSummary && matchMetadata.playersSummary.length > 0) {
                    console.log('🎨 Step 3: Rendering immediate match display...');
                    
                    // Hide loader and show initial content immediately
                    showLoader(false);
                    
                    // Start progressive loading
                    await matchAnalyzer.renderProgressiveMatchAnalysis(matchMetadata, deadlockAPI);
                    console.log('✅ Progressive match analysis completed successfully');
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
        
        // Show error if enhanced method didn't succeed
        if (!enhancedSucceeded) {
            showError('Failed to load match data with enhanced analysis. Please try again.');
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
                console.log('✅ Match analyzer with mock data completed');
            } catch (mockError) {
                console.error('❌ Match analyzer with mock data failed:', mockError);
                showError('Failed to display match data. Please refresh and try again.');
            }
        } else {
            showError('Match analyzer not available. Please refresh the page.');
        }
    } finally {
        showLoader(false);
    }
}

