import './sass/index.scss';
import Cherry from './index.js';
import MilkdownWysiwygPlugin from './addons/cherry-wysiwyg-milkdown-plugin.js';
import { Crepe } from '@milkdown/crepe';
import { replaceAll } from '@milkdown/kit/utils';
import { createWysiwygCommandMap } from './wysiwyg/commandMap.js';
import { getAllCustomMarkPlugins } from './wysiwyg/marks/index.js';
import { getAllCustomNodePlugins } from './wysiwyg/nodes/index.js';
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';
import '@examples/assets/scripts/pinyin/pinyin_dist.js';

Cherry.usePlugin(MilkdownWysiwygPlugin, {
  Crepe,
  replaceAll,
  commandMap: createWysiwygCommandMap(),
  customPlugins: [...getAllCustomMarkPlugins(), ...getAllCustomNodePlugins()],
});

window.Cherry = Cherry;

import indexMd from '@examples/assets/markdown/index.md?raw';
import imgMd from '@examples/assets/markdown/img.md?raw';
import tableMd from '@examples/assets/markdown/table.md?raw';
import headAutoNumMd from '@examples/assets/markdown/head-auto-num.md?raw';

import { basicConfig } from '@examples/assets/scripts/index-demo.js';
import { h5Config } from '@examples/assets/scripts/h5-demo.js';
import { multipleCherryConfig1, multipleCherryConfig2 } from '@examples/assets/scripts/multiple-demo.js';
import { noToolbarConfig } from '@examples/assets/scripts/notoolbar-demo.js';
import { previewConfig } from '@examples/assets/scripts/preview-demo.js';
import { imgConfig } from '@examples/assets/scripts/img-demo.js';
import { aiChatScenario } from '@examples/assets/scripts/ai-chat-demo.js';

const devCompatibleConfig = {
  // Fix drawio iframe URL for Vite dev server (examples/ served via middleware)
  drawioIframeUrl: '/examples/drawio_demo.html',
  callback: {
    urlProcessor: (url, type) => {
      console.log('urlProcessor', url, type);
      if (type !== 'image') return url;

      if (/^(https?:)?\/\//i.test(url) || /^data:/i.test(url) || url.startsWith('/')) {
        return url;
      }

      console.log('加载本地图片', '/@fs/' + __EXAMPLES_PATH__ + '/' + url);
      return '/@fs/' + __EXAMPLES_PATH__ + '/' + url;
    },
  },
};

let CONFIG = {};

const currentPath = window.__ORIGINAL_PATH__ || window.location.pathname;

switch (currentPath) {
  case '/':
    basicConfig.callback.urlProcessor = devCompatibleConfig.callback.urlProcessor;
    basicConfig.drawioIframeUrl = devCompatibleConfig.drawioIframeUrl;
    CONFIG = Object.assign({}, basicConfig, { value: indexMd });
    break;
  case '/h5.html':
    h5Config.callback.urlProcessor = devCompatibleConfig.callback.urlProcessor;
    CONFIG = Object.assign({}, h5Config, { value: indexMd });
    break;
  case '/multiple.html':
    multipleCherryConfig1.callback.urlProcessor = devCompatibleConfig.callback.urlProcessor;
    CONFIG = Object.assign({}, multipleCherryConfig1, { value: indexMd });

    const CONFIG2 = Object.assign({}, multipleCherryConfig2, { value: indexMd, ...devCompatibleConfig });
    window.cherry = new Cherry(CONFIG2);
    break;
  case '/notoolbar.html':
    noToolbarConfig.callback.urlProcessor = devCompatibleConfig.callback.urlProcessor;
    CONFIG = Object.assign({}, noToolbarConfig, { value: indexMd });
    break;
  case '/preview_only.html':
    previewConfig.callback.urlProcessor = devCompatibleConfig.callback.urlProcessor;
    CONFIG = Object.assign({}, previewConfig, { value: indexMd });
    break;
  case '/xss.html':
    CONFIG = {
      id: 'markdown',
      engine: {
        global: {
          htmlWhiteList: 'iframe|script|style',
        },
      },
      value: indexMd,
    };
    break;
  case '/img.html':
    imgConfig.callback.urlProcessor = devCompatibleConfig.callback.urlProcessor;
    CONFIG = Object.assign({}, imgConfig, { value: imgMd });
    break;
  case '/table.html':
    CONFIG = {
      id: 'markdown',
      toolbars: {
        toolbar: ['bold', 'italic', 'strikethrough', '|', 'header', 'list', 'graph'],
      },
      editor: {
        height: '70%',
      },
      value: tableMd,
    };
    break;
  case '/head_num.html':
    CONFIG = {
      id: 'markdown',
      engine: {
        syntax: {
          header: {
            anchorStyle: 'autonumber',
          },
          toc: {
            showAutoNumber: true,
          },
        },
      },
      toolbars: {
        showAutoNumber: true,
      },
      value: headAutoNumMd,
    };
    break;
  case '/ai_chat.html':
    document.addEventListener('DOMContentLoaded', function () {
      aiChatScenario(devCompatibleConfig);
    });
    break;
  case '/vim.html':
    break;
  case '/mermaid.html':
    break;
  default:
    CONFIG = Object.assign({}, basicConfig, { value: indexMd });
}

if (window.location.pathname !== '/ai_chat.html') {
  window.cherry = new Cherry(CONFIG);
}
