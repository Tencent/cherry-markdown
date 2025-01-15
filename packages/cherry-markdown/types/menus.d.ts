export type MenuIconType = 'svg' | 'iconfont' | 'image' | 'element';

export interface CustomMenuIcon {
  type: MenuIconType;
  /**
   * 如果 type 为 'svg'，则该属性为 svg 文件内容
   * 如果 type 为 'iconfont'，则该属性为 iconfont 类名（请确保已引入字体）
   * 如果 type 为 'image'，则该属性为img元素的src属性
   */
  content: string;
  /**
   * 除了 iconfont 外，其他类型可以设置该属性来改变图标的内联样式
   */
  iconStyle?: string;
  /** 设置class属性 */
  iconClassName?: string;
}

export type IconElement<T extends HTMLElement = HTMLElement> = T;

export interface CustomMenuConfig {
  name: string;
  icon: string | CustomMenuIcon | IconElement;
}
