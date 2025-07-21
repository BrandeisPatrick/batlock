// DOM Elements
const matchIdInput = document.getElementById('matchIdInput');
const fetchButton = document.getElementById('fetchButton');
const loader = document.getElementById('loader');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const chartsContainer = document.getElementById('chartsContainer');

let matchesPlayedChartInstance = null;
let winRateChartInstance = null;

// UI Helper Functions
function showLoader(isLoading) {
    loader.classList.toggle('hidden', !isLoading);
}

function showError(message) {
    errorMessage.classList.toggle('hidden', !message);
    if (message) errorText.textContent = message;
}

function hideCharts() {
    chartsContainer.classList.add('hidden');
    if (matchesPlayedChartInstance) matchesPlayedChartInstance.destroy();
    if (winRateChartInstance) winRateChartInstance.destroy();
}

function displayCharts(team1Labels, team2Labels, team1Matches, team2Matches, team1WinRates, team2WinRates) {
    chartsContainer.classList.remove('hidden');
    if (matchesPlayedChartInstance) matchesPlayedChartInstance.destroy();
    if (winRateChartInstance) winRateChartInstance.destroy();

    const maxTeamSize = Math.max(team1Labels.length, team2Labels.length);
    const yLabels = Array.from({ length: maxTeamSize }, (_, i) => ` `); // Use empty labels

    const padArray = (arr, len) => [...arr, ...Array(Math.max(0, len - arr.length)).fill(0)];
    const paddedT1Matches = padArray(team1Matches, maxTeamSize).map(d => -d);
    const paddedT2Matches = padArray(team2Matches, maxTeamSize);
    const paddedT1WinRates = padArray(team1WinRates, maxTeamSize).map(d => -d);
    const paddedT2WinRates = padArray(team2WinRates, maxTeamSize);

    const createChartOptions = (unit = '', maxVal = null) => ({
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: {
                left: 120, // Make space for left labels
                right: 120 // Make space for right labels
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: {
                    color: '#d1d5db',
                    callback: (value) => Math.abs(value) + unit
                },
                max: maxVal,
                min: maxVal ? -maxVal : null,
            },
            y: {
                grid: { display: false },
                ticks: { display: false } // Hide the y-axis labels
            }
        },
        plugins: {
            legend: {
                position: 'top',
                labels: { color: '#d1d5db' }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const datasetIndex = context.datasetIndex;
                        const dataIndex = context.dataIndex;
                        let playerName = datasetIndex === 0 ? team1Labels[dataIndex] : team2Labels[dataIndex];
                        return `${playerName || 'N/A'}: ${Math.abs(context.raw).toFixed(1)}${unit}`;
                    }
                }
            }
        }
    });

    // Chart 1: Total Matches Played
    const matchesCtx = document.getElementById('matchesPlayedChart').getContext('2d');
    matchesPlayedChartInstance = new Chart(matchesCtx, {
        type: 'bar',
        data: {
            labels: yLabels,
            datasets: [
                { label: 'Team 1 Matches', data: paddedT1Matches, backgroundColor: 'rgba(96, 165, 250, 0.7)' },
                { label: 'Team 2 Matches', data: paddedT2Matches, backgroundColor: 'rgba(251, 146, 60, 0.7)' }
            ],
            team1Names: team1Labels,
            team2Names: team2Labels
        },
        options: createChartOptions('', 55)
    });

    // Chart 2: Win Rate
    const winRateCtx = document.getElementById('winRateChart').getContext('2d');
    winRateChartInstance = new Chart(winRateCtx, {
        type: 'bar',
        data: {
            labels: yLabels,
            datasets: [
                { label: 'Team 1 Win Rate', data: paddedT1WinRates, backgroundColor: 'rgba(96, 165, 250, 0.7)' },
                { label: 'Team 2 Win Rate', data: paddedT2WinRates, backgroundColor: 'rgba(251, 146, 60, 0.7)' }
            ],
            team1Names: team1Labels,
            team2Names: team2Labels
        },
        options: createChartOptions('%', 100)
    });
}