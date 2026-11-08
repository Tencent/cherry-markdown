interface SourceNode {
  type: string;
  value?: string;
  children?: SourceNode[];
  position?: { start?: { offset?: number }; end?: { offset?: number } };
}

/** Map an edit inside literal text only when the complete source trees match. */
export function mapMarkdownTextEdit(
  raw: string,
  serialized: string,
  from: number,
  to: number,
  parse: (source: string) => unknown,
): number | undefined {
  try {
    const original = parse(raw) as SourceNode;
    const canonical = parse(serialized) as SourceNode;
    const withoutPositions = (key: string, value: unknown) => (key === 'position' ? undefined : value);
    if (JSON.stringify(original, withoutPositions) !== JSON.stringify(canonical, withoutPositions)) return undefined;
    const matches: number[] = [];
    const visit = (left: SourceNode, right: SourceNode) => {
      if (right.type === 'text' && typeof right.value === 'string') {
        const start = right.position?.start?.offset;
        const end = right.position?.end?.offset;
        const originalStart = left.position?.start?.offset;
        const originalEnd = left.position?.end?.offset;
        if (
          start !== undefined &&
          end !== undefined &&
          originalStart !== undefined &&
          originalEnd !== undefined &&
          start <= from &&
          to <= end &&
          serialized.slice(start, end) === right.value &&
          raw.slice(originalStart, originalEnd) === left.value
        )
          matches.push(originalStart + from - start);
      }
      right.children?.forEach((child, index) => {
        const corresponding = left.children?.[index];
        if (corresponding) visit(corresponding, child);
      });
    };
    visit(original, canonical);
    return matches.length === 1 ? matches[0] : undefined;
  } catch {
    return undefined;
  }
}
