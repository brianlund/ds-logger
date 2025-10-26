// Inject content script into existing DreamingSpanish tabs when extension loads
chrome.runtime.onInstalled.addListener(injectIntoExistingTabs);

function injectIntoExistingTabs() {
  chrome.tabs.query({ url: 'https://app.dreaming.com/*' }, (tabs) => {
    tabs.forEach(tab => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['dreaming-spanish-token.js']
      }).catch(() => {
        // Ignore errors (tab might not be ready)
      });
    });
  });
}

async function inspectVideo(videoUrl, token) {
  const encodedUrl = encodeURIComponent(videoUrl);
  const response = await fetch(`https://app.dreaming.com/.netlify/functions/inspectExternalVideo?videoUrl=${encodedUrl}`, {
    method: 'GET',
    headers: { 'authorization': 'Bearer ' + token }
  });
  
  if (!response.ok) {
    throw new Error('Failed to inspect video');
  }
  
  return response.json();
}

function calculateDuration(videoData) {
  const durationInSeconds = (videoData.hours || 0) * 3600 + (videoData.minutes || 0) * 60 + (videoData.seconds || 0);
  return durationInSeconds || videoData.duration || videoData.timeSeconds || 0;
}

function buildDescription(title, channel) {
  if (!title) return 'YouTube video';
  
  if (channel) {
    return `YouTube - ${channel}: ${title}`;
  } else {
    return `YouTube: ${title}`;
  }
}

function createPayload(videoData, videoUrl, channel) {
  const finalDuration = calculateDuration(videoData);
  
  if (!finalDuration || finalDuration === 0) {
    throw new Error('No video duration available');
  }
  
  return {
    id: Date.now().toString(),
    date: new Date().toISOString().split('T')[0],
    description: buildDescription(videoData.title, channel),
    url: videoUrl,
    type: 'watching',
    timeSeconds: finalDuration,
    idempotencyKey: crypto.randomUUID()
  };
}

async function logVideo(payload, token) {
  const response = await fetch('https://app.dreaming.com/.netlify/functions/externalTime?language=es', {
    method: 'POST',
    headers: {
      'accept': '*/*',
      'authorization': 'Bearer ' + token,
      'content-type': 'text/plain;charset=UTF-8'
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    throw new Error('Failed to log video');
  }
  
  return response;
}

async function logVideoFallback(payload, token, videoData, sendResponse) {
  await logVideo(payload, token);
  sendResponse({ success: true, videoData, payload });
}

async function handleVideoInspectAndLog(msg, sendResponse) {
  chrome.storage.local.get('ds_token', async data => {
    const token = data.ds_token;
    if (!token) {
      return sendResponse({ success: false, error: 'No token' });
    }

    try {
      const videoData = await inspectVideo(msg.videoUrl, token);
      const payload = createPayload(videoData, msg.videoUrl, msg.channel);
      
      // Instead of logging from background, send payload to DreamingSpanish page to log from their context
      const tabs = await chrome.tabs.query({ url: 'https://app.dreaming.com/*' });
      if (tabs.length > 0) {
        // Send to first DS tab to make the API call from page context
        try {
          const response = await chrome.tabs.sendMessage(tabs[0].id, {
            type: 'logTimeFromPage',
            payload: payload
          });
          
          if (response?.success) {
            sendResponse({ success: true, videoData, payload });
          } else {
            // Fallback: log from background if page context fails
            await logVideoFallback(payload, token, videoData, sendResponse);
          }
        } catch (error) {
          // Fallback: log from background if page context fails
          await logVideoFallback(payload, token, videoData, sendResponse);
        }
      } else {
        // No DS tab open, log from background
        await logVideoFallback(payload, token, videoData, sendResponse);
      }
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'tokenExtracted') {
    // Store extracted token from DreamingSpanish
    chrome.storage.local.set({ ds_token: msg.token });
    return;
  }
  
  if (msg.type === 'inspectAndLogToDS') {
    handleVideoInspectAndLog(msg, sendResponse);
    return true; // async response
  }
});
