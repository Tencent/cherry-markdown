import type { MiniProgramInlineRun } from '../../types';
import type { NativeEvent, NativeInstance } from '../platform';

type TextRun = Exclude<MiniProgramInlineRun, { type: 'image' | 'image_placeholder' }>;
type InlineGroup = { type: 'text'; runs: TextRun[] } | Exclude<MiniProgramInlineRun, TextRun>;

/** A single text host preserves native line wrapping and selection across marks. */
export function groupInlineRuns(nodes: MiniProgramInlineRun[]): InlineGroup[] {
  const groups: InlineGroup[] = [];
  for (const node of nodes) {
    if (node.type === 'image' || node.type === 'image_placeholder') {
      groups.push(node);
    } else {
      const previous = groups[groups.length - 1];
      if (previous?.type === 'text') previous.runs.push(node);
      else groups.push({ type: 'text', runs: [node] });
    }
  }
  return groups;
}

Component({
  options: { styleIsolation: 'isolated' },
  properties: { nodes: { type: Array, value: [] } },
  data: { groups: [] },
  observers: {
    nodes(this: NativeInstance<{ nodes: MiniProgramInlineRun[] }>, nodes: MiniProgramInlineRun[]) {
      this.setData({ groups: groupInlineRuns(nodes || []) });
    },
  },
  methods: {
    linkTap(this: NativeInstance<object>, event: NativeEvent) {
      const href = event.currentTarget.dataset.href;
      if (href) this.triggerEvent('linktap', { href }, { bubbles: true, composed: true });
    },
    previewImage(event: NativeEvent) {
      const src = event.currentTarget.dataset.src;
      if (src) wx.previewImage({ current: src, urls: [src] });
    },
  },
});
