/** Stable, sibling-unique positional keys for append-only children of a reconciled top-level block. */
export function withNativeKeys<T>(value: T, path: string): T {
  if (Array.isArray(value)) return value.map((item, index) => withNativeKeys(item, `${path}-${index}`)) as T;
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries([
    ...Object.entries(value).map(([name, child]) => [name, withNativeKeys(child, `${path}-${name}`)]),
    ['id', path],
  ]) as T;
}
