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
   
    const team1Stats = await Promise.all(team1.map(p => getPlayerStats(p.steamId)));
    const team2Stats = await Promise.all(team2.map(p => getPlayerStats(p.steamId)));
   
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