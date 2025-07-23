// Initialize match analyzer and player search
let matchAnalyzer = null;
let playerSearch = null;

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

// Import and initialize player search
import PlayerSearch from './player-search.js';

try {
    console.log('Attempting to initialize PlayerSearch...');
    playerSearch = new PlayerSearch();
    console.log('PlayerSearch initialized successfully.');
} catch (e) {
    console.error('Error initializing PlayerSearch:', e);
}

// Check if enhanced styles are loading

// Search mode variables
let currentSearchMode = 'match'; // 'match' or 'player'
let currentPlayerMatches = null;
let selectedMatchIndex = 0;

// Event Listeners
const fetchButton = document.getElementById('fetchButton');
const matchIdInput = document.getElementById('matchIdInput');
const loader = document.getElementById('loader');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const resultsDiv = document.getElementById('results');

// Player search elements
const matchSearchTab = document.getElementById('matchSearchTab');
const playerSearchTab = document.getElementById('playerSearchTab');
const matchSearchSection = document.getElementById('matchSearchSection');
const playerSearchSection = document.getElementById('playerSearchSection');
const playerSearchInput = document.getElementById('playerSearchInput');
const playerSearchButton = document.getElementById('playerSearchButton');
const playerSearchResults = document.getElementById('playerSearchResults');

// Helper functions for UI state
function showLoader(show) {
    if (loader) loader.classList.toggle('hidden', !show);
}

function showError(message) {
    if (errorMessage) errorMessage.classList.toggle('hidden', !message);
    if (errorText) errorText.textContent = message || '';
}

// Search mode toggle functionality
function switchSearchMode(mode) {
    currentSearchMode = mode;
    
    if (mode === 'match') {
        matchSearchTab.classList.add('active');
        playerSearchTab.classList.remove('active');
        matchSearchSection.classList.remove('hidden');
        playerSearchSection.classList.add('hidden');
        playerSearchResults.classList.add('hidden');
    } else {
        playerSearchTab.classList.add('active');
        matchSearchTab.classList.remove('active');
        playerSearchSection.classList.remove('hidden');
        matchSearchSection.classList.add('hidden');
    }
    
    // Clear results and errors when switching modes
    showError(null);
    if (resultsDiv) {
        resultsDiv.classList.add('hidden');
    }
}

// Add event listeners for search mode toggle
if (matchSearchTab && playerSearchTab) {
    matchSearchTab.addEventListener('click', () => switchSearchMode('match'));
    playerSearchTab.addEventListener('click', () => switchSearchMode('player'));
}

// Ensure match search elements exist before adding listeners
if (fetchButton && matchIdInput) {
    fetchButton.addEventListener('click', handleFetchData);
    matchIdInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') handleFetchData();
    });
    console.log('Event listeners added to fetchButton and matchIdInput.');
} else {
    console.error('Could not find fetchButton or matchIdInput elements.');
}

// Add player search event listeners
if (playerSearchButton && playerSearchInput) {
    playerSearchButton.addEventListener('click', handlePlayerSearch);
    playerSearchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') handlePlayerSearch();
    });
    console.log('Event listeners added to player search elements.');
}

// Main Logic
async function handleFetchData(eventOrMatchId) {
    console.log('handleFetchData called.');
    const providedMatchId = (typeof eventOrMatchId === 'string' || typeof eventOrMatchId === 'number') ? eventOrMatchId : null;
    let matchId = providedMatchId || matchIdInput.value.trim();

    if (!matchId) {
        matchId = '38069822'; // Use default match ID when input is empty
        matchIdInput.value = matchId; // Update the input field to show the default value
        console.log(`Using default match ID: ${matchId}`);
    }
    
    // Update input field if match ID was provided externally
    if (providedMatchId) {
        matchIdInput.value = providedMatchId;
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

// Player search functionality
async function handlePlayerSearch() {
    console.log('handlePlayerSearch called.');
    const query = playerSearchInput.value.trim();
    
    if (!query) {
        showError('Please enter a Steam name or profile URL.');
        return;
    }
    
    showLoader(true);
    showError(null);
    playerSearchResults.classList.add('hidden');
    
    try {
        console.log('Searching for player:', query);
        
        // Search for the player
        const playerData = await playerSearch.searchPlayer(query);
        console.log('Player data:', playerData);
        
        if (!playerData || !playerData.deadlockAccountId) {
            throw new Error('Failed to resolve player data');
        }
        
        // Fetch recent matches using SteamID64
        const steamId64 = playerData.steamId64 || playerData.steamid || playerData.deadlockAccountId;
        console.log('Fetching recent matches for SteamID64:', steamId64);
        const matchHistory = await playerSearch.fetchPlayerRecentMatches(steamId64);
        console.log('Match history:', matchHistory);
        
        // Store for later use
        currentPlayerMatches = matchHistory.matches;
        selectedMatchIndex = 0;
        
        // Render the results
        playerSearch.renderPlayerSearchResults(playerData, matchHistory);
        
        // Auto-select first match if available
        if (matchHistory.matches && matchHistory.matches.length > 0) {
            console.log('Auto-selecting first match:', matchHistory.matches[0].matchId);
            // Wait a bit for the tabs to render, then select first match
            setTimeout(() => {
                handleMatchFromTab(matchHistory.matches[0].matchId);
            }, 100);
        }
        
    } catch (error) {
        console.error('Player search error:', error);
        let errorMsg = error.message;
        
        // Provide more helpful error messages and suggestions
        if (error.message.includes('not found') || error.message.includes('Player not found')) {
            const searchQuery = playerSearchInput.value.trim();
            let specificTip = '';
            if (searchQuery.includes(' ')) {
                specificTip = `\n• NOTE: "${searchQuery}" contains spaces. Steam vanity URLs typically don't have spaces - try removing them or using underscores.`;
            }
            errorMsg = `${error.message}\n\nTips:\n• Try the exact Steam vanity URL (the part after /id/ in your Steam profile)\n• Use the full Steam profile URL (steamcommunity.com/id/username)\n• Check if the profile is public and exists\n• Try searching on Steam first to verify the username${specificTip}`;
        } else if (error.message.includes('No recent matches')) {
            errorMsg = 'Player found but no recent Deadlock matches available. The player may not have played Deadlock recently or their match history is private.';
        } else if (error.message.includes('Failed to resolve')) {
            errorMsg = 'Unable to resolve Steam profile. Please try using the full Steam profile URL instead.';
        }
        
        showError(errorMsg);
    } finally {
        showLoader(false);
    }
}

// Handle match selection from tabs
function handleMatchFromTab(matchId) {
    console.log('handleMatchFromTab called with:', matchId);
    
    // Switch to match search mode to show results
    switchSearchMode('match');
    
    // Call the existing match analysis function
    handleFetchData(matchId);
    
    // Scroll to results after a brief delay
    setTimeout(() => {
        if (resultsDiv && !resultsDiv.classList.contains('hidden')) {
            resultsDiv.scrollIntoView({ behavior: 'smooth' });
        }
    }, 500);
}

// Make handleMatchFromTab available globally for the player-search module
window.handleMatchFromTab = handleMatchFromTab;

// Check if enhanced styles are loading

// Remove duplicate event listeners (they're added above now)

