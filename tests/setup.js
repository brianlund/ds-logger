// Vitest setup for Chrome extension testing
import { vi } from 'vitest';

// Mock Chrome APIs
global.chrome = {
  runtime: {
    onMessage: {
      addListener: vi.fn()
    },
    sendMessage: vi.fn(),
    lastError: null
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn()
    }
  }
};

// Mock fetch
global.fetch = vi.fn();

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123')
  },
  writable: true
});
