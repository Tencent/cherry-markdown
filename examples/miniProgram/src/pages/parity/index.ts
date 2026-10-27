import { MOBILE_PARITY_MARKDOWN } from '../../fixtures/mobile-parity';
import { MOBILE_INTERACTION_MARKDOWN } from '../../fixtures/mobile-interactions';
import { cherryThemes } from 'cherry-markdown/theme';
declare function Page(options: object): void;
Page({
  data: { markdown: MOBILE_PARITY_MARKDOWN, theme: 'default', background: cherryThemes.default['--base-previewer-bg'] },
  onLoad(
    this: { setData(data: { theme: string; background: string; markdown: string }): void },
    query: { theme?: string; interactive?: string },
  ) {
    const theme = query.theme === 'dark' ? 'dark' : 'default';
    this.setData({
      theme,
      background: cherryThemes[theme]['--base-previewer-bg'],
      markdown: query.interactive === '1' ? MOBILE_INTERACTION_MARKDOWN : MOBILE_PARITY_MARKDOWN,
    });
  },
});
