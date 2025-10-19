
// Check if token exists on load
chrome.storage.local.get('ds_token', (data) => {
  if (data.ds_token) {
    document.getElementById('status').textContent = 'Token ready';
    document.getElementById('tokenInput').placeholder = 'Token already saved';
  } else {
    document.getElementById('status').textContent = 'Auto-extracting token...';
  }
});

// Auto-extract token button
document.getElementById('autoExtractBtn').onclick = () => {
  document.getElementById('status').textContent = 'Extracting token...';
  
  // Query for DreamingSpanish tabs
  chrome.tabs.query({ url: 'https://app.dreaming.com/*' }, (tabs) => {
    if (tabs.length === 0) {
      document.getElementById('status').textContent = 'Please open DreamingSpanish in a tab first';
      return;
    }
    
    // Send message to content script to extract token
    chrome.tabs.sendMessage(tabs[0].id, { type: 'extractToken' }, () => {
      if (chrome.runtime.lastError) {
        document.getElementById('status').textContent = 'Failed to extract. Try manual entry.';
      } else {
        // Token will be saved automatically by background script
        // Check if it was saved
        setTimeout(() => {
          chrome.storage.local.get('ds_token', (data) => {
            if (data.ds_token) {
              document.getElementById('status').textContent = 'Token auto-extracted and saved!';
              document.getElementById('tokenInput').placeholder = 'Token auto-extracted';
            } else {
              document.getElementById('status').textContent = 'No token found. Try manual entry.';
            }
          });
        }, 500);
      }
    });
  });
};

// Manual token save button
document.getElementById('saveBtn').onclick = () => {
  const token = document.getElementById('tokenInput').value.trim();
  if (!token) {
    document.getElementById('status').textContent = 'Please enter a token';
    return;
  }
  
  chrome.storage.local.set({ ds_token: token }, () => {
    document.getElementById('status').textContent = 'Token saved manually.';
    document.getElementById('tokenInput').value = '';
    document.getElementById('tokenInput').placeholder = 'Token saved';
  });
};
