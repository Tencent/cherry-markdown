import { beforeEach, describe, expect, it } from 'vite-plus/test';
import CherryStream from '../src/index';

describe('@cherry-markdown/stream convergence contract', () => {
  beforeEach(() => {
    // @ts-expect-error build constant
    globalThis.BUILD_ENV = 'production';
  });

  it.each([
    ['**unfinished', '**finished**'],
    ['```js\nconst value = 1', '```js\nconst value = 1\n```'],
    ['[link](https://exam', '[link](https://example.com)'],
    ['| a | b |\n| --', '| a | b |\n| --- | --- |\n| 1 | 2 |'],
  ])('converges from an unfinished token chunk', (partial, completed) => {
    const stream = new CherryStream({ value: '' });
    stream.setMarkdown(partial);
    expect(stream.getMarkdown()).toBe(partial);
    stream.setMarkdown(completed);
    expect(stream.getMarkdown()).toBe(completed);
    expect(stream.engine.makeHtml(completed)).not.toContain('undefined');
  });

  it('converges the mounted preview and removes its DOM on destroy', () => {
    const mount = document.createElement('div');
    const stream = new CherryStream({ el: mount, value: '' });
    const chunks = ['# T', '# Title\n\n**bo', '# Title\n\n**bold**'];

    chunks.forEach((chunk) => stream.setMarkdown(chunk));
    expect(stream.getMarkdown()).toBe(chunks.at(-1));
    expect(stream.getHtml()).toContain('<strong>bold</strong>');
    expect(stream.getToc()).toHaveLength(1);

    stream.refreshPreviewer();
    expect(stream.getHtml()).toContain('Title');
    stream.destroy();
    expect(mount.children).toHaveLength(0);
  });
});
