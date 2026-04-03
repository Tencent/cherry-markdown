---
'cherry-markdown': patch
---

- chore: 升级 TypeScript 至 v6.0.2，升级 Mermaid 可选依赖至 ^11.14.0
  - TypeScript: 4.7.2 → 6.0.2（构建工具升级，对用户无影响）
    - 全项目统一 TS 版本，新增 tsconfig.base.json 公共配置
    - 移除 @types/d3-dispatch（TS6 原生支持新语法）
    - 适配 TS6 兼容性：ignoreDeprecations、rootDir、strict 模式优化
    - 修复 logLevel 类型、clearTimeout 类型、process/env、closest polyfill 等 TS 错误
  - Mermaid（optionalDependencies）: ^11.x → ^11.14.0
    - Mermaid 是图表渲染可选依赖，用户按需安装即可使用流程图/时序图等代码块功能
    - 兼容 v9/v10/v11 多版本 API，自动检测运行环境选择渲染方式
