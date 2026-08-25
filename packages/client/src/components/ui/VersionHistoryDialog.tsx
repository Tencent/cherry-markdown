/**
 * 历史版本对话框
 *
 * 场景：状态栏点击"查看历史版本"按钮时打开。
 * 列出当前文件的所有本地版本（IndexedDB versions store），按时间倒序，
 * 每行按粒度显示不同精度的标签：
 *   - minute → 08/25 12:03:45
 *   - hour   → 08/25 12:00
 *   - day    → 08/25
 * 选中后点击"应用到编辑器"，通过 emit('apply', content) 由外部灌入。
 */
import { computed, defineComponent, h, PropType, Teleport, Transition, ref, watch } from 'vue';
import { readTextFile } from '@tauri-apps/plugin-fs';
import {
  clearAllVersions,
  deleteVersion,
  formatVersionLabel,
  listVersions,
  type VersionRecord,
} from '../../services/localVersions';
import { diffLines, summarizeDiff, type DiffLine } from '../../utils/diffLines';
import '../ui/ui.css';

const kindLabel: Record<VersionRecord['kind'], string> = {
  minute: '分钟',
  hour: '小时',
  day: '日',
};

const humanSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

export default defineComponent({
  name: 'VersionHistoryDialog',
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
    filePath: {
      type: String as PropType<string | null>,
      default: null,
    },
  },
  emits: {
    close: () => true,
    apply: (_content: string, _versionId: string) => true,
  },
  setup(props, { emit }) {
    const versions = ref<VersionRecord[]>([]);
    const activeId = ref<string | null>(null);
    const hoveredId = ref<string | null>(null);
    const loading = ref(false);

    // 磁盘上当前文件的内容，作为差异对比的基准
    // — 注意：不是 IDB latest，而是本次打开弹窗时从磁盘重新读取的内容
    const currentFileContent = ref<string | null>(null);
    const currentFileError = ref<string | null>(null);
    // 预览模式：默认展示 diff，可切换为原文
    const viewMode = ref<'diff' | 'raw'>('diff');

    const loadCurrentFileContent = async (): Promise<void> => {
      currentFileError.value = null;
      if (!props.filePath) {
        // 未命名草稿：无磁盘内容，统一当作空内容参与 diff
        currentFileContent.value = '';
        return;
      }
      try {
        currentFileContent.value = await readTextFile(props.filePath);
      } catch (err) {
        // 文件已删除 / 无权限等情况，降级为“空内容”，并提示用户
        currentFileContent.value = '';
        currentFileError.value = err instanceof Error ? err.message : String(err);
        console.warn('[VersionHistoryDialog] readTextFile failed:', err);
      }
    };

    const loadVersions = async (): Promise<void> => {
      if (!props.filePath) {
        versions.value = [];
        activeId.value = null;
        return;
      }
      loading.value = true;
      try {
        versions.value = await listVersions(props.filePath);
        activeId.value = versions.value[0]?.id ?? null;
      } finally {
        loading.value = false;
      }
    };

    watch(
      () => [props.visible, props.filePath],
      ([vis]) => {
        if (vis) {
          void loadVersions();
          void loadCurrentFileContent();
          // 每次打开重置为 diff 视图，避免上次遗留 raw 的预期差异
          viewMode.value = 'diff';
        }
      },
      { immediate: true },
    );

    const activeVersion = computed<VersionRecord | null>(
      () => versions.value.find((v) => v.id === activeId.value) ?? null,
    );

    // 当前选中版本 vs 磁盘当前内容的差异（行级）
    const activeDiff = computed<DiffLine[]>(() => {
      if (!activeVersion.value) return [];
      const cur = currentFileContent.value ?? '';
      return diffLines(cur, activeVersion.value.content);
    });

    const diffSummary = computed(() => summarizeDiff(activeDiff.value));

    const handleApply = (): void => {
      const v = activeVersion.value;
      if (!v) return;
      emit('apply', v.content, v.id);
    };

    const handleClose = (): void => emit('close');

    // 删除单条：更新内存列表并同步 IDB；若删除的是当前选中项，则回落到列表第一条
    const handleDeleteOne = async (id: string, event: MouseEvent): Promise<void> => {
      event.stopPropagation();
      try {
        await deleteVersion(id);
        versions.value = versions.value.filter((v) => v.id !== id);
        if (activeId.value === id) {
          activeId.value = versions.value[0]?.id ?? null;
        }
      } catch (err) {
        console.warn('[VersionHistoryDialog] deleteVersion failed:', err);
      }
    };

    // 清空所有：仅清 versions（保留 latest，避免破坏“自动快照”提示的连续性）
    const handleClearAll = async (): Promise<void> => {
      if (!props.filePath) return;
      if (versions.value.length === 0) return;
      // 简单确认，避免误点
      const confirmed = window.confirm(
        `确定要清空当前文件的全部 ${versions.value.length} 个本地历史版本吗？此操作不可撤销。`,
      );
      if (!confirmed) return;
      try {
        await clearAllVersions(props.filePath);
        versions.value = [];
        activeId.value = null;
      } catch (err) {
        console.warn('[VersionHistoryDialog] clearAllVersions failed:', err);
      }
    };

    return () =>
      h(Teleport, { to: 'body' }, [
        h(
          Transition,
          { name: 'dialog-fade' },
          {
            default: () =>
              props.visible
                ? h(
                    'div',
                    {
                      class: 'dialog-overlay',
                      onClick: (event: MouseEvent) => {
                        if (event.target === event.currentTarget) handleClose();
                      },
                    },
                    [
                      h(
                        'div',
                        {
                          class: 'dialog-content version-history-dialog',
                          style: { minWidth: '640px', maxWidth: '820px', maxHeight: '80vh' },
                        },
                        [
                          h('h3', { class: 'dialog-title' }, '本地历史版本'),
                          h(
                            'p',
                            { class: 'dialog-message' },
                            props.filePath ? `文件：${props.filePath}` : '当前为未命名草稿的历史版本',
                          ),

                          loading.value
                            ? h('p', { class: 'dialog-message' }, '正在加载…')
                            : versions.value.length === 0
                              ? h('p', { class: 'dialog-message' }, '暂无历史版本记录。')
                              : h(
                                  'div',
                                  {
                                    class: 'version-history-body',
                                    style: {
                                      display: 'grid',
                                      gridTemplateColumns: '260px 1fr',
                                      gap: '12px',
                                      height: '50vh',
                                      minHeight: 0,
                                      overflow: 'hidden',
                                    },
                                  },
                                  [
                                    // 左列：版本列表
                                    h(
                                      'ul',
                                      {
                                        class: 'version-list',
                                        style: {
                                          listStyle: 'none',
                                          margin: 0,
                                          padding: 0,
                                          height: '100%',
                                          minHeight: 0,
                                          overflowY: 'auto',
                                          border: '1px solid var(--color-border, #e0e0e0)',
                                          borderRadius: '6px',
                                        },
                                      },
                                      versions.value.map((v) =>
                                        h(
                                          'li',
                                          {
                                            key: v.id,
                                            class: ['version-item', { active: v.id === activeId.value }],
                                            style: {
                                              position: 'relative',
                                              padding: '8px 12px',
                                              paddingRight: '36px',
                                              cursor: 'pointer',
                                              borderBottom: '1px solid var(--color-border, #f0f0f0)',
                                              background:
                                                v.id === activeId.value
                                                  ? 'var(--color-accent-soft, rgba(24, 144, 255, 0.08))'
                                                  : 'transparent',
                                            },
                                            onClick: () => {
                                              activeId.value = v.id;
                                            },
                                            onMouseenter: () => {
                                              hoveredId.value = v.id;
                                            },
                                            onMouseleave: () => {
                                              if (hoveredId.value === v.id) hoveredId.value = null;
                                            },
                                          },
                                          [
                                            h(
                                              'div',
                                              { style: { fontSize: '13px', fontWeight: 600 } },
                                              formatVersionLabel(v),
                                            ),
                                            h(
                                              'div',
                                              {
                                                style: {
                                                  fontSize: '11px',
                                                  color: 'var(--color-text-muted, #999)',
                                                  marginTop: '2px',
                                                },
                                              },
                                              `${kindLabel[v.kind]} · ${humanSize(v.size)}`,
                                            ),
                                            // hover 时显示的行内删除按钮
                                            hoveredId.value === v.id
                                              ? h(
                                                  'button',
                                                  {
                                                    type: 'button',
                                                    title: '删除此版本',
                                                    'aria-label': '删除此版本',
                                                    onClick: (e: MouseEvent) => {
                                                      void handleDeleteOne(v.id, e);
                                                    },
                                                    style: {
                                                      position: 'absolute',
                                                      right: '8px',
                                                      top: '50%',
                                                      transform: 'translateY(-50%)',
                                                      width: '22px',
                                                      height: '22px',
                                                      padding: 0,
                                                      border: '1px solid var(--color-border, #e0e0e0)',
                                                      borderRadius: '4px',
                                                      background: 'var(--color-surface, #fff)',
                                                      color: 'var(--color-danger, #d4380d)',
                                                      cursor: 'pointer',
                                                      display: 'inline-flex',
                                                      alignItems: 'center',
                                                      justifyContent: 'center',
                                                      fontSize: '14px',
                                                      lineHeight: 1,
                                                    },
                                                  },
                                                  '×',
                                                )
                                              : null,
                                          ],
                                        ),
                                      ),
                                    ),

                                    // 右列：预览（含工具条 + 内容区）
                                    h(
                                      'div',
                                      {
                                        class: 'version-preview',
                                        style: {
                                          display: 'flex',
                                          flexDirection: 'column',
                                          border: '1px solid var(--color-border, #e0e0e0)',
                                          borderRadius: '6px',
                                          height: '100%',
                                          minHeight: 0,
                                          overflow: 'hidden',
                                          background: 'var(--color-surface, rgba(0,0,0,0.02))',
                                        },
                                      },
                                      [
                                        // 工具条：diff / 原文 切换 + 增减行数摘要
                                        h(
                                          'div',
                                          {
                                            class: 'version-preview-toolbar',
                                            style: {
                                              flex: '0 0 auto',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'space-between',
                                              padding: '6px 10px',
                                              borderBottom: '1px solid var(--color-border, #e0e0e0)',
                                              fontSize: '12px',
                                              background: 'var(--color-surface, #fafafa)',
                                            },
                                          },
                                          [
                                            h('div', { style: { display: 'flex', gap: '6px' } }, [
                                              h(
                                                'button',
                                                {
                                                  type: 'button',
                                                  class: ['view-mode-btn', { active: viewMode.value === 'diff' }],
                                                  onClick: () => {
                                                    viewMode.value = 'diff';
                                                  },
                                                  style: {
                                                    padding: '2px 10px',
                                                    borderRadius: '4px',
                                                    border: '1px solid var(--color-border, #e0e0e0)',
                                                    background:
                                                      viewMode.value === 'diff'
                                                        ? 'var(--color-accent-soft, rgba(24, 144, 255, 0.12))'
                                                        : 'transparent',
                                                    color:
                                                      viewMode.value === 'diff'
                                                        ? 'var(--color-accent, #1890ff)'
                                                        : 'var(--color-text, inherit)',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                  },
                                                },
                                                '差异',
                                              ),
                                              h(
                                                'button',
                                                {
                                                  type: 'button',
                                                  class: ['view-mode-btn', { active: viewMode.value === 'raw' }],
                                                  onClick: () => {
                                                    viewMode.value = 'raw';
                                                  },
                                                  style: {
                                                    padding: '2px 10px',
                                                    borderRadius: '4px',
                                                    border: '1px solid var(--color-border, #e0e0e0)',
                                                    background:
                                                      viewMode.value === 'raw'
                                                        ? 'var(--color-accent-soft, rgba(24, 144, 255, 0.12))'
                                                        : 'transparent',
                                                    color:
                                                      viewMode.value === 'raw'
                                                        ? 'var(--color-accent, #1890ff)'
                                                        : 'var(--color-text, inherit)',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                  },
                                                },
                                                '原文',
                                              ),
                                            ]),
                                            viewMode.value === 'diff' && activeVersion.value
                                              ? h(
                                                  'div',
                                                  {
                                                    style: {
                                                      display: 'flex',
                                                      gap: '10px',
                                                      color: 'var(--color-text-muted, #666)',
                                                      fontSize: '11px',
                                                    },
                                                    title: '相对于磁盘上的当前文件内容',
                                                  },
                                                  [
                                                    h(
                                                      'span',
                                                      { style: { color: 'var(--color-success, #52c41a)' } },
                                                      `+${diffSummary.value.added}`,
                                                    ),
                                                    h(
                                                      'span',
                                                      { style: { color: 'var(--color-danger, #d4380d)' } },
                                                      `-${diffSummary.value.removed}`,
                                                    ),
                                                  ],
                                                )
                                              : null,
                                          ],
                                        ),

                                        // 内容区
                                        h(
                                          'div',
                                          {
                                            class: 'version-preview-body',
                                            style: {
                                              flex: '1 1 auto',
                                              minHeight: 0,
                                              overflow: 'auto',
                                              padding: '4px 0',
                                              fontFamily: 'var(--font-mono, monospace)',
                                              fontSize: '12px',
                                            },
                                          },
                                          activeVersion.value
                                            ? viewMode.value === 'raw'
                                              ? [
                                                  h(
                                                    'pre',
                                                    {
                                                      style: {
                                                        margin: 0,
                                                        padding: '4px 10px',
                                                        whiteSpace: 'pre-wrap',
                                                        wordBreak: 'break-word',
                                                      },
                                                    },
                                                    activeVersion.value.content.slice(0, 20000) +
                                                      (activeVersion.value.content.length > 20000
                                                        ? '\n\n… (仅显示前 20KB)'
                                                        : ''),
                                                  ),
                                                ]
                                              : [
                                                  currentFileError.value
                                                    ? h(
                                                        'div',
                                                        {
                                                          style: {
                                                            padding: '6px 10px',
                                                            color: 'var(--color-warning, #d48806)',
                                                            fontSize: '11px',
                                                          },
                                                        },
                                                        `无法读取当前磁盘文件（按空内容对比）：${currentFileError.value}`,
                                                      )
                                                    : null,
                                                  ...activeDiff.value.slice(0, 5000).map((line, idx) => {
                                                    const isInsert = line.type === 'insert';
                                                    const isDelete = line.type === 'delete';
                                                    const prefix = isInsert ? '+' : isDelete ? '-' : ' ';
                                                    return h(
                                                      'div',
                                                      {
                                                        key: idx,
                                                        class: ['diff-line', line.type],
                                                        style: {
                                                          padding: '0 10px',
                                                          whiteSpace: 'pre-wrap',
                                                          wordBreak: 'break-word',
                                                          background: isInsert
                                                            ? 'rgba(82, 196, 26, 0.12)'
                                                            : isDelete
                                                              ? 'rgba(212, 56, 13, 0.12)'
                                                              : 'transparent',
                                                          color: isInsert
                                                            ? 'var(--color-success, #237804)'
                                                            : isDelete
                                                              ? 'var(--color-danger, #a8071a)'
                                                              : 'var(--color-text, inherit)',
                                                          borderLeft: `3px solid ${
                                                            isInsert
                                                              ? 'var(--color-success, #52c41a)'
                                                              : isDelete
                                                                ? 'var(--color-danger, #d4380d)'
                                                                : 'transparent'
                                                          }`,
                                                        },
                                                      },
                                                      `${prefix} ${line.text}`,
                                                    );
                                                  }),
                                                  activeDiff.value.length > 5000
                                                    ? h(
                                                        'div',
                                                        {
                                                          style: {
                                                            padding: '6px 10px',
                                                            color: 'var(--color-text-muted, #999)',
                                                            fontSize: '11px',
                                                          },
                                                        },
                                                        `… 仅显示前 5000 行差异（共 ${activeDiff.value.length} 行）`,
                                                      )
                                                    : null,
                                                ]
                                            : [],
                                        ),
                                      ],
                                    ),
                                  ],
                                ),

                          h(
                            'div',
                            {
                              class: 'dialog-actions',
                              style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
                            },
                            [
                              // 左下角：清空所有版本
                              h(
                                'button',
                                {
                                  class: 'btn btn-danger-link',
                                  disabled: versions.value.length === 0 || !props.filePath,
                                  onClick: () => {
                                    void handleClearAll();
                                  },
                                  style: {
                                    background: 'transparent',
                                    border: 'none',
                                    color:
                                      versions.value.length === 0 || !props.filePath
                                        ? 'var(--color-text-muted, #bbb)'
                                        : 'var(--color-danger, #d4380d)',
                                    cursor: versions.value.length === 0 || !props.filePath ? 'not-allowed' : 'pointer',
                                    padding: '4px 8px',
                                    fontSize: '12px',
                                  },
                                },
                                '清空所有版本',
                              ),
                              // 右下角：应用 / 关闭
                              h('div', { style: { display: 'flex', gap: '8px' } }, [
                                h(
                                  'button',
                                  {
                                    class: 'btn btn-primary',
                                    disabled: !activeVersion.value,
                                    onClick: handleApply,
                                  },
                                  '应用到编辑器',
                                ),
                                h('button', { class: 'btn btn-secondary', onClick: handleClose }, '关闭'),
                              ]),
                            ],
                          ),
                        ],
                      ),
                    ],
                  )
                : null,
          },
        ),
      ]);
  },
});
