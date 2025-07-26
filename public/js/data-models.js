/**
 * Data models and transformers for Deadlock match and player data
 */

class MatchData {
    constructor(rawData) {
        this.matchId = rawData.match_id || rawData.id;
        this.duration = rawData.duration_s || 0;
        this.startTime = rawData.start_time;
        this.endTime = rawData.end_time;
        this.gameMode = rawData.game_mode;
        this.winningTeam = rawData.winning_team;
        this.players = (rawData.players || []).map(p => new PlayerMatchData(p, this.duration));
    }

    getTeamPlayers(teamNumber) {
        return this.players.filter(p => p.team === teamNumber);
    }

    getTeamStats(teamNumber) {
        const teamPlayers = this.getTeamPlayers(teamNumber);
        return {
            totalKills: teamPlayers.reduce((sum, p) => sum + p.kills, 0),
            totalDeaths: teamPlayers.reduce((sum, p) => sum + p.deaths, 0),
            totalAssists: teamPlayers.reduce((sum, p) => sum + p.assists, 0),
            totalDamage: teamPlayers.reduce((sum, p) => sum + p.playerDamage, 0),
            totalHealing: teamPlayers.reduce((sum, p) => sum + p.healingOutput, 0),
            totalNetWorth: teamPlayers.reduce((sum, p) => sum + p.netWorth, 0),
            averageKDA: teamPlayers.reduce((sum, p) => sum + p.kda, 0) / teamPlayers.length,
            won: this.winningTeam === teamNumber
        };
    }
}

class PlayerMatchData {
    constructor(rawData, matchDuration) {
        // Basic info
        this.steamId = rawData.account_id || rawData.steam_id;
        this.playerName = rawData.player_name || rawData.name;
        this.team = rawData.team === 0 ? 1 : 2; // Convert from API format
        this.playerSlot = rawData.player_slot;
        
        // Hero info
        this.heroId = rawData.hero_id;
        this.heroName = rawData.hero_name;
        
        // Combat stats
        this.kills = rawData.kills || 0;
        this.deaths = rawData.deaths || 0;
        this.assists = rawData.assists || 0;
        this.kda = this.calculateKDA();
        
        // Damage and healing
        this.playerDamage = rawData.player_damage || 0;
        this.damagePerMinute = this.calculatePerMinute(this.playerDamage, matchDuration);
        this.healingOutput = rawData.healing_output || 0;
        this.healingPerMinute = this.calculatePerMinute(this.healingOutput, matchDuration);
        
        // Economy
        this.netWorth = rawData.net_worth || 0;
        this.netWorthPerMinute = this.calculatePerMinute(this.netWorth, matchDuration);
        this.lastHits = rawData.last_hits || 0;
        this.denies = rawData.denies || 0;
        
        // Items and abilities
        this.items = rawData.items || [];
        this.abilities = rawData.abilities || [];
        
        // Additional stats
        this.level = rawData.level || 0;
        this.goldSpent = rawData.gold_spent || 0;
        this.heroDamage = rawData.hero_damage || 0;
        this.towerDamage = rawData.tower_damage || 0;
    }

    calculateKDA() {
        if (this.deaths === 0) {
            return this.kills + this.assists;
        }
        return Math.round(((this.kills + this.assists) / this.deaths) * 100) / 100;
    }

    calculatePerMinute(value, durationSeconds) {
        if (!durationSeconds || durationSeconds === 0) return 0;
        const minutes = durationSeconds / 60;
        return Math.round((value / minutes) * 10) / 10;
    }

    getPerformanceRating() {
        // Simple performance rating based on KDA and damage/healing output
        const kdaScore = this.kda * 10;
        const damageScore = this.damagePerMinute / 100;
        const healingScore = this.healingPerMinute / 50;
        const economyScore = this.netWorthPerMinute / 100;
        
        return Math.round(kdaScore + damageScore + healingScore + economyScore);
    }
}

class PlayerProfile {
    constructor(rawData) {
        this.steamId = rawData.steam_id || rawData.account_id;
        this.playerName = rawData.player_name || rawData.name;
        // Steam display name if available
        this.displayName = rawData.displayName || rawData.personaname || null;
        this.avatar = rawData.avatar;
        this.profileUrl = rawData.profile_url;
        
        // Overall stats
        this.totalMatches = rawData.total_matches || 0;
        this.wins = rawData.wins || 0;
        this.losses = rawData.losses || 0;
        this.winRate = this.totalMatches > 0 ? Math.round((this.wins / this.totalMatches) * 100) : 0;
        
        // Average stats
        this.averageKills = rawData.average_kills || 0;
        this.averageDeaths = rawData.average_deaths || 0;
        this.averageAssists = rawData.average_assists || 0;
        this.averageKDA = rawData.average_kda || 0;
        
        // Hero preferences
        this.favoriteHeroes = rawData.favorite_heroes || [];
        this.heroStats = rawData.hero_stats || {};
        
        // Recent performance
        this.recentMatches = rawData.recent_matches || [];
        this.recentForm = this.calculateRecentForm();
    }

    calculateRecentForm() {
        if (!this.recentMatches || this.recentMatches.length === 0) return [];
        
        // Determine win/loss based on which team the player was on.
        return this.recentMatches.slice(0, 10).map(match => {
            const resultValue = Number(match.match_result);
            let teamValue = null;
            if (match.team !== undefined) {
                teamValue = Number(match.team);
            } else if (match.player_team !== undefined) {
                teamValue = Number(match.player_team);
            } else if (match.player_slot !== undefined) {
                teamValue = Number(match.player_slot) <= 6 ? 0 : 1;
            }
            const playerWon = teamValue !== null && !Number.isNaN(resultValue)
                ? teamValue === resultValue
                : resultValue === 0;
            return playerWon ? 'W' : 'L';
        });
    }

    getHeroWinRate(heroId) {
        const heroStat = this.heroStats[heroId];
        if (!heroStat || !heroStat.matches) return 0;
        
        return Math.round((heroStat.wins / heroStat.matches) * 100);
    }

    getMostPlayedHeroes(limit = 5) {
        return Object.entries(this.heroStats)
            .sort((a, b) => b[1].matches - a[1].matches)
            .slice(0, limit)
            .map(([heroId, stats]) => ({
                heroId,
                ...stats,
                winRate: this.getHeroWinRate(heroId)
            }));
    }

    getBestHeroes(limit = 5) {
        return Object.entries(this.heroStats)
            .filter(([_, stats]) => stats.matches >= 5) // Minimum 5 matches
            .sort((a, b) => {
                const aWinRate = (a[1].wins / a[1].matches) * 100;
                const bWinRate = (b[1].wins / b[1].matches) * 100;
                return bWinRate - aWinRate;
            })
            .slice(0, limit)
            .map(([heroId, stats]) => ({
                heroId,
                ...stats,
                winRate: this.getHeroWinRate(heroId)
            }));
    }
}

// Export for use in other modules
export { MatchData, PlayerMatchData, PlayerProfile };

// Also make available globally for legacy compatibility
window.MatchData = MatchData;
window.PlayerMatchData = PlayerMatchData;
window.PlayerProfile = PlayerProfile;