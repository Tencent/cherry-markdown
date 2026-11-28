import { iconFamily, icons, styles } from './generated/cherry-styles.js';

type ShadowStyles = {
  sheet?: CSSStyleSheet;
  font?: Promise<void>;
};

const documents = new WeakMap<Document, ShadowStyles>();

function getStyles(document: Document): ShadowStyles {
  const existing = documents.get(document);
  if (existing) return existing;

  const window = document.defaultView;
  const result: ShadowStyles = {};
  if (window?.CSSStyleSheet.prototype.replaceSync) {
    result.sheet = new window.CSSStyleSheet();
    result.sheet.replaceSync(styles);
  }
  if (window?.FontFace && document.fonts) {
    // Register the published font under a separate name. Browsers differ in
    // how they load @font-face inside a shadow tree.
    const bytes = Uint8Array.from(window.atob(icons), (value) => value.charCodeAt(0));
    const face = new window.FontFace(iconFamily, bytes);
    result.font = face.load().then((font) => {
      document.fonts.add(font);
    });
  }
  documents.set(document, result);
  return result;
}

export async function createShadowHost(document: Document) {
  const host = document.createElement('div');
  host.setAttribute('data-cherry-milkdown', '');
  const root = host.attachShadow({ mode: 'open' });
  const { sheet, font } = getStyles(document);
  if (sheet && 'adoptedStyleSheets' in root) {
    root.adoptedStyleSheets = [sheet];
  } else {
    const style = document.createElement('style');
    style.textContent = styles;
    root.append(style);
  }
  await font;
  return { host, root };
}
