import type { NativeEvent } from '../platform';

Component({
  options: { styleIsolation: 'isolated' },
  properties: { block: { type: Object, value: null } },
  methods: {
    copyCode(event: NativeEvent) {
      const text = event.currentTarget.dataset.text;
      if (text) wx.setClipboardData({ data: text });
    },
    previewImage(event: NativeEvent) {
      const src = event.currentTarget.dataset.src;
      if (src) wx.previewImage({ current: src, urls: [src] });
    },
  },
});
