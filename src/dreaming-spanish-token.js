// Content script for app.dreaming.com to extract bearer token
// Runs on DreamingSpanish pages to read localStorage.token

// Track pending reload to debounce multiple video logs
let reloadTimeout = null;

function extractToken() {
    try {
        const token = localStorage.getItem('token');
        if (token) {
            // Send token to background script
            chrome.runtime.sendMessage({
                type: 'tokenExtracted',
                token: token
            });
        }
    } catch (error) {
        console.log('DS Logger: Could not extract token:', error);
    }
}

extractToken();

// Re-extract token periodically in case it changes
setInterval(extractToken, 3600000); // Every hour

// Listen for messages from popup requesting token extraction
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'extractToken') {
        extractToken();
        sendResponse({ success: true });
    }
    
    if (msg.type === 'refreshWatchedTime') {
        // Force a hard reload with cache bypass
        window.location.reload(true);
        sendResponse({ success: true });
    }
    
    if (msg.type === 'logTimeFromPage') {
        // Make the API call from the page context so their UI detects it
        const token = localStorage.getItem('token');
        fetch('https://app.dreaming.com/.netlify/functions/externalTime?language=es', {
            method: 'POST',
            headers: {
                'accept': '*/*',
                'authorization': 'Bearer ' + token,
                'content-type': 'text/plain;charset=UTF-8'
            },
            body: JSON.stringify(msg.payload)
        }).then(response => {
            if (response.ok) {
                // Clear the reload timeout if it exists
                if (reloadTimeout) {
                    clearTimeout(reloadTimeout);
                }
                
                // Set a new timeout to reload after 3 seconds of inactivity
                // This allows users to log multiple videos before the page refreshes
                reloadTimeout = setTimeout(() => {
                    localStorage.removeItem('dailyGoalCompletionByLanguage');
                    
                    // Delete IndexedDB cache and reload
                    // This is the most reliable way to refresh the UI from an extension
                    indexedDB.deleteDatabase('react_query_offline_db');
                    setTimeout(() => {
                        window.location.reload();
                    }, 300);
                }, 3000);
                
                sendResponse({ success: true });
            }
                sendResponse({ success: false, error: 'API call failed' });
            }
        }).catch(error => {
            sendResponse({ success: false, error: error.message });
        });
        return true; // async response
    }
});
