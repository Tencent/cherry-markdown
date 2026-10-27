import { MOBILE_PARITY_MARKDOWN } from '../../fixtures/mobile-parity';
import {cherryThemes} from 'cherry-markdown/theme';
declare function Page(options: object): void;
Page({
  data: { markdown: MOBILE_PARITY_MARKDOWN, theme: 'default', background: cherryThemes.default['--base-previewer-bg'] },
  onLoad(this: {setData(data: {theme: string; background: string}): void}, query: {theme?: string}) {
    const theme = query.theme === 'dark' ? 'dark' : 'default';
    this.setData({theme, background: cherryThemes[theme]['--base-previewer-bg']});
  },
});
