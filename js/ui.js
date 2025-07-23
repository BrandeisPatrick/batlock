// DOM Elements
const matchIdInput = document.getElementById('matchIdInput');
const fetchButton = document.getElementById('fetchButton');
const loader = document.getElementById('loader');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');

// UI Helper Functions
function showLoader(isLoading) {
    loader.classList.toggle('hidden', !isLoading);
}

function showError(message) {
    errorMessage.classList.toggle('hidden', !message);
    if (message) errorText.textContent = message;
}

// Make UI functions globally available
window.showLoader = showLoader;
window.showError = showError;

// Make DOM elements globally available
window.matchIdInput = matchIdInput;
window.fetchButton = fetchButton;
window.loader = loader;
window.errorMessage = errorMessage;
window.errorText = errorText;