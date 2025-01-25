module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // 新功能
        'fix', // 修复bug
        'docs', // 文档更新
        'style', // 代码格式（不影响功能）
        'refactor', // 代码重构
        'perf', // 性能优化
        'test', // 添加或修改测试
        'chore', // 构建过程或辅助工具的变动(用于描述不直接影响源代码或测试的维护性任务)
        'ci', // 持续集成相关
        'build', // 构建相关(专门用于与构建系统和构建过程相关的更改)
        'revert', // 回退某个提交
        'release', // 发布版本
        'WIP', // 工作进行中(暂未完成,不应该合并)
        // 待补充
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'core', // cherry-markdown 项目
        'client', // 客户端部分
        'vscodePlugin', // VSCode 插件
        'global', // Monorepo 结构(可省略)
        'scripts', // 脚本
        // 待补充
      ],
    ],
  },
};
