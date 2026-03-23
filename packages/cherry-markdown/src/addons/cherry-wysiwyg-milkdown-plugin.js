import mergeWith from 'lodash/mergeWith';

/**
 * Milkdown WYSIWYG 插件
 * 通过 Cherry.usePlugin(MilkdownWysiwygPlugin, { Crepe }) 注册
 * 将 Milkdown Crepe 编辑器集成到 Cherry Markdown 中，提供所见即所得编辑模式
 */
export default class MilkdownWysiwygPlugin {
  /**
   * @param {object} cherryOptions Cherry 默认配置
   * @param {object} options 插件选项
   * @param {import('@milkdown/crepe').Crepe} options.Crepe Milkdown Crepe 类引用
   * @param {Function} options.replaceAll Milkdown replaceAll 宏（来自 @milkdown/kit/utils）
   * @param {object} [options.commandMap] Milkdown 命令映射表（来自 createWysiwygCommandMap()）
   * @param {object} [options.crepeOptions] 传递给 Crepe 构造函数的额外选项
   */
  static install(cherryOptions, options = {}) {
    // commandMap 和 customPlugins 包含 Milkdown Slice 对象，不能被 lodash mergeWith 深度遍历，需要直接赋值
    const commandMap = options.commandMap || null;
    const customPlugins = options.customPlugins || null;
    mergeWith(cherryOptions, {
      wysiwyg: {
        enabled: true,
        Crepe: options.Crepe,
        replaceAll: options.replaceAll,
        crepeOptions: options.crepeOptions || {},
      },
    });
    cherryOptions.wysiwyg.commandMap = commandMap;
    cherryOptions.wysiwyg.customPlugins = customPlugins;
  }
}
