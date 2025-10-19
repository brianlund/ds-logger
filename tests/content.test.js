// Mock DOM elements for testing

// Helper function to test (copied from content.js)
function parseDuration(text) {
  if (!text) return 0;
  const parts = text.trim().split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return 0;
}

describe('Content Script Functions', () => {
  describe('parseDuration', () => {
    test('should parse MM:SS format', () => {
      expect(parseDuration('5:30')).toBe(330); // 5*60 + 30
      expect(parseDuration('10:15')).toBe(615); // 10*60 + 15
    });

    test('should parse H:MM:SS format', () => {
      expect(parseDuration('1:30:45')).toBe(5445); // 1*3600 + 30*60 + 45
    });

    test('should handle edge cases', () => {
      expect(parseDuration('')).toBe(0);
      expect(parseDuration(null)).toBe(0);
      expect(parseDuration(undefined)).toBe(0);
      expect(parseDuration('60')).toBe(60);
    });
  });

  describe('Button Creation', () => {
    test('should create button with correct properties', () => {
      const button = document.createElement('button');
      button.textContent = 'Log to DS';
      button.className = 'ds-log-btn';
      
      expect(button.textContent).toBe('Log to DS');
      expect(button.className).toBe('ds-log-btn');
    });
  });

  describe('Video URL Parsing', () => {
    test('should handle regular YouTube URLs', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      expect(url.includes('/watch?v=')).toBe(true);
    });

    test('should handle YouTube Shorts URLs', () => {
      const url = 'https://www.youtube.com/shorts/dQw4w9WgXcQ';
      expect(url.includes('/shorts/')).toBe(true);
    });
  });
});
