import DeadlockAPIService from './deadlock-api-service.js';

const apiService = new DeadlockAPIService();

/**
 * Fetch top win rate items for a specific hero from the Deadlock API
 * @param {number} heroId - The hero ID
 * @param {number} limit - Max number of items to retrieve
 * @returns {Promise<string[]>} Array of item IDs
 */
export async function getTopWinRateItems(heroId, limit = 10) {
    if (!heroId) return [];
    try {
        const data = await apiService.getHeroTopItems(heroId, limit);
        const items = Array.isArray(data) ? data : (data.items || []);
        return items.slice(0, limit).map(item => item.item_id || item.id || item.itemId);
    } catch (err) {
        console.error(`Failed to fetch top win rate items for hero ${heroId}`, err);
        return [];
    }
}

/**
 * Aggregate top win rate items across multiple enemy heroes
 * @param {number[]} heroIds - List of enemy hero IDs
 * @param {number} limit - Number of aggregated items to return
 * @returns {Promise<string[]>} Array of item IDs
 */
export async function getTopEffectiveItems(heroIds, limit = 10) {
    const itemCounts = {};
    for (const id of heroIds) {
        const items = await getTopWinRateItems(id, limit);
        for (const item of items) {
            itemCounts[item] = (itemCounts[item] || 0) + 1;
        }
    }
    return Object.entries(itemCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([item]) => item);
}
