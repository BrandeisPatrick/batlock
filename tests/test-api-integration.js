/**
 * Test the integrated API functionality with only_stored_history
 */

// Import the DeadlockAPIService
const DeadlockAPIService = require('../js/deadlock-api-service.js');

const testAPIIntegration = async () => {
    const api = new DeadlockAPIService();
    const testMatchId = '38069822';
    const testPlayerId = '83829524';
    
    console.log('🧪 Testing Deadlock API Integration\n');
    
    // Test 1: Get player match history with only_stored_history
    console.log('1️⃣ Testing getPlayerMatchHistory with only_stored_history=true');
    console.log('─'.repeat(50));
    try {
        const playerHistory = await api.getPlayerMatchHistory(testPlayerId, 10, 0, true);
        console.log(`✅ Successfully fetched ${playerHistory.matchesAnalyzed} matches`);
        console.log(`   Total matches in DB: ${playerHistory.totalMatches}`);
        console.log(`   Win Rate: ${playerHistory.statistics.winRate}%`);
        console.log(`   Average KDA: ${playerHistory.statistics.averageKDA}`);
        console.log(`   Recent Form: ${playerHistory.statistics.recentForm.join(' ')}`);
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }
    
    console.log('\n');
    
    // Test 2: Get match metadata
    console.log('2️⃣ Testing getMatchMetadata');
    console.log('─'.repeat(50));
    try {
        const matchData = await api.getMatchMetadata(testMatchId);
        console.log(`✅ Successfully fetched match ${testMatchId}`);
        console.log(`   Duration: ${Math.floor(matchData.match_info.duration_s / 60)}:${String(matchData.match_info.duration_s % 60).padStart(2, '0')}`);
        console.log(`   Winning Team: ${matchData.match_info.winning_team}`);
        console.log(`   Players: ${matchData.playersSummary.length}`);
        console.log(`   Team 0: ${matchData.playersSummary.filter(p => p.team === 0).length} players`);
        console.log(`   Team 1: ${matchData.playersSummary.filter(p => p.team === 1).length} players`);
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }
    
    console.log('\n');
    
    // Test 3: Get all players from match (comprehensive test)
    console.log('3️⃣ Testing getAllPlayersFromMatch (fetches stats for all 12 players)');
    console.log('─'.repeat(50));
    console.log('⏱️  This will fetch stats for all players using only_stored_history...\n');
    
    try {
        const startTime = Date.now();
        const allPlayersData = await api.getAllPlayersFromMatch(testMatchId, 20);
        const endTime = Date.now();
        
        console.log(`✅ Successfully fetched all players in ${((endTime - startTime) / 1000).toFixed(2)} seconds`);
        console.log(`\n📊 Match Summary:`);
        console.log(`   Match ID: ${allPlayersData.matchId}`);
        
        // Team 0 stats
        console.log(`\n🟢 Team 0 (${allPlayersData.teams.team0.length} players):`);
        allPlayersData.teams.team0.forEach(player => {
            if (player.statistics) {
                console.log(`   Player ${player.accountId}:`);
                console.log(`     Win Rate: ${player.statistics.winRate}% | KDA: ${player.statistics.averageKDA}`);
            }
        });
        
        // Team 1 stats
        console.log(`\n🔴 Team 1 (${allPlayersData.teams.team1.length} players):`);
        allPlayersData.teams.team1.forEach(player => {
            if (player.statistics) {
                console.log(`   Player ${player.accountId}:`);
                console.log(`     Win Rate: ${player.statistics.winRate}% | KDA: ${player.statistics.averageKDA}`);
            }
        });
        
        // Calculate team averages
        const team0Stats = allPlayersData.teams.team0.filter(p => p.statistics);
        const team1Stats = allPlayersData.teams.team1.filter(p => p.statistics);
        
        if (team0Stats.length > 0 && team1Stats.length > 0) {
            const team0AvgWR = team0Stats.reduce((sum, p) => sum + p.statistics.winRate, 0) / team0Stats.length;
            const team1AvgWR = team1Stats.reduce((sum, p) => sum + p.statistics.winRate, 0) / team1Stats.length;
            
            console.log(`\n📈 Team Averages:`);
            console.log(`   Team 0: ${team0AvgWR.toFixed(2)}% average win rate`);
            console.log(`   Team 1: ${team1AvgWR.toFixed(2)}% average win rate`);
            console.log(`   Difference: ${(team0AvgWR - team1AvgWR).toFixed(2)}%`);
        }
        
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }
    
    console.log('\n');
    
    // Test 4: Rate limit test with only_stored_history
    console.log('4️⃣ Testing rate limits with rapid requests');
    console.log('─'.repeat(50));
    console.log('Making 10 rapid requests with only_stored_history=true...\n');
    
    let successCount = 0;
    let errorCount = 0;
    const testStartTime = Date.now();
    
    for (let i = 0; i < 10; i++) {
        try {
            await api.getPlayerMatchHistory(testPlayerId, 5, 0, true);
            successCount++;
            process.stdout.write('✅');
        } catch (error) {
            errorCount++;
            process.stdout.write('❌');
        }
    }
    
    const testEndTime = Date.now();
    console.log(`\n\nCompleted in ${((testEndTime - testStartTime) / 1000).toFixed(2)} seconds`);
    console.log(`Success: ${successCount}/10 | Errors: ${errorCount}/10`);
    console.log(errorCount === 0 ? '✅ No rate limiting detected!' : '⚠️  Some requests failed');
    
    console.log('\n🏁 All tests completed!');
};

// Run the tests
testAPIIntegration().catch(console.error);