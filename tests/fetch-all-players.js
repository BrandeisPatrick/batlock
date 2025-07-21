/**
 * Fetch statistics for all 12 players from match 38069822
 */

const getPlayerStats = async (accountId, limit = 50) => {
    const baseUrl = 'https://api.deadlock-api.com/v1';
    
    try {
        // Use only_stored_history=true to bypass rate limiting
        const url = `${baseUrl}/players/${accountId}/match-history?limit=${limit}&only_stored_history=true`;
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.error(`❌ API Error for player ${accountId}: ${response.status} ${response.statusText}`);
            return null;
        }
        
        const data = await response.json();
        const matches = Array.isArray(data) ? data : (data.matches || []);
        
        if (matches.length === 0) {
            return {
                accountId,
                error: 'No matches found'
            };
        }
        
        // Calculate stats from match history
        let wins = 0;
        let totalKills = 0;
        let totalDeaths = 0;
        let totalAssists = 0;
        
        const actualMatches = Math.min(matches.length, limit);
        
        matches.slice(0, actualMatches).forEach((match) => {
            const won = match.match_result === 1;
            if (won) wins++;
            
            totalKills += match.player_kills || 0;
            totalDeaths += match.player_deaths || 0;
            totalAssists += match.player_assists || 0;
        });
        
        // Calculate averages
        const winRate = actualMatches > 0 ? (wins / actualMatches * 100) : 0;
        const avgKills = actualMatches > 0 ? (totalKills / actualMatches) : 0;
        const avgDeaths = actualMatches > 0 ? (totalDeaths / actualMatches) : 0;
        const avgAssists = actualMatches > 0 ? (totalAssists / actualMatches) : 0;
        const avgKDA = avgDeaths > 0 ? ((avgKills + avgAssists) / avgDeaths) : (avgKills + avgAssists);
        
        return {
            accountId,
            totalMatchesInDB: matches.length,
            matchesAnalyzed: actualMatches,
            wins,
            winRate: parseFloat(winRate.toFixed(2)),
            avgKills: parseFloat(avgKills.toFixed(2)),
            avgDeaths: parseFloat(avgDeaths.toFixed(2)),
            avgAssists: parseFloat(avgAssists.toFixed(2)),
            avgKDA: parseFloat(avgKDA.toFixed(2)),
            recentHero: matches[0].hero_id // Most recent hero played
        };
        
    } catch (error) {
        console.error(`❌ Error fetching stats for player ${accountId}:`, error.message);
        return {
            accountId,
            error: error.message
        };
    }
};

const fetchAllPlayersFromMatch = async () => {
    // All 12 players from match 38069822
    const playerIds = [
        '83829524',    // Team 1, slot 11, hero 13
        '1524353695',  // Team 0, slot 2, hero 4  
        '1167486585',  // Team 0, slot 3, hero 18
        '95166203',    // Team 1, slot 6, hero 12
        '445177910',   // Team 1, slot 8, hero 19
        '46771019',    // Team 1, slot 12, hero 2
        '184591063',   // Team 0, slot 1, hero 1
        '296995168',   // Team 1, slot 7, hero 11
        '108159355',   // Team 1, slot 10, hero 16
        '160259861',   // Team 0, slot 5, hero 50
        '1048084960',  // Team 1, slot 9, hero 7
        '1571969349'   // Team 0, slot 4, hero 15
    ];
    
    const teamAssignments = {
        '83829524': { team: 1, slot: 11, hero: 13 },
        '1524353695': { team: 0, slot: 2, hero: 4 },
        '1167486585': { team: 0, slot: 3, hero: 18 },
        '95166203': { team: 1, slot: 6, hero: 12 },
        '445177910': { team: 1, slot: 8, hero: 19 },
        '46771019': { team: 1, slot: 12, hero: 2 },
        '184591063': { team: 0, slot: 1, hero: 1 },
        '296995168': { team: 1, slot: 7, hero: 11 },
        '108159355': { team: 1, slot: 10, hero: 16 },
        '160259861': { team: 0, slot: 5, hero: 50 },
        '1048084960': { team: 1, slot: 9, hero: 7 },
        '1571969349': { team: 0, slot: 4, hero: 15 }
    };
    
    console.log(`🔄 Fetching statistics for all ${playerIds.length} players from match 38069822...`);
    console.log('🚀 Using only_stored_history=true to bypass rate limiting\n');
    
    const allStats = [];
    let successCount = 0;
    let errorCount = 0;
    
    // Process players with small delays to be respectful to the API
    for (let i = 0; i < playerIds.length; i++) {
        const playerId = playerIds[i];
        const teamInfo = teamAssignments[playerId];
        
        console.log(`📊 [${i + 1}/${playerIds.length}] Fetching stats for player ${playerId} (Team ${teamInfo.team}, Hero ${teamInfo.hero})...`);
        
        const stats = await getPlayerStats(playerId, 50);
        
        if (stats && !stats.error) {
            stats.teamInMatch = teamInfo.team;
            stats.slotInMatch = teamInfo.slot;
            stats.heroInMatch = teamInfo.hero;
            allStats.push(stats);
            successCount++;
            console.log(`   ✅ Success: ${stats.winRate}% WR, ${stats.avgKDA} KDA (${stats.matchesAnalyzed} matches)`);
        } else {
            errorCount++;
            console.log(`   ❌ Failed: ${stats?.error || 'Unknown error'}`);
            allStats.push(stats || { accountId: playerId, error: 'Unknown error' });
        }
        
        // No delay needed when using only_stored_history=true (no rate limiting)
        // But add a small 100ms delay to be polite to the server
        if (i < playerIds.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📈 MATCH 38069822 - ALL PLAYER STATISTICS SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Successfully fetched: ${successCount} players`);
    console.log(`❌ Failed requests: ${errorCount} players`);
    console.log();
    
    // Separate by teams
    const team0Players = allStats.filter(p => p.teamInMatch === 0 && !p.error);
    const team1Players = allStats.filter(p => p.teamInMatch === 1 && !p.error);
    
    console.log('🟢 TEAM 0 (WINNERS):');
    console.log('─'.repeat(40));
    team0Players
        .sort((a, b) => a.slotInMatch - b.slotInMatch)
        .forEach(player => {
            console.log(`Player ${player.accountId} (Slot ${player.slotInMatch}, Hero ${player.heroInMatch}):`);
            console.log(`  Win Rate: ${player.winRate}% | KDA: ${player.avgKDA} (K:${player.avgKills} D:${player.avgDeaths} A:${player.avgAssists})`);
            console.log(`  Total Games: ${player.totalMatchesInDB} | Recent Hero: ${player.recentHero}`);
            console.log();
        });
    
    console.log('🔴 TEAM 1:');
    console.log('─'.repeat(40));
    team1Players
        .sort((a, b) => a.slotInMatch - b.slotInMatch)
        .forEach(player => {
            console.log(`Player ${player.accountId} (Slot ${player.slotInMatch}, Hero ${player.heroInMatch}):`);
            console.log(`  Win Rate: ${player.winRate}% | KDA: ${player.avgKDA} (K:${player.avgKills} D:${player.avgDeaths} A:${player.avgAssists})`);
            console.log(`  Total Games: ${player.totalMatchesInDB} | Recent Hero: ${player.recentHero}`);
            console.log();
        });
    
    // Calculate team averages
    if (team0Players.length > 0 && team1Players.length > 0) {
        const team0AvgWR = team0Players.reduce((sum, p) => sum + p.winRate, 0) / team0Players.length;
        const team0AvgKDA = team0Players.reduce((sum, p) => sum + p.avgKDA, 0) / team0Players.length;
        
        const team1AvgWR = team1Players.reduce((sum, p) => sum + p.winRate, 0) / team1Players.length;
        const team1AvgKDA = team1Players.reduce((sum, p) => sum + p.avgKDA, 0) / team1Players.length;
        
        console.log('📊 TEAM COMPARISON:');
        console.log('─'.repeat(40));
        console.log(`Team 0 (Winners): ${team0AvgWR.toFixed(2)}% avg WR | ${team0AvgKDA.toFixed(2)} avg KDA`);
        console.log(`Team 1: ${team1AvgWR.toFixed(2)}% avg WR | ${team1AvgKDA.toFixed(2)} avg KDA`);
        console.log();
        
        const wrDifference = team0AvgWR - team1AvgWR;
        const kdaDifference = team0AvgKDA - team1AvgKDA;
        
        console.log('🎯 ANALYSIS:');
        console.log(`Win Rate Difference: ${wrDifference > 0 ? '+' : ''}${wrDifference.toFixed(2)}% (Team 0 advantage)`);
        console.log(`KDA Difference: ${kdaDifference > 0 ? '+' : ''}${kdaDifference.toFixed(2)} (Team 0 advantage)`);
    }
    
    return allStats;
};

// Run the fetch
fetchAllPlayersFromMatch()
    .then(results => {
        console.log(`\n🏁 Completed! Retrieved stats for ${results.length} players.`);
    })
    .catch(error => {
        console.error('❌ Error in main execution:', error);
    });