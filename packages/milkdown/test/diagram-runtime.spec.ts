import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderMermaid } from '../src/wysiwyg/diagram-runtime';

const render = vi.hoisted(() => vi.fn());
const initialize = vi.hoisted(() => vi.fn());
vi.mock('mermaid', () => ({ default: { initialize, render } }));

afterEach(() => {
  render.mockReset();
  initialize.mockReset();
  document.body.replaceChildren();
});

describe('Mermaid renderer ownership', () => {
  it('resolves each queued render from its own Cherry theme scope', async () => {
    render.mockResolvedValue({ svg: '<svg></svg>' });
    const light = document.body.appendChild(document.createElement('div'));
    light.className = 'cherry theme__default';
    const dark = document.body.appendChild(document.createElement('div'));
    dark.className = 'cherry theme__dark';
    dark.style.setProperty('--primary-color', '#339af0');
    dark.style.setProperty('--base-font-color', '#eee');
    dark.style.setProperty('--base-previewer-bg', '#222');
    await Promise.all([
      renderMermaid('graph LR\nA-->B', undefined, light),
      renderMermaid('graph LR\nC-->D', undefined, dark),
    ]);
    expect(initialize.mock.calls[0]?.[0]).toEqual({ securityLevel: 'strict', startOnLoad: false, theme: 'default' });
    expect(initialize.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({
        theme: 'dark',
        themeVariables: {
          primaryBorderColor: '#339af0',
          primaryTextColor: '#eee',
          lineColor: '#eee',
          background: '#222',
        },
      }),
    );
  });
  it('serializes simultaneous renders and removes each temporary canvas', async () => {
    let finishFirst!: (value: { svg: string }) => void;
    render
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishFirst = resolve;
          }),
      )
      .mockResolvedValueOnce({ svg: '<svg id="second"></svg>' });

    const first = renderMermaid('graph LR\nA-->B');
    const second = renderMermaid('graph LR\nC-->D');
    await vi.waitFor(() => expect(render).toHaveBeenCalledTimes(1));
    expect(document.querySelectorAll('[data-cherry-milkdown-mermaid-canvas]')).toHaveLength(1);
    finishFirst({ svg: '<svg id="first"></svg>' });
    expect(await first).toContain('first');
    expect(await second).toContain('second');
    expect(render).toHaveBeenCalledTimes(2);
    expect(render.mock.calls[0]?.[2]).not.toBe(render.mock.calls[1]?.[2]);
    expect(document.querySelectorAll('[data-cherry-milkdown-mermaid-canvas]')).toHaveLength(0);
  });

  it('skips a queued render when its node is removed', async () => {
    let finishFirst!: (value: { svg: string }) => void;
    render.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishFirst = resolve;
        }),
    );
    const first = renderMermaid('graph LR\nA-->B');
    const controller = new AbortController();
    const removed = renderMermaid('graph LR\nC-->D', controller.signal);
    await vi.waitFor(() => expect(render).toHaveBeenCalledTimes(1));
    controller.abort();
    finishFirst({ svg: '<svg></svg>' });
    await first;
    await expect(removed).rejects.toMatchObject({ name: 'AbortError' });
    expect(render).toHaveBeenCalledTimes(1);
    expect(document.querySelectorAll('[data-cherry-milkdown-mermaid-canvas]')).toHaveLength(0);
  });
});
