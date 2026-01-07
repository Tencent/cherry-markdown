import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { isBrowser } from '../../src/utils/env';

describe('utils/env', () => {
  let originalWindow: any;

  beforeEach(() => {
    originalWindow = global.window;
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  describe('isBrowser', () => {
    it('should return true in browser environment', () => {
      // In test environment (jsdom), window is defined
      expect(isBrowser()).toBe(true);
    });

    it('should return false in non-browser environment', () => {
      // @ts-expect-error - Simulating non-browser environment
      delete global.window;
      expect(isBrowser()).toBe(false);
    });
  });
});
