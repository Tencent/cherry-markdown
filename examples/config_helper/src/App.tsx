import { useCallback, useMemo, useState } from 'react';
import ConfigPanel from './components/ConfigPanel';
import ExportModal from './components/ExportModal';
import Footer from './components/Footer';
import Header from './components/Header';
import PreviewTabs from './components/PreviewTabs';
import Toast from './components/Toast';
import { useConfigState } from './hooks/useConfigState';
import { useToast } from './hooks/useToast';
import type { PresetName, TabName } from './types';
import { copyText } from './utils/clipboard';
import { buildExportCode } from './utils/configGenerator';

const DEFAULT_MARKDOWN = '# Hello Cherry Markdown!';

export default function App() {
  const { state, config, categories, actions } = useConfigState();
  const { message, visible, showToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabName>('preview');
  /** 配置参考面板聚焦的配置项；null 表示展示完整源码 */
  const [sourceKey, setSourceKey] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  /** 重置 / 预设后递增，通知配置面板恢复默认展开状态 */
  const [resetSignal, setResetSignal] = useState(0);

  const exportCode = useMemo(() => buildExportCode(config), [config]);

  const markdown = useMemo(() => {
    const value = state.value?.value;
    return typeof value === 'string' && value ? value : DEFAULT_MARKDOWN;
  }, [state.value]);

  /** 配置项上的"查看配置参考"按钮：跳到配置参考标签并定位到该项源码片段 */
  const handleShowSource = useCallback((key: string) => {
    setSourceKey(key);
    setActiveTab('source');
  }, []);

  /** 手动点击标签时，配置参考面板回到完整源码视图 */
  const handleTabChange = useCallback((tab: TabName) => {
    if (tab === 'source') setSourceKey(null);
    setActiveTab(tab);
  }, []);

  const handleCopy = useCallback(async () => {
    await copyText(exportCode);
    showToast('代码已复制到剪贴板！');
  }, [exportCode, showToast]);

  const handleReset = useCallback(() => {
    actions.reset();
    setResetSignal((s) => s + 1);
    showToast('配置已重置为默认值');
  }, [actions, showToast]);

  const handleApplyPreset = useCallback(
    (name: PresetName) => {
      const preset = actions.applyPreset(name);
      setResetSignal((s) => s + 1);
      if (preset) showToast(`已应用「${preset.name}」预设`);
    },
    [actions, showToast],
  );

  const closeExport = useCallback(() => setExportOpen(false), []);

  return (
    <>
      <Header onReset={handleReset} onExport={() => setExportOpen(true)} />

      {/* 桌面端：主区域占满剩余视口高度，左右两栏各自内部滚动；小屏：整体纵向堆叠并由 main 滚动 */}
      <main className="flex-1 min-h-0 w-full max-w-[1600px] mx-auto px-6 py-4 overflow-y-auto lg:overflow-hidden">
        <div className="grid grid-cols-12 gap-6 lg:h-full">
          <ConfigPanel
            categories={categories}
            state={state}
            actions={actions}
            onShowSource={handleShowSource}
            onApplyPreset={handleApplyPreset}
            resetSignal={resetSignal}
          />

          <section className="col-span-12 lg:col-span-8 xl:col-span-9 flex flex-col min-h-0 lg:h-full">
            <PreviewTabs
              activeTab={activeTab}
              onTabChange={handleTabChange}
              config={config}
              markdown={markdown}
              exportCode={exportCode}
              onCopyCode={handleCopy}
              sourceKey={sourceKey}
            />
          </section>
        </div>
      </main>

      <ExportModal open={exportOpen} code={exportCode} onClose={closeExport} onCopy={handleCopy} />
      <Footer />
      <Toast message={message} visible={visible} />
    </>
  );
}
