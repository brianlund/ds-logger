
function markButtonSuccess(button) {
    button.textContent = 'Success';
    button.disabled = true;
    button.style.backgroundColor = '#e8f5e8';
    button.style.color = '#137333';
    button.style.borderColor = '#c6e6c6';
    button.style.opacity = 1;
}

function logToDS(title, channel, videoUrl, button) {
    // Check if chrome.runtime is available
    if (typeof chrome === 'undefined' || !chrome.runtime) {
        button.textContent = 'Error';
        return;
    }

    // Use DreamingSpanishs inspectExternalVideo to get duration, could be done directly from YT, but ehh, it was there already....
    chrome.runtime.sendMessage({
        type: 'inspectAndLogToDS',
        videoUrl: videoUrl,
        channel: channel
    }, (response) => {
        if (chrome.runtime.lastError) {
            button.textContent = 'Error';
            return;
        }

        if (response?.success) {
            markButtonSuccess(button);
        } else {
            button.textContent = 'Error';
        }
    });
}


function isHistoryPage() {
    return window.location.href.includes('/feed/history');
}

function removeAllButtons() {
    document.querySelectorAll('.ds-log-btn').forEach(btn => {
        btn.closest('span')?.remove() || btn.remove();
    });
}

// Debounce timeout for adding buttons
let addButtonsTimeout = null;

function findVideoElements(element) {
    const titleEl = element.querySelector('#video-title') ||
        element.querySelector('h3 a') ||
        element.querySelector('a[id*="video-title"]');

    const channelEl = element.querySelector('.yt-core-attributed-string.yt-content-metadata-view-model__metadata-text');

    const linkEl = element.querySelector('a[href*="/watch?v="]') || titleEl;

    return { titleEl, channelEl, linkEl };
}

function extractVideoData(elements) {
    const { titleEl, channelEl, linkEl } = elements;

    if (!titleEl || !linkEl) return null;

    return {
        title: titleEl.textContent.trim(),
        channel: channelEl?.textContent.trim(),
        videoUrl: linkEl.href
    };
}

function createLogButton() {
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

    return btn;
}

function createButtonWrapper() {
    const wrapper = document.createElement('span');
    wrapper.style.cssText = `
        display: inline-block;
        margin-left: 0px;
        margin-top: 8px;
        flex: none;
    `;
    return wrapper;
}

function attachButton(element, button) {
    // Try to append the button wrapper
    let meta = element.querySelector('.yt-lockup-metadata-view-model__text-container');

    if (meta) {
        meta.appendChild(button);
    } else {
        // Default placement
        element.style.position = 'relative';
        button.style.position = 'absolute';
        button.style.top = '5px';
        button.style.right = '5px';
        element.appendChild(button);
    }
}

function processVideoElement(element) {
    if (element.querySelector('.ds-log-btn')) return;

    const elements = findVideoElements(element);
    const videoData = extractVideoData(elements);

    if (!videoData) return;

    // Skip YouTube Shorts
    if (videoData.videoUrl && videoData.videoUrl.includes('/shorts/')) return;

    const button = createLogButton();
    const wrapper = createButtonWrapper();

    wrapper.appendChild(button);

    button.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        logToDS(videoData.title, videoData.channel, videoData.videoUrl, button);
    };

    attachButton(element, wrapper);
}

function addButtonsToVideos() {
    if (!isHistoryPage()) return;

    const selectors = [
        'ytd-video-renderer',
        'ytd-rich-item-renderer',
        'ytd-video-meta-block',
        'ytd-compact-video-renderer',
        'yt-lockup-view-model'
    ];

    selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(processVideoElement);
    });
}

// Initial run when page loads
if (isHistoryPage()) {
    setTimeout(() => {
        addButtonsToVideos();
    }, 500);
}

// Watch for dynamically loaded content
const observer = new MutationObserver(() => {
    if (isHistoryPage()) {
        // Clear any pending timeout to prevent excessive calls
        if (addButtonsTimeout) {
            clearTimeout(addButtonsTimeout);
        }
        
        // Only add buttons if we're on history page
        addButtonsTimeout = setTimeout(() => {
            if (isHistoryPage()) {
                addButtonsToVideos();
            }
        }, 500);
    } else {
        // Clear any pending timeout when leaving history page
        if (addButtonsTimeout) {
            clearTimeout(addButtonsTimeout);
            addButtonsTimeout = null;
        }
        
        // Always remove buttons if we're not on history page
        removeAllButtons();
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
