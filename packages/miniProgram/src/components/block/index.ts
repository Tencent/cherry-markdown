import { nativeThemeStyle, nativePanelStyle, nativePanelTextColor } from '../../native/theme';
import { nativeCodeLayout } from '../../native/code-layout';
import type { MiniProgramViewBlock } from '../../types';
import type { NativeEvent, NativeInstance, NativeSelectorQuery } from '../platform';

interface BlockInstance extends NativeInstance<{
  block: MiniProgramViewBlock | null;
  tableHeight: number;
  tableWidth: number;
  tableScrollLeft: number;
  detailOpen: boolean;
  codeHeight: number;
  codeWidth: number;
  panelStyle: string;
  theme: string;
}> {
  tableReady?: boolean;
  detailDefaultOpen?: boolean;
  imageMeasurements?: Map<string, string>;
  scrollLeft?: number;
  measurementVersion?: number;
  createSelectorQuery(): NativeSelectorQuery;
}

function measureTable(instance: BlockInstance) {
  if (!instance.tableReady || instance.data.block?.type !== 'table') return;
  const version = (instance.measurementVersion || 0) + 1;
  instance.measurementVersion = version;
  instance.setData({ tableHeight: 0, tableScrollLeft: instance.scrollLeft || 0 }, () => {
    if (!instance.tableReady || version !== instance.measurementVersion) return;
    instance
      .createSelectorQuery()
      .select('.md-table')
      .boundingClientRect((rect) => {
        if (!instance.tableReady || version !== instance.measurementVersion || instance.data.block?.type !== 'table')
          return;
        const height = Math.ceil(rect?.height || 0);
        if (height > 0 && height !== instance.data.tableHeight) instance.setData({ tableHeight: height });
      })
      .exec();
  });
}

Component({
  options: { styleIsolation: 'isolated' },
  properties: {
    block: { type: Object, value: null },
    theme: { type: String, value: 'default' },
    context: { type: String, value: '' },
    listDepth: { type: Number, value: 0 },
    textColor: { type: String, value: '--md-paragraph-color' },
  },
  data: {
    themeStyle: nativeThemeStyle(),
    detailOpen: false,
    codeHeight: 0,
    codeWidth: 0,
    tableHeight: 0,
    tableWidth: 0,
    tableScrollLeft: 0,
  },
  observers: {
    theme(this: BlockInstance, theme: string) {
      this.setData({
        themeStyle: nativeThemeStyle(theme),
        panelStyle: nativePanelStyle(theme, this.data.block?.type === 'panel' ? this.data.block.kind : undefined),
      });
    },
    block(this: BlockInstance, block: MiniProgramViewBlock | null) {
      if (block?.type === 'panel')
        this.setData({
          panelStyle: nativePanelStyle(this.data.theme, block.kind),
          panelTextColor: nativePanelTextColor(block.kind),
        });
      if (block?.type === 'code_block') {
        this.setData(nativeCodeLayout(block.text));
      }
      if (block?.type === 'detail') {
        const open = block.open === true;
        if (this.detailDefaultOpen !== open) {
          this.detailDefaultOpen = open;
          this.setData({ detailOpen: open });
        }
      } else this.detailDefaultOpen = undefined;
      this.measurementVersion = (this.measurementVersion || 0) + 1;
      if (block?.type !== 'table') {
        this.imageMeasurements = undefined;
        if (this.data.tableHeight) this.setData({ tableHeight: 0 });
        return;
      }
      const cells = [...block.header, ...block.rows].flatMap((row) => row.cells);
      const activeCells = new Set(cells.map((cell) => (cell as typeof cell & { id?: string }).id));
      for (const key of this.imageMeasurements?.keys() || []) {
        if (!activeCells.has(key.split(':')[0])) this.imageMeasurements?.delete(key);
      }
      const columns = [...block.header, ...block.rows].reduce((count, row) => Math.max(count, row.cells.length), 0);
      this.setData({ tableWidth: columns * 114 }, () => measureTable(this));
    },
  },
  lifetimes: {
    ready(this: BlockInstance) {
      this.tableReady = true;
      measureTable(this);
    },
    detached(this: BlockInstance) {
      this.tableReady = false;
      this.measurementVersion = (this.measurementVersion || 0) + 1;
    },
  },
  pageLifetimes: {
    resize(this: BlockInstance) {
      measureTable(this);
    },
    show(this: BlockInstance) {
      measureTable(this);
    },
  },
  methods: {
    toggleDetail(this: BlockInstance) {
      if (this.data.block?.type === 'detail') this.setData({ detailOpen: !this.data.detailOpen });
    },
    tableImageLoaded(
      this: BlockInstance,
      event: NativeEvent & { detail: { id: string; src: string; width: number; height: number } },
    ) {
      const key = `${event.currentTarget.dataset.cell || ''}:${event.detail.id}`;
      const size = `${event.detail.src}:${event.detail.width}x${event.detail.height}`;
      this.imageMeasurements ||= new Map();
      if (this.imageMeasurements.get(key) === size) return;
      this.imageMeasurements.set(key, size);
      measureTable(this);
    },
    tableScrolled(this: BlockInstance, event: { detail: { scrollLeft: number } }) {
      this.scrollLeft = event.detail.scrollLeft;
    },
    measureTable(this: BlockInstance) {
      measureTable(this);
    },
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
