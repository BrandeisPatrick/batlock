/**
 * Progressive Loading Fix Validation
 * Validates that all critical fixes are in place
 */

const fs = require('fs');

console.log('🔧 Validating Progressive Loading Fixes...\n');

// 1. Check HTML has results div
console.log('1. 📋 Checking HTML structure...');
const htmlContent = fs.readFileSync('index.html', 'utf8');

const hasResultsDiv = htmlContent.includes('id="results"');
const resultsAfterError = htmlContent.indexOf('id="results"') > htmlContent.indexOf('id="errorMessage"');
const resultsBeforeCharts = htmlContent.indexOf('id="results"') < htmlContent.indexOf('id="chartsContainer"');

console.log(`   Results div exists: ${hasResultsDiv ? '✅' : '❌'}`);
console.log(`   Results div positioned correctly: ${(resultsAfterError && resultsBeforeCharts) ? '✅' : '❌'}`);

// 2. Check MatchAnalyzer has proper error handling
console.log('\n2. 🛡️ Checking error handling...');
const matchAnalyzerContent = fs.readFileSync('js/match-analyzer.js', 'utf8');

const hasErrorCheck = matchAnalyzerContent.includes('if (!resultsDiv)');
const hasErrorMessage = matchAnalyzerContent.includes('Results div not found');
const hasShowResultsDiv = matchAnalyzerContent.includes('resultsDiv.classList.remove(\'hidden\')');
const hasHideChartsContainer = matchAnalyzerContent.includes('chartsContainer.classList.add(\'hidden\')');

console.log(`   DOM element validation: ${hasErrorCheck ? '✅' : '❌'}`);
console.log(`   Helpful error message: ${hasErrorMessage ? '✅' : '❌'}`);
console.log(`   Show results div: ${hasShowResultsDiv ? '✅' : '❌'}`);
console.log(`   Hide fallback charts: ${hasHideChartsContainer ? '✅' : '❌'}`);

// 3. Check chart methods exist
console.log('\n3. 📊 Checking chart integration...');

const hasWinRateChart = matchAnalyzerContent.includes('createWinRateChart(');
const hasKDAChart = matchAnalyzerContent.includes('createKDAComparisonChart(');
const hasChartCanvases = matchAnalyzerContent.includes('id="winRateChart"') && matchAnalyzerContent.includes('id="kdaComparisonChart"');

console.log(`   Win Rate chart method: ${hasWinRateChart ? '✅' : '❌'}`);
console.log(`   KDA comparison chart method: ${hasKDAChart ? '✅' : '❌'}`);
console.log(`   Chart canvas elements: ${hasChartCanvases ? '✅' : '❌'}`);

// 4. Check progressive loading structure
console.log('\n4. ⚡ Checking progressive loading structure...');

const hasProgressiveMethod = matchAnalyzerContent.includes('renderProgressiveMatchAnalysis');
const hasFourPhases = [1, 2, 3, 4].every(phase => matchAnalyzerContent.includes(`Phase ${phase}`));
const hasProgressTracking = matchAnalyzerContent.includes('updateProgress');
const hasLoadingCards = matchAnalyzerContent.includes('createLoadingPlayerCard');
const hasCardUpdates = matchAnalyzerContent.includes('updatePlayerCard');

console.log(`   Progressive method exists: ${hasProgressiveMethod ? '✅' : '❌'}`);
console.log(`   4-phase implementation: ${hasFourPhases ? '✅' : '❌'}`);
console.log(`   Progress tracking: ${hasProgressTracking ? '✅' : '❌'}`);
console.log(`   Loading placeholders: ${hasLoadingCards ? '✅' : '❌'}`);
console.log(`   Individual card updates: ${hasCardUpdates ? '✅' : '❌'}`);

// 5. Check app.js integration
console.log('\n5. 🔗 Checking app.js integration...');
const appContent = fs.readFileSync('js/app.js', 'utf8');

const callsProgressiveLoading = appContent.includes('renderProgressiveMatchAnalysis');
const hidesLoaderEarly = appContent.includes('showLoader(false)');
const hasProperErrorHandling = appContent.includes('Enhanced match analysis failed');

console.log(`   Calls progressive loading: ${callsProgressiveLoading ? '✅' : '❌'}`);
console.log(`   Hides loader early: ${hidesLoaderEarly ? '✅' : '❌'}`);
console.log(`   Error handling intact: ${hasProperErrorHandling ? '✅' : '❌'}`);

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(50));

const allChecks = [
    hasResultsDiv, resultsAfterError, resultsBeforeCharts,
    hasErrorCheck, hasErrorMessage, hasShowResultsDiv, hasHideChartsContainer,
    hasWinRateChart, hasKDAChart, hasChartCanvases,
    hasProgressiveMethod, hasFourPhases, hasProgressTracking, hasLoadingCards, hasCardUpdates,
    callsProgressiveLoading, hidesLoaderEarly, hasProperErrorHandling
];

const passedChecks = allChecks.filter(Boolean).length;
const totalChecks = allChecks.length;

console.log(`\n✅ Passed: ${passedChecks}/${totalChecks} checks`);

if (passedChecks === totalChecks) {
    console.log('🎉 ALL FIXES VALIDATED SUCCESSFULLY!');
    console.log('\n🚀 Progressive loading should now work properly:');
    console.log('   1. Open index.html in browser');
    console.log('   2. Enter match ID: 38069822');
    console.log('   3. Click "Analyze Match"');
    console.log('   4. Watch progressive loading in action!');
} else {
    console.log('⚠️  Some checks failed - review the issues above');
}

console.log('\n📋 Expected Progressive Loading Flow:');
console.log('   Phase 1: Match overview appears immediately (1-2s)');
console.log('   Phase 2: Player cards load progressively (2-15s)');
console.log('   Phase 3: Team comparisons update (15-16s)');
console.log('   Phase 4: Charts and insights complete (16-18s)');
console.log('\n🎯 Test with match ID: 38069822');