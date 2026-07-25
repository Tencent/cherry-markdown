import { describe, it, expect, vi } from 'vitest';
import Footnote from '../../../src/core/hooks/Footnote';

const defaultConfig = {
  selfClosing: false,
  refNumber: {
    appendClass: '',
    render: (refNum: number) => `[${refNum}]`,
    clickRefNumberCallback: () => true,
  },
  refList: {
    appendClass: '',
    title: {
      appendClass: '',
      render: () => '',
    },
    listItem: {
      appendClass: '',
      render: (refNum: number, refTitle: string, content: string, refNumberLinkRender: Function) => {
        return `${refNumberLinkRender(refNum, refTitle)}${content}`;
      },
    },
  },
  bubbleCard: false as const,
};

function cloneConfig(config: any = defaultConfig) {
  return {
    ...config,
    refNumber: { ...config.refNumber },
    refList:
      config.refList === false
        ? false
        : {
            ...config.refList,
            title: { ...(config.refList?.title || {}) },
            listItem: { ...(config.refList?.listItem || {}) },
          },
  };
}

function createFootnoteHook(config: any = defaultConfig, cherryExtra: Record<string, unknown> = {}) {
  const cherry = {
    options: {
      engine: {
        global: {
          flowSessionContext: false,
        },
      },
    },
    ...cherryExtra,
  };
  const hook = new Footnote({ externals: {}, config: cloneConfig(config), cherry }) as any;
  hook.$engine = {
    hash: (str: string) => `sign-${str.length}`,
    makeHtmlForFootnote: (md: string) => md,
    $cherry: cherry,
  };
  hook.RULE = hook.rule();
  return hook;
}

const sampleMd = `正文引用脚注[^note]。

[^note]: 脚注内容`;

describe('core/hooks/footnote', () => {
  describe('title rendering', () => {
    it('默认 title.render 返回空字符串时不渲染 .footnote-title', () => {
      const hook = createFootnoteHook();
      const html = hook.beforeMakeHtml(sampleMd);
      expect(html).toContain('class="footnote');
      expect(html).not.toContain('footnote-title');
      expect(html).toContain('one-footnote');
    });

    it('title.render 返回非空时渲染对应标题，且只调用一次 render', () => {
      const render = vi.fn(() => '参考资料');
      const config = cloneConfig(defaultConfig);
      config.refList.title.render = render;
      config.refList.title.appendClass = 'ref-title';
      const hook = createFootnoteHook(config);
      const html = hook.beforeMakeHtml(sampleMd);
      expect(render).toHaveBeenCalledTimes(1);
      expect(html).toContain('class="footnote-title ref-title"');
      expect(html).toContain('>参考资料</div>');
    });

    it('title.render 返回 null/undefined 时按空字符串处理且不渲染标题', () => {
      for (const value of [null, undefined] as const) {
        const config = cloneConfig(defaultConfig);
        config.refList.title.render = () => value as any;
        const hook = createFootnoteHook(config);
        const html = hook.beforeMakeHtml(sampleMd);
        expect(html).not.toContain('footnote-title');
      }
    });

    it('title.render 未配置时不抛错且不渲染标题', () => {
      const config = cloneConfig(defaultConfig);
      config.refList.title = { appendClass: 'custom-title' };
      const hook = createFootnoteHook(config);
      expect(() => hook.beforeMakeHtml(sampleMd)).not.toThrow();
      const html = hook.beforeMakeHtml(sampleMd);
      expect(html).not.toContain('footnote-title');
    });

    it('即使 cherry.locale 存在 footnoteTitle 也不会自动回退使用', () => {
      const hook = createFootnoteHook(defaultConfig, {
        locale: { footnoteTitle: '脚注' },
      });
      const html = hook.beforeMakeHtml(sampleMd);
      expect(html).not.toContain('footnote-title');
      expect(html).not.toContain('>脚注<');
    });
  });

  describe('ref list visibility and classes', () => {
    it('refList 为 false 时脚注列表带 hidden class', () => {
      const config = cloneConfig(defaultConfig);
      config.refList = false;
      const hook = createFootnoteHook(config);
      const html = hook.beforeMakeHtml(sampleMd);
      expect(html).toMatch(/class="footnote\s+hidden"/);
      expect(html).not.toContain('footnote-title');
    });

    it('支持 refList.appendClass 与 listItem.appendClass', () => {
      const config = cloneConfig(defaultConfig);
      config.refList.appendClass = 'ref-list';
      config.refList.listItem.appendClass = 'ref-item';
      const hook = createFootnoteHook(config);
      const html = hook.beforeMakeHtml(sampleMd);
      expect(html).toContain('class="footnote ref-list');
      expect(html).toContain('class="one-footnote ref-item"');
    });
  });

  describe('inline ref and list content', () => {
    it('渲染正文角标占位，并在 afterMakeHtml 替换为真实链接', () => {
      const hook = createFootnoteHook();
      const before = hook.beforeMakeHtml(sampleMd);
      expect(before).toContain('\0~fn#0#\0');
      expect(before).toContain('id="fn:1"');
      expect(before).toContain('脚注内容');

      const after = hook.afterMakeHtml(before);
      expect(after).not.toContain('\0~fn#');
      expect(after).toContain('class="cherry-footnote-number"');
      expect(after).toContain('href="#fn:1"');
      expect(after).toContain('id="fnref:1"');
      expect(after).toContain('>[1]<');
    });

    it('底部回跳链接指向正文角标', () => {
      const hook = createFootnoteHook();
      const html = hook.beforeMakeHtml(sampleMd);
      expect(html).toContain('href="#fnref:1"');
      expect(html).toContain('class="footnote-ref');
      expect(html).toContain('data-index="1"');
    });

    it('重复引用同一脚注只生成一条列表项', () => {
      const md = `第一次[^note] 第二次[^note]

[^note]: 共用内容`;
      const hook = createFootnoteHook();
      const before = hook.beforeMakeHtml(md);
      expect(before.match(/\0~fn#0#\0/g)?.length).toBe(2);
      expect(before.match(/class="one-footnote/g)?.length).toBe(1);
      expect(hook.getFootNote()).toHaveLength(1);

      const after = hook.afterMakeHtml(before);
      // 两处正文引用都指向同一脚注编号
      expect(after.match(/class="cherry-footnote-number"/g)?.length).toBe(2);
      expect(after.match(/href="#fn:1"/g)?.length).toBe(2);
    });

    it('支持自定义 refNumber.render', () => {
      const config = cloneConfig(defaultConfig);
      config.refNumber.render = (num: number) => `*${num}*`;
      const hook = createFootnoteHook(config);
      const after = hook.afterMakeHtml(hook.beforeMakeHtml(sampleMd));
      expect(after).toContain('>*1*<');
      expect(after).toContain('class="footnote-ref');
    });

    it('无脚注引用时不输出脚注列表', () => {
      const hook = createFootnoteHook();
      const html = hook.beforeMakeHtml('普通段落，没有脚注');
      expect(html).not.toContain('class="footnote');
      expect(html).not.toContain('one-footnote');
    });
  });

  describe('selfClosing unmatched refs', () => {
    it('非自闭合时未定义角标保持原样', () => {
      const hook = createFootnoteHook();
      const html = hook.beforeMakeHtml('未定义[^missing]');
      expect(html).toContain('[^missing]');
      expect(html).not.toContain('cherry-footnote-number');
    });

    it('自闭合时未定义角标也会渲染角标', () => {
      const config = cloneConfig(defaultConfig);
      config.selfClosing = true;
      const hook = createFootnoteHook(config);
      const html = hook.beforeMakeHtml('未定义[^missing]');
      expect(html).toContain('class="cherry-footnote-number"');
      expect(html).toContain('id="fnref:1"');
      expect(html).toContain('>[1]<');
      // 无定义内容时不生成底部列表
      expect(html).not.toContain('one-footnote');
    });
  });
});
