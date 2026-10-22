import { describe, expect, it } from 'vitest';
import { canonicalPanelKind, panelSyntaxHandling } from '../src/wysiwyg/syntax-policy';

describe('Cherry syntax handling policy', () => {
  it.each([
    ['p', 'primary'],
    ['i', 'info'],
    ['w', 'warning'],
    ['d', 'danger'],
    ['s', 'success'],
  ])('keeps Cherry panel alias %s structurally editable as %s', (source, expected) => {
    expect(canonicalPanelKind(source)).toBe(expected);
    expect(panelSyntaxHandling(source)).toBe('structured');
  });

  it.each(['tabs', 't', 'timeline', 'cols', '2cols', '3cols', 'business-card'])(
    'keeps layout or business directive %s source-backed',
    (source) => {
      expect(panelSyntaxHandling(source)).toBe('native-source');
    },
  );
});
