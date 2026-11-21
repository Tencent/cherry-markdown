export const aliases = {
  '--color-brand-primary': '--primary-color',
  '--color-bg-active': '--secondary-color',
  '--color-text-primary': '--base-font-color',
  '--color-bg-canvas': '--base-editor-bg',
  '--color-bg-surface': '--base-previewer-bg',
  '--color-border-default': '--base-border-color',
  '--color-text-secondary': '--base-sub-font-color',
  '--color-text-link': '--md-link-color',
  '--color-brand-primary-hover': '--md-link-hover-color',
};

/** @param {keyof typeof aliases} role */
export function themeColor(role) {
  return `var(${aliases[role]}, var(${role}))`;
}

/**
 * @template T
 * @param {keyof typeof aliases} role
 * @param {(name: string) => string | undefined} read
 * @param {T} fallback
 * @returns {string | T}
 */
export function readThemeColor(role, read, fallback) {
  return read(aliases[role]) || read(role) || fallback;
}
