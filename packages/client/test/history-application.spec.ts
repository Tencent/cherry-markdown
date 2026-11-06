import { afterEach, expect, it, vi } from 'vite-plus/test';
import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import App from '../src/App';

const mocks = vi.hoisted(() => ({ setMarkdown: vi.fn(), setDirty: vi.fn(), updateTitle: vi.fn(async () => {}) }));
vi.mock('../src/components/SidePanelManager', () => ({ default: defineComponent(() => () => null) }));
vi.mock('../src/components/ui/SettingsDialog', () => ({ default: defineComponent(() => () => null) }));
vi.mock('../src/components/ui/ToastContainer', () => ({ default: defineComponent(() => () => null) }));
vi.mock('../src/components/ui/UnsavedChangesDialog', () => ({ default: defineComponent(() => () => null) }));
vi.mock('../src/components/StatusBar', () => ({ default: defineComponent({ emits: ['openVersionHistory'], setup: (_p, { emit }) => () => h('button', { id: 'open-history', onClick: () => emit('openVersionHistory') }, 'history') }) }));
vi.mock('../src/services/localVersions', () => ({
  listVersions: vi.fn(async () => [{ id: 'v1', filePath: 'file.md', content: 'old version', kind: 'minute', size: 11, bucket: 0, createdAt: 0 }]),
  formatVersionLabel: () => 'version 1', clearFile: vi.fn(), deleteVersion: vi.fn(),
}));
vi.mock('@tauri-apps/plugin-fs', () => ({ readTextFile: vi.fn(async () => 'current'), stat: vi.fn(async () => ({ mtime: null })) }));
vi.mock('@tauri-apps/plugin-dialog', () => ({ ask: vi.fn(async () => true) }));
vi.mock('../src/store', () => ({ useFileStore: () => ({ currentFilePath: 'file.md', touchUntitledDraft: vi.fn() }) }));
vi.mock('../src/components/composables/useEditorAdapter', () => ({ useEditorAdapter: () => ({
  setMarkdown: mocks.setMarkdown, getMarkdown: () => '', clearUndoRedo: vi.fn(), scrollPreviewToTop: vi.fn(),
  initEditor: vi.fn(async () => {}), disposeEditor: vi.fn(async () => {}), toolbarVisible: ref(true), toggleToolbar: vi.fn(),
}) }));
vi.mock('../src/components/composables/useUnsavedGuard', () => ({ useUnsavedGuard: () => ({
  hasUnsavedChanges: ref(false), showUnsavedDialog: ref(false), setUnsavedChanges: mocks.setDirty,
  confirmProceedWhenUnsaved: vi.fn(async () => true), checkUnsavedChanges: vi.fn(), handleUnsavedDialogClose: vi.fn(),
}) }));
vi.mock('../src/components/composables/useLocalVersioning', () => ({ useLocalVersioning: () => ({
  lastAutoSavedAt: ref(null), hasVersion: ref(true), checkNewerLocalVersion: vi.fn(async () => null), onContentChanged: vi.fn(),
}) }));
vi.mock('../src/components/composables/useAppFileOperations', () => ({ useAppFileOperations: () => ({ restoreInitialFile: vi.fn(async () => {}), saveMarkdown: vi.fn() }) }));
vi.mock('../src/components/composables/useAppEvents', () => ({ useAppEvents: () => ({ registerWindowEvents: vi.fn(), registerTauriEvents: vi.fn(async () => {}), cleanupAll: vi.fn(async () => {}) }) }));
vi.mock('../src/components/composables/useAppWindowLifecycle', () => ({ useAppWindowLifecycle: () => ({ updateTitle: mocks.updateTitle, mountWindowLifecycle: vi.fn(async () => {}), cleanupWindowLifecycle: vi.fn() }) }));
vi.mock('../src/utils/notifications', () => ({ notifyError: vi.fn(), notifyInfo: vi.fn() }));

afterEach(() => { document.body.replaceChildren(); vi.clearAllMocks(); });

it('applies a selected history version through App and marks the file unsaved', async () => {
  const root = document.body.appendChild(document.createElement('div'));
  const app = createApp(App);
  app.mount(root);
  root.querySelector<HTMLButtonElement>('#open-history')!.click();
  await vi.waitFor(() => expect(document.body.textContent).toContain('version 1'));
  const apply = [...document.querySelectorAll('button')].find((button) => button.textContent === '应用到编辑器');
  expect(apply).toBeDefined();
  apply!.click();
  await nextTick();
  expect(mocks.setMarkdown).toHaveBeenCalledWith('old version', { addToHistory: true });
  expect(mocks.setDirty).toHaveBeenCalledWith(true);
  expect(mocks.updateTitle).toHaveBeenCalledWith('file.md', true);
  app.unmount();
});
