# Change Log

## 0.1.2

### Patch Changes

- style: 优化代码块工具栏的定位逻辑，从px改成em [@sunsonliu](https://github.com/sunsonliu)([#1459](https://github.com/Tencent/cherry-markdown/pull/1459))([`3bf6f5d`](https://github.com/Tencent/cherry-markdown/commit/3bf6f5da80336a023b470817e17559d609353e0f))
- feat: #1443 在目录里特殊标记被引用的标题 [@sunsonliu](https://github.com/sunsonliu)([#1472](https://github.com/Tencent/cherry-markdown/pull/1472))([`b32783e`](https://github.com/Tencent/cherry-markdown/commit/b32783e6e142168ee776d760629096368b2ce192))
- feat: #1202 增加代码块外层容器自定义能力 [@sunsonliu](https://github.com/sunsonliu)([#1473](https://github.com/Tencent/cherry-markdown/pull/1473))([`92d029d`](https://github.com/Tencent/cherry-markdown/commit/92d029d33ba3e7039c0c3b0a8b074343946c7f52))
- fix: #1461 #1453 精简流式渲染场景的dom结构，并优化流式渲染场景mermaid的渲染失败时的处理逻辑

#### 在流式输出模式下(`global.flowSessionContext=true`)

1. 当只有一个 mermaid 渲染的时候，如果在编辑过程中出现 mermaid 渲染错误，他会保持渲染上次渲染成功 mermaid svg。
2. 当有多个 mermaid 渲染的时候，当在第一次渲染的时候，如果后面的 mermaid 渲染错误，他会往上寻找直到寻找渲染成功的 mermaid svg 进行替换当前渲染错误的 mermaid。

#### 在流式输出模式下(`global.flowSessionContext=true`) && 没有开启预览区编辑(`enablePreviewerBubble=false`)

1. 并且没有开启预览区编辑，则需要移除不再需要的dom ,这里针对流式输出的场景简单移除dom，是符合预期的，但这种精简 dom 的方案在需要 switchModel 时会有问题。 [@sunsonliu](https://github.com/sunsonliu)([#1463](https://github.com/Tencent/cherry-markdown/pull/1463))([`c1c306b`](https://github.com/Tencent/cherry-markdown/commit/c1c306b4eed2b5dce14ffc10eee2ae8e3c001bf8))

- Updated dependencies [[`513eeb0`](https://github.com/Tencent/cherry-markdown/commit/513eeb04ec4d8da39148dbed15a3b1421891b6c0), [`6c4bb89`](https://github.com/Tencent/cherry-markdown/commit/6c4bb89a71b1386c3b165def51782cc85b383507), [`5909dcd`](https://github.com/Tencent/cherry-markdown/commit/5909dcd7084857f8c3105651fafc65438f26b5d9), [`630adc7`](https://github.com/Tencent/cherry-markdown/commit/630adc70b6a49a00c43697f4364a975a78604671), [`69e9a9b`](https://github.com/Tencent/cherry-markdown/commit/69e9a9b144b0def931448aabd0f2a39485e30cb8), [`3bf6f5d`](https://github.com/Tencent/cherry-markdown/commit/3bf6f5da80336a023b470817e17559d609353e0f), [`057fd27`](https://github.com/Tencent/cherry-markdown/commit/057fd27b0e495a85a57ccbc367b8c2b1364e96b1), [`c86824f`](https://github.com/Tencent/cherry-markdown/commit/c86824f5332be49c0d5b1d285ef82c21c65154fe), [`64a3278`](https://github.com/Tencent/cherry-markdown/commit/64a3278ee324bb30576bfaab53832640a4d5694b), [`c1c290f`](https://github.com/Tencent/cherry-markdown/commit/c1c290fbe159e4b2d2c0cd703b4f13e67ab6bb6c), [`d4dc15b`](https://github.com/Tencent/cherry-markdown/commit/d4dc15b627d84cadf5394dc7c797b1812d3e8e2d), [`04f5e62`](https://github.com/Tencent/cherry-markdown/commit/04f5e62958f35d5c3a1787e804a8598d6742aece), [`ba30ff5`](https://github.com/Tencent/cherry-markdown/commit/ba30ff5bb6bd44d22f0cbcc0a7db63dee9c4d385), [`9bee29a`](https://github.com/Tencent/cherry-markdown/commit/9bee29a1b9b3c2b4d34e7e08ccacfe63be4e4bfa), [`24971b5`](https://github.com/Tencent/cherry-markdown/commit/24971b5e7ca07d17138b8496fda90cf816426395), [`4c32ac7`](https://github.com/Tencent/cherry-markdown/commit/4c32ac74e6e6de754f849f2e256be8354e56da33), [`172c702`](https://github.com/Tencent/cherry-markdown/commit/172c7020ce69a6e2a3da02b26f72ae8515a68e9e), [`a067f37`](https://github.com/Tencent/cherry-markdown/commit/a067f3792a08c4cfd871a8733f592f4b66d23640), [`ffe38b8`](https://github.com/Tencent/cherry-markdown/commit/ffe38b8f1fc5f73f424b850c189f1fbc35c9abee), [`af30d00`](https://github.com/Tencent/cherry-markdown/commit/af30d00776a75b59ffac62881a68fe63ff8c43b0), [`92ebbc6`](https://github.com/Tencent/cherry-markdown/commit/92ebbc6f1ad42d8a5c86dc7d5796f27b9d160710), [`136f455`](https://github.com/Tencent/cherry-markdown/commit/136f455da75df1b79c7ff44fa71a21fbcf6da19a), [`d3140e2`](https://github.com/Tencent/cherry-markdown/commit/d3140e2fa4837f7100d93e4d0e81fd860c5a0882), [`b32783e`](https://github.com/Tencent/cherry-markdown/commit/b32783e6e142168ee776d760629096368b2ce192), [`8d340ab`](https://github.com/Tencent/cherry-markdown/commit/8d340ab34802e8988dbccb46796ce2645e5e9a30), [`5d0c02a`](https://github.com/Tencent/cherry-markdown/commit/5d0c02a8ddb5d7d944dc24edce2b2b00ccd648ed), [`a93564b`](https://github.com/Tencent/cherry-markdown/commit/a93564b44de8466777bc759c300d60dabc464a91), [`a142b3b`](https://github.com/Tencent/cherry-markdown/commit/a142b3be2ff71e51da78fb9c1c806ca11873e37e), [`594577f`](https://github.com/Tencent/cherry-markdown/commit/594577f5d2a02486f18c39d87e06036cd247254a), [`f9ed1ae`](https://github.com/Tencent/cherry-markdown/commit/f9ed1ae601bf69564c1d0b87e5cbd93ed28bed68), [`0b9b429`](https://github.com/Tencent/cherry-markdown/commit/0b9b4298ee74bdbf6f21756b079d804f6e701712), [`92d029d`](https://github.com/Tencent/cherry-markdown/commit/92d029d33ba3e7039c0c3b0a8b074343946c7f52), [`19534f4`](https://github.com/Tencent/cherry-markdown/commit/19534f4624980ffcc5a9e5c70c48ca3081077b1f), [`3434053`](https://github.com/Tencent/cherry-markdown/commit/34340531bc643dd1affc7e602a4b80f5ee55d2bc), [`c1c306b`](https://github.com/Tencent/cherry-markdown/commit/c1c306b4eed2b5dce14ffc10eee2ae8e3c001bf8), [`dd3d953`](https://github.com/Tencent/cherry-markdown/commit/dd3d953140511db2fe0e7eae1d8fcd069497cd54)]:
  - cherry-markdown@0.10.1

## 0.1.0

### Minor Changes

- feat(theme): set light theme as new default [#1314](https://github.com/Tencent/cherry-markdown/issues/1314)

### 破坏性更改 BREAKING CHANGES

- **移除 `light` 主题**：原有的 `light` 主题已被移除
- **默认主题变更**： `light` 作为新的默认主题
- **主题列表更新**：可用主题列表中不再包含 `light` 选项

### 影响范围 IMPACTS

- 对于原本在配置项 `themeSettings.mainTheme` 中使用 `light` 主题的用户，由于该主题不存在，将会导致主题切换为 `default` 主题，也即是原先的 `light` 主题

### 迁移指南 MIGRATION GUIDE

- 如果您之前使用了 `light` 主题：
  1. 由于 `light` 以不存在，主题会自动切换为 `default` 主题
  2. （可选）你可以选择将配置中的 `mainTheme: 'light'` 更改为 `mainTheme: 'default'`
- 如果您之前自定义配置了 `light` 主题：
  1. 您可以直接把原先 `light.scss` 文件底部的配置项迁移到 `default.scss` 文件中
  2. （可选）你可以选择将配置中的 `mainTheme: 'light'` 更改为 `mainTheme: 'default'`
- 如果您之前自定义配置了 `default` 主题：
  1. 您可以将原先 `default.scss` 文件底部的配置项迁移到新的 `default.scss` 文件中 [@Seeridia](https://github.com/Seeridia)([#1322](https://github.com/Tencent/cherry-markdown/pull/1322))([`8444130`](https://github.com/Tencent/cherry-markdown/commit/84441304159cdb3458c7a89cf872297e316c7cb0))

### Patch Changes

- fix: #1299 增加自定义代码块语言配置 `all` [@sunsonliu](https://github.com/sunsonliu)([#1301](https://github.com/Tencent/cherry-markdown/pull/1301))([`4848b82`](https://github.com/Tencent/cherry-markdown/commit/4848b82f0af5da07ff58fab7b4eb80fa82d2a9d0))
- chore: upgrade `eslint@8.x` and `prettier@3.x` [@RSS1102](https://github.com/RSS1102)([#1274](https://github.com/Tencent/cherry-markdown/pull/1274))([`489180c`](https://github.com/Tencent/cherry-markdown/commit/489180cbafa15cca368efc0a60450fd33b352bdd))
- fix: #1281 表格添加列时，列的对齐方式取左边列（如有）的对齐方式，否则取右侧列的对齐方式 [@sunsonliu](https://github.com/sunsonliu)([#1294](https://github.com/Tencent/cherry-markdown/pull/1294))([`2584eda`](https://github.com/Tencent/cherry-markdown/commit/2584eda7e4749654815774d7da113a594c7495e0))
- fix: #1280 修复选中标题选区被扩大的问题 [@sunsonliu](https://github.com/sunsonliu)([#1296](https://github.com/Tencent/cherry-markdown/pull/1296))([`f4cb828`](https://github.com/Tencent/cherry-markdown/commit/f4cb828dbf60506c36877e40bd9306b107aed7b3))
- docs: #1238 links to invalid Features [@sunsonliu](https://github.com/sunsonliu)([#1239](https://github.com/Tencent/cherry-markdown/pull/1239))([`8593488`](https://github.com/Tencent/cherry-markdown/commit/859348806d1ad2635ed0f4e8551ab5344a745406))
- chore: update license to change Copyright [@sunsonliu](https://github.com/sunsonliu)([#1242](https://github.com/Tencent/cherry-markdown/pull/1242))([`348c4f4`](https://github.com/Tencent/cherry-markdown/commit/348c4f4138ff3d9fe784be693534f38ea99f3ea3))
- Updated dependencies [[`4848b82`](https://github.com/Tencent/cherry-markdown/commit/4848b82f0af5da07ff58fab7b4eb80fa82d2a9d0), [`489180c`](https://github.com/Tencent/cherry-markdown/commit/489180cbafa15cca368efc0a60450fd33b352bdd), [`1fc0b64`](https://github.com/Tencent/cherry-markdown/commit/1fc0b649339795323a72617dc72c198a4d90f92d), [`f928c5e`](https://github.com/Tencent/cherry-markdown/commit/f928c5e2d848d4690f3e6f2912e74a4da35e89cf), [`2584eda`](https://github.com/Tencent/cherry-markdown/commit/2584eda7e4749654815774d7da113a594c7495e0), [`50924e5`](https://github.com/Tencent/cherry-markdown/commit/50924e5c2705608565ad3f2b974a6a51ea855b97), [`9e9dfb5`](https://github.com/Tencent/cherry-markdown/commit/9e9dfb53df4040124f5814c6913af329a9830d69), [`0416a3a`](https://github.com/Tencent/cherry-markdown/commit/0416a3a87798c83cb612c768148f0b6f46668a27), [`3fb95d4`](https://github.com/Tencent/cherry-markdown/commit/3fb95d49790a3adb4eea35f1f9c9d14afd45ee8f), [`240c2a8`](https://github.com/Tencent/cherry-markdown/commit/240c2a83815165be37ddba509199a7af9c5276b1), [`27eb2f7`](https://github.com/Tencent/cherry-markdown/commit/27eb2f7db18e51c5545c08cc4364fe2ad61bea14), [`f418126`](https://github.com/Tencent/cherry-markdown/commit/f4181265e2596cf253d5fb8268f962f350080d01), [`fcd17a5`](https://github.com/Tencent/cherry-markdown/commit/fcd17a58286e1f9da21da4b252c4764856015615), [`556da12`](https://github.com/Tencent/cherry-markdown/commit/556da127e91492ca077b1169da7f5261fe50d36e), [`4df364a`](https://github.com/Tencent/cherry-markdown/commit/4df364a5ad0cff30841f8a52b25d7c886de80e43), [`030960d`](https://github.com/Tencent/cherry-markdown/commit/030960dca8b07658f5bef01b217e8b20195f5c3a), [`50fd3be`](https://github.com/Tencent/cherry-markdown/commit/50fd3be213405414308f87fdd76821d36db59e0a), [`2f8dada`](https://github.com/Tencent/cherry-markdown/commit/2f8dada195789110f7560af0a70c0a1dcd27d64c), [`0474c1a`](https://github.com/Tencent/cherry-markdown/commit/0474c1a8d2d170fd6c69bd55119ade907a73392a), [`c22731c`](https://github.com/Tencent/cherry-markdown/commit/c22731cf21a4805e356bbccd217f4b5ff5b28409), [`ba2c6df`](https://github.com/Tencent/cherry-markdown/commit/ba2c6df0715498b9e2a60a5ea067e0b988f77080), [`f4cb828`](https://github.com/Tencent/cherry-markdown/commit/f4cb828dbf60506c36877e40bd9306b107aed7b3), [`ccd7524`](https://github.com/Tencent/cherry-markdown/commit/ccd7524f1f549c62de86fc54a4d3142dd6e20ccb), [`8444130`](https://github.com/Tencent/cherry-markdown/commit/84441304159cdb3458c7a89cf872297e316c7cb0), [`19fc19b`](https://github.com/Tencent/cherry-markdown/commit/19fc19b9c8cf7095bb6542b901c2465a8ef6405e), [`1273e5e`](https://github.com/Tencent/cherry-markdown/commit/1273e5ea8e8c3d819950f4e84c6929acb0e4b764), [`5039a3e`](https://github.com/Tencent/cherry-markdown/commit/5039a3edc16d143d8dbb53fd63ae88d7b2bacec2), [`015295c`](https://github.com/Tencent/cherry-markdown/commit/015295cfa53ab81f40f0665a6fc65b42fdc5fc4b), [`bc7a046`](https://github.com/Tencent/cherry-markdown/commit/bc7a0469e1cd38257084f356d2434ac3e3b394fb), [`bcb596b`](https://github.com/Tencent/cherry-markdown/commit/bcb596b056cfb8dddb9d5e826d2cd6a1b181973b), [`85c9789`](https://github.com/Tencent/cherry-markdown/commit/85c9789b0ad4af0d0748c5e91199fc00384f7f36), [`3cec9c5`](https://github.com/Tencent/cherry-markdown/commit/3cec9c51cd8ddc09a88b476687866bbed2138be0), [`e688271`](https://github.com/Tencent/cherry-markdown/commit/e688271ddcd9678dcf561407579ed3e1b4629421), [`7f629e8`](https://github.com/Tencent/cherry-markdown/commit/7f629e816d1086ef2be47b1f5aa4734e02a60897), [`dc095ba`](https://github.com/Tencent/cherry-markdown/commit/dc095ba8930cffaf5993794fea61fcf43ad6d956), [`348c4f4`](https://github.com/Tencent/cherry-markdown/commit/348c4f4138ff3d9fe784be693534f38ea99f3ea3), [`0f8fa2e`](https://github.com/Tencent/cherry-markdown/commit/0f8fa2e590b1f4f5a5a6402e2dfd398a0384d379), [`df6b5f0`](https://github.com/Tencent/cherry-markdown/commit/df6b5f097817bff4a0526e32e76a4c368b4899cd), [`7439d42`](https://github.com/Tencent/cherry-markdown/commit/7439d42827c324a51c03ff84f15c4b13e30436f8)]:
  - cherry-markdown@0.10.0

## 0.0.20

### Patch Changes

- ci: declare dev preview, dynamic dev independent version [@RSS1102](https://github.com/RSS1102)([#1142](https://github.com/Tencent/cherry-markdown/pull/1142))([`22f03fb`](https://github.com/Tencent/cherry-markdown/commit/22f03fbe318b00829e1baebd94d7019f7fe5f2e9))
- Updated dependencies [[`d23d141`](https://github.com/Tencent/cherry-markdown/commit/d23d14101114925ef7b2a5f341120ed41c53bc73), [`0f39d6b`](https://github.com/Tencent/cherry-markdown/commit/0f39d6b00217c6f0181d99251f36e2dc9a93982b), [`63982bc`](https://github.com/Tencent/cherry-markdown/commit/63982bce5cb16871f1d7f9103648f1e99d8ab945)]:
  - cherry-markdown@0.9.1

## 0.0.19

### Patch Changes

- feat: add changesets [@RSS1102](https://github.com/RSS1102)([#1036](https://github.com/Tencent/cherry-markdown/pull/1036))([`640a177`](https://github.com/Tencent/cherry-markdown/commit/640a17716fa69fa2ffdb8fe5f684c2db831072b0))
- feat(vscodePlugin): added export preview png [@RSS1102](https://github.com/RSS1102)([#1044](https://github.com/Tencent/cherry-markdown/pull/1044))([`b6ceb25`](https://github.com/Tencent/cherry-markdown/commit/b6ceb255058bd6af705aebc321d82f1062f7fcce))
- ci: beautify release message [@RSS1102](https://github.com/RSS1102)([#1057](https://github.com/Tencent/cherry-markdown/pull/1057))([`f6bbd88`](https://github.com/Tencent/cherry-markdown/commit/f6bbd88a630be70f1a22a3d2e909ad591df290fc))
- ci: 使用 `changeset` 进行发布流程自动化 [@RSS1102](https://github.com/RSS1102)([#1040](https://github.com/Tencent/cherry-markdown/pull/1040))([`a61dde9`](https://github.com/Tencent/cherry-markdown/commit/a61dde968649ea42622f9016e59a75fbccb5d816))
- Updated dependencies [[`63dfbd3`](https://github.com/Tencent/cherry-markdown/commit/63dfbd3c48d9f86b34a7fa52d934433df137dfe2), [`67eb094`](https://github.com/Tencent/cherry-markdown/commit/67eb094a389d8620246db5c116bafc90299d4c9f), [`321c388`](https://github.com/Tencent/cherry-markdown/commit/321c388f0f52f096a2eb8b19238a214925744176), [`eb3e4b4`](https://github.com/Tencent/cherry-markdown/commit/eb3e4b47811cc342d310bd62ee7f9089709b9b61), [`b72fb02`](https://github.com/Tencent/cherry-markdown/commit/b72fb02a4c8fca988d142eedc11798353ce93e46), [`b0fba64`](https://github.com/Tencent/cherry-markdown/commit/b0fba640a1453b7543149ea83bb7adeea6648e5a), [`640a177`](https://github.com/Tencent/cherry-markdown/commit/640a17716fa69fa2ffdb8fe5f684c2db831072b0), [`67778d1`](https://github.com/Tencent/cherry-markdown/commit/67778d1e8b9f5f65c0d99b46fe4f90208204a2ab), [`4c460f1`](https://github.com/Tencent/cherry-markdown/commit/4c460f1e12e410ae322ee0f5cedbbee30f0660a6), [`b2b2f55`](https://github.com/Tencent/cherry-markdown/commit/b2b2f555831328b368af37d9358ca0a7e0d37dd1), [`839da2d`](https://github.com/Tencent/cherry-markdown/commit/839da2dd32deb8b77e32bc69eb9bca1ba8620a9d), [`f6bbd88`](https://github.com/Tencent/cherry-markdown/commit/f6bbd88a630be70f1a22a3d2e909ad591df290fc), [`2a73e28`](https://github.com/Tencent/cherry-markdown/commit/2a73e281f2a76feac999a01411852ee97ca5934a), [`d26c814`](https://github.com/Tencent/cherry-markdown/commit/d26c814cfe9c4644140c5934f8f17eb79250cb81), [`f069564`](https://github.com/Tencent/cherry-markdown/commit/f0695648508352226f4e7a40d39e0766989dfc10), [`e0f7ffe`](https://github.com/Tencent/cherry-markdown/commit/e0f7ffe4a720af580d9808280d27e533cf864a57), [`a61dde9`](https://github.com/Tencent/cherry-markdown/commit/a61dde968649ea42622f9016e59a75fbccb5d816)]:
  - cherry-markdown@0.9.0

All notable changes to the "cherrymarkdown" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

- Initial release
