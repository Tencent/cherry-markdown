/** A unique URL is inserted synchronously, before any asynchronous upload work. */
export const UPLOAD_PLACEHOLDER_PATTERN = /^cherry-upload:[a-f\d-]{36}$/;

export function findUploadPlaceholder(markdown: string, placeholder: string): number | undefined {
  if (!UPLOAD_PLACEHOLDER_PATTERN.test(placeholder)) return undefined;
  const anchor = `(${placeholder})`;
  const index = markdown.indexOf(anchor);
  // A deleted, edited or duplicated anchor is no longer an unambiguous insertion target.
  if (index < 0 || markdown.indexOf(anchor, index + anchor.length) >= 0) return undefined;
  return index + 1;
}

export function replaceUploadPlaceholder(markdown: string, placeholder: string, url: string): string | undefined {
  const index = findUploadPlaceholder(markdown, placeholder);
  if (index === undefined) return undefined;
  return markdown.slice(0, index) + url + markdown.slice(index + placeholder.length);
}
