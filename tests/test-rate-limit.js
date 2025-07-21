/**
 * Rate limit test for Deadlock API
 * Tests how many requests can be made before hitting rate limits
 */

const testRateLimit = async () => {
    const baseUrl = 'https://api.deadlock-api.com/v1';
    const corsProxy = 'https://proxy.cors.sh/';
    // Test with a valid player ID from the match
    const testPlayerId = '83829524'; // Account ID from match 38069822
    const testEndpoint = `/players/${testPlayerId}/match-history`;
    
    let requestCount = 0;
    let rateLimitHit = false;
    const results = [];
    
    console.log('Starting rate limit test...');
    console.log('Testing endpoint:', `${baseUrl}${testEndpoint}`);
    console.log('');
    
    while (!rateLimitHit && requestCount < 100) { // Safety limit of 100 requests
        const startTime = Date.now();
        requestCount++;
        
        try {
            const url = `${baseUrl}${testEndpoint}`;
            // Try direct request first, then fallback to proxy if CORS fails
            let response;
            try {
                response = await fetch(url, {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
            } catch (corsError) {
                // Fallback to CORS proxy
                const proxiedUrl = `${corsProxy}${encodeURIComponent(url)}`;
                response = await fetch(proxiedUrl, {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });
            }
            
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            const result = {
                request: requestCount,
                status: response.status,
                statusText: response.statusText,
                responseTime: responseTime,
                timestamp: new Date().toISOString()
            };
            
            results.push(result);
            
            console.log(`Request ${requestCount}: ${response.status} ${response.statusText} (${responseTime}ms)`);
            
            if (response.status === 429) {
                rateLimitHit = true;
                console.log('\n🚫 RATE LIMIT HIT!');
                
                // Try to get rate limit headers
                const retryAfter = response.headers.get('Retry-After');
                const rateLimitLimit = response.headers.get('X-RateLimit-Limit');
                const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
                const rateLimitReset = response.headers.get('X-RateLimit-Reset');
                
                console.log('Rate limit headers:');
                console.log('- Retry-After:', retryAfter);
                console.log('- X-RateLimit-Limit:', rateLimitLimit);
                console.log('- X-RateLimit-Remaining:', rateLimitRemaining);
                console.log('- X-RateLimit-Reset:', rateLimitReset);
                
                break;
            }
            
            if (!response.ok && response.status !== 404) {
                console.log(`❌ Error response: ${response.status} ${response.statusText}`);
            }
            
            // Small delay to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } catch (error) {
            console.error(`Request ${requestCount} failed:`, error.message);
            results.push({
                request: requestCount,
                status: 'ERROR',
                statusText: error.message,
                responseTime: Date.now() - startTime,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    console.log('\n📊 TEST RESULTS:');
    console.log('=================');
    console.log(`Total requests made: ${requestCount}`);
    console.log(`Rate limit hit: ${rateLimitHit ? 'YES' : 'NO'}`);
    
    if (rateLimitHit) {
        console.log(`✅ Successfully made ${requestCount - 1} requests before hitting rate limit`);
    } else {
        console.log(`⚠️  Test completed without hitting rate limit (stopped at ${requestCount} requests)`);
    }
    
    // Analyze response times
    const successfulRequests = results.filter(r => typeof r.status === 'number' && r.status < 400);
    if (successfulRequests.length > 0) {
        const avgResponseTime = successfulRequests.reduce((sum, r) => sum + r.responseTime, 0) / successfulRequests.length;
        console.log(`📈 Average response time: ${avgResponseTime.toFixed(2)}ms`);
    }
    
    // Show status code breakdown
    const statusCodes = {};
    results.forEach(r => {
        const status = r.status.toString();
        statusCodes[status] = (statusCodes[status] || 0) + 1;
    });
    
    console.log('\n📋 Status code breakdown:');
    Object.entries(statusCodes).forEach(([status, count]) => {
        console.log(`- ${status}: ${count} requests`);
    });
    
    return {
        totalRequests: requestCount,
        rateLimitHit,
        results
    };
};

// Run the test
testRateLimit().catch(console.error);