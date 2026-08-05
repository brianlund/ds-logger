
function markButtonSuccess(button) {
    button.textContent = 'Success';
    button.disabled = true;
    button.style.backgroundColor = '#e8f5e8';
    button.style.color = '#137333';
    button.style.borderColor = '#c6e6c6';
    button.style.opacity = 1;
}

function logToDS(title, channel, videoUrl, viewedDate, button) {
    // Check if chrome.runtime is available
    if (typeof chrome === 'undefined' || !chrome.runtime) {
        button.textContent = 'Error';
        return;
    }

    // Use DreamingSpanishs inspectExternalVideo to get duration, could be done directly from YT, but ehh, it was there already....
    chrome.runtime.sendMessage({
        type: 'inspectAndLogToDS',
        videoUrl: videoUrl,
        channel: channel,
        viewedDate: viewedDate
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

function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function cleanDateText(text) {
    return text
        .replace(/\s+/g, ' ')
        .replace(/^watched\s+/i, '')
        .trim();
}

function dateFromParts(year, month, day) {
    const date = new Date(year, month, day);
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
        return null;
    }
    return date;
}

function parseMonthNameDate(text, referenceDate) {
    const months = {
        january: 0, jan: 0,
        february: 1, feb: 1,
        march: 2, mar: 2,
        april: 3, apr: 3,
        may: 4,
        june: 5, jun: 5,
        july: 6, jul: 6,
        august: 7, aug: 7,
        september: 8, sep: 8, sept: 8,
        october: 9, oct: 9,
        november: 10, nov: 10,
        december: 11, dec: 11
    };
    const monthAlternatives = Object.keys(months).join('|');
    const monthFirstMatch = text.match(new RegExp(`^(${monthAlternatives})\\.?\\s+(\\d{1,2})(?:,?\\s+(\\d{4}))?$`, 'i'));
    const dayFirstMatch = text.match(new RegExp(`^(\\d{1,2})\\s+(${monthAlternatives})\\.?(?:\\s+(\\d{4}))?$`, 'i'));

    const match = monthFirstMatch || dayFirstMatch;
    if (!match) return null;

    const month = monthFirstMatch ? months[match[1].toLowerCase().replace('.', '')] : months[match[2].toLowerCase().replace('.', '')];
    const day = Number(monthFirstMatch ? match[2] : match[1]);
    let year = Number(match[3]);

    if (!year) {
        year = referenceDate.getFullYear();
        const candidate = dateFromParts(year, month, day);
        if (candidate && candidate > referenceDate) {
            year -= 1;
        }
    }

    return dateFromParts(year, month, day);
}

function parseNumericDate(text, referenceDate) {
    const match = text.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
    if (!match) return null;

    const first = Number(match[1]);
    const second = Number(match[2]);
    let year = match[3] ? Number(match[3]) : referenceDate.getFullYear();
    if (year < 100) year += 2000;

    const candidates = [
        dateFromParts(year, first - 1, second),
        dateFromParts(year, second - 1, first)
    ].filter(Boolean);

    if (candidates.length === 0) return null;
    return candidates.find(date => date <= referenceDate) || candidates[0];
}

function parseWeekdayDate(text, referenceDate) {
    const weekdays = {
        sunday: 0, sun: 0,
        monday: 1, mon: 1,
        tuesday: 2, tue: 2, tues: 2,
        wednesday: 3, wed: 3,
        thursday: 4, thu: 4, thurs: 4,
        friday: 5, fri: 5,
        saturday: 6, sat: 6
    };
    const match = text.match(/^(sunday|sun|monday|mon|tuesday|tue|tues|wednesday|wed|thursday|thu|thurs|friday|fri|saturday|sat)$/i);
    if (!match) return null;

    const targetDay = weekdays[match[1].toLowerCase()];
    const date = new Date(referenceDate);
    const daysBack = (date.getDay() - targetDay + 7) % 7;
    date.setDate(date.getDate() - daysBack);
    return date;
}

function parseHistoryDateText(text, referenceDate = new Date()) {
    const cleanedText = cleanDateText(text);
    if (!cleanedText) return null;

    const startOfToday = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());

    if (/^today$/i.test(cleanedText)) {
        return formatLocalDate(startOfToday);
    }

    if (/^yesterday$/i.test(cleanedText)) {
        const yesterday = new Date(startOfToday);
        yesterday.setDate(yesterday.getDate() - 1);
        return formatLocalDate(yesterday);
    }

    const parsedDate = parseMonthNameDate(cleanedText, startOfToday) ||
        parseNumericDate(cleanedText, startOfToday) ||
        parseWeekdayDate(cleanedText, startOfToday);

    return parsedDate ? formatLocalDate(parsedDate) : null;
}

function extractDateFromHeaderElement(element) {
    if (!element) return null;

    const text = element.textContent || '';
    if (text.length > 120) return null;

    return parseHistoryDateText(text);
}

function findViewedDateInSection(element) {
    const section = element.closest('ytd-item-section-renderer');
    if (!section) return null;

    const header = section.querySelector('ytd-item-section-header-renderer, #header, [role="heading"]');
    return extractDateFromHeaderElement(header);
}

function findViewedDateInPreviousHeaders(element) {
    let current = element;

    while (current && current !== document.body) {
        let sibling = current.previousElementSibling;

        while (sibling) {
            const header = sibling.matches('ytd-item-section-header-renderer, [role="heading"], h2, h3')
                ? sibling
                : sibling.querySelector('ytd-item-section-header-renderer, #header, [role="heading"], h2, h3');
            const viewedDate = extractDateFromHeaderElement(header);

            if (viewedDate) return viewedDate;

            sibling = sibling.previousElementSibling;
        }

        current = current.parentElement;
    }

    return null;
}

function findViewedDate(element) {
    return findViewedDateInSection(element) || findViewedDateInPreviousHeaders(element);
}

function createLogButton(language) {
    const btn = document.createElement('button');
    btn.textContent = language === 'fr' ? 'Log to DF' : 'Log to DS';
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
        display: block;
        margin: 0;
        flex: none;
    `;
    return wrapper;
}

function attachButton(element, button) {
    const container = element.closest('yt-lockup-view-model, ytd-video-renderer, ytd-rich-item-renderer, ytd-compact-video-renderer') || element;

    container.style.position = 'relative';
    button.style.position = 'absolute';
    button.style.top = '32px';
    button.style.right = '10px';
    button.style.zIndex = 10;
    container.appendChild(button);
}

function processVideoElement(element, language) {
    if (element.querySelector('.ds-log-btn')) return;

    const elements = findVideoElements(element);
    const videoData = extractVideoData(elements);

    if (!videoData) return;

    // Skip YouTube Shorts
    if (videoData.videoUrl && videoData.videoUrl.includes('/shorts/')) return;

    const button = createLogButton(language);
    const wrapper = createButtonWrapper();

    wrapper.appendChild(button);

    button.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        logToDS(videoData.title, videoData.channel, videoData.videoUrl, findViewedDate(element), button);
    };

    attachButton(element, wrapper);
}

function addButtonsToVideos() {
    if (!isHistoryPage()) return;

    // Check if token exists before adding buttons
    chrome.storage.local.get(['ds_token', 'ds_language'], (data) => {
        if (!data.ds_token) return; // No token, don't show buttons

        const language = data.ds_language || 'es';

        const selectors = [
            'ytd-video-renderer',
            'ytd-rich-item-renderer',
            'ytd-video-meta-block',
            'ytd-compact-video-renderer',
            'yt-lockup-view-model'
        ];

        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => processVideoElement(el, language));
        });
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
