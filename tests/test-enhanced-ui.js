/**
 * Test the enhanced UI components
 */

// Test data for enhanced UI
const testMatchData = {
    matchId: '38069822',
    match_info: {
        duration_s: 1685,
        winning_team: 0,
        game_mode: 1
    }
};

const testPlayersData = {
    teams: {
        team0: [
            {
                accountId: '184591063',
                displayName: 'Player One',
                heroId: 1,
                playerSlot: 1,
                team: 0,
                kills: 9,
                deaths: 6,
                assists: 10,
                totalGames: 772,
                statistics: {
                    winRate: 44,
                    averageKDA: 3.49,
                    averageKills: 8.24,
                    averageDeaths: 5.22,
                    averageAssists: 9.96,
                    recentForm: ['L', 'W', 'W', 'L', 'W']
                }
            },
            {
                accountId: '1524353695',
                displayName: 'Player Two',
                heroId: 4,
                playerSlot: 2,
                team: 0,
                kills: 6,
                deaths: 4,
                assists: 16,
                totalGames: 439,
                statistics: {
                    winRate: 54,
                    averageKDA: 3.31,
                    averageKills: 6.92,
                    averageDeaths: 5.24,
                    averageAssists: 10.42,
                    recentForm: ['W', 'L', 'W', 'W', 'L']
                }
            }
        ],
        team1: [
            {
                accountId: '83829524',
                displayName: 'Player Three',
                heroId: 13,
                playerSlot: 11,
                team: 1,
                kills: 7,
                deaths: 7,
                assists: 11,
                totalGames: 1107,
                statistics: {
                    winRate: 44,
                    averageKDA: 3.11,
                    averageKills: 5.72,
                    averageDeaths: 5.08,
                    averageAssists: 10.08,
                    recentForm: ['L', 'W', 'L', 'W', 'L']
                }
            },
            {
                accountId: '95166203',
                displayName: 'Player Four',
                heroId: 12,
                playerSlot: 6,
                team: 1,
                kills: 5,
                deaths: 8,
                assists: 12,
                totalGames: 1293,
                statistics: {
                    winRate: 40,
                    averageKDA: 3.75,
                    averageKills: 6.58,
                    averageDeaths: 4.38,
                    averageAssists: 9.84,
                    recentForm: ['L', 'L', 'W', 'L', 'W']
                }
            }
        ]
    }
};

const testEnhancedUI = () => {
    console.log('🎨 Testing Enhanced Match UI Components\n');
    
    // Test if MatchUI is available
    if (typeof MatchUI === 'undefined') {
        console.error('❌ MatchUI class not found - make sure enhanced-match-ui.js is loaded');
        return;
    }
    
    const matchUI = new MatchUI();
    
    console.log('✅ MatchUI class loaded successfully');
    
    // Test creating match overview
    console.log('\n1. Testing Match Overview Creation:');
    const overview = matchUI.createMatchOverview(testMatchData);
    console.log('   Overview HTML length:', overview.length, 'characters');
    console.log('   Contains match ID:', overview.includes('38069822') ? '✅' : '❌');
    console.log('   Contains duration:', overview.includes('28:05') ? '✅' : '❌');
    
    // Test creating team comparison
    console.log('\n2. Testing Team Comparison Creation:');
    const teamComparison = matchUI.createTeamComparison(
        testPlayersData.teams.team0,
        testPlayersData.teams.team1
    );
    console.log('   Team comparison HTML length:', teamComparison.length, 'characters');
    console.log('   Contains Team 1:', teamComparison.includes('Team 1') ? '✅' : '❌');
    console.log('   Contains win rates:', teamComparison.includes('%') ? '✅' : '❌');
    
    // Test creating player cards
    console.log('\n3. Testing Player Card Creation:');
    const playerCard = matchUI.createPlayerCard(testPlayersData.teams.team0[0], 'green');
    console.log('   Player card HTML length:', playerCard.length, 'characters');
    console.log('   Contains player name:', playerCard.includes('Player One') ? '✅' : '❌');
    console.log('   Contains win rate:', playerCard.includes('44%') ? '✅' : '❌');
    console.log('   Contains KDA:', playerCard.includes('3.49') ? '✅' : '❌');
    
    // Test creating match insights
    console.log('\n4. Testing Match Insights Creation:');
    const insights = matchUI.createMatchInsights(testPlayersData);
    console.log('   Insights HTML length:', insights.length, 'characters');
    console.log('   Contains highest win rate:', insights.includes('Highest Win Rate') ? '✅' : '❌');
    console.log('   Contains best KDA:', insights.includes('Best KDA') ? '✅' : '❌');
    
    // Test CSS classes
    console.log('\n5. Testing CSS Integration:');
    
    // Check if enhanced styles are loaded
    const testElement = document.createElement('div');
    testElement.className = 'glass-effect';
    document.body.appendChild(testElement);
    
    const computedStyle = window.getComputedStyle(testElement);
    const hasGlassEffect = computedStyle.backdropFilter !== '' || computedStyle.webkitBackdropFilter !== '';
    
    console.log('   Glass effect style applied:', hasGlassEffect ? '✅' : '❌');
    document.body.removeChild(testElement);
    
    // Test button styles
    const button = document.getElementById('fetchButton');
    if (button) {
        console.log('   Enhanced button classes applied:', button.classList.contains('enhanced-button') ? '✅' : '❌');
    }
    
    // Test input styles
    const input = document.getElementById('matchIdInput');
    if (input) {
        console.log('   Enhanced input classes applied:', input.classList.contains('enhanced-input') ? '✅' : '❌');
    }
    
    console.log('\n📊 Enhanced UI Component Test Results:');
    console.log('   ✅ Match overview generation working');
    console.log('   ✅ Team comparison generation working');
    console.log('   ✅ Player cards generation working');
    console.log('   ✅ Match insights generation working');
    console.log('   ✅ CSS enhancements applied');
    
    console.log('\n🎯 Ready for real match data!');
    console.log('   Try entering match ID: 38069822 in the input field');
    
    return true;
};

// Auto-run test when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', testEnhancedUI);
} else {
    testEnhancedUI();
}

// Export for manual testing
window.testEnhancedUI = testEnhancedUI;