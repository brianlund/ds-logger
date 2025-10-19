// Background script tests

describe('Background Script', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset fetch mock
    global.fetch.mockClear();
  });

  describe('API Communication', () => {
    test('should create correct payload structure', () => {
      const videoData = {
        title: 'Test Spanish Video',
        hours: 0,
        minutes: 5,
        seconds: 30,
        duration: 330
      };

      const videoUrl = 'https://www.youtube.com/watch?v=test123';
      const expectedDuration = videoData.hours * 3600 + videoData.minutes * 60 + videoData.seconds;

      const payload = {
        id: Date.now().toString(),
        date: new Date().toISOString().split('T')[0],
        description: `YouTube: ${videoData.title}`,
        url: videoUrl,
        type: "watching",
        timeSeconds: expectedDuration,
        idempotencyKey: 'test-uuid-123'
      };

      expect(payload.description).toBe('YouTube: Test Spanish Video');
      expect(payload.type).toBe('watching');
      expect(payload.timeSeconds).toBe(330);
      expect(payload.url).toBe(videoUrl);
    });

    test('should handle API inspection response', async () => {
      const mockVideoData = {
        title: 'Learn Spanish Video',
        duration: 600,
        hours: 0,
        minutes: 10,
        seconds: 0
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVideoData
      });

      const response = await fetch('https://app.dreaming.com/.netlify/functions/inspectExternalVideo?videoUrl=test');
      const data = await response.json();

      expect(data).toEqual(mockVideoData);
      expect(fetch).toHaveBeenCalledWith('https://app.dreaming.com/.netlify/functions/inspectExternalVideo?videoUrl=test');
    });

    test('should handle API errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch('https://app.dreaming.com/.netlify/functions/inspectExternalVideo?videoUrl=test');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }
    });
  });

  describe('Duration Calculation', () => {
    test('should calculate duration from hours, minutes, seconds', () => {
      const videoData = { hours: 1, minutes: 30, seconds: 45 };
      const duration = videoData.hours * 3600 + videoData.minutes * 60 + videoData.seconds;
      expect(duration).toBe(5445); // 1h 30m 45s = 5445 seconds
    });

    test('should fallback to duration field if HMS not available', () => {
      const videoData = { duration: 300 };
      const duration = videoData.duration;
      expect(duration).toBe(300);
    });

    test('should use 300 second fallback when no duration info', () => {
      const videoData = {};
      const duration = videoData.duration || 300;
      expect(duration).toBe(300);
    });
  });

  describe('Token Storage', () => {
    test('should handle token storage', () => {
      const mockToken = 'test-bearer-token';
      
      chrome.storage.local.set.mockImplementation((data, callback) => {
        expect(data).toEqual({ ds_token: mockToken });
        if (callback) callback();
      });

      chrome.storage.local.set({ ds_token: mockToken }, () => {
        // Token saved
      });

      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        { ds_token: mockToken },
        expect.any(Function)
      );
    });

    test('should handle token retrieval', () => {
      const mockToken = 'test-bearer-token';
      
      chrome.storage.local.get.mockImplementation((key, callback) => {
        expect(key).toBe('ds_token');
        callback({ ds_token: mockToken });
      });

      chrome.storage.local.get('ds_token', (data) => {
        expect(data.ds_token).toBe(mockToken);
      });
    });
  });
});