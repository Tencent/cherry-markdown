import { describe, expect, it } from 'vitest';
import { isBrowser } from '../../src/utils/env';

describe('utils/env', () => {
  describe('isBrowser', () => {
    it('should detect browser environment', () => {
      // In test environment (jsdom), window is defined
      expect(isBrowser()).toBe(true);
    });
  });
});
