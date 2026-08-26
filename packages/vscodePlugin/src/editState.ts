export function isPreviewEditEnabled(
  targetDocumentUri: string | undefined,
  targetLanguageId: string | undefined,
  activeDocumentUri: string | undefined,
  activeLanguageId: string | undefined,
): boolean {
  if (!targetDocumentUri || targetLanguageId !== 'markdown') return false;
  if (activeLanguageId === undefined) return true;
  return activeLanguageId === 'markdown' && activeDocumentUri === targetDocumentUri;
}
