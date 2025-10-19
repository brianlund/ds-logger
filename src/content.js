
function parseDuration(text) {
    if (!text) return 0;
    const parts = text.trim().split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 1) return parts[0];
    return 0;
}

function markButtonSuccess(button) {
    button.textContent = '✓';
    button.disabled = true;
    button.style.backgroundColor = '#e8f5e8';
    button.style.color = '#137333';
    button.style.borderColor = '#c6e6c6';
    button.style.opacity = 1;
}

function logToDS(title, channel, videoUrl, seconds, button) {
    // Check if chrome.runtime is available
    if (typeof chrome === 'undefined' || !chrome.runtime) {
        button.textContent = '❌ No API';
        return;
    }
    
    // Use DreamingSpanish's new inspectExternalVideo API
    chrome.runtime.sendMessage({ 
        type: 'inspectAndLogToDS', 
        videoUrl: videoUrl 
    }, (response) => {
        if (chrome.runtime.lastError) {
            button.textContent = '❌ Runtime Error';
            return;
        }
        
        if (response?.success) {
            markButtonSuccess(button);
        } else {
            button.textContent = '❌ Error';
        }
    });
}

function addButtonsToRegularVideos() {
    document.querySelectorAll('ytd-video-renderer').forEach(el => {
        if (el.querySelector('.ds-log-btn')) return;

        const titleEl = el.querySelector('#video-title');
        const durationEl = el.querySelector('ytd-thumbnail-overlay-time-status-renderer span');
        const channelEl = el.querySelector('#channel-name');
        const linkEl = el.querySelector('a#thumbnail');
        if (!titleEl || !durationEl || !linkEl) return;

        const title = titleEl.textContent.trim();
        const channel = channelEl?.textContent.trim();
        const videoUrl = linkEl.href;
        const seconds = parseDuration(durationEl.textContent);

        const btn = document.createElement('button');
        btn.textContent = 'Log to DS';
        btn.className = 'ds-log-btn';
        btn.style.marginLeft = '10px';
        btn.style.cursor = 'pointer';
        btn.onclick = () => logToDS(title, channel, videoUrl, seconds, btn);

        const meta = el.querySelector('#metadata-line');
        if (meta) meta.appendChild(btn);
    });
}

function addButtonsToHistoryEntries() {
    // Handle different YouTube history page selectors including new lockup models
    const selectors = [
        'ytd-video-renderer',
        'ytd-rich-item-renderer', 
        'ytd-video-meta-block',
        'ytd-compact-video-renderer',
        'yt-lockup-view-model' // New YouTube structure
    ];
    
    selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            if (el.querySelector('.ds-log-btn')) return;

            // Try different title selectors (including new lockup structure)
            const titleEl = el.querySelector('#video-title') || 
                           el.querySelector('h3 a') || 
                           el.querySelector('a[id*="video-title"]') ||
                           el.querySelector('.ytd-video-meta-block h3 a') ||
                           el.querySelector('.yt-lockup-metadata-view-model__heading-reset a');
                           
            // Try different duration selectors
            const durationEl = el.querySelector('ytd-thumbnail-overlay-time-status-renderer span') ||
                             el.querySelector('.ytd-thumbnail-overlay-time-status-renderer span') ||
                             el.querySelector('span.style-scope.ytd-thumbnail-overlay-time-status-renderer') ||
                             el.querySelector('[aria-label*="minutes"]') ||
                             el.querySelector('[aria-label*="seconds"]');
                             
            // Try different channel selectors
            const channelEl = el.querySelector('#channel-name') ||
                            el.querySelector('a.yt-simple-endpoint.style-scope.yt-formatted-string') ||
                            el.querySelector('#text.ytd-channel-name') ||
                            el.querySelector('.yt-lockup-metadata-view-model__text-container a[href*="/@"]');
                            
            // Try different link selectors (prioritize regular video links)
            const linkEl = el.querySelector('a[href*="/watch?v="]') ||
                         el.querySelector('a#thumbnail') ||
                         el.querySelector('a[href*="watch"]') ||
                         titleEl;
                         
            if (!titleEl || !linkEl) return;
            
            // Skip if it's a shorts link (we handle those separately)
            if (linkEl.href && linkEl.href.includes('/shorts/')) return;
            
            // For regular videos, we still want to add buttons even without duration
            // (YouTube history sometimes doesn't show duration)
            const title = titleEl.textContent.trim();
            const channel = channelEl?.textContent.trim();
            const videoUrl = linkEl.href;
            
            // Try to get duration, default to 0 if not found
            let seconds = 0;
            if (durationEl) {
                seconds = parseDuration(durationEl.textContent) || parseDuration(durationEl.getAttribute('aria-label') || '') || 300; // Default 5 min if can't parse
            } else {
                seconds = 300; // Default 5 minutes for videos without visible duration
            }

            // Create wrapper to prevent flex stretching
            const btnWrapper = document.createElement('span');
            btnWrapper.style.cssText = `
                display: inline-block;
                margin-left: 8px;
                flex: none;
            `;
            
            const btn = document.createElement('button');
            btn.textContent = 'Log to DS';
            btn.className = 'ds-log-btn';
            btn.style.cssText = `
                padding: 3px 8px !important;
                background-color: #f1f1f1 !important;
                color: #606060 !important;
                border: 1px solid #d3d3d3 !important;
                border-radius: 18px !important;
                font-size: 11px !important;
                font-weight: 500 !important;
                cursor: pointer !important;
                transition: all 0.2s ease !important;
                font-family: Roboto, Arial, sans-serif !important;
                line-height: 1 !important;
                white-space: nowrap !important;
                display: inline-block !important;
                width: auto !important;
                min-width: auto !important;
                max-width: none !important;
                flex: none !important;
                margin: 0 !important;
                vertical-align: middle !important;
                box-sizing: border-box !important;
            `;
            
            // Add hover effects
            btn.onmouseenter = () => {
                btn.style.backgroundColor = '#e0e0e0';
                btn.style.color = '#030303';
                btn.style.borderColor = '#c6c6c6';
            };
            btn.onmouseleave = () => {
                btn.style.backgroundColor = '#f1f1f1';
                btn.style.color = '#606060';
                btn.style.borderColor = '#d3d3d3';
            };
            
            btnWrapper.appendChild(btn);
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                logToDS(title, channel, videoUrl, seconds, btn);
            };

            // Try different places to append the button wrapper (new lockup structure)
            const meta = el.querySelector('#metadata-line') ||
                        el.querySelector('.ytd-video-meta-block') ||
                        el.querySelector('#meta') ||
                        el.querySelector('.yt-lockup-metadata-view-model__text-container') ||
                        el.querySelector('.yt-lockup-view-model__metadata');
            
            if (meta) {
                meta.appendChild(btnWrapper);
            } else {
                // Fallback: append to the element itself
                el.style.position = 'relative';
                btnWrapper.style.position = 'absolute';
                btnWrapper.style.top = '5px';
                btnWrapper.style.right = '5px';
                el.appendChild(btnWrapper);
            }
        });
    });
}

function addButtons() {
    addButtonsToRegularVideos();
    addButtonsToHistoryEntries();
}
// Add buttons to YouTube Shorts containers
function addButtonsToShorts() {
    const shortsContainers = document.querySelectorAll('ytd-reel-item-renderer, ytd-shorts-lockup-view-renderer');
    
    shortsContainers.forEach((el) => {
        if (el.querySelector('.ds-log-btn')) return;
        
        const titleEl = el.querySelector('span[dir="auto"]') || el.querySelector('#video-title');
        const linkEl = el.querySelector('a[href*="shorts"]') || el.querySelector('a');
        
        if (titleEl && linkEl) {
            const title = titleEl.textContent.trim();
            const videoUrl = linkEl.href;
            
            const btn = document.createElement('button');
            btn.textContent = 'Log to DS';
            btn.className = 'ds-log-btn';
            btn.style.cssText = `
                margin: 5px;
                padding: 3px 8px;
                background-color: #f1f1f1;
                color: #606060;
                border: 1px solid #d3d3d3;
                border-radius: 18px;
                font-size: 11px;
                font-weight: 500;
                cursor: pointer;
                position: relative;
                z-index: 1000;
                transition: all 0.2s ease;
                font-family: Roboto, Arial, sans-serif;
                line-height: 1;
                white-space: nowrap;
                display: inline-block;
                width: auto;
                flex-shrink: 0;
                min-width: fit-content;
                max-width: none;
            `;
            
            btn.onmouseenter = () => {
                btn.style.backgroundColor = '#e0e0e0';
                btn.style.color = '#030303';
                btn.style.borderColor = '#c6c6c6';
            };
            btn.onmouseleave = () => {
                btn.style.backgroundColor = '#f1f1f1';
                btn.style.color = '#606060';
                btn.style.borderColor = '#d3d3d3';
            };
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                logToDS(title, '', videoUrl, 30, btn);
            };
            
            el.appendChild(btn);
        }
    });
}

// Use both interval and mutation observer
setInterval(() => {
    addButtons();
    addButtonsToShorts();
}, 3000);

// Mutation observer for dynamic content
const observer = new MutationObserver((mutations) => {
    let shouldAddButtons = false;
    
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // Element node
                    const hasVideoContent = node.querySelector && (
                        node.querySelector('ytd-video-renderer') ||
                        node.querySelector('ytd-rich-item-renderer') ||
                        node.querySelector('ytd-reel-item-renderer') ||
                        node.querySelector('ytd-shorts-lockup-view-renderer')
                    );
                    if (hasVideoContent) {
                        shouldAddButtons = true;
                    }
                }
            });
        }
    });
    
    if (shouldAddButtons) {
        setTimeout(() => {
            addButtons();
            addButtonsToShorts();
        }, 500); // Small delay to let DOM settle
    }
});

// Start observing
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Initial run
addButtons();
addButtonsToShorts();
