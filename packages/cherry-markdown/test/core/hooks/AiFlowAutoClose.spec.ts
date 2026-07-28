import { describe, expect, it } from 'vitest';
import AiFlowAutoClose from '../../../src/core/hooks/AiFlowAutoClose';

type MediaType = 'img' | 'video' | 'audio';

interface AutoCloseOptions {
  emphasis?: boolean;
  image?: boolean;
  link?: boolean;
  flowSessionContext?: boolean;
  selfClosingRender?: (type: MediaType, content: string, url: string) => string;
}

function createAutoClose({
  emphasis = false,
  image = false,
  link = false,
  flowSessionContext = false,
  selfClosingRender,
}: AutoCloseOptions = {}) {
  const cherry = {
    options: {
      engine: {
        global: { flowSessionContext },
        syntax: {
          fontEmphasis: { selfClosing: emphasis },
          image: { selfClosing: image, selfClosingRender },
          link: { selfClosing: link },
        },
      },
    },
  };
  return new AiFlowAutoClose({ config: {}, cherry });
}

describe('core/hooks/AiFlowAutoClose', () => {
  it('leaves emphasis, media, and links unchanged when self-closing is disabled', () => {
    const hook = createAutoClose();

    expect(hook.$dealEmphasis('*unfinished')).toBe('*unfinished');
    expect(hook.dealMedia('![unfinished')).toBe('![unfinished');
    expect(hook.dealLink('[unfinished')).toBe('[unfinished');
  });

  it.each([
    ['*italic', '*italic*'],
    ['**strong', '**strong**'],
    ['***both', '***both***'],
    ['prefix *italic', 'prefix *italic*'],
    ['first line\n**second line', 'first line\n**second line**'],
  ])('closes unfinished emphasis in %s', (markdown, expected) => {
    const hook = createAutoClose({ emphasis: true });

    expect(hook.$dealEmphasis(markdown)).toBe(expected);
  });

  it('removes a trailing unmatched marker and preserves balanced emphasis', () => {
    const hook = createAutoClose({ emphasis: true });

    expect(hook.$dealEmphasis('text*')).toBe('text');
    expect(hook.$dealEmphasis('*closed*')).toBe('*closed*');
    expect(hook.$dealEmphasis('plain text')).toBe('plain text');
  });

  it('closes the innermost marker when two different emphasis markers are unfinished', () => {
    const hook = createAutoClose({ emphasis: true });

    expect(hook.$dealEmphasis('**strong *italic')).toBe('**strong *italic*');
  });

  it('does not treat an asterisk list marker as emphasis', () => {
    const hook = createAutoClose({ emphasis: true });

    expect(hook.$dealEmphasis('* list item')).toBe('* list item');
    expect(hook.$dealEmphasis('before\n* list item')).toBe('before\n* list item');
  });

  it('protects inline and block formula asterisks while closing surrounding emphasis', () => {
    const hook = createAutoClose({ emphasis: true });

    expect(hook.$dealEmphasis('formula ~Dx*y~D')).toBe('formula ~Dx*y~D');
    expect(hook.$dealEmphasis('formula ~D~Dx*y~D~D')).toBe('formula ~D~Dx*y~D~D');
    expect(hook.$dealEmphasis('*formula ~Dx*y~D')).toBe('*formula ~Dx*y~D*');
  });

  it.each([
    ['![alt text', '<img src></img>'],
    ['prefix ![alt text]', 'prefix <img src></img>'],
    ['!video[clip](https://video.example/file', '<video src></video>'],
    ['!audio[song](https://audio.example/file', '<audio src></audio>'],
  ])('renders an incomplete media placeholder for %s', (markdown, expected) => {
    const hook = createAutoClose({ image: true });

    expect(hook.dealMedia(markdown)).toBe(expected);
  });

  it('does not replace complete media or media-like text in the middle of a line', () => {
    const hook = createAutoClose({ image: true });

    expect(hook.dealMedia('![alt](image.png)')).toBe('![alt](image.png)');
    expect(hook.dealMedia('![alt] trailing')).toBe('![alt] trailing');
  });

  it.each([
    ['[label', '<a href="">label</a>'],
    ['prefix [label]', 'prefix <a href="">label</a>'],
    ['[label](https://example.com/path', '<a href="https://example.com/path">label</a>'],
  ])('closes an unfinished link in %s', (markdown, expected) => {
    const hook = createAutoClose({ link: true });

    expect(hook.dealLink(markdown)).toBe(expected);
  });

  it('does not replace complete links or bracket text followed by content', () => {
    const hook = createAutoClose({ link: true });

    expect(hook.dealLink('[label](https://example.com)')).toBe('[label](https://example.com)');
    expect(hook.dealLink('[label] trailing')).toBe('[label] trailing');
  });

  it('enables every self-closing rule in flow-session context', () => {
    const hook = createAutoClose({ flowSessionContext: true });

    expect(hook.$dealEmphasis('**stream')).toBe('**stream**');
    expect(hook.dealMedia('![image')).toBe('<img src></img>');
    expect(hook.dealLink('[link')).toBe('<a href="">link</a>');
  });

  it('moves the virtual cursor after completed syntax and preserves a trailing newline', () => {
    const hook = createAutoClose({ flowSessionContext: true });

    expect(hook.makeHtml('**streamCHERRYFLOWSESSIONCURSOR')).toBe('**stream**CHERRYFLOWSESSIONCURSOR');
    expect(hook.makeHtml('**closedCHERRYFLOWSESSIONCURSOR**')).toBe('**closed**CHERRYFLOWSESSIONCURSOR');
    expect(hook.makeHtml('[linkCHERRYFLOWSESSIONCURSOR\n')).toBe('<a href="">link</a>CHERRYFLOWSESSIONCURSOR\n');
  });

  it('keeps ordinary input stable when no cursor or unfinished syntax exists', () => {
    const hook = createAutoClose({ flowSessionContext: true });

    expect(hook.makeHtml('plain text')).toBe('plain text');
    expect(hook.makeHtml('plain text\n')).toBe('plain text\n');
  });
});
