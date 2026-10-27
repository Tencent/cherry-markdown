import { NativeMarkdownController } from '../../native/controller';
import type { NativeViewBlock } from '../../native/controller';
import type { NativeInstance } from '../platform';

interface MarkdownInstance extends NativeInstance<{
  markdown: string;
  streaming: boolean;
  updateInterval: number;
  blocks: NativeViewBlock[];
}> {
  controller?: NativeMarkdownController;
}

Component({
  options: { styleIsolation: 'isolated' },
  externalClasses: ['custom-class'],
  properties: {
    markdown: { type: String, value: '' },
    streaming: { type: Boolean, value: false },
    updateInterval: { type: Number, value: 80 },
  },
  data: { blocks: [] },
  observers: {
    'markdown, streaming'(this: MarkdownInstance, markdown: string, streaming: boolean) {
      this.controller?.setMarkdown(markdown, streaming);
    },
  },
  methods: {
    setMarkdown(this: MarkdownInstance, markdown: string, streaming = false) {
      this.controller?.setMarkdown(markdown, streaming);
    },
  },
  lifetimes: {
    attached(this: MarkdownInstance) {
      this.controller = new NativeMarkdownController((patch, done) => this.setData(patch, done), {
        interval: this.data.updateInterval,
      });
      this.controller.setMarkdown(this.data.markdown, this.data.streaming);
    },
    detached(this: MarkdownInstance) {
      this.controller?.dispose();
      this.controller = undefined;
    },
  },
});
