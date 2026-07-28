import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import PlantUMLCodeEngine from '../../src/addons/cherry-code-block-plantuml-plugin';
import CherryEngine from '../../src/index.engine.core';

interface PlantOptions {
  engine: {
    syntax: {
      plantuml?: { baseUrl: string };
      codeBlock?: { customRenderer: { plantuml: PlantUMLCodeEngine } };
    };
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('addons/PlantUMLCodeEngine', () => {
  it('installs a renderer while honoring syntax-level options', () => {
    const options: PlantOptions = {
      engine: {
        syntax: {
          plantuml: { baseUrl: 'https://syntax.example.com/plantuml' },
        },
      },
    };

    PlantUMLCodeEngine.install(options, { baseUrl: 'https://argument.example.com/plantuml' });

    const renderer = options.engine.syntax.codeBlock?.customRenderer.plantuml;
    if (!renderer) {
      throw new Error('PlantUML renderer was not installed');
    }
    expect(renderer).toBeInstanceOf(PlantUMLCodeEngine);
    expect(renderer.baseUrl).toBe('https://syntax.example.com/plantuml');
  });

  it('uses install arguments when syntax-level options are absent', () => {
    const options: PlantOptions = { engine: { syntax: {} } };

    PlantUMLCodeEngine.install(options, { baseUrl: 'https://argument.example.com/plantuml' });

    expect(options.engine.syntax.codeBlock?.customRenderer.plantuml.baseUrl).toBe(
      'https://argument.example.com/plantuml',
    );
  });

  it('renders deterministic PlantUML server image URLs', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const renderer = new PlantUMLCodeEngine({ baseUrl: 'https://plantuml.example.com' });
    const source = '@startuml\nAlice -> Bob: Hello\n@enduml';

    const html = renderer.render(source, 'diagram');
    const repeated = renderer.render(source, 'diagram');

    expect(html).toBe(repeated);
    expect(html).toMatch(
      /^<img id="plantuml-diagram-\d+" src="https:\/\/plantuml\.example\.com\/svg\/[0-9A-Za-z_-]+" \/>$/,
    );
  });

  it('supports default IDs, short inputs, and Unicode diagrams', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.12345678);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const renderer = new PlantUMLCodeEngine();

    expect(renderer.render('a', '')).toContain('id="plantuml-12345678-');
    expect(renderer.render('ab', 'short')).toContain('http://www.plantuml.com/plantuml/svg/');
    expect(renderer.render('@startuml\n用户 -> 系统: 登录\n@enduml', 'unicode')).toMatch(
      /src="http:\/\/www\.plantuml\.com\/plantuml\/svg\//,
    );
  });

  it('renders a fenced PlantUML block through CherryEngine', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const options: PlantOptions = {
      engine: {
        syntax: {
          plantuml: { baseUrl: 'https://plantuml.example.com/server' },
        },
      },
    };
    PlantUMLCodeEngine.install(options, {});
    const engine = new CherryEngine(options);
    const container = document.createElement('div');
    // @ts-expect-error CherryEngine's compatibility constructor returns an Engine instance.
    container.innerHTML = engine.makeHtml('```plantuml\n@startuml\nAlice -> Bob: Hello\n@enduml\n```');
    const wrapper = container.querySelector('[data-type="plantuml"]');
    const image = wrapper?.querySelector('img');

    expect(wrapper).not.toBeNull();
    expect(wrapper?.querySelector('pre')).toBeNull();
    expect(image?.id).toMatch(/^plantuml-[0-9a-f]+-1767225600000$/);
    expect(image?.getAttribute('src')).toMatch(/^https:\/\/plantuml\.example\.com\/server\/svg\/[0-9A-Za-z_-]+$/);
  });
});
