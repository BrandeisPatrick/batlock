/**
 * Simple test to demonstrate the API functionality
 */

const DeadlockAPIService = require('../js/deadlock-api-service.js');

const runSimpleTest = async () => {
    const api = new DeadlockAPIService();
    
    console.log('🚀 Deadlock API Simple Test\n');
    
    // Test 1: Get a single player's stats
    console.log('📊 Fetching player stats with only_stored_history=true...');
    try {
        const playerId = '83829524';
        const playerData = await api.getPlayerMatchHistory(playerId, 20, 0, true);
        
        console.log(`\n✅ Player ${playerId} Statistics:`);
        console.log(`   Total Games: ${playerData.totalMatches}`);
        console.log(`   Matches Analyzed: ${playerData.matchesAnalyzed}`);
        console.log(`   Win Rate: ${playerData.statistics.winRate}%`);
        console.log(`   Average KDA: ${playerData.statistics.averageKDA}`);
        console.log(`   K/D/A: ${playerData.statistics.averageKills}/${playerData.statistics.averageDeaths}/${playerData.statistics.averageAssists}`);
        console.log(`   Recent Form: ${playerData.statistics.recentForm.join(' ')}`);
        
        // Show hero stats
        const heroStats = Object.entries(playerData.statistics.heroStats)
            .sort((a, b) => b[1].matches - a[1].matches)
            .slice(0, 3);
            
        console.log(`\n   Top 3 Heroes:`);
        heroStats.forEach(([heroId, stats]) => {
            console.log(`     Hero ${heroId}: ${stats.matches} games, ${stats.winRate}% WR, ${stats.averageKDA} KDA`);
        });
        
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }
    
    console.log('\n' + '─'.repeat(60) + '\n');
    
    // Test 2: Get match metadata
    console.log('🎮 Fetching match metadata...');
    try {
        const matchId = '38069822';
        const matchData = await api.getMatchMetadata(matchId);
        
        console.log(`\n✅ Match ${matchId} Details:`);
        console.log(`   Duration: ${Math.floor(matchData.match_info.duration_s / 60)}:${String(matchData.match_info.duration_s % 60).padStart(2, '0')}`);
        console.log(`   Game Mode: ${matchData.match_info.game_mode}`);
        console.log(`   Winning Team: ${matchData.match_info.winning_team === 0 ? 'Team 0 (Radiant)' : 'Team 1 (Dire)'}`);
        
        console.log(`\n   Team 0 Players:`);
        matchData.playersSummary
            .filter(p => p.team === 0)
            .forEach(p => {
                console.log(`     ${p.accountId} - Hero ${p.heroId} (${p.kills}/${p.deaths}/${p.assists})`);
            });
            
        console.log(`\n   Team 1 Players:`);
        matchData.playersSummary
            .filter(p => p.team === 1)
            .forEach(p => {
                console.log(`     ${p.accountId} - Hero ${p.heroId} (${p.kills}/${p.deaths}/${p.assists})`);
            });
            
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }
    
    console.log('\n' + '─'.repeat(60) + '\n');
    
    // Test 3: Demonstrate rate limit bypass
    console.log('⚡ Testing rate limit bypass with only_stored_history=true...');
    console.log('Making 5 rapid requests:\n');
    
    const testPlayerId = '1524353695';
    let successCount = 0;
    const startTime = Date.now();
    
    for (let i = 1; i <= 5; i++) {
        try {
            await api.getPlayerMatchHistory(testPlayerId, 5, 0, true);
            successCount++;
            console.log(`   Request ${i}: ✅ Success`);
        } catch (error) {
            console.log(`   Request ${i}: ❌ Failed - ${error.message}`);
        }
    }
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`\n   Completed ${successCount}/5 requests in ${duration} seconds`);
    console.log(`   Average: ${(duration / 5).toFixed(2)} seconds per request`);
    console.log(`   ${successCount === 5 ? '✅ No rate limiting detected!' : '⚠️  Some requests failed'}`);
    
    console.log('\n🏁 Test completed!');
};

// Run the test
runSimpleTest().catch(console.error);