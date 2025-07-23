import https from 'https';

async function fetchData(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve(data);
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        }).on('error', reject);
    });
}

async function debugMatchHistory() {
    const steamId64 = '76561198148166542';
    console.log('=== DEBUGGING MATCH HISTORY ===');
    console.log(`SteamID64: ${steamId64}`);
    
    // Convert to account ID
    const accountId = BigInt(steamId64) - BigInt('76561197960265728');
    console.log(`Account ID: ${accountId}`);
    
    // Test different endpoints that might work
    const testEndpoints = [
        `https://api.deadlock-api.com/v1/players/${accountId}/match-history`,
        `https://api.deadlock-api.com/v1/players/${accountId}/matches`,
        `https://api.deadlock-api.com/v1/analytics/hero-stats?account_id=${accountId}`,
        `https://api.deadlock-api.com/v1/matches?account_id=${accountId}`,
    ];
    
    for (const endpoint of testEndpoints) {
        console.log(`\n--- Testing: ${endpoint} ---`);
        try {
            const data = await fetchData(endpoint);
            console.log('✅ Success!');
            console.log('Response type:', Array.isArray(data) ? 'Array' : typeof data);
            console.log('Response keys:', typeof data === 'object' ? Object.keys(data) : 'N/A');
            
            if (Array.isArray(data)) {
                console.log(`Array length: ${data.length}`);
                if (data.length > 0) {
                    console.log('First item keys:', Object.keys(data[0]));
                }
            } else if (data && typeof data === 'object') {
                console.log('Sample data:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
            }
        } catch (error) {
            console.log('❌ Error:', error.message);
        }
    }
}

debugMatchHistory().catch(console.error);