# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.8.1](https://github.com/Tencent/cherry-markdown/compare/v0.8.0...v0.8.1) (2022-09-06)


### Bug Fixes

* 懒加载逻辑不能幂等 ([a2198cb](https://github.com/Tencent/cherry-markdown/commit/a2198cb9f6b0ecb720be3e2c26a4385e9b49e7d7))

## [0.8.0](https://github.com/Tencent/cherry-markdown/compare/v0.7.9...v0.8.0) (2022-09-01)


### Features

* 实现快捷键显示/隐藏toolbar [#268](https://github.com/Tencent/cherry-markdown/issues/268) ([10cce7d](https://github.com/Tencent/cherry-markdown/commit/10cce7defa5d07420fa5849a970b3ac0bc594a2a))
* 通过快捷键来实现显示|隐藏 toolbar 或 设置按钮子菜单隐藏toolbar [#268](https://github.com/Tencent/cherry-markdown/issues/268) ([8c05a87](https://github.com/Tencent/cherry-markdown/commit/8c05a87a22f78b11ce7a50951e35b5e203123783))
* 优化字体大小按钮的选区，并增加快捷键 ([901db75](https://github.com/Tencent/cherry-markdown/commit/901db75b5e058322f26a66c6163616348af5f421))
* 优化toolbar插入内容时的选区逻辑 ([3b02d07](https://github.com/Tencent/cherry-markdown/commit/3b02d07dca4c562426787e77206397a073550d88))


### Bug Fixes

* [#301](https://github.com/Tencent/cherry-markdown/issues/301) ([#302](https://github.com/Tencent/cherry-markdown/issues/302)) ([f8bae8b](https://github.com/Tencent/cherry-markdown/commit/f8bae8bdb5fa5c981ee280f81e487f5de2a81ac0))
* 暗黑模式下调色盘文字看不清楚 ([fef4aba](https://github.com/Tencent/cherry-markdown/commit/fef4aba6c54cb6dfb95d53a75f2b4e4f636810fb))
* 无法使用Ctrl+Shift组合键 [#290](https://github.com/Tencent/cherry-markdown/issues/290) ([e07e9ac](https://github.com/Tencent/cherry-markdown/commit/e07e9acb0648333b292f97bde9ccc1afbd5b8679))
* Cannot read properties of undefined (reading 'createBtn') [#303](https://github.com/Tencent/cherry-markdown/issues/303) ([#304](https://github.com/Tencent/cherry-markdown/issues/304)) ([1fc3689](https://github.com/Tencent/cherry-markdown/commit/1fc3689c8ef9b95fb16ec8ef216deb9a462d6d3f))
* lint err Expected '!==' and instead saw '!=' ([90a410b](https://github.com/Tencent/cherry-markdown/commit/90a410bef5810b1814d3728d02652d0dc945c7a9))

### [0.7.9](https://github.com/Tencent/cherry-markdown/compare/v0.7.8...v0.7.9) (2022-08-12)


### Bug Fixes

* **imageLazyLoad:** 修复懒加载开关配置 ([01543f8](https://github.com/Tencent/cherry-markdown/commit/01543f8b51cdb217694efd6f7d0386e8f37add4c))


### Css or Code Change

* remove ambiguous css reset ([e159254](https://github.com/Tencent/cherry-markdown/commit/e159254333f4923f450ae36499d8024931b1e7b8))

### [0.7.8](https://github.com/Tencent/cherry-markdown/compare/v0.7.7...v0.7.8) (2022-08-04)


### Bug Fixes

* install husky when dev only ([#289](https://github.com/Tencent/cherry-markdown/issues/289)) ([51d864c](https://github.com/Tencent/cherry-markdown/commit/51d864cda43df0b41f371eef6868f37432035ac1))

### [0.7.7](https://github.com/Tencent/cherry-markdown/compare/v0.7.6...v0.7.7) (2022-08-04)


### Features

* add ruby syntax ([710d65b](https://github.com/Tencent/cherry-markdown/commit/710d65b5f280df2aa67b3d4def8b8bcc920d2672))
* **eslint:** setup husky and lint-staged ([487ec2d](https://github.com/Tencent/cherry-markdown/commit/487ec2d9e0bf2e7eed6b077a8d66b6f51ba92986))
* support data-cm-atomic for dom plugins ([01d51a3](https://github.com/Tencent/cherry-markdown/commit/01d51a30b0c0172283835712267d53a3b4168a90))
* update sidebar style ([70d5260](https://github.com/Tencent/cherry-markdown/commit/70d5260d508d9d73ba76c863cbd879f086dd1f19))
* 增加ruby语法（拼音语法）的toolbar和demo ([297ef97](https://github.com/Tencent/cherry-markdown/commit/297ef978c036812a31cb54fa33e68933cc1ba638))
* 增加新的图片懒加载机制 ([735b9cc](https://github.com/Tencent/cherry-markdown/commit/735b9cccbf4e453c3ccd06ecdefb68f7d03bb2ed))


### Bug Fixes

* vdom的style写法有误导致每次都会重建元素 ([3ba6f36](https://github.com/Tencent/cherry-markdown/commit/3ba6f36071fe2cf93a0c2c17030a9ea9041e7726))
* 编辑时更新预览时，DOM若存在相邻的 TextNode 会导致文字渲染两次 ([4256eb4](https://github.com/Tencent/cherry-markdown/commit/4256eb484a50b5e312acc7579e20c1648c1eadfa))

### [0.7.6](https://github.com/Tencent/cherry-markdown/compare/v0.7.5...v0.7.6) (2022-07-11)


### Features

* 代码块增加复制功能 ([ac48904](https://github.com/Tencent/cherry-markdown/commit/ac48904fbd0fef929b39f40a93b1c610bef65adf)), closes [#239](https://github.com/Tencent/cherry-markdown/issues/239)
* 代码块增加复制功能 ([856b5fd](https://github.com/Tencent/cherry-markdown/commit/856b5fd0346cff0bbb124659b78737fcd0f67927)), closes [#239](https://github.com/Tencent/cherry-markdown/issues/239)
* 代码块增加复制功能 更换复制到剪贴板的方法 ([ac38a7f](https://github.com/Tencent/cherry-markdown/commit/ac38a7f7a59de360aceefb07fe43f47185a219cb))
* 代码块增加复制功能 更换复制到剪贴板的方法 ([0b28b05](https://github.com/Tencent/cherry-markdown/commit/0b28b05a7f54f6e15b784669e33dc4718d95be41))
* 没有选中文字的时候点击工具栏会自动选中光标附近的文字或行 ([61ed011](https://github.com/Tencent/cherry-markdown/commit/61ed01140f3ea78f402e2adb96cc28e416fe2eeb)), closes [#261](https://github.com/Tencent/cherry-markdown/issues/261)
* 增加图片样式（边框、阴影、圆角） ([01775bd](https://github.com/Tencent/cherry-markdown/commit/01775bdd902932a3f148ca6b68d3144070f9722b)), closes [#264](https://github.com/Tencent/cherry-markdown/issues/264)
* border support for image ([6df8fdc](https://github.com/Tencent/cherry-markdown/commit/6df8fdc80ac7924a36a4b0cac4ff7c8daf507a45))


### Bug Fixes

* 修复可能的报错 ([43e4e90](https://github.com/Tencent/cherry-markdown/commit/43e4e901e35299f98f99089dbe47c300b0351547))
* Link hook对url进行排他处理 ([767bc80](https://github.com/Tencent/cherry-markdown/commit/767bc803255df047d211d0710586c570af52ae13))

### [0.7.5](https://github.com/Tencent/cherry-markdown/compare/v0.7.4...v0.7.5) (2022-07-01)


### Features

* 把二级菜单里的toolbar开放出来([#199](https://github.com/Tencent/cherry-markdown/issues/199)） ([95a3e09](https://github.com/Tencent/cherry-markdown/commit/95a3e09b36dee371067e9ab89298f0cd47a464cd))
* 暴露预览区域图片点击事件的回调 ([34725a8](https://github.com/Tencent/cherry-markdown/commit/34725a868261615d226812c66461cbf33961521c))
* 暴露预览区域图片点击事件的回调 ([203ff13](https://github.com/Tencent/cherry-markdown/commit/203ff13422bdcec2ccfb925107dc83dadc5767f7))
* **emphasis:** add chinese punctuations as word's boundary ([6d8a769](https://github.com/Tencent/cherry-markdown/commit/6d8a769e45e08b8a43cc11b8b282afacd0cad834))
* support configure plantuml args ([ec97968](https://github.com/Tencent/cherry-markdown/commit/ec979681edb134ac84c31c6ec6c9705700fbb64d))


### Code Refactoring

* **build/addons:** use rollup to generate addon bundles ([86a5705](https://github.com/Tencent/cherry-markdown/commit/86a57052e702649b2de3f8ce8bc7fb311dbcdd8f))

### [0.7.4](https://github.com/Tencent/cherry-markdown/compare/v0.7.3...v0.7.4) (2022-06-07)


### Bug Fixes

* 删除线配置失效，顺便优化注释 ([b819667](https://github.com/Tencent/cherry-markdown/commit/b819667cd908ef89e1f5f7daf8cf974d0a4addf8))
* 只读模式下出现了两个问题(1、只读模式下宽度变成50%了；2、只读模式下可以编辑图片尺寸) ([ff46352](https://github.com/Tencent/cherry-markdown/commit/ff46352d2709af3bf5784f9ea8812bf8d0c9d614)), closes [#246](https://github.com/Tencent/cherry-markdown/issues/246)

### [0.7.3](https://github.com/Tencent/cherry-markdown/compare/v0.7.2...v0.7.3) (2022-05-26)

### [0.7.1](https://github.com/Tencent/cherry-markdown/compare/v0.7.0...v0.7.1) (2022-05-10)


### Features

* **toolbar:** add quote hook & optimize quote level implementation ([2416e93](https://github.com/Tencent/cherry-markdown/commit/2416e93b2c87c591193640bceabeec42308976dc))
* 插入有序列表的时候，序号自增 [#160](https://github.com/Tencent/cherry-markdown/issues/160) ([b49d47a](https://github.com/Tencent/cherry-markdown/commit/b49d47ad41f06bad0612444a9b6733f8292c3840))


### Bug Fixes

* **checklist:** illegal inline checklist ([#200](https://github.com/Tencent/cherry-markdown/issues/200)) ([f3fa79a](https://github.com/Tencent/cherry-markdown/commit/f3fa79a6ff7fee6d05a36f80de187ad8eb154feb))
* **code-block:** fix [#166](https://github.com/Tencent/cherry-markdown/issues/166) parse hr and indent code ([#205](https://github.com/Tencent/cherry-markdown/issues/205)) ([8320f5b](https://github.com/Tencent/cherry-markdown/commit/8320f5bf3021d42197e200f8981015093057f6d3))
* **comment-reference:** fix npe problem when there is a comment reference at the beginning of the document ([b97fc8f](https://github.com/Tencent/cherry-markdown/commit/b97fc8f77902f4a3f977a9b9ca9c751c7c062c2a))
* update blockquote regex to split list ([8b86eb3](https://github.com/Tencent/cherry-markdown/commit/8b86eb36efdaad95fc2737e2824034776b756ea1)), closes [#165](https://github.com/Tencent/cherry-markdown/issues/165)
* update list type regex to avoid content lost ([#196](https://github.com/Tencent/cherry-markdown/issues/196)) ([017dc43](https://github.com/Tencent/cherry-markdown/commit/017dc43faa1f297433e6310e2a259d696223fb35)), closes [#194](https://github.com/Tencent/cherry-markdown/issues/194)
* 修复批量拖拽上传文件没回调就插入内容的bug ([20d6ddf](https://github.com/Tencent/cherry-markdown/commit/20d6ddfa1f4e53aa8e06774f019aba4b90627dc4))
* 修复缩进代码块行号计算不准的问题 ([fe129b0](https://github.com/Tencent/cherry-markdown/commit/fe129b0ca70209f916e4d89f448036f8e10327ee))
* 最小高度调整 [#207](https://github.com/Tencent/cherry-markdown/issues/207) ([58a090b](https://github.com/Tencent/cherry-markdown/commit/58a090b390106d0d16f9155b1cd31aac00ac45b3))
* 增加使用el初始化编辑器的能力 [#203](https://github.com/Tencent/cherry-markdown/issues/203) ([e48d8e8](https://github.com/Tencent/cherry-markdown/commit/e48d8e8ed4ae1030f312d8b947f6cfa4005d25fe))
* 通过工具栏插入内容时，默认选中被插入的内容 [#206](https://github.com/Tencent/cherry-markdown/issues/206) ([678f695](https://github.com/Tencent/cherry-markdown/commit/678f69576074b21faeeb1c8a741ad3b63901f7e3))

## [0.7.0](https://github.com/Tencent/cherry-markdown/compare/v0.6.12...v0.7.0) (2022-04-12)


### Features

* add table wysiwyg v1.0 ([#189](https://github.com/Tencent/cherry-markdown/issues/189)) ([39a5a9e](https://github.com/Tencent/cherry-markdown/commit/39a5a9e68583d59291621f19f66a9424001a9f2a))
* update unit test ([#188](https://github.com/Tencent/cherry-markdown/issues/188)) ([50d2218](https://github.com/Tencent/cherry-markdown/commit/50d22182d70f533459b2d1a0fdc67cf696ceefbb))
* 增加表格编辑文档 ([46accca](https://github.com/Tencent/cherry-markdown/commit/46acccaee6bca431dade29dd151d7a45991380fc))


### Bug Fixes

* **code-block:** fix language matching regex ([4fa3b43](https://github.com/Tencent/cherry-markdown/commit/4fa3b43fbac75ac93e5e021ceb945c4801060eeb)), closes [#90](https://github.com/Tencent/cherry-markdown/issues/90)
* **link:** add bracket match check ([2bf3fa8](https://github.com/Tencent/cherry-markdown/commit/2bf3fa86acccf2757553104bdfbdec3f46b9a36f))
* **suggester:** fix keydown 'enter' affect the default logic of newlineAndIndentContinueMarkdownList ([#190](https://github.com/Tencent/cherry-markdown/issues/190)) ([ed0a5dd](https://github.com/Tencent/cherry-markdown/commit/ed0a5ddacec41fa596671002afa6909aa45fc8b8))

### [0.6.12](https://github.com/Tencent/cherry-markdown/compare/v0.6.11...v0.6.12) (2022-03-23)


### Bug Fixes

* **list:** use list start number ([d93b242](https://github.com/Tencent/cherry-markdown/commit/d93b24203e4881135a340a20aa590ea5d7606be2))

### [0.6.11](https://github.com/Tencent/cherry-markdown/compare/v0.6.10...v0.6.11) (2022-03-17)


### Bug Fixes

* replace lookbehind in math regex ([4dc2a7e](https://github.com/Tencent/cherry-markdown/commit/4dc2a7ee9bbed0da99d270e360c45614a35a543a))

### [0.6.10](https://github.com/Tencent/cherry-markdown/compare/v0.6.9...v0.6.10) (2022-03-17)

### [0.6.9](https://github.com/Tencent/cherry-markdown/compare/v0.6.8...v0.6.9) (2022-03-14)


### Bug Fixes

* **table-head:** fix th content not rendering ([98ce938](https://github.com/Tencent/cherry-markdown/commit/98ce938af72a71c9be6a9dfade4c2c5870b2aa4a))

### [0.6.8](https://github.com/Tencent/cherry-markdown/compare/v0.6.7...v0.6.8) (2022-02-28)


### Features

* add commonmark test suites ([ef2c950](https://github.com/Tencent/cherry-markdown/commit/ef2c950f03cbc391018fd57655d8413bb37aa780))
* add commonmark test suites ([c2e0c56](https://github.com/Tencent/cherry-markdown/commit/c2e0c56acdc2b19a52b623d6ba9fe352013063b4))
* add commonmark test suites ([44287e3](https://github.com/Tencent/cherry-markdown/commit/44287e3b39adea318c9a1832467811c61b77ded4))
* improve content cache for paragraph ([a7661d7](https://github.com/Tencent/cherry-markdown/commit/a7661d70fa65f0749758abe60ed128bd4f6568bb))


### Bug Fixes

* eslint fix & list test case fix ([2b8cb1a](https://github.com/Tencent/cherry-markdown/commit/2b8cb1a55d5922cd4c2396061a558aa9b68fd3e3))

### [0.6.7](https://github.com/Tencent/cherry-markdown/compare/v0.6.6...v0.6.7) (2022-02-28)


### Features

* add code tag in indent code block ([f9f2aaa](https://github.com/Tencent/cherry-markdown/commit/f9f2aaaef4bac71b4ca8b919925ef03fbc4f520d))
* 增加拖拽上传功能; Fixed:[#36](https://github.com/Tencent/cherry-markdown/issues/36) ([#146](https://github.com/Tencent/cherry-markdown/issues/146)) ([74b100b](https://github.com/Tencent/cherry-markdown/commit/74b100b72a3e061652eaf6a3aa1ce21a6f3cbf3c))


### Bug Fixes

* add no-escape regex in math ([541b210](https://github.com/Tencent/cherry-markdown/commit/541b2100b88392faddb3f44ef313d69b85ccbece))
* **editor:** fix the compatibility issue of cjk ime ([#150](https://github.com/Tencent/cherry-markdown/issues/150)) ([05703a3](https://github.com/Tencent/cherry-markdown/commit/05703a3cb1221033713f1ab49892c828821b3b78)), closes [#82](https://github.com/Tencent/cherry-markdown/issues/82)
* refresh codemirror while toggling fullscreen ([a8ed1a4](https://github.com/Tencent/cherry-markdown/commit/a8ed1a4c5ff5ff7646622b64988666f60d8636f0))
* 修复代码块内嵌套缩进时出现占位字符的情况 ([999581e](https://github.com/Tencent/cherry-markdown/commit/999581ea20fe181cefad98efb9b185055e7c5e45))

### [0.6.6](https://github.com/Tencent/cherry-markdown/compare/v0.6.5...v0.6.6) (2022-02-18)


### Features

* optimize error output ([1282583](https://github.com/Tencent/cherry-markdown/commit/12825831fcf875f52f6b4f1a913d7be636d44429))


### Bug Fixes

* fix README content of engine mode. ([4388bfa](https://github.com/Tencent/cherry-markdown/commit/4388bfaea60857faf515be6ee3606761f2455eaf))
* **list:** adapt list cases to avoid array out of boundary ([4061e50](https://github.com/Tencent/cherry-markdown/commit/4061e50c2a56eb38e5345f17bc5139a3a7bd3654))

### [0.6.5](https://github.com/Tencent/cherry-markdown/compare/v0.6.4...v0.6.5) (2022-01-24)


### Features

* optimize error output ([ed7323c](https://github.com/Tencent/cherry-markdown/commit/ed7323c798d8daf98589d3d79d37fbdd08ff2e98))


### Bug Fixes

* **list:** adapt list cases to avoid array out of boundary ([4c5a23c](https://github.com/Tencent/cherry-markdown/commit/4c5a23c72f50ee0cc2fc1589681e9f47c91a459c))
* **ts file:** fix ts file couldn't submit ([6ab75b3](https://github.com/Tencent/cherry-markdown/commit/6ab75b36ad48ff4b4273172d39fcdcef04ab04f1))


### Performance Improvements

* **image:** fix poor performance when referencing data-url images ([37ac086](https://github.com/Tencent/cherry-markdown/commit/37ac0861ffeee052e8f1ba1dbef720b663dcb2db))


### Css or Code Change

* lint ([f4e156f](https://github.com/Tencent/cherry-markdown/commit/f4e156ffa2f9495b77d22e12ce4720ce2c310bdd))

### [0.6.4](https://github.com/Tencent/cherry-markdown/compare/v0.6.3...v0.6.4) (2022-01-13)

### [0.6.3](https://github.com/Tencent/cherry-markdown/compare/v0.6.2...v0.6.3) (2022-01-12)


### Features

* add force append ([c97f65b](https://github.com/Tencent/cherry-markdown/commit/c97f65bf852f54a855030525a29fd7b025b5bef4))
* api:setValue() 更新内容时支持保持光标位置 ([#106](https://github.com/Tencent/cherry-markdown/issues/106)) ([fa346c8](https://github.com/Tencent/cherry-markdown/commit/fa346c8e5710a0725b8755d74e44b6f79f0a95ea))


### Bug Fixes

* **Image:** encode poster url ([e73403d](https://github.com/Tencent/cherry-markdown/commit/e73403d98b9172c490838b0829bb513189c9e983))
* **list:** avoid string collect error while building tree ([031a359](https://github.com/Tencent/cherry-markdown/commit/031a359f81e743c73ea65b803a8b8ed0579942f2))

### [0.6.2](https://github.com/Tencent/cherry-markdown/compare/v0.6.1...v0.6.2) (2022-01-10)


### Bug Fixes

* delay backslash tranform time ([8e32e73](https://github.com/Tencent/cherry-markdown/commit/8e32e739aef6be480360f77db0fe00b62f74cbfa))
* mathjax script duplicate with multiple cherry instances ([5ba3ddd](https://github.com/Tencent/cherry-markdown/commit/5ba3ddd0b42dd163ef5bb599577bb5bbba0b5e1f)), closes [#73](https://github.com/Tencent/cherry-markdown/issues/73)
* type error in mathjax ([a5e6820](https://github.com/Tencent/cherry-markdown/commit/a5e6820aa403ce7ec713bd69ac46a30ae3783ea2))
* fix usage of lookbehind support ([d9dc315](https://github.com/Tencent/cherry-markdown/commit/d9dc315473fbae385692f20adaf5e49cbefabca6))
* **lookbehind:** fix `replaceStringByBuffer` returns empty string when nothing to replace ([525a5ab](https://github.com/Tencent/cherry-markdown/commit/525a5ab6ba467830c42fe432faea59bb0eef47b2))
* **suggester:**  adapt empty regex in safari ([a3027f7](https://github.com/Tencent/cherry-markdown/commit/a3027f784dd007293db6a7b07b3c9d5545e45f9e))
* **suggester:** add leadingChars ([a1fb8b1](https://github.com/Tencent/cherry-markdown/commit/a1fb8b13e28e5e5df34316c021e071bb2030254c))
* **suggester:** extract replacer from toHtml to avoid regex error in safari ([760449e](https://github.com/Tencent/cherry-markdown/commit/760449e9639524b03a77834208c8542333ab7d7a))
* **suggester:** suggester lookbehind regex support & fix list test case ([879a523](https://github.com/Tencent/cherry-markdown/commit/879a523256d1422cc4cf926ffc714408d5f91249))
* 0xA0 need to be treated as space ([75eee5b](https://github.com/Tencent/cherry-markdown/commit/75eee5bdb5ecab4ee5b6daaf923e985e2ec8dbb7)), closes [#83](https://github.com/Tencent/cherry-markdown/issues/83)
* use 0xa0 unicode instead ([ec9cbac](https://github.com/Tencent/cherry-markdown/commit/ec9cbac6d041ee103b0036101a17e274e8ff92fc)), closes [/github.com/Tencent/cherry-markdown/pull/84#discussion_r778531298](https://github.com/Tencent//github.com/Tencent/cherry-markdown/pull/84/issues/discussion_r778531298) [#84](https://github.com/Tencent/cherry-markdown/issues/84)


### Css or Code Change

* eslint fix ([6cb72fe](https://github.com/Tencent/cherry-markdown/commit/6cb72feb409c41392232543a3b1affecaaa30555))

### [0.6.1](https://github.com/Tencent/cherry-markdown/compare/v0.5.15...v0.6.1) (2021-12-30)


### Features

* 预览区域跟随编辑区域光标滚动 ([#72](https://github.com/Tencent/cherry-markdown/issues/72)) ([02c500b](https://github.com/Tencent/cherry-markdown/commit/02c500b24fe4ce4ad4772337e6665ac24c4dcc6f))
* **suggester:** add suggester function ([a8c35ed](https://github.com/Tencent/cherry-markdown/commit/a8c35ed9c03cb4c1eebfcb2afdc8722d16c251da))
* **suggester:** improve css ([4ab4bb6](https://github.com/Tencent/cherry-markdown/commit/4ab4bb6981747ed8fea7986b226df9c286e4888e))
* **suggester:** improve css code ([b333c71](https://github.com/Tencent/cherry-markdown/commit/b333c711ade436e1cf300707a88f419cff42e17b))
* add eslint jest plugin ([23bcbb3](https://github.com/Tencent/cherry-markdown/commit/23bcbb34fd4263075fdfa6e75c9702f8c0feea4e))
* add yarnrc & update dependencies ([ba8b5cd](https://github.com/Tencent/cherry-markdown/commit/ba8b5cdc5eb158d4052441e9351d6259de9a6892))
* init client project ([#53](https://github.com/Tencent/cherry-markdown/issues/53)) ([9f46acf](https://github.com/Tencent/cherry-markdown/commit/9f46acf009889bd7a8d77f4507e658f403023cc6))
* use jest for unit test ([0b15764](https://github.com/Tencent/cherry-markdown/commit/0b157645abd5564ec906ca1277287af9b1a79668))
* **sanitizer:** remove jsdom from browser builds & add new commonjs bundle for node env ([#62](https://github.com/Tencent/cherry-markdown/issues/62)) ([c61df0d](https://github.com/Tencent/cherry-markdown/commit/c61df0d14855cc88253545f57a686e990d067be3))


### Bug Fixes

* **list:** fix magic number ([34224a8](https://github.com/Tencent/cherry-markdown/commit/34224a8bd3e1aedab9168806f9e96e0bbad57983))
* **list:** support checklist && add test case ([f4d6a2a](https://github.com/Tencent/cherry-markdown/commit/f4d6a2acad817c11ed785f4a1704e3145db6684a))
* suggester 初始化判断有问题 ([cb22da6](https://github.com/Tencent/cherry-markdown/commit/cb22da6e252dfd216f49855a2966fa88198910ff))
* **custom-syntax:** revert get config from customSyntax & fix type error ([ebc5aee](https://github.com/Tencent/cherry-markdown/commit/ebc5aee4262d40f6755c759247515ddb66939225))


### Code Refactoring

* **list:** implement list with tree ([43ba79a](https://github.com/Tencent/cherry-markdown/commit/43ba79a09e948a499178bcfe9cb334efb378741e))

### [0.5.15](https://github.com/Tencent/cherry-markdown/compare/v0.5.14...v0.5.15) (2021-12-12)


### Features

* mocha support typescript & add list unit test ([a198733](https://github.com/Tencent/cherry-markdown/commit/a1987337df6aade66f137ac3700eb7c30fe9aa45))
* 在cherry上暴露导出接口，并修复导出没考虑多实例的情况 ([e21895b](https://github.com/Tencent/cherry-markdown/commit/e21895b096c564be03b4450fd27bc5fc44cad3d3))
* **Export:** export toolbar handler api ([#38](https://github.com/Tencent/cherry-markdown/issues/38)) ([360de5f](https://github.com/Tencent/cherry-markdown/commit/360de5f4d128a8bbaf619aadb9da8157592d2562))


### Bug Fixes

* fix cherry overflow & fix customHook could config params on the Cherry config ([#61](https://github.com/Tencent/cherry-markdown/issues/61)) ([1e24f12](https://github.com/Tencent/cherry-markdown/commit/1e24f127d88947206aa98835034246368c7ed04e))
*  连续多个音视频无法正确解析 ([74426b2](https://github.com/Tencent/cherry-markdown/commit/74426b20c33e114d2dad04788f4c8a8dfc46bbcf))
*  连续多个音视频无法正确解析 ([#34](https://github.com/Tencent/cherry-markdown/issues/34)) ([10008e9](https://github.com/Tencent/cherry-markdown/commit/10008e9bcf0396a462b1e1e90f16eb091041f11c))
* 列表内的行内语法污染了列表  Fixed [#40](https://github.com/Tencent/cherry-markdown/issues/40) ([#41](https://github.com/Tencent/cherry-markdown/issues/41)) ([d7546b8](https://github.com/Tencent/cherry-markdown/commit/d7546b8c24020a6ec731d645b5ebc7dd998e4a12))
* **api-demo:** basic config undefined ([#37](https://github.com/Tencent/cherry-markdown/issues/37)) ([f269eb3](https://github.com/Tencent/cherry-markdown/commit/f269eb38b4febcb2810174fdbb4300e60d30fb36))
* demo image's url ([2c933f1](https://github.com/Tencent/cherry-markdown/commit/2c933f1012b508c2c538e66e16cf3218ef089954))
* editor handleUpload has Invalid function parameter problem ([1f1d92e](https://github.com/Tencent/cherry-markdown/commit/1f1d92eb20062e20b53f8c2cee7e846bfcb60040))
* table's space and color picker's 'null' color Fixed [#30](https://github.com/Tencent/cherry-markdown/issues/30) ([244c190](https://github.com/Tencent/cherry-markdown/commit/244c1907e534ebcb6f959bb386183bfce4acfe74))
* use replaceLookBehind for bg、color、sub、sup ([0bd9229](https://github.com/Tencent/cherry-markdown/commit/0bd92295510edf12923933ff85a1bade7ea8cb9f))
* variable fix in demo scripts ([97bf5b5](https://github.com/Tencent/cherry-markdown/commit/97bf5b5ecb6a1941976553842ed9e84aa3f0b7cd))
* **toolbar:** init br button name by options ([174a4cd](https://github.com/Tencent/cherry-markdown/commit/174a4cd48c82b804d4c430e853a85557a1ca0b50))

### 0.5.13 (2021-10-27)


### Bug Fixes

* fix dependabot alerts ([54f4ab5](https://github.com/Tencent/cherry-markdown/commit/54f4ab599a6bf611966a66697e2e57a436431075))
* **menu:** avoid infinite loop in get shortcutKeys ([#2](https://github.com/Tencent/cherry-markdown/issues/2)) ([38d387c](https://github.com/Tencent/cherry-markdown/commit/38d387cde7bfbdf49bb8585c63b990ecc09a58e0))
* **plantuml:** use svg output to avoid font issue ([3bab59a](https://github.com/Tencent/cherry-markdown/commit/3bab59aa0fff88e58d381719d472a6f303f0af7a))
