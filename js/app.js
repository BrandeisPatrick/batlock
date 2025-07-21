// Initialize enhanced UI if available
let enhancedUI = null;
try {
    if (typeof EnhancedUI !== 'undefined') {
        enhancedUI = new EnhancedUI();
    }
} catch (e) {
    console.log('EnhancedUI not loaded, using standard UI');
}

// Event Listeners
fetchButton.addEventListener('click', handleFetchData);
matchIdInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') handleFetchData();
});

// Main Logic
async function handleFetchData() {
    const matchId = matchIdInput.value.trim();
    if (!matchId) {
        showError('Please enter a Match ID.');
        return;
    }

    showLoader(true);
    showError(null);
    hideCharts();

    try {
        const players = await getPlayersFromMatch(matchId);
       
        if (!players || players.length === 0) {
            showError(`No players found for Match ID: ${matchId}. Displaying mock data.`);
            await processAndDisplayStats(MOCK_MATCH_DATA.players);
            return;
        }
       
        await processAndDisplayStats(players);

    } catch (error) {
        console.error('Error fetching data:', error);
        showError(`Failed to fetch data. ${error.message}. Displaying mock data as a fallback.`);
        await processAndDisplayStats(MOCK_MATCH_DATA.players);
    } finally {
        showLoader(false);
    }
}

async function processAndDisplayStats(players) {
    const team1 = players.filter(p => p.team === 1);
    const team2 = players.filter(p => p.team === 2);
   
    // Process players in parallel (faster) with error handling
    const team1Stats = await Promise.all(
        team1.map(async (player) => {
            try {
                return await getPlayerStats(player.steamId);
            } catch (error) {
                console.warn(`Failed to get stats for ${player.steamId}:`, error.message);
                return { steamId: player.steamId, total: 0, winRate: 0 };
            }
        })
    );
    
    const team2Stats = await Promise.all(
        team2.map(async (player) => {
            try {
                return await getPlayerStats(player.steamId);
            } catch (error) {
                console.warn(`Failed to get stats for ${player.steamId}:`, error.message);
                return { steamId: player.steamId, total: 0, winRate: 0 };
            }
        })
    );
   
    // Merge player data with stats
    const team1PlayersWithStats = team1.map((player, index) => ({
        ...player,
        ...team1Stats[index]
    }));
    const team2PlayersWithStats = team2.map((player, index) => ({
        ...player,
        ...team2Stats[index]
    }));
   
    // Check if we have enhanced data (KDA, damage, etc.)
    const hasEnhancedData = players.some(p => p.kda !== undefined || p.damagePerMinute !== undefined);
   
    if (hasEnhancedData && enhancedUI) {
        // Use enhanced UI for richer visualization
        const container = document.getElementById('chartsContainer');
        container.innerHTML = ''; // Clear existing content
        container.classList.remove('hidden');
        
        // Create team summary cards
        const summaryContainer = document.createElement('div');
        summaryContainer.className = 'grid grid-cols-1 md:grid-cols-2 gap-6 mb-8';
        
        // Calculate team stats if available
        const team1TotalStats = team1PlayersWithStats.reduce((acc, p) => ({
            totalKills: acc.totalKills + (p.kills || 0),
            totalDeaths: acc.totalDeaths + (p.deaths || 0),
            totalAssists: acc.totalAssists + (p.assists || 0),
            totalDamage: acc.totalDamage + (p.playerDamage || 0),
            totalHealing: acc.totalHealing + (p.healingOutput || 0),
            averageKDA: acc.averageKDA + (p.kda || 0)
        }), { totalKills: 0, totalDeaths: 0, totalAssists: 0, totalDamage: 0, totalHealing: 0, averageKDA: 0 });
        team1TotalStats.averageKDA = team1TotalStats.averageKDA / team1.length;
        
        const team2TotalStats = team2PlayersWithStats.reduce((acc, p) => ({
            totalKills: acc.totalKills + (p.kills || 0),
            totalDeaths: acc.totalDeaths + (p.deaths || 0),
            totalAssists: acc.totalAssists + (p.assists || 0),
            totalDamage: acc.totalDamage + (p.playerDamage || 0),
            totalHealing: acc.totalHealing + (p.healingOutput || 0),
            averageKDA: acc.averageKDA + (p.kda || 0)
        }), { totalKills: 0, totalDeaths: 0, totalAssists: 0, totalDamage: 0, totalHealing: 0, averageKDA: 0 });
        team2TotalStats.averageKDA = team2TotalStats.averageKDA / team2.length;
        
        summaryContainer.appendChild(enhancedUI.createTeamSummaryCard(1, team1PlayersWithStats, team1TotalStats));
        summaryContainer.appendChild(enhancedUI.createTeamSummaryCard(2, team2PlayersWithStats, team2TotalStats));
        container.appendChild(summaryContainer);
        
        // Create player cards for each team
        const playersContainer = document.createElement('div');
        playersContainer.className = 'grid grid-cols-1 md:grid-cols-2 gap-6 mb-8';
        
        const team1Container = document.createElement('div');
        team1Container.innerHTML = '<h3 class="text-lg font-bold text-blue-400 mb-3">Team 1 Players</h3>';
        team1PlayersWithStats.forEach(player => {
            team1Container.appendChild(enhancedUI.createPlayerCard(player));
        });
        
        const team2Container = document.createElement('div');
        team2Container.innerHTML = '<h3 class="text-lg font-bold text-orange-400 mb-3">Team 2 Players</h3>';
        team2PlayersWithStats.forEach(player => {
            team2Container.appendChild(enhancedUI.createPlayerCard(player));
        });
        
        playersContainer.appendChild(team1Container);
        playersContainer.appendChild(team2Container);
        container.appendChild(playersContainer);
        
        // Display performance comparison charts
        enhancedUI.displayPlayerPerformance([...team1PlayersWithStats, ...team2PlayersWithStats]);
    }
   
    // Always display the standard charts as well
    const team1Labels = team1.map(p => p.displayName);
    const team2Labels = team2.map(p => p.displayName);
   
    const team1MatchesData = team1Stats.map(s => s ? s.total : 0);
    const team2MatchesData = team2Stats.map(s => s ? s.total : 0);
    const team1WinRateData = team1Stats.map(s => s ? s.winRate : 0);
    const team2WinRateData = team2Stats.map(s => s ? s.winRate : 0);

    displayCharts(
        team1Labels,
        team2Labels,
        team1MatchesData,
        team2MatchesData,
        team1WinRateData,
        team2WinRateData
    );
}