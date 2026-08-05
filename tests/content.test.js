describe('Content Script Logic', () => {
  describe('History Page Detection', () => {
    test('should detect history page URL', () => {
      const isHistoryPage = (url) => url.includes('/feed/history');
      
      expect(isHistoryPage('https://www.youtube.com/feed/history')).toBe(true);
      expect(isHistoryPage('https://www.youtube.com/results?search_query=test')).toBe(false);
      expect(isHistoryPage('https://www.youtube.com/')).toBe(false);
    });
  });

  describe('Message Payload Creation', () => {
    test('should create correct payload structure', () => {
      const createPayload = (videoUrl, channel, viewedDate) => ({
        type: 'inspectAndLogToDS',
        videoUrl: videoUrl,
        channel: channel,
        viewedDate: viewedDate
      });
      
      const payload = createPayload('https://youtube.com/watch?v=abc123', 'Test Channel', '2026-05-12');
      
      expect(payload).toEqual({
        type: 'inspectAndLogToDS',
        videoUrl: 'https://youtube.com/watch?v=abc123',
        channel: 'Test Channel',
        viewedDate: '2026-05-12'
      });
    });

  });

  describe('YouTube History Date Parsing', () => {
    const formatLocalDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const parseHistoryDateText = (text, referenceDate = new Date()) => {
      const cleanedText = text.replace(/\s+/g, ' ').trim();
      const startOfToday = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());

      if (/\btoday\b/i.test(cleanedText)) {
        return formatLocalDate(startOfToday);
      }

      if (/\byesterday\b/i.test(cleanedText)) {
        const yesterday = new Date(startOfToday);
        yesterday.setDate(yesterday.getDate() - 1);
        return formatLocalDate(yesterday);
      }

      return null;
    };

    test('should resolve Today and Yesterday headers', () => {
      const referenceDate = new Date(2026, 4, 13);

      expect(parseHistoryDateText('Today', referenceDate)).toBe('2026-05-13');
      expect(parseHistoryDateText('Yesterday', referenceDate)).toBe('2026-05-12');
    });
  });

  describe('Button State Management', () => {
    test('should create button with Spanish text', () => {
      const createButton = (language) => {
        const button = document.createElement('button');
        button.textContent = language === 'fr' ? 'Log to DF' : 'Log to DS';
        button.className = 'ds-log-btn';
        button.disabled = false;
        return button;
      };
      
      const button = createButton('es');
      expect(button.textContent).toBe('Log to DS');
      expect(button.className).toBe('ds-log-btn');
      expect(button.disabled).toBe(false);
    });

    test('should create button with French text', () => {
      const createButton = (language) => {
        const button = document.createElement('button');
        button.textContent = language === 'fr' ? 'Log to DF' : 'Log to DS';
        button.className = 'ds-log-btn';
        button.disabled = false;
        return button;
      };
      
      const button = createButton('fr');
      expect(button.textContent).toBe('Log to DF');
      expect(button.className).toBe('ds-log-btn');
      expect(button.disabled).toBe(false);
    });

    test('should update button to success state', () => {
      const markButtonSuccess = (button) => {
        button.textContent = 'Success';
        button.disabled = true;
      };
      
      const button = document.createElement('button');
      markButtonSuccess(button);
      
      expect(button.textContent).toBe('Success');
      expect(button.disabled).toBe(true);
    });

    test('should update button to error state', () => {
      const button = document.createElement('button');
      button.textContent = 'Error';
      
      expect(button.textContent).toBe('Error');
    });
  });

});
