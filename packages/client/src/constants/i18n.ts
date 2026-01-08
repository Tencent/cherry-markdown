/**
 * 国际化消息常量
 * 集中管理所有用户可见的文案，便于后续多语言支持
 */

export const MESSAGES = {
  // 文件操作
  FILE: {
    OPEN_FAILED: '打开文件失败',
    SAVE_SUCCESS: '文件已保存',
    SAVE_FAILED: '保存文件失败',
    SAVE_AS_SUCCESS: '文件已另存为',
    SAVE_AS_FAILED: '另存为失败',
    READ_FAILED: '读取文件失败',
    CREATE_FAILED: '创建新文件失败',
    USER_CANCELLED: '用户取消操作',
    USER_CANCELLED_SAVE: '用户取消保存',
    USER_CANCELLED_SELECT: '用户取消选择文件',
    RESTORE_SUCCESS: '成功恢复上次打开的文件',
    RESTORE_FAILED: '恢复上次打开的文件失败',
  },

  // 目录操作
  DIRECTORY: {
    OPEN_FAILED: '打开目录失败',
    LOAD_FAILED: '加载目录结构失败',
    GET_LIST_FAILED: '获取目录列表失败',
  },

  // 剪贴板
  CLIPBOARD: {
    COPY_PATH_SUCCESS: '文件路径已复制到剪贴板',
    COPY_PATH_FAILED: '复制文件路径失败',
    COPY_PATH_FALLBACK: '无法打开，已复制文件路径到剪贴板',
  },

  // 文件管理
  FILE_MANAGEMENT: {
    REMOVE_SUCCESS: '文件已从最近列表中移除',
    REMOVE_FAILED: '移除文件失败',
  },

  // 资源管理器
  EXPLORER: {
    OPEN_FAILED: '打开资源管理器失败',
  },

  // 快捷键
  SHORTCUT: {
    REGISTER_SAVE_FAILED: '注册保存快捷键失败',
    UNREGISTER_SAVE_FAILED: '注销保存快捷键失败',
  },

  // 状态持久化
  STORAGE: {
    LOAD_EXPAND_STATE_FAILED: '加载目录管理展开状态失败',
    SAVE_EXPAND_STATE_FAILED: '保存目录管理展开状态失败',
    LOAD_FILE_STATE_FAILED: '加载文件状态失败',
    SAVE_FILE_STATE_FAILED: '保存文件状态失败',
  },

  // 未知错误
  UNKNOWN_ERROR: '未知错误',
} as const;

export const DIALOGS = {
  UNSAVED_CHANGES: {
    TITLE: '未保存的更改',
    MESSAGE: '检测到未保存的更改，您要如何处理？',
    SAVE_AND_CONTINUE: '保存并继续',
    DISCARD: '放弃更改',
    CANCEL: '取消',
    // 简单模式（confirm）的提示
    SIMPLE_CONFIRM: '检测到未保存的更改，继续操作将丢失未保存内容，是否继续？',
  },
  CANCELLED_UNSAVED: '已取消：存在未保存的更改',
} as const;

export type MessageKey = keyof typeof MESSAGES;
export type DialogKey = keyof typeof DIALOGS;
