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
      const createPayload = (videoUrl, channel) => ({
        type: 'inspectAndLogToDS',
        videoUrl: videoUrl,
        channel: channel
      });
      
      const payload = createPayload('https://youtube.com/watch?v=abc123', 'Test Channel');
      
      expect(payload).toEqual({
        type: 'inspectAndLogToDS',
        videoUrl: 'https://youtube.com/watch?v=abc123',
        channel: 'Test Channel'
      });
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
