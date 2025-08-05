// Basic item recommendation data for demonstration purposes
// Keyed by hero ID. Values are arrays of item IDs/names.
export const HERO_COUNTER_ITEMS = {
    // Infernus
    1: ['item_coolant_bomb', 'item_barrier_generator', 'item_flash_net'],
    // Seven
    2: ['item_power_dampener', 'item_shield_breaker', 'item_charge_coil'],
    // Vindicta
    3: ['item_reflector', 'item_static_trap', 'item_detoxifier']
};

export const HERO_TOP_WINRATE_ITEMS = {
    // Infernus
    1: ['item_flame_blade', 'item_reflector', 'item_heal_pack'],
    // Seven
    2: ['item_speed_boots', 'item_energy_bar', 'item_targeting_computer'],
    // Vindicta
    3: ['item_shrapnel', 'item_precision_scope', 'item_flash_net']
};

export function getTopCounterItems(heroId) {
    return HERO_COUNTER_ITEMS[heroId] || [];
}

export function getTopWinRateItems(heroId) {
    return HERO_TOP_WINRATE_ITEMS[heroId] || [];
}

// Get the top win rate items against a list of hero IDs
export function getTopEffectiveItems(heroIds, limit = 10) {
    const itemCounts = {};
    heroIds.forEach(id => {
        const items = getTopWinRateItems(id);
        items.forEach(item => {
            itemCounts[item] = (itemCounts[item] || 0) + 1;
        });
    });
    return Object.entries(itemCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([item]) => item);
}
