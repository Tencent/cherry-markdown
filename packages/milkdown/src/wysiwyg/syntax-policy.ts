export type CherrySyntaxHandling = 'structured' | 'native-source' | 'passthrough';

const PANEL_ALIASES: Readonly<Record<string, string>> = {
  p: 'primary',
  i: 'info',
  w: 'warning',
  d: 'danger',
  s: 'success',
  l: 'left',
  c: 'center',
  r: 'right',
  j: 'justify',
  t: 'tabs',
  '2cols': 'cols',
  '3cols': 'cols',
};

const STRUCTURED_PANEL_KINDS = new Set(['panel', 'primary', 'info', 'warning', 'danger', 'success']);

export function canonicalPanelKind(rawType: string) {
  const normalized = rawType.trim().toLowerCase();
  return PANEL_ALIASES[normalized] ?? normalized;
}

/**
 * Only one-to-one content containers are rebuilt as ProseMirror structures.
 * Layout directives and unknown business directives stay engine-owned and
 * retain their complete source in one editable native node.
 */
export function panelSyntaxHandling(rawType: string): CherrySyntaxHandling {
  return STRUCTURED_PANEL_KINDS.has(canonicalPanelKind(rawType)) ? 'structured' : 'native-source';
}
