/**
 * Get player IDs from a match ID using the Deadlock API
 */

const getPlayersFromMatch = async (matchId) => {
    const baseUrl = 'https://api.deadlock-api.com/api/v1';
    const corsProxy = 'https://proxy.cors.sh/';
    
    console.log(`Getting players from match ID: ${matchId}`);
    
    try {
        // Use the correct endpoint from API documentation
        const possibleEndpoints = [
            `${baseUrl}/matches/${matchId}/metadata`,  // Documented endpoint
            `${baseUrl}/matches/${matchId}`,
            `https://api.deadlock-api.com/v1/matches/${matchId}/metadata`  // Try v1 directly
        ];
        
        let matchData = null;
        let successUrl = null;
        
        for (const url of possibleEndpoints) {
            console.log(`Trying: ${url}`);
            
            try {
                // Try direct request first
                let response;
                try {
                    response = await fetch(url, {
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        }
                    });
                    console.log(`  Direct request: ${response.status} ${response.statusText}`);
                } catch (corsError) {
                    console.log('  CORS error, trying with proxy...');
                    // Fallback to CORS proxy
                    const proxiedUrl = `${corsProxy}${encodeURIComponent(url)}`;
                    response = await fetch(proxiedUrl, {
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        }
                    });
                    console.log(`  Proxied request: ${response.status} ${response.statusText}`);
                }
                
                if (response.ok) {
                    matchData = await response.json();
                    successUrl = url;
                    console.log(`  ✅ Success! Got data from: ${url}`);
                    break;
                } else {
                    console.log(`  ❌ Failed: ${response.status} ${response.statusText}`);
                }
            } catch (error) {
                console.log(`  ❌ Error: ${error.message}`);
            }
        }
        
        if (!matchData) {
            console.error('All endpoints failed');
            return null;
        }
        console.log('Match data received successfully');
        
        // Extract player IDs from the match data
        const players = [];
        
        if (matchData.match_info && matchData.match_info.players) {
            console.log(`Found ${matchData.match_info.players.length} players in match`);
            matchData.match_info.players.forEach((player, index) => {
                players.push({
                    playerId: player.account_id,
                    accountId: player.account_id,
                    playerSlot: player.player_slot,
                    team: player.player_slot < 6 ? 0 : 1, // Team 0 for slots 0-5, Team 1 for slots 6-11
                    hero: player.hero_id
                });
            });
        }
        
        console.log('\n=== PLAYER IDs FOUND ===');
        players.forEach((player, index) => {
            console.log(`Player ${index + 1}:`);
            console.log(`  Account ID: ${player.accountId}`);
            console.log(`  Player Slot: ${player.playerSlot}`);
            console.log(`  Team: ${player.team}`);
            console.log(`  Hero ID: ${player.hero}`);
            console.log('');
        });
        
        // Also log basic match info for debugging
        console.log('\n=== MATCH INFO ===');
        if (matchData.match_info) {
            console.log(`Match ID: ${matchData.match_info.match_id}`);
            console.log(`Duration: ${Math.floor(matchData.match_info.duration_s / 60)}:${String(matchData.match_info.duration_s % 60).padStart(2, '0')}`);
            console.log(`Winning Team: ${matchData.match_info.winning_team}`);
            console.log(`Game Mode: ${matchData.match_info.game_mode}`);
        }
        
        return {
            matchId,
            players,
            rawData: matchData
        };
        
    } catch (error) {
        console.error('Error fetching match data:', error);
        return null;
    }
};

// Test with the provided match ID
getPlayersFromMatch('38069822').then(result => {
    if (result) {
        console.log(`\n✅ Successfully extracted ${result.players.length} player IDs from match ${result.matchId}`);
    } else {
        console.log('❌ Failed to get player data');
    }
}).catch(console.error);