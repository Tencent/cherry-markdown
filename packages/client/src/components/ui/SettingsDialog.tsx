import { defineComponent, h, Teleport, Transition, ref, computed, watch } from 'vue';
import { useImageBedStore, usePreferencesStore, type ImageBedProvider, type ImageBedState } from '../../store';
import { FIXED_WIDTH_DEFAULT, FIXED_WIDTH_MAX, FIXED_WIDTH_MIN } from '../../store/modal/preferences';
import { testImageBedConnection } from '../composables/useImageBedUploader';
import './settings-dialog.css';

const PROVIDER_OPTIONS: Array<{ value: ImageBedProvider; label: string; hint: string }> = [
  { value: 'none', label: '禁用（Base64 内联）', hint: '不使用图床，图片以 base64 内联到 markdown' },
  { value: 'picgo', label: 'PicGo Server', hint: '本地运行 PicGo，通过 HTTP 接口上传' },
  { value: 'custom', label: '自定义 HTTP 上传', hint: '任意支持 multipart/form-data 的上传接口' },
];

type TestResult = { ok: boolean; message: string } | null;

export default defineComponent({
  name: 'SettingsDialog',
  props: {
    visible: {
      type: Boolean,
      required: true,
    },
  },
  emits: {
    close: () => true,
  },
  setup(props, { emit }) {
    const store = useImageBedStore();
    const preferences = usePreferencesStore();

    // Local draft: only committed to store on "保存"; discarded on "取消"
    const draft = ref<ImageBedState>(cloneState(store.$state));
    // 专注模式 - 固定宽度草稿（px）；同样只在“保存”时提交
    const fixedWidthDraft = ref<number>(preferences.fixedWidthValue);

    // 每次弹窗打开时，用最新的 store 状态刷新草稿
    watch(
      () => props.visible,
      (v) => {
        if (v) {
          draft.value = cloneState(store.$state);
          fixedWidthDraft.value = preferences.fixedWidthValue;
          testResult.value = null;
        }
      },
    );

    const testing = ref(false);
    const testResult = ref<TestResult>(null);

    const canTest = computed(() => draft.value.provider === 'picgo' || draft.value.provider === 'custom');

    const handleTest = async (): Promise<void> => {
      if (!canTest.value) return;
      testing.value = true;
      testResult.value = null;
      try {
        testResult.value = await testImageBedConnection(draft.value.provider as 'picgo' | 'custom', draft.value);
      } finally {
        testing.value = false;
      }
    };

    const handleSave = (): void => {
      store.replaceAll(cloneState(draft.value));
      // 固定宽度：写回前需限制到合法范围内，store 内部也会再做一次 clamp
      const raw = Number(fixedWidthDraft.value);
      const px = Number.isFinite(raw) ? raw : FIXED_WIDTH_DEFAULT;
      preferences.setFixedWidthValue(Math.min(FIXED_WIDTH_MAX, Math.max(FIXED_WIDTH_MIN, Math.round(px))));
      emit('close');
    };

    const handleCancel = (): void => {
      emit('close');
    };

    const addHeader = (): void => {
      draft.value.custom.headers = [...draft.value.custom.headers, { key: '', value: '' }];
    };

    const removeHeader = (index: number): void => {
      draft.value.custom.headers = draft.value.custom.headers.filter((_, i) => i !== index);
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
                        if (event.target === event.currentTarget) handleCancel();
                      },
                    },
                    [
                      h('div', { class: 'dialog-content settings-dialog' }, [
                        h('h3', { class: 'dialog-title' }, '设置'),

                        // ==== 专注模式分节 ====
                        h('section', { class: 'settings-section' }, [
                          h('h4', { class: 'settings-section-title' }, '专注模式'),
                          h(
                            'p',
                            { class: 'settings-section-desc' },
                            '专注模式下，正文采用居中固定宽度布局，便于阅读。可在下方自定义宽度，修改后立即生效。',
                          ),
                          h('div', { class: 'settings-form' }, [
                            h('label', { class: 'settings-field' }, [
                              h('span', { class: 'settings-field-label' }, `固定宽度（px）`),
                              h('input', {
                                class: 'settings-input',
                                type: 'number',
                                min: FIXED_WIDTH_MIN,
                                max: FIXED_WIDTH_MAX,
                                step: 20,
                                value: fixedWidthDraft.value,
                                placeholder: String(FIXED_WIDTH_DEFAULT),
                                onInput: (e: Event) => {
                                  const v = Number((e.target as HTMLInputElement).value);
                                  fixedWidthDraft.value = Number.isFinite(v) ? v : FIXED_WIDTH_DEFAULT;
                                },
                              }),
                              h(
                                'span',
                                { class: 'settings-field-hint' },
                                `建议范围 ${FIXED_WIDTH_MIN} – ${FIXED_WIDTH_MAX}，默认 ${FIXED_WIDTH_DEFAULT}。仅在“固定宽度”模式下生效，100% 宽度不受影响。`,
                              ),
                            ]),
                          ]),
                        ]),

                        // ==== 图床设置分节 ====
                        h('section', { class: 'settings-section' }, [
                          h('h4', { class: 'settings-section-title' }, '图床'),
                          h(
                            'p',
                            { class: 'settings-section-desc' },
                            '选择上传图片时使用的图床。修改后立即生效，无需重启。',
                          ),

                          // Provider radio group
                          h(
                            'div',
                            { class: 'settings-provider-list' },
                            PROVIDER_OPTIONS.map((opt) =>
                              h(
                                'label',
                                {
                                  class: ['settings-provider-item', { active: draft.value.provider === opt.value }],
                                },
                                [
                                  h('input', {
                                    type: 'radio',
                                    name: 'image-bed-provider',
                                    value: opt.value,
                                    checked: draft.value.provider === opt.value,
                                    onChange: () => {
                                      draft.value.provider = opt.value;
                                      testResult.value = null;
                                    },
                                  }),
                                  h('div', { class: 'settings-provider-text' }, [
                                    h('div', { class: 'settings-provider-label' }, opt.label),
                                    h('div', { class: 'settings-provider-hint' }, opt.hint),
                                  ]),
                                ],
                              ),
                            ),
                          ),

                          // PicGo config
                          draft.value.provider === 'picgo'
                            ? h('div', { class: 'settings-form' }, [
                                h('label', { class: 'settings-field' }, [
                                  h('span', { class: 'settings-field-label' }, 'PicGo Server 上传地址'),
                                  h('input', {
                                    class: 'settings-input',
                                    type: 'text',
                                    value: draft.value.picgo.url,
                                    placeholder: 'http://127.0.0.1:36677/upload',
                                    onInput: (e: Event) => {
                                      draft.value.picgo.url = (e.target as HTMLInputElement).value;
                                    },
                                  }),
                                  h(
                                    'span',
                                    { class: 'settings-field-hint' },
                                    '本地需先启动 PicGo 桌面客户端并在 "PicGo Server" 设置中打开监听。',
                                  ),
                                ]),
                              ])
                            : null,

                          // Custom uploader config
                          draft.value.provider === 'custom'
                            ? h('div', { class: 'settings-form' }, [
                                h('label', { class: 'settings-field' }, [
                                  h('span', { class: 'settings-field-label' }, '上传 URL'),
                                  h('input', {
                                    class: 'settings-input',
                                    type: 'text',
                                    value: draft.value.custom.url,
                                    placeholder: 'https://your-server.com/upload',
                                    onInput: (e: Event) => {
                                      draft.value.custom.url = (e.target as HTMLInputElement).value;
                                    },
                                  }),
                                ]),
                                h('label', { class: 'settings-field' }, [
                                  h('span', { class: 'settings-field-label' }, '表单字段名'),
                                  h('input', {
                                    class: 'settings-input',
                                    type: 'text',
                                    value: draft.value.custom.fieldName,
                                    placeholder: 'file',
                                    onInput: (e: Event) => {
                                      draft.value.custom.fieldName = (e.target as HTMLInputElement).value;
                                    },
                                  }),
                                  h(
                                    'span',
                                    { class: 'settings-field-hint' },
                                    'multipart/form-data 中承载文件的字段名，多数服务为 file / image。',
                                  ),
                                ]),
                                h('label', { class: 'settings-field' }, [
                                  h('span', { class: 'settings-field-label' }, '响应 URL 字段路径'),
                                  h('input', {
                                    class: 'settings-input',
                                    type: 'text',
                                    value: draft.value.custom.responseUrlPath,
                                    placeholder: 'data.url',
                                    onInput: (e: Event) => {
                                      draft.value.custom.responseUrlPath = (e.target as HTMLInputElement).value;
                                    },
                                  }),
                                  h(
                                    'span',
                                    { class: 'settings-field-hint' },
                                    '响应为 JSON 时，用点号路径提取最终图片 URL，例如 data.url、result.0.url。',
                                  ),
                                ]),
                                h('div', { class: 'settings-field' }, [
                                  h('div', { class: 'settings-headers-header' }, [
                                    h('span', { class: 'settings-field-label' }, '自定义请求头'),
                                    h(
                                      'button',
                                      {
                                        class: 'settings-btn-mini',
                                        type: 'button',
                                        onClick: addHeader,
                                      },
                                      '+ 添加',
                                    ),
                                  ]),
                                  ...draft.value.custom.headers.map((header, index) =>
                                    h('div', { class: 'settings-header-row', key: index }, [
                                      h('input', {
                                        class: 'settings-input',
                                        type: 'text',
                                        value: header.key,
                                        placeholder: 'Header 名，如 Authorization',
                                        onInput: (e: Event) => {
                                          draft.value.custom.headers[index].key = (e.target as HTMLInputElement).value;
                                        },
                                      }),
                                      h('input', {
                                        class: 'settings-input',
                                        type: 'text',
                                        value: header.value,
                                        placeholder: 'Header 值',
                                        onInput: (e: Event) => {
                                          draft.value.custom.headers[index].value = (
                                            e.target as HTMLInputElement
                                          ).value;
                                        },
                                      }),
                                      h(
                                        'button',
                                        {
                                          class: 'settings-btn-mini danger',
                                          type: 'button',
                                          onClick: () => removeHeader(index),
                                        },
                                        '删除',
                                      ),
                                    ]),
                                  ),
                                ]),
                              ])
                            : null,

                          // Test connection block
                          canTest.value
                            ? h('div', { class: 'settings-test-row' }, [
                                h(
                                  'button',
                                  {
                                    class: 'btn btn-secondary',
                                    type: 'button',
                                    disabled: testing.value,
                                    onClick: handleTest,
                                  },
                                  testing.value ? '测试中…' : '测试连接',
                                ),
                                testResult.value
                                  ? h(
                                      'span',
                                      {
                                        class: ['settings-test-result', testResult.value.ok ? 'ok' : 'err'],
                                      },
                                      testResult.value.message,
                                    )
                                  : null,
                              ])
                            : null,
                        ]),

                        // ==== 底部操作按钮 ====
                        h('div', { class: 'dialog-actions' }, [
                          h('button', { class: 'btn btn-primary', onClick: handleSave }, '保存'),
                          h('button', { class: 'btn btn-secondary', onClick: handleCancel }, '取消'),
                        ]),
                      ]),
                    ],
                  )
                : null,
          },
        ),
      ]);
  },
});

function cloneState(state: ImageBedState): ImageBedState {
  return {
    provider: state.provider,
    picgo: { ...state.picgo },
    custom: {
      url: state.custom.url,
      fieldName: state.custom.fieldName,
      responseUrlPath: state.custom.responseUrlPath,
      headers: state.custom.headers.map((h) => ({ ...h })),
    },
  };
}
