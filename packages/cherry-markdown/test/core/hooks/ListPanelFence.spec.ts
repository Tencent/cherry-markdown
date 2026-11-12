import { describe, expect, it } from 'vite-plus/test';
import CherryEngine from '../../../src/index.engine.core';

const createEngine = () => new CherryEngine({ engine: { global: { classicBr: false } } });

const renderOne = (markdown: string) => createEngine().makeHtml(markdown);

describe('Panel/Detail 与列表相邻', () => {
  it('列表紧贴 ::: 结束标记时 panel 语法仍然生效', () => {
    const html = renderOne(['::: center 标题', '- a', '- b', ':::'].join('\n'));

    // 修复前：List hook 把 ::: 当作列表项内容吞掉，panel 匹配失败，
    // 输出退化为 <p>::: center 标题</p> + <ul>，预览区泄漏 ::: 源码
    expect(html).toContain('cherry-text-align__center');
    expect(html).toContain('cherry-panel--body');
    expect(html).not.toContain(':::');
  });

  it('列表紧贴 ::: 结束标记时列表本身仍正常渲染', () => {
    const html = renderOne(['::: center 标题', '- a', '- b', ':::'].join('\n'));

    expect(html).toContain('<ul');
    expect(html).toContain('<li');
    expect(html).toContain('<p>a</p>');
    expect(html).toContain('<p>b</p>');
    // 修复前结束标记会被拼进第二个列表项，渲染为 b<br>:::
    expect(html).not.toContain('b<br>');
  });

  it('列表紧贴 +++ 结束标记时 detail 语法仍然生效', () => {
    const html = renderOne(['+++ 标题', '- a', '- b', '+++'].join('\n'));

    expect(html).toContain('cherry-detail');
    expect(html).toContain('<details>');
    expect(html).not.toContain('+++');
    expect(html).not.toContain('b<br>');
  });

  it('没有 panel 包裹时列表渲染结果不变', () => {
    const html = renderOne(['- a', '- b'].join('\n'));

    expect(html).toContain('cherry-list__default');
    expect(html).toContain('<p>a</p>');
    expect(html).toContain('<p>b</p>');
  });

  it('列表后接空行再跟普通段落时渲染结果不变', () => {
    const html = renderOne(['- a', '- b', '', 'next'].join('\n'));

    expect(html).toContain('cherry-list__default');
    expect(html).toContain('next');
  });

  it('嵌套列表渲染结果不变', () => {
    const html = renderOne(['- a', '  - a1', '- b'].join('\n'));

    expect(html).toContain('<ul');
    expect(html).toContain('<p>a</p>');
    expect(html).toContain('<p>a1</p>');
    expect(html).toContain('<p>b</p>');
  });
});
