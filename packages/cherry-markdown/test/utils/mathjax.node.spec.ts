// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { configureMathJax } from '../../src/utils/mathjax';

vi.mock('@/utils/env', () => ({
  isBrowser: () => false,
}));

describe('utils/mathjax in non-browser environments', () => {
  it('skips MathJax configuration without accessing browser globals', () => {
    expect(() => configureMathJax(true)).not.toThrow();
  });
});
