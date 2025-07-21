/**
 * Test getting player statistics (KDA, win rate) from match history
 */

const getPlayerStats = async (accountId, limit = 50) => {
    const baseUrl = 'https://api.deadlock-api.com/v1';
    
    console.log(`Getting stats for player ${accountId} (last ${limit} matches)`);
    
    try {
        const url = `${baseUrl}/players/${accountId}/match-history?limit=${limit}`;
        console.log(`Fetching: ${url}`);
        
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`Response: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            console.error(`API Error: ${response.status} ${response.statusText}`);
            return null;
        }
        
        const data = await response.json();
        console.log(`Received match history data`);
        
        // Debug the data structure
        console.log('Data type:', typeof data);
        console.log('Is array:', Array.isArray(data));
        if (Array.isArray(data)) {
            console.log('Array length:', data.length);
            if (data.length > 0) {
                console.log('First item type:', typeof data[0]);
                console.log('First item keys:', Object.keys(data[0]));
                console.log('Sample match:', JSON.stringify(data[0], null, 2));
            }
        } else {
            console.log('Data structure keys:', Object.keys(data));
            if (data.matches && data.matches.length > 0) {
                console.log('First match structure:', Object.keys(data.matches[0]));
                console.log('Sample match:', JSON.stringify(data.matches[0], null, 2));
            }
        }
        
        // Calculate stats from match history
        let totalMatches = 0;
        let wins = 0;
        let totalKills = 0;
        let totalDeaths = 0;
        let totalAssists = 0;
        
        // Handle both array and object structures
        const matches = Array.isArray(data) ? data : (data.matches || []);
        
        if (matches.length > 0) {
            totalMatches = matches.length;
            console.log(`Processing ${totalMatches} matches...`);
            
            matches.slice(0, Math.min(matches.length, limit)).forEach((match, index) => {
                // The match object directly contains the player's stats
                const won = match.match_result === 1; // 1 = win, 0 = loss
                
                if (won) wins++;
                
                // Extract KDA stats from the match object
                const kills = match.player_kills || 0;
                const deaths = match.player_deaths || 0;
                const assists = match.player_assists || 0;
                
                totalKills += kills;
                totalDeaths += deaths;
                totalAssists += assists;
                
                if (index < 5) { // Log first 5 matches for debugging
                    console.log(`Match ${index + 1}: K:${kills} D:${deaths} A:${assists} Won:${won} (Hero:${match.hero_id})`);
                }
            });
        }
        
        // Use the actual number of matches processed (limited to 'limit')
        const actualMatches = Math.min(matches.length, limit);
        
        // Calculate final stats
        const winRate = actualMatches > 0 ? (wins / actualMatches * 100) : 0;
        const avgKills = actualMatches > 0 ? (totalKills / actualMatches) : 0;
        const avgDeaths = actualMatches > 0 ? (totalDeaths / actualMatches) : 0;
        const avgAssists = actualMatches > 0 ? (totalAssists / actualMatches) : 0;
        const avgKDA = avgDeaths > 0 ? ((avgKills + avgAssists) / avgDeaths) : (avgKills + avgAssists);
        
        const stats = {
            accountId,
            totalMatchesInDB: totalMatches,
            matchesAnalyzed: actualMatches,
            wins,
            winRate: winRate.toFixed(2),
            avgKills: avgKills.toFixed(2),
            avgDeaths: avgDeaths.toFixed(2),
            avgAssists: avgAssists.toFixed(2),
            avgKDA: avgKDA.toFixed(2)
        };
        
        console.log('\n=== PLAYER STATISTICS ===');
        console.log(`Account ID: ${stats.accountId}`);
        console.log(`Total Matches in DB: ${stats.totalMatchesInDB}`);
        console.log(`Matches Analyzed: ${stats.matchesAnalyzed}`);
        console.log(`Wins: ${stats.wins}`);
        console.log(`Win Rate: ${stats.winRate}%`);
        console.log(`Average KDA: ${stats.avgKDA}`);
        console.log(`  - Kills: ${stats.avgKills}`);
        console.log(`  - Deaths: ${stats.avgDeaths}`);
        console.log(`  - Assists: ${stats.avgAssists}`);
        
        return stats;
        
    } catch (error) {
        console.error('Error fetching player stats:', error);
        return null;
    }
};

// Test with multiple players from the match
const testPlayerIds = [
    '83829524',    // First player from our match
    '1524353695',  // Second player (winner)
    '184591063'    // Third player  
];

const testMultiplePlayers = async () => {
    console.log('Testing player statistics for multiple players...\n');
    
    for (let i = 0; i < testPlayerIds.length; i++) {
        const playerId = testPlayerIds[i];
        console.log(`\n${'='.repeat(50)}`);
        console.log(`TESTING PLAYER ${i + 1}: ${playerId}`);
        console.log(`${'='.repeat(50)}`);
        
        const stats = await getPlayerStats(playerId, 50);
        
        if (!stats) {
            console.log(`❌ Failed to get stats for player ${playerId}`);
        } else {
            console.log(`✅ Successfully got stats for player ${playerId}`);
        }
        
        // Small delay between requests
        if (i < testPlayerIds.length - 1) {
            console.log('Waiting 1 second before next request...');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    console.log('\n🏁 Finished testing all players');
};

// Run the test
testMultiplePlayers().catch(console.error);