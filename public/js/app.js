// Initialize match analyzer
let matchAnalyzer = null;

try {
    console.log('Attempting to initialize MatchAnalyzer...');
    if (typeof MatchAnalyzer !== 'undefined') {
        matchAnalyzer = new MatchAnalyzer();
        console.log('MatchAnalyzer initialized successfully.');
    } else {
        console.warn('MatchAnalyzer class is not defined.');
    }
} catch (e) {
    console.error('Error initializing MatchAnalyzer:', e);
}

// Check if enhanced styles are loading

// Event Listeners
const fetchButton = document.getElementById('fetchButton');
const matchIdInput = document.getElementById('matchIdInput');
const loader = document.getElementById('loader');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const resultsDiv = document.getElementById('results');

// Helper functions for UI state
function showLoader(show) {
    if (loader) loader.classList.toggle('hidden', !show);
}

function showError(message) {
    if (errorMessage) errorMessage.classList.toggle('hidden', !message);
    if (errorText) errorText.textContent = message || '';
}

// Ensure elements exist before adding listeners
if (fetchButton && matchIdInput) {
    fetchButton.addEventListener('click', handleFetchData);
    matchIdInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') handleFetchData();
    });
    console.log('Event listeners added to fetchButton and matchIdInput.');
} else {
    console.error('Could not find fetchButton or matchIdInput elements.');
}

// Main Logic
async function handleFetchData() {
    console.log('handleFetchData called.');
    let matchId = matchIdInput.value.trim();
    if (!matchId) {
        matchId = '38069822'; // Use default match ID when input is empty
        matchIdInput.value = matchId; // Update the input field to show the default value
        console.log(`Using default match ID: ${matchId}`);
    }

    showLoader(true);
    showError(null);

    try {
        let enhancedSucceeded = false;
        
        // Use progressive loading with match analyzer if available
        if (matchAnalyzer && deadlockAPI) {
            console.log('MatchAnalyzer and deadlockAPI are available. Attempting enhanced analysis.');
            try {
                // Get match metadata first (fast)
                const matchMetadata = await deadlockAPI.getMatchMetadata(matchId);
                console.log('Fetched match metadata:', matchMetadata);
                
                if (matchMetadata && matchMetadata.playersSummary && matchMetadata.playersSummary.length > 0) {
                    
                    // If no damage/healing data, fetch detailed match data
                    const hasStats = matchMetadata.playersSummary.some(p => p.playerDamage > 0);
                    
                    if (!hasStats) {
                        console.log('No damage/healing stats found, fetching detailed match data...');
                        try {
                            const fullMatchData = await deadlockAPI.getMatchDetails(matchId);
                            if (fullMatchData && fullMatchData.match_info) {
                                matchMetadata.match_info = fullMatchData.match_info;
                                matchMetadata.playersSummary = fullMatchData.playersSummary;
                                console.log('Detailed match data fetched and merged.');
                            }
                        } catch (detailError) {
                            console.warn('Could not fetch detailed match data:', detailError);
                            // Could not fetch detailed match data
                        }
                    }
                    
                    // Hide loader and show initial content immediately
                    showLoader(false);
                    
                    // Start progressive loading
                    console.log('Calling renderProgressiveMatchAnalysis...');
                    await matchAnalyzer.renderProgressiveMatchAnalysis(matchMetadata, deadlockAPI);
                    enhancedSucceeded = true;
                    console.log('renderProgressiveMatchAnalysis completed.');
                } else {
                    console.warn('No player data received from match metadata, falling back.');
                    // No player data received, falling back to standard method
                }
            } catch (enhancedError) {
                console.error('Enhanced match analysis failed:', enhancedError);
                // Enhanced match analysis failed, falling back to standard method
            }
        } else {
            console.warn('Enhanced components (MatchAnalyzer or deadlockAPI) not available.');
            // Enhanced components not available
        }
        
        // Show error if enhanced method didn't succeed
        if (!enhancedSucceeded) {
            showError('Failed to load match data with enhanced analysis. Please try again.');
            console.error('Enhanced analysis did not succeed.');
        }

    } catch (error) {
        console.error('Match data fetch error:', error);
        showError(`Failed to fetch match data: ${error.message}. Please check the match ID and try again.`);
    } finally {
        showLoader(false);
        console.log('handleFetchData finished.');
    }
}

// Check if enhanced styles are loading

// Event Listeners
fetchButton.addEventListener('click', handleFetchData);
matchIdInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') handleFetchData();
});


