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
        console.error('Match data fetch error:', error);
        showError(`Failed to fetch match data: ${error.message}. Please check the match ID and try again.`);
    } finally {
        showLoader(false);
    }
}

