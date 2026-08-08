import { describe, expect, it } from 'vite-plus/test';
import { addonsKeywords, allSuggestList, suggesterKeywords } from '../../../src/core/hooks/SuggestList';

interface Suggestion {
  icon: string;
  label: string;
  keyword: string;
  value: string;
}

const customSuggestion: Suggestion = {
  icon: 'custom',
  label: 'customAction',
  keyword: 'custom',
  value: 'custom value',
};

describe('core/hooks/SuggestList', () => {
  it('exports every built-in trigger including addon keywords', () => {
    expect(suggesterKeywords).toContain('/');
    expect(suggesterKeywords).toContain('、');
    expect(suggesterKeywords).toContain(addonsKeywords);
  });

  it('returns localized system suggestions for slash-like triggers', () => {
    const suggestions = allSuggestList('/', { heading1: 'Heading one' });
    const heading = suggestions.find((item) => item.keyword === '/head1');

    expect(heading?.label).toBe('Heading one');
    expect(heading?.value).toBe('# ');
    expect(suggestions.every((item) => item.keyword.startsWith('/'))).toBe(true);
  });

  it('uses a configured system list instead of defaults', () => {
    const suggestions = allSuggestList(
      '#',
      { customAction: 'Custom action' },
      {
        systemSuggestList: [customSuggestion],
      },
    );

    expect(suggestions.some((item) => item.keyword === '#custom')).toBe(true);
    expect(suggestions.find((item) => item.keyword === '#custom')?.label).toBe('Custom action');
    expect(suggestions.some((item) => item.keyword === '#head1')).toBe(false);
  });

  it('appends configured system suggestions to defaults', () => {
    const suggestions = allSuggestList('/', {}, { extendSystemSuggestList: [customSuggestion] });

    expect(suggestions.some((item) => item.keyword === '/head1')).toBe(true);
    expect(suggestions.some((item) => item.keyword === '/custom')).toBe(true);
  });

  it('filters non-system punctuation suggestions by their trigger', () => {
    const dollar = allSuggestList('$', {});
    const fullWidthBracket = allSuggestList('【', {});

    expect(dollar.length).toBeGreaterThan(0);
    expect(dollar.every((item) => item.keyword.startsWith('$'))).toBe(true);
    expect(dollar.some((item) => item.label === 'inlineMath')).toBe(true);
    expect(fullWidthBracket.some((item) => item.value === '[')).toBe(true);
    expect(fullWidthBracket.some((item) => item.value === '[]')).toBe(true);
  });

  it('ignores empty replacement and extension arrays', () => {
    const suggestions = allSuggestList('/', {}, { systemSuggestList: [], extendSystemSuggestList: [] });

    expect(suggestions.some((item) => item.keyword === '/head1')).toBe(true);
  });
});
