import generatedThemes from 'virtual:cherry-semantic-theme';
export type CherryThemeName = 'default' | 'dark' | 'blue' | 'green' | 'red' | 'violet' | 'gray' | 'abyss';
export type CherryThemeTokens = Readonly<Record<string, string>>;
/** Resolved tokens from Cherry's existing Sass themes, materialized at build time. */
export const cherryThemes: Readonly<Record<CherryThemeName, CherryThemeTokens>> = Object.freeze(
  Object.fromEntries(Object.entries(generatedThemes).map(([name, tokens]) => [name, Object.freeze(tokens)])),
) as Readonly<Record<CherryThemeName, CherryThemeTokens>>;
