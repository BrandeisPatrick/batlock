/**
 * Test if we can access Deadlock API directly without CORS proxy
 * This will help determine if the API has proper CORS headers
 */

const testDirectAPIAccess = async () => {
    console.log('🔍 Testing Direct API Access (No CORS Proxy)\n');
    
    const endpoints = [
        {
            name: 'Match Metadata',
            url: 'https://api.deadlock-api.com/v1/matches/38069822/metadata'
        },
        {
            name: 'Player Match History',
            url: 'https://api.deadlock-api.com/v1/players/83829524/match-history?limit=5&only_stored_history=true'
        },
        {
            name: 'Active Matches',
            url: 'https://api.deadlock-api.com/v1/matches/active'
        }
    ];
    
    console.log('Testing endpoints WITHOUT CORS proxy...\n');
    
    for (const endpoint of endpoints) {
        console.log(`📍 Testing: ${endpoint.name}`);
        console.log(`   URL: ${endpoint.url}`);
        
        try {
            const startTime = Date.now();
            
            // Direct API call - no proxy
            const response = await fetch(endpoint.url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            console.log(`   Status: ${response.status} ${response.statusText}`);
            console.log(`   Response Time: ${responseTime}ms`);
            
            // Check CORS headers
            const corsHeaders = {
                'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
                'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
                'access-control-allow-headers': response.headers.get('access-control-allow-headers')
            };
            
            console.log(`   CORS Headers:`);
            Object.entries(corsHeaders).forEach(([header, value]) => {
                if (value) {
                    console.log(`     ${header}: ${value}`);
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`   ✅ SUCCESS - Data received`);
                console.log(`   Data preview:`, JSON.stringify(data).substring(0, 100) + '...');
            } else {
                console.log(`   ❌ FAILED - HTTP ${response.status}`);
            }
            
        } catch (error) {
            console.log(`   ❌ ERROR: ${error.message}`);
            
            // In Node.js, CORS errors won't occur, but network errors might
            if (error.message.includes('CORS') || error.message.includes('cors')) {
                console.log('   ⚠️  CORS issue detected');
            } else if (error.message.includes('fetch')) {
                console.log('   ⚠️  Network/fetch error');
            }
        }
        
        console.log('');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY:');
    console.log('='.repeat(60));
    
    console.log('\n⚠️  IMPORTANT NOTES:');
    console.log('1. This test runs in Node.js, which does NOT enforce CORS');
    console.log('2. Even if requests succeed here, they may fail in browser');
    console.log('3. Check the CORS headers above to see if browser access is allowed');
    console.log('4. If "access-control-allow-origin" is missing or not "*", browser requests will fail');
    
    console.log('\n🌐 To test in browser, open DevTools console and run:');
    console.log(`
fetch('https://api.deadlock-api.com/v1/matches/38069822/metadata')
  .then(res => {
    console.log('Status:', res.status);
    console.log('CORS Header:', res.headers.get('access-control-allow-origin'));
    return res.json();
  })
  .then(data => console.log('Success! Data:', data))
  .catch(err => console.log('Failed:', err.message));
    `);
    
    console.log('\n🔧 Testing with different request configurations...\n');
    
    // Test with different headers to see if API responds differently
    const headerTests = [
        {
            name: 'No headers',
            headers: {}
        },
        {
            name: 'With Origin header',
            headers: {
                'Origin': 'http://localhost:3000'
            }
        },
        {
            name: 'With Referer',
            headers: {
                'Referer': 'http://localhost:3000',
                'Origin': 'http://localhost:3000'
            }
        }
    ];
    
    const testUrl = 'https://api.deadlock-api.com/v1/matches/38069822/metadata';
    
    for (const test of headerTests) {
        console.log(`🧪 ${test.name}:`);
        try {
            const response = await fetch(testUrl, {
                method: 'GET',
                headers: test.headers
            });
            
            const corsHeader = response.headers.get('access-control-allow-origin');
            console.log(`   Status: ${response.status}`);
            console.log(`   CORS: ${corsHeader || 'NOT SET'}`);
            
            if (corsHeader) {
                console.log(`   ✅ CORS header present!`);
            } else {
                console.log(`   ❌ No CORS header - browser requests will fail`);
            }
        } catch (error) {
            console.log(`   Error: ${error.message}`);
        }
        console.log('');
    }
    
    console.log('\n🏁 Test completed!');
};

// Run the test
testDirectAPIAccess().catch(console.error);