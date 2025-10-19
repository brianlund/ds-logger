
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'logToDS') {
    // Legacy support for old API
    chrome.storage.local.get('ds_token', data => {
      const token = data.ds_token;
      if (!token) return sendResponse({ status: 401 });

      fetch('https://app.dreaming.com/.netlify/functions/externalTime', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer ' + token,
          'content-type': 'text/plain;charset=UTF-8'
        },
        body: JSON.stringify(msg.payload)
      }).then(res => {
        sendResponse({ status: res.status });
      }).catch(() => {
        sendResponse({ status: 'error' });
      });
    });
    return true; // async response
  }
  
  if (msg.type === 'inspectAndLogToDS') {
    chrome.storage.local.get('ds_token', async data => {
      const token = data.ds_token;
      if (!token) return sendResponse({ success: false, error: 'No token' });

      try {
        // Step 1: Inspect the external video
        const encodedUrl = encodeURIComponent(msg.videoUrl);
        const inspectResponse = await fetch(`https://app.dreaming.com/.netlify/functions/inspectExternalVideo?videoUrl=${encodedUrl}`, {
          method: 'GET',
          headers: {
            'authorization': 'Bearer ' + token
          }
        });
        
        if (!inspectResponse.ok) {
          return sendResponse({ success: false, error: 'Failed to inspect video' });
        }
        
        const videoData = await inspectResponse.json();
        console.log('[DS Logger] Video data from API:', videoData);
        
        // Step 2: Log the video with the fetched metadata
        // Calculate duration from hours, minutes, seconds fields
        const durationInSeconds = (videoData.hours || 0) * 3600 + (videoData.minutes || 0) * 60 + (videoData.seconds || 0);
        
        // Get final duration, reject if no duration available
        const finalDuration = durationInSeconds || videoData.duration || videoData.timeSeconds;
        if (!finalDuration || finalDuration === 0) {
          return sendResponse({ success: false, error: 'No video duration available' });
        }
        
        const payload = {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          description: videoData.title ? `YouTube: ${videoData.title}` : 'YouTube video',
          url: msg.videoUrl,
          type: 'watching',
          timeSeconds: finalDuration,
          idempotencyKey: crypto.randomUUID()
        };
        console.log('[DS Logger] Payload being sent:', payload);
        
        const logResponse = await fetch('https://app.dreaming.com/.netlify/functions/externalTime', {
          method: 'POST',
          headers: {
            'authorization': 'Bearer ' + token,
            'content-type': 'text/plain;charset=UTF-8'
          },
          body: JSON.stringify(payload)
        });
        
        if (logResponse.ok) {
          sendResponse({ success: true, videoData: videoData, payload: payload });
        } else {
          sendResponse({ success: false, error: 'Failed to log video', videoData: videoData });
        }
        
      } catch (error) {
        console.error('DS Logger error:', error);
        sendResponse({ success: false, error: error.message });
      }
    });
    return true; // async response
  }
});
