/**
 * Test script to discover hero display names to slug mappings
 * This script will fetch hero data from the API and extract the mappings
 */

import DeadlockAPIService from '../js/deadlock-api-service.js';

async function discoverHeroMappings() {
    console.log('🔍 Discovering Deadlock Hero Mappings...\n');
    
    const apiService = new DeadlockAPIService();
    
    try {
        // Fetch all heroes data from the assets API
        console.log('Fetching hero data from API...');
        const heroes = await apiService.getAllHeroes();
        
        if (!heroes || heroes.length === 0) {
            console.log('❌ No hero data returned from API');
            return;
        }
        
        console.log(`✅ Found ${heroes.length} heroes\n`);
        
        // Create mappings
        const displayNameToSlug = {};
        const idToDisplayName = {};
        const idToClassName = {};
        const slugToDisplayName = {};
        
        console.log('Hero Mappings:\n');
        console.log('ID | Display Name | Class Name | Slug');
        console.log('---|--------------|------------|-----');
        
        heroes.forEach(hero => {
            // Extract slug from class_name (e.g., "hero_atlas" -> "atlas")
            const slug = hero.class_name ? hero.class_name.replace('hero_', '') : 'unknown';
            const displayName = hero.name || 'Unknown';
            const id = hero.id || 'unknown';
            
            // Store mappings
            displayNameToSlug[displayName] = slug;
            idToDisplayName[id] = displayName;
            idToClassName[id] = hero.class_name;
            slugToDisplayName[slug] = displayName;
            
            console.log(`${id} | ${displayName} | ${hero.class_name} | ${slug}`);
        });
        
        // Generate JavaScript mapping objects
        console.log('\n\n📝 JavaScript Mapping Objects:\n');
        
        console.log('// Display Name to Slug Mapping');
        console.log('const HERO_DISPLAY_TO_SLUG = {');
        Object.entries(displayNameToSlug).forEach(([name, slug]) => {
            console.log(`    "${name}": "${slug}",`);
        });
        console.log('};\n');
        
        console.log('// Slug to Display Name Mapping');
        console.log('const HERO_SLUG_TO_DISPLAY = {');
        Object.entries(slugToDisplayName).forEach(([slug, name]) => {
            console.log(`    "${slug}": "${name}",`);
        });
        console.log('};\n');
        
        console.log('// ID to Display Name Mapping');
        console.log('const HERO_ID_TO_NAME = {');
        Object.entries(idToDisplayName).forEach(([id, name]) => {
            console.log(`    ${id}: "${name}",`);
        });
        console.log('};\n');
        
        console.log('// ID to Class Name Mapping');
        console.log('const HERO_ID_TO_CLASS = {');
        Object.entries(idToClassName).forEach(([id, className]) => {
            console.log(`    ${id}: "${className}",`);
        });
        console.log('};\n');
        
        // Test some known mappings from the current code
        console.log('\n🧪 Testing known mappings:');
        const knownMappings = {
            6: { name: 'Abrams', className: 'hero_atlas' },
            1: { name: 'Infernus', className: 'hero_inferno' },
            7: { name: 'Wraith', className: 'hero_wraith' }
        };
        
        Object.entries(knownMappings).forEach(([id, expected]) => {
            const actual = heroes.find(h => h.id == id);
            if (actual) {
                const match = actual.name === expected.name && actual.class_name === expected.className;
                console.log(`${match ? '✅' : '❌'} ID ${id}: Expected ${expected.name} (${expected.className}), Got ${actual.name} (${actual.class_name})`);
            } else {
                console.log(`❌ ID ${id}: Not found in API response`);
            }
        });
        
    } catch (error) {
        console.error('❌ Error discovering hero mappings:', error.message);
    }
}

// Run the discovery
discoverHeroMappings();