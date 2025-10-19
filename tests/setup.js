// Mock Chrome APIs
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn()
    },
    sendMessage: jest.fn(),
    lastError: null
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  }
};

// Mock fetch
global.fetch = jest.fn();

// Mock crypto.randomUUID
global.crypto = {
  randomUUID: jest.fn(() => 'test-uuid-123')
};