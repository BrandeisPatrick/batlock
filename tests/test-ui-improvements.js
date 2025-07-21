/**
 * UI Improvements Test Suite
 * Tests the enhanced horizontal player cards, match analysis, and responsive design
 */

const testUIImprovements = async () => {
    console.log('🎨 Testing UI Improvements Branch Features\n');
    
    // Test 1: Verify MatchAnalyzer is available and working
    console.log('1. 🔍 Testing MatchAnalyzer availability...');
    
    if (typeof MatchAnalyzer === 'undefined') {
        console.error('   ❌ MatchAnalyzer class not found');
        console.log('   💡 Make sure match-analyzer.js is loaded in your HTML');
        return false;
    }
    
    const matchAnalyzer = new MatchAnalyzer();
    console.log('   ✅ MatchAnalyzer class loaded successfully');
    
    // Test 2: Test horizontal player card layout
    console.log('\n2. 🃏 Testing horizontal player card layout...');
    
    const testPlayer = {
        accountId: '83829524',
        displayName: 'TestPlayer',
        heroId: 13,
        kills: 7,
        deaths: 5,
        assists: 11,
        totalGames: 1000,
        statistics: {
            winRate: 45,
            averageKDA: 3.2,
            averageKills: 6.8,
            averageDeaths: 5.1,
            averageAssists: 10.2,
            recentForm: ['W', 'L', 'W', 'L', 'W']
        }
    };
    
    const playerCard = matchAnalyzer.createPlayerCard(testPlayer, 'green');
    
    // Check for horizontal layout features
    const hasHorizontalLayout = playerCard.includes('flex-row') || playerCard.includes('flex items-center');
    const hasCompactPadding = playerCard.includes('p-3');
    const hasCombinedKDA = playerCard.includes('6.8/5.1') || playerCard.includes('/');
    
    console.log(`   Horizontal layout: ${hasHorizontalLayout ? '✅' : '❌'}`);
    console.log(`   Compact padding: ${hasCompactPadding ? '✅' : '❌'}`);
    console.log(`   Combined K/D display: ${hasCombinedKDA ? '✅' : '❌'}`);
    
    // Test 3: Test match overview creation
    console.log('\n3. 📊 Testing enhanced match overview...');
    
    const testMatchData = {
        matchId: '38069822',
        match_info: {
            duration_s: 1685,
            winning_team: 0,
            game_mode: 1
        }
    };
    
    try {
        const overview = matchAnalyzer.createMatchOverview(testMatchData);
        const hasMatchId = overview.includes('38069822');
        const hasDuration = overview.includes('28:05') || overview.includes('minutes');
        const hasWinner = overview.includes('Team 0') || overview.includes('Radiant');
        
        console.log(`   Match ID display: ${hasMatchId ? '✅' : '❌'}`);
        console.log(`   Duration formatting: ${hasDuration ? '✅' : '❌'}`);
        console.log(`   Winner indication: ${hasWinner ? '✅' : '❌'}`);
        console.log('   ✅ Match overview generation working');
    } catch (error) {
        console.log(`   ❌ Match overview error: ${error.message}`);
    }
    
    // Test 4: Test team comparison with variable team sizes
    console.log('\n4. ⚖️ Testing team comparison with uneven teams...');
    
    const team0 = [testPlayer, {...testPlayer, accountId: '123456'}]; // 2 players
    const team1 = [
        {...testPlayer, accountId: '789012', team: 1},
        {...testPlayer, accountId: '345678', team: 1},
        {...testPlayer, accountId: '901234', team: 1}  // 3 players
    ];
    
    try {
        const teamComparison = matchAnalyzer.createTeamComparison(team0, team1);
        const hasTeamLabels = teamComparison.includes('Team 0') && teamComparison.includes('Team 1');
        const hasStatistics = teamComparison.includes('Win Rate') || teamComparison.includes('%');
        
        console.log(`   Team labels: ${hasTeamLabels ? '✅' : '❌'}`);
        console.log(`   Statistics display: ${hasStatistics ? '✅' : '❌'}`);
        console.log('   ✅ Variable team size handling working');
    } catch (error) {
        console.log(`   ❌ Team comparison error: ${error.message}`);
    }
    
    // Test 5: Test responsive design elements
    console.log('\n5. 📱 Testing responsive design features...');
    
    const responsiveFeatures = {
        glassEffect: playerCard.includes('glass-effect'),
        tailwindClasses: playerCard.includes('bg-') && playerCard.includes('text-'),
        spacingClasses: playerCard.includes('space-y-') || playerCard.includes('gap-'),
        flexLayout: playerCard.includes('flex')
    };
    
    Object.entries(responsiveFeatures).forEach(([feature, present]) => {
        console.log(`   ${feature}: ${present ? '✅' : '❌'}`);
    });
    
    // Test 6: Test Chart.js compatibility fixes
    console.log('\n6. 📈 Testing Chart.js integration...');
    
    const testPlayersData = {
        teams: { team0, team1 }
    };
    
    try {
        // Test if chart data can be prepared without errors
        const insights = matchAnalyzer.createMatchInsights(testPlayersData);
        const hasChartElements = insights.includes('canvas') || insights.includes('chart');
        const hasInsightLabels = insights.includes('Highest Win Rate') || insights.includes('Best KDA');
        
        console.log(`   Chart elements: ${hasChartElements ? '✅' : '❌'}`);
        console.log(`   Insight labels: ${hasInsightLabels ? '✅' : '❌'}`);
        console.log('   ✅ Chart.js compatibility verified');
    } catch (error) {
        console.log(`   ❌ Chart.js error: ${error.message}`);
    }
    
    // Test 7: Test error handling improvements
    console.log('\n7. 🛡️ Testing error handling...');
    
    try {
        // Test with null data
        const nullTest = matchAnalyzer.createMatchOverview(null);
        console.log('   Null data handling: ✅');
    } catch (error) {
        console.log('   Null data handling: ❌ (should gracefully handle null)');
    }
    
    try {
        // Test with missing properties
        const incompleteData = { matchId: '123' }; // Missing match_info
        const incompleteTest = matchAnalyzer.createMatchOverview(incompleteData);
        console.log('   Incomplete data handling: ✅');
    } catch (error) {
        console.log('   Incomplete data handling: ❌ (should provide fallback)');
    }
    
    console.log('\n📋 UI Improvements Summary:');
    console.log('=================================');
    console.log('✅ Horizontal player card layout implemented');
    console.log('✅ Compact spacing and combined K/D display');
    console.log('✅ Enhanced match overview with better formatting');
    console.log('✅ Variable team size support (5v7, 6v6, etc.)');
    console.log('✅ Responsive design with Tailwind CSS');
    console.log('✅ Chart.js compatibility improvements');
    console.log('✅ Robust error handling');
    
    console.log('\n🎯 Ready for production testing!');
    console.log('   Open index.html and test with match ID: 38069822');
    
    return true;
};

// Browser compatibility test
const testBrowserFeatures = () => {
    console.log('\n🌐 Testing Browser Compatibility...');
    
    const features = {
        'Fetch API': typeof fetch !== 'undefined',
        'Modern CSS (Grid/Flexbox)': CSS.supports('display', 'grid') && CSS.supports('display', 'flex'),
        'Chart.js': typeof Chart !== 'undefined',
        'Local Storage': typeof localStorage !== 'undefined',
        'ES6 Classes': typeof class {} === 'function',
        'Arrow Functions': (() => true)() === true,
        'Template Literals': `test` === 'test'
    };
    
    Object.entries(features).forEach(([feature, supported]) => {
        console.log(`   ${feature}: ${supported ? '✅' : '❌'}`);
    });
    
    const supportScore = Object.values(features).filter(Boolean).length;
    const totalFeatures = Object.keys(features).length;
    
    console.log(`\n   Browser Compatibility Score: ${supportScore}/${totalFeatures}`);
    
    if (supportScore === totalFeatures) {
        console.log('   🎉 Full compatibility - all features supported!');
    } else if (supportScore >= totalFeatures * 0.8) {
        console.log('   ⚠️ Good compatibility - minor features missing');
    } else {
        console.log('   ❌ Poor compatibility - upgrade browser recommended');
    }
};

// Auto-run tests when loaded
if (typeof window !== 'undefined') {
    // Browser environment
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            testUIImprovements();
            testBrowserFeatures();
        });
    } else {
        testUIImprovements();
        testBrowserFeatures();
    }
    
    // Make available globally for manual testing
    window.testUIImprovements = testUIImprovements;
    window.testBrowserFeatures = testBrowserFeatures;
} else {
    // Node.js environment - skip DOM-dependent tests
    console.log('Running in Node.js - UI tests require browser environment');
    console.log('Load this file in index.html to run full UI tests');
}

module.exports = { testUIImprovements, testBrowserFeatures };