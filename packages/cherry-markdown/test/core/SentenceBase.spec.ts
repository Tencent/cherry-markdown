import { describe, expect, it } from 'vitest';
import SentenceBase from '../../src/core/SentenceBase';

describe('core/SentenceBase', () => {
  it('initializes with the default sentence hook metadata', () => {
    const hook = new SentenceBase();

    expect(hook.getName()).toBe('');
    expect(hook.getType()).toBe('sentence');
  });

  it('maps numeric hook types to public hook type names', () => {
    const hook = new SentenceBase();

    hook.HOOKTYPE = 2;
    expect(hook.getType()).toBe('paragraph');

    hook.HOOKTYPE = 3;
    expect(hook.getType()).toBe('page');
  });

  it('falls back to sentence for unknown hook types', () => {
    const hook = new SentenceBase();

    hook.HOOKTYPE = 99;

    expect(hook.getType()).toBe('sentence');
  });

  it('returns optional subclass handlers when they exist', () => {
    class CustomSentence extends SentenceBase {
      makeHtml(str: string) {
        return str.toUpperCase();
      }

      onKeyDown() {
        return true;
      }

      rule() {
        return { reg: /test/ };
      }
    }

    const hook = new CustomSentence();

    expect(hook.getMakeHtml()).toBe(hook.makeHtml);
    expect(hook.getOnKeyDown()).toBe(hook.onKeyDown);
    expect(hook.getRule()).toBe(hook.rule);
  });

  it('returns false for optional subclass handlers when they are missing', () => {
    const hook = new SentenceBase();

    expect(hook.getMakeHtml()).toBe(false);
    expect(hook.getOnKeyDown()).toBe(false);
    expect(hook.getRule()).toBe(false);
  });
});
