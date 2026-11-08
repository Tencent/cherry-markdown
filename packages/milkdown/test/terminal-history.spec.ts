import { describe, expect, it } from 'vite-plus/test';
import { createTerminalHistory, preserveLineEndings } from '../src/terminal-history';

describe('terminal newline history', () => {
  it('restores a different source spelling only after checking the complete document', () => {
    const history = createTerminalHistory();
    history.remember('# Title\n', 'Title\n=====\n');
    const raw = '# Title\n';
    expect(
      history.restoreSource(
        '# Title\n',
        raw,
        () => true,
        () => false,
      ),
    ).toBe(raw);
    expect(
      history.restoreSource(
        '# Title\n',
        raw,
        () => false,
        () => true,
      ),
    ).toBe(raw);
    expect(
      history.restoreSource(
        '# Title\n',
        raw,
        () => true,
        () => true,
      ),
    ).toBe('Title\n=====\n');
  });
  it('restores a validated unambiguous source and refuses an ambiguous or oversized one', () => {
    const history = createTerminalHistory(2, 32);
    history.remember('- Item\n', '* Item\r\n');
    expect(history.restoreSource('- Item\n', '- Item\n', (candidate) => candidate === '* Item\r\n')).toBe('* Item\r\n');
    expect(history.restoreSource('- Item\n', '- Item\n', () => false)).toBe('- Item\n');
    expect(history.restoreSource('- Item\n', '- **Item**\n', () => true)).toBe('- **Item**\n');
    history.remember('- Item\n', '- Item\n');
    expect(history.restoreSource('- Item\n', '- Item\n', () => true)).toBe('- Item\n');
    history.clear();
    history.remember('small', 'x'.repeat(40));
    expect(history.restoreSource('small', 'Current', () => true)).toBe('Current');
    history.remember('- A', '+ A');
    history.remember('- B', '* B');
    history.remember('- C', '+ C');
    expect(history.restoreSource('- A', '- A', () => true)).toBe('- A');
    expect(history.restoreSource('- C', '- C', () => true)).toBe('+ C');
  });

  it('restores only the remembered suffix and validates the candidate', () => {
    const history = createTerminalHistory();
    history.remember('canonical', 'Old');
    expect(history.restore('canonical', 'Current\n', (value) => value === 'Current')).toBe('Current');
    expect(history.restore('canonical', 'Current\n', () => false)).toBe('Current\n');
    expect(history.restore('missing', 'Current\n', () => true)).toBe('Current\n');
  });

  it('does not guess when one serialized state has different source suffixes', () => {
    const history = createTerminalHistory();
    history.remember('canonical', 'Text');
    history.remember('canonical', 'Text\n');
    history.remember('canonical', 'Text');
    expect(history.restore('canonical', 'Text\n\n', () => true)).toBe('Text\n\n');
    history.clear();
    history.remember('canonical', 'Text');
    expect(history.restore('canonical', 'Text\n', () => true)).toBe('Text');
  });

  it('recognizes equivalent serialized line endings and editor-only terminal newlines', () => {
    const history = createTerminalHistory();
    history.rememberExternalAlias('A\r\nB\n', 'A\r\nB\r\n');
    expect(history.restore('A\nB\n\n', 'A\nB\n\n', () => true)).toBe('A\r\nB\r\n');
    history.rememberExternalAlias('A\nB\n\n', 'A\nB');
    expect(history.restore('A\nB\n', 'A\nB\n\n', () => true)).toBe('A\nB\n\n');
  });

  it('keeps exact editor states separate even when their normalized aliases match', () => {
    const history = createTerminalHistory();
    history.remember('Text\n', 'Text');
    history.remember('Text\n\n', 'Text\n');
    expect(history.restore('Text\n', 'Text\n', () => true)).toBe('Text');
    expect(history.restore('Text\n\n', 'Text\n\n', () => true)).toBe('Text\n');
    history.rememberExternalAlias('Text\n', 'Text\n\n');
    expect(history.restore('Text\n', 'Text\n', () => true)).toBe('Text');
  });

  it('bounds retained states', () => {
    const history = createTerminalHistory(1);
    history.remember('first', 'One');
    history.remember('second', 'Two\n');
    expect(history.restore('first', 'One\n', () => true)).toBe('One\n');
    expect(history.restore('second', 'Two', () => true)).toBe('Two\n');
  });

  it('restores uniform CRLF and rejects mixed, lone CR, or ambiguous conventions', () => {
    const history = createTerminalHistory();
    history.remember('crlf', 'A\r\n\r\nB\r\n');
    expect(history.restore('crlf', 'A\n\nB\n', () => true)).toBe('A\r\n\r\nB\r\n');
    expect(history.restore('crlf', 'A\r\nB\n', () => true)).toBe('A\r\nB\n');
    expect(history.restore('crlf', 'A\rB', () => true)).toBe('A\rB');
    expect(history.restore('crlf', 'A\nB\n', () => false)).toBe('A\nB\n');
    history.remember('mixed', 'A\r\nB\n');
    expect(history.restore('mixed', 'A\nB', () => true)).toBe('A\nB');
    history.remember('crlf', 'A\r\nB\n');
    expect(history.restore('crlf', 'A\n\nB', () => true)).toBe('A\n\nB');
    history.clear();
    history.remember('crlf', 'A\r\n\r\nB\r\n');
    history.remember('crlf', 'A\n\nB\n');
    expect(history.restore('crlf', 'A\n\nB', () => true)).toBe('A\n\nB');
  });

  it('preserves uniform CRLF during editing only when the candidate is valid', () => {
    const raw = 'A\r\n\r\nB';
    const candidate = 'A\n\nB\n\nC\n';
    expect(preserveLineEndings(raw, candidate, () => true)).toBe('A\r\n\r\nB\r\n\r\nC\r\n');
    expect(preserveLineEndings(raw, candidate, () => false)).toBe(candidate);
    expect(preserveLineEndings('A\r\nB\n', candidate, () => true)).toBe(candidate);
    expect(preserveLineEndings(raw, 'A\r\nB\n', () => true)).toBe('A\r\nB\r\n');
    expect(preserveLineEndings(raw, 'A\rB\n', () => true)).toBe('A\rB\n');
    expect(preserveLineEndings('A\nB', candidate, () => true)).toBe(candidate);
  });

  it('also bounds the total size of serialized history keys', () => {
    const history = createTerminalHistory(10, 5);
    history.remember('abc', 'one');
    history.remember('def', 'two');
    expect(history.restore('abc', 'one\n', () => true)).toBe('one\n');
    expect(history.restore('def', 'two\n', () => true)).toBe('two');
    history.remember('too long', 'three');
    expect(history.restore('def', 'two\n', () => true)).toBe('two');
  });
});
