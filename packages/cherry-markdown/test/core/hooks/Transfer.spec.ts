import { describe, expect, it } from 'vitest';
import Transfer from '../../../src/core/hooks/Transfer';

describe('core/hooks/Transfer', () => {
  it('protects an escaped line ending before Markdown rendering', () => {
    const hook = new Transfer({});

    expect(hook.beforeMakeHtml('first\\\nsecond')).toBe('first\\ \nsecond');
    expect(hook.beforeMakeHtml('first\nsecond')).toBe('first\nsecond');
  });

  it('restores every protected punctuation token after rendering', () => {
    const hook = new Transfer({});

    expect(hook.afterMakeHtml('~Q ~X ~Y ~Z ~& ~K')).toBe('~ ` ! # & /');
  });

  it('exposes the inert transfer rule', () => {
    const hook = new Transfer({});

    expect(hook.RULE.begin).toBe('');
    expect(hook.RULE.content).toBe('');
    expect(hook.RULE.end).toBe('');
    expect(hook.RULE.reg.test('text')).toBe(true);
  });
});
