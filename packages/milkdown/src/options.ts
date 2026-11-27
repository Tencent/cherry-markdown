import type { CherryMilkdownOptions, CherryMilkdownTheme } from './types.js';

export const CHERRY_THEMES = ['default', 'dark', 'abyss', 'green', 'red', 'gray', 'violet', 'blue'] as const;

function invalid(path: string, reason: string): never {
  throw new TypeError(
    `Invalid Milkdown configuration "${path}": ${reason}. See CONFIGURATION.md in @cherry-markdown/milkdown.`,
  );
}

export function configurationObject(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid(path, 'expected an object');
  return value as Record<string, unknown>;
}

export function supportedKeys(value: Record<string, unknown>, keys: readonly string[], path: string) {
  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) invalid(`${path}.${key}`, `unsupported option; supported keys are ${keys.join(', ')}`);
  }
}

function functions(value: Record<string, unknown>, path: string) {
  for (const [key, item] of Object.entries(value)) {
    if (item !== undefined && typeof item !== 'function') invalid(`${path}.${key}`, 'expected a function');
  }
}

export function validateTheme(theme: unknown): asserts theme is CherryMilkdownTheme {
  if (!CHERRY_THEMES.includes(theme as CherryMilkdownTheme))
    invalid('theme', `expected one of ${CHERRY_THEMES.join(', ')}`);
}

export function validateOptions(input: CherryMilkdownOptions) {
  const options = configurationObject(input, 'options');
  supportedKeys(
    options,
    [
      'root',
      'value',
      'engine',
      'engineOptions',
      'bubble',
      'readonly',
      'theme',
      'debounce',
      'mathlive',
      'fileUpload',
      'plugins',
      'renderers',
      'onChange',
      'onError',
    ],
    'options',
  );
  if (typeof options.root !== 'string' && !(options.root instanceof HTMLElement))
    invalid('root', 'expected a selector or HTMLElement');
  if (options.value !== undefined && typeof options.value !== 'string')
    invalid('value', 'expected Markdown as a string');
  for (const key of ['bubble', 'readonly']) {
    if (options[key] !== undefined && typeof options[key] !== 'boolean') invalid(key, 'expected a boolean');
  }
  if (options.theme !== undefined) validateTheme(options.theme);
  if (
    options.debounce !== undefined &&
    (typeof options.debounce !== 'number' || !Number.isFinite(options.debounce) || options.debounce < 0)
  )
    invalid('debounce', 'expected finite milliseconds greater than or equal to zero');
  functions({ fileUpload: options.fileUpload, onChange: options.onChange, onError: options.onError }, 'options');
  if (options.engine !== undefined) {
    const engine = configurationObject(options.engine, 'engine');
    if (typeof engine.makeHtml !== 'function') invalid('engine.makeHtml', 'expected a function');
    if (engine.destroyRenderedContent !== undefined && typeof engine.destroyRenderedContent !== 'function')
      invalid('engine.destroyRenderedContent', 'expected a function');
    if (options.engineOptions !== undefined)
      invalid('engineOptions', 'cannot be combined with engine; configure the supplied engine directly');
  }
  if (options.engineOptions !== undefined) {
    const engine = configurationObject(options.engineOptions, 'engineOptions');
    supportedKeys(engine, ['callback'], 'engineOptions');
    if (engine.callback !== undefined) {
      const callback = configurationObject(engine.callback, 'engineOptions.callback');
      supportedKeys(callback, ['urlProcessor', 'beforeImageMounted'], 'engineOptions.callback');
      functions(callback, 'engineOptions.callback');
    }
  }
  if (options.mathlive !== undefined) {
    const math = configurationObject(options.mathlive, 'mathlive');
    supportedKeys(math, ['macros', 'virtualKeyboardMode'], 'mathlive');
    if (math.macros !== undefined) {
      const macros = configurationObject(math.macros, 'mathlive.macros');
      for (const [key, value] of Object.entries(macros)) {
        if (typeof value !== 'string') invalid(`mathlive.macros.${key}`, 'expected a string');
      }
    }
    if (
      math.virtualKeyboardMode !== undefined &&
      (typeof math.virtualKeyboardMode !== 'string' ||
        !['auto', 'manual', 'onfocus', 'off'].includes(math.virtualKeyboardMode))
    )
      invalid('mathlive.virtualKeyboardMode', 'expected auto, manual, onfocus or off');
  }
  if (
    options.plugins !== undefined &&
    (!Array.isArray(options.plugins) || !options.plugins.every((plugin) => typeof plugin === 'function'))
  )
    invalid('plugins', 'expected an array of Milkdown plugin functions');
  if (options.renderers !== undefined) functions(configurationObject(options.renderers, 'renderers'), 'renderers');
}
