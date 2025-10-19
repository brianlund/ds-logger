// Content script for app.dreaming.com to extract bearer token
// Runs on DreamingSpanish pages to read localStorage.token

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
});
