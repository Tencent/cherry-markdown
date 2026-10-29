import { cherryThemes } from 'cherry-markdown/theme';

export function nativeThemeStyle(theme = 'default'): string {
  const name = Object.prototype.hasOwnProperty.call(cherryThemes, theme) ? theme : 'default';
  return Object.entries(cherryThemes[name as keyof typeof cherryThemes])
    .map(([key, value]) => `${key}:${value}`)
    .join(';');
}

function panelKind(kind: string): string {
  return ['primary', 'info', 'warning', 'danger', 'success'].includes(kind) ? kind : 'primary';
}

export function nativePanelTextColor(kind = 'primary'): string {
  return `--native-panel-${panelKind(kind)}-body-color`;
}

export function nativePanelStyle(theme = 'default', kind = 'primary'): string {
  const tokens =
    cherryThemes[
      Object.prototype.hasOwnProperty.call(cherryThemes, theme) ? (theme as keyof typeof cherryThemes) : 'default'
    ];
  const name = panelKind(kind);
  return ['bg', 'border-color', 'title-bg', 'title-color', 'body-bg', 'body-color']
    .map((part) => `--panel-${part}:${tokens[`--native-panel-${name}-${part}`]}`)
    .join(';');
}

/** Only native text styles supported by both renderers; no arbitrary source CSS. */
export function nativeInlineStyle(source = '', inherited = ''): string {
  const values = new Map<string, string>();
  for (const declaration of `${inherited};${source}`.split(';')) {
    const colon = declaration.indexOf(':');
    if (colon < 0) continue;
    const name = declaration.slice(0, colon).trim().toLowerCase();
    const value = declaration.slice(colon + 1).trim();
    if (
      (name === 'color' || name === 'background-color') &&
      /^(?:#[\da-f]{3,8}|[a-z]+|rgba?\([\d.,%\s]+\)|hsla?\([\d.,%\s]+\))$/i.test(value)
    )
      values.set(name, value);
    if (name === 'font-size' && /^\d+(?:\.\d+)?px$/.test(value) && parseFloat(value) > 0 && parseFloat(value) <= 256)
      values.set(name, value);
  }
  return [...values].map(([name, value]) => `${name}:${value}`).join(';');
}
