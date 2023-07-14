# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.8.21](https://github.com/Tencent/cherry-markdown/compare/v0.8.20...v0.8.21) (2023-07-14)


### Features

* 丰富表格所见即所得功能 ([#479](https://github.com/Tencent/cherry-markdown/issues/479)) ([aa574a7](https://github.com/Tencent/cherry-markdown/commit/aa574a78492783a8f8556a4f46943343c0494ee1))
* 优化输入联想的交互体验 ([2dcb231](https://github.com/Tencent/cherry-markdown/commit/2dcb231d5777ebb8e3444fefd913b355b5d2d176))
* 预览区支持hover相关逻辑、表格支持hover添加行列 ([#502](https://github.com/Tencent/cherry-markdown/issues/502)) ([57ba97b](https://github.com/Tencent/cherry-markdown/commit/57ba97bf4bb7da037ed6be3dc5032628cab86699))
* 支持专注模式、打字机模式 ([#503](https://github.com/Tencent/cherry-markdown/issues/503)) ([8c22aea](https://github.com/Tencent/cherry-markdown/commit/8c22aeaa334c8f62243a698ce4e069834d88b9d9))
* add mermaid error, issue [#488](https://github.com/Tencent/cherry-markdown/issues/488) ([5fcdbbe](https://github.com/Tencent/cherry-markdown/commit/5fcdbbee7e3e621a4e76171c6af3bb394c4c1d11))
* **docs:** add configuration option ([#468](https://github.com/Tencent/cherry-markdown/issues/468)) ([73be84c](https://github.com/Tencent/cherry-markdown/commit/73be84cfce5ee90ba2b4b0c2bfbe81c26d7bb5e7))
* **Editor:** 增加对罗马数字与汉字列表的换行自动补全 ([#493](https://github.com/Tencent/cherry-markdown/issues/493)) ([085b5ea](https://github.com/Tencent/cherry-markdown/commit/085b5ea28f841418e85fa63584f9095ee06c6465))
* **Suggester:** Suggester扩展 [#430](https://github.com/Tencent/cherry-markdown/issues/430) ([#473](https://github.com/Tencent/cherry-markdown/issues/473)) ([d315708](https://github.com/Tencent/cherry-markdown/commit/d3157081396ef80c0247f0b70da92af2f6f10172))
* support switching language when previewing code ([#464](https://github.com/Tencent/cherry-markdown/issues/464)) ([21d5b98](https://github.com/Tencent/cherry-markdown/commit/21d5b98a141a21a2a5ac1fd1aa6f62f8f987a546))


### Bug Fixes

* [#466](https://github.com/Tencent/cherry-markdown/issues/466) 去掉时序图强制显示序号的逻辑 ([2bcefc7](https://github.com/Tencent/cherry-markdown/commit/2bcefc73366ff52f32cbf47d2ad50d1416aa733a))
* 避免出现 theme__null class 以及修复了常用操作的一些i18n国际化问题 ([#463](https://github.com/Tencent/cherry-markdown/issues/463)) ([b2c0805](https://github.com/Tencent/cherry-markdown/commit/b2c0805685970c98775f32e3a69af7ce91eea0fe))
* close [#470](https://github.com/Tencent/cherry-markdown/issues/470) 点击float 插入 menu位置错位 ([1b0844d](https://github.com/Tencent/cherry-markdown/commit/1b0844d6af48634d33cd908bc7136ea7a73a6058))
* close [#472](https://github.com/Tencent/cherry-markdown/issues/472) 修复点击draw.io图片出现无法回显编辑内容的情况 ([047d48e](https://github.com/Tencent/cherry-markdown/commit/047d48ee3a5ab53c29e68f7e1de3a428b75a01e3))
* close [#476](https://github.com/Tencent/cherry-markdown/issues/476) 处理粘贴代码时出现多余换行的情况，同时顺便修复复制粘贴代码块出现select标签的情况 ([08c351b](https://github.com/Tencent/cherry-markdown/commit/08c351bf9c3c0af8a10d5f37a8e6b309374087ca))
* **Engine:** 修复 blockquote 里，代码块被渲染为行内代码的 bug ([#481](https://github.com/Tencent/cherry-markdown/issues/481)) ([22940ae](https://github.com/Tencent/cherry-markdown/commit/22940aea6dc85360659289b6fcdde32a0890a951))
* **preview:** 修复html2canvas导致的含MathJax的截图导出重影问题 ([#484](https://github.com/Tencent/cherry-markdown/issues/484)) ([855b633](https://github.com/Tencent/cherry-markdown/commit/855b633ed31c5b8f10c3724568ebb69b1f3d6435))
* **Unittest:** 修复了单元测试代码中的诸多小问题 ([#482](https://github.com/Tencent/cherry-markdown/issues/482)) ([58092e4](https://github.com/Tencent/cherry-markdown/commit/58092e46e5284a89ea581d12052dae17bb0b5ba4))

### [0.8.20](https://github.com/Tencent/cherry-markdown/compare/v0.8.19...v0.8.20) (2023-05-31)


### Features

* 增加mermaid配置功能，可指定mermaid生成的是svg还是图片 ([2bcded7](https://github.com/Tencent/cherry-markdown/commit/2bcded78dae523fb1e766a7b91389658d1e23f3b))
* **client:** add `cherry markdown` to use ([#451](https://github.com/Tencent/cherry-markdown/issues/451)) ([7054200](https://github.com/Tencent/cherry-markdown/commit/70542001c4ac0c47f69fdb88b1f709267b623ae5))
* **preview:** ([#432](https://github.com/Tencent/cherry-markdown/issues/432)) support checkbox what-you-see-is-what-you-get feature ([#457](https://github.com/Tencent/cherry-markdown/issues/457)) ([baf592f](https://github.com/Tencent/cherry-markdown/commit/baf592f7ad803c130ff4fef1f815e0efb22751cc))


### Bug Fixes

* [#444](https://github.com/Tencent/cherry-markdown/issues/444) 初始化 float 和 bubble 时传入 customMenu ([#446](https://github.com/Tencent/cherry-markdown/issues/446)) ([1fc0972](https://github.com/Tencent/cherry-markdown/commit/1fc0972d8d4629f679970047f4b0f91af410fbfe))
* 同一行多个img所见即所得编辑时无法选中正确的图片 ([f64430d](https://github.com/Tencent/cherry-markdown/commit/f64430d92c6d94e4305d1ab22c4f5a47df42c946))
* 限制表格预览区域编辑的判定范围 ([ee28d26](https://github.com/Tencent/cherry-markdown/commit/ee28d26531b1e0a8087a27b46c96652939745d03))
* 优化图片懒加载的配置判断逻辑 ([61974b9](https://github.com/Tencent/cherry-markdown/commit/61974b9d4aada1fc660ed4d5e30b51d19ff89f38))
* **fullScreen:** icon switch (close [#445](https://github.com/Tencent/cherry-markdown/issues/445)) ([#447](https://github.com/Tencent/cherry-markdown/issues/447)) ([bd310c1](https://github.com/Tencent/cherry-markdown/commit/bd310c16c9fa096fb4ba7281456efabc4850ba1a))
* **Previewer:** 调整暗黑模式下高亮行颜色 ([69ad07d](https://github.com/Tencent/cherry-markdown/commit/69ad07d9b48008512297c172a5ba1fa8f2e7b008))

### [0.8.19](https://github.com/Tencent/cherry-markdown/compare/v0.8.18...v0.8.19) (2023-04-24)


### Features

* [#412](https://github.com/Tencent/cherry-markdown/issues/412) 增加textarea的name属性配置能力 ([b20c260](https://github.com/Tencent/cherry-markdown/commit/b20c26061dea3c7d392a860bb5bb8fa150eeff4a))
* [#424](https://github.com/Tencent/cherry-markdown/issues/424) 增加对齐方式语法和对应按钮 ([f0973d6](https://github.com/Tencent/cherry-markdown/commit/f0973d6b7259f4ba2e51fe7f87a0a0e3c6c4a0d8))
* add fullScreen function ([#420](https://github.com/Tencent/cherry-markdown/issues/420)) ([#426](https://github.com/Tencent/cherry-markdown/issues/426)) ([843ad64](https://github.com/Tencent/cherry-markdown/commit/843ad647d8d6cfb1ed4eb247fee1a495c25dfce0))
* support drawIo in client ([92a3119](https://github.com/Tencent/cherry-markdown/commit/92a3119167e100ea8ec97dde91dd03ef58bc5560))
* vscode 插件支持预览工作区图片 ([cd09242](https://github.com/Tencent/cherry-markdown/commit/cd092429c13243e80dd3173d072a312544f8caec))


### Bug Fixes

* [#439](https://github.com/Tencent/cherry-markdown/issues/439) 修复sidebar设置为false失效的问题 ([4474e47](https://github.com/Tencent/cherry-markdown/commit/4474e478c1790b95125dbc6dc436388e63484bba))
* [#440](https://github.com/Tencent/cherry-markdown/issues/440) 修复顶格插入表格时，预览区域表格无法进行编辑 ([3e5b3b8](https://github.com/Tencent/cherry-markdown/commit/3e5b3b82e7547fbc78779ed79bee93814e5d4d82))
* 处理右对齐工具栏的默认值问题 ([dc9186d](https://github.com/Tencent/cherry-markdown/commit/dc9186df0e0c1748d0bdff5e62d320e236b33d4f))
* 修复侧边栏二级菜单定位不准确的问题 ([8bc6c3b](https://github.com/Tencent/cherry-markdown/commit/8bc6c3b21dd0c0beb97ed7544f8af4a8f769ba8f))
* 优化判断图片是否在视区内的判断逻辑 ([83efd75](https://github.com/Tencent/cherry-markdown/commit/83efd758e0b3a4621c4aa7cdbaf3c2f294f62f65))
* use up-to-date script for client to avoid drawIo not found error ([8ed9400](https://github.com/Tencent/cherry-markdown/commit/8ed9400c651b18f360ed0d2b14066bb5f7de3e90))

### [0.8.18](https://github.com/Tencent/cherry-markdown/compare/v0.8.16...v0.8.18) (2023-04-10)


### Features

* 对正在编辑的区域进行高亮 ([#413](https://github.com/Tencent/cherry-markdown/issues/413)) ([bac8173](https://github.com/Tencent/cherry-markdown/commit/bac8173dbad26c159bb179b7db18676e7c5614b4))
* 图片语法增加花括号扩展能力 ([44d8063](https://github.com/Tencent/cherry-markdown/commit/44d806355db28afe067c1c21041058673d9c1bd5))
* 增加插入draw.io功能；增加编辑draw.io机制；\n fix: 修复编辑图片尺寸时有可能受代码块语法影响的问题 ([e326b86](https://github.com/Tencent/cherry-markdown/commit/e326b86ddd85b680c34a5ca071a9d735a22c6148))
* 增加设置主题的api ([681857f](https://github.com/Tencent/cherry-markdown/commit/681857f749e059290025e6bfd58fa37618473a4c))
* 增加draw.io示例里的图形种类 ([2aba33b](https://github.com/Tencent/cherry-markdown/commit/2aba33ba68d77e381edb33f78bf54344a45f9402))


### Bug Fixes

* [#395](https://github.com/Tencent/cherry-markdown/issues/395) 尝试无脑修复，需要humyfred确认 ([1f30506](https://github.com/Tencent/cherry-markdown/commit/1f305062f753355ee579ae42e946aba3f950f57d))
* 代码块逆解析成代码块语法时有多余的中括号产生 [#414](https://github.com/Tencent/cherry-markdown/issues/414) ([76acd94](https://github.com/Tencent/cherry-markdown/commit/76acd94450de761878832f06dcfbe89c3798c653))
* 非双栏模式，或者从双栏模式切换到单栏模式时，需要去掉高亮光标对应预览区域的机制 ([6cb9821](https://github.com/Tencent/cherry-markdown/commit/6cb98216264a61034be5c68e1fe1f32703889328))
* 删除多余逻辑 ([668993b](https://github.com/Tencent/cherry-markdown/commit/668993b7310fdd0485e517a77eec9b97c124a1d5))

### [0.8.17](https://github.com/Tencent/cherry-markdown/compare/v0.8.16...v0.8.17) (2023-03-27)


### Features

* 对正在编辑的区域进行高亮 ([#413](https://github.com/Tencent/cherry-markdown/issues/413)) ([bac8173](https://github.com/Tencent/cherry-markdown/commit/bac8173dbad26c159bb179b7db18676e7c5614b4))
* 图片语法增加花括号扩展能力 ([44d8063](https://github.com/Tencent/cherry-markdown/commit/44d806355db28afe067c1c21041058673d9c1bd5))
* 增加插入draw.io功能；增加编辑draw.io机制；\n fix: 修复编辑图片尺寸时有可能受代码块语法影响的问题 ([e326b86](https://github.com/Tencent/cherry-markdown/commit/e326b86ddd85b680c34a5ca071a9d735a22c6148))


### Bug Fixes

* 代码块逆解析成代码块语法时有多余的中括号产生 [#414](https://github.com/Tencent/cherry-markdown/issues/414) ([76acd94](https://github.com/Tencent/cherry-markdown/commit/76acd94450de761878832f06dcfbe89c3798c653))

### [0.8.16](https://github.com/Tencent/cherry-markdown/compare/v0.8.15...v0.8.16) (2023-03-13)


### Features

* 修改信息面板和手风琴语法 ([a7e1f96](https://github.com/Tencent/cherry-markdown/commit/a7e1f960944954c3d0b148b41f308988f0935289))


### Bug Fixes

* 改正了一处typo，并且修复了子菜单关闭逻辑的bug ([#410](https://github.com/Tencent/cherry-markdown/issues/410)) ([6ce02cf](https://github.com/Tencent/cherry-markdown/commit/6ce02cf1e2e0de7872a7b7fce5a85cdc6a376338))
* 将之前的更新适配至electron客户端 ([#405](https://github.com/Tencent/cherry-markdown/issues/405)) ([d8774c6](https://github.com/Tencent/cherry-markdown/commit/d8774c652b4274ccb110e02603972cdac76e3048))

### [0.8.15](https://github.com/Tencent/cherry-markdown/compare/v0.8.14...v0.8.15) (2023-03-06)


### Features

* 客户端增加关闭提醒和导出markdown/HTML文件功能 ([#399](https://github.com/Tencent/cherry-markdown/issues/399)) ([520eb00](https://github.com/Tencent/cherry-markdown/commit/520eb001e476c4ded2c25378ffc0d715da11f82f))
* 优化信息面板标题的背景色值 ([318740e](https://github.com/Tencent/cherry-markdown/commit/318740e5859b75f34efa1e176d192c8d9e25edfd))
* 增加手风琴语法和对应的按钮；fix: 修复换行、列表语法占位符没有行号信息的问题 ([e21cc35](https://github.com/Tencent/cherry-markdown/commit/e21cc35f180aaffafd2c86d08266f33f485bfad3))
* 增加信息面板语法和对应的按钮 ([fc7bc1f](https://github.com/Tencent/cherry-markdown/commit/fc7bc1f536022750971563cf7a99e27f77cb629e))


### Bug Fixes

* [#396](https://github.com/Tencent/cherry-markdown/issues/396) ([07ebfd5](https://github.com/Tencent/cherry-markdown/commit/07ebfd55edb12b93f1e6f50385bf89d2a16f864b))
* 修复翻译 ([4be5d37](https://github.com/Tencent/cherry-markdown/commit/4be5d37d8d7fe121a37dfb4cc64bf73fc9ab9b9e))

### [0.8.14](https://github.com/Tencent/cherry-markdown/compare/v0.8.13...v0.8.14) (2023-02-21)


### Bug Fixes

* 临时解决超链接和斜体语法冲突的问题，最终解决方案应该是AutoLink语法实现排他 ([9d23c56](https://github.com/Tencent/cherry-markdown/commit/9d23c565d682535b14d9bfbae3cefa35012b0b86))

### [0.8.13](https://github.com/Tencent/cherry-markdown/compare/v0.8.12...v0.8.13) (2023-02-17)


### Features

* (hooks) 自动超链接-支持展示固定长度字符 ([#391](https://github.com/Tencent/cherry-markdown/issues/391)) ([69056e4](https://github.com/Tencent/cherry-markdown/commit/69056e4ad9490bb09c1350b4f39a4d5b4e96e6fe))
* 丰富图标，优化侧边栏切换主题按钮的下拉框定位 ([d17d0fe](https://github.com/Tencent/cherry-markdown/commit/d17d0fee634fd0ced49c3102d3b372fda61e0542))
* 丰富图标，优化侧边栏切换主题按钮的下拉框定位 ([452ae1f](https://github.com/Tencent/cherry-markdown/commit/452ae1fd63a052efde307b689f61e14b291984ed))
* 增加vscode plugin，可以在vscode扩展中输入cherry-markdown搜索安装该插件 ([61be297](https://github.com/Tencent/cherry-markdown/commit/61be29709f7b1c4cbc107c00e3ed5711d3b67554))


### Bug Fixes

* [#388](https://github.com/Tencent/cherry-markdown/issues/388) 修复复制粘贴图片时，图片alt属性丢失的问题 ([21a505a](https://github.com/Tencent/cherry-markdown/commit/21a505af9a772307183e9ea54338cbfec8850943))
* unity header anchor safe id ([d28c488](https://github.com/Tencent/cherry-markdown/commit/d28c4883dd0c215726ec4e5f41914026b6a94104))
* 复制粘贴代码块的时候会丢失\t ([a1179c5](https://github.com/Tencent/cherry-markdown/commit/a1179c5004c8e58efe243418217e9b764419846b))

### [0.8.12](https://github.com/Tencent/cherry-markdown/compare/v0.8.11...v0.8.12) (2023-01-13)


### Features

* [#379](https://github.com/Tencent/cherry-markdown/issues/379) 通过引入第三方组件cm-search-replace实现左侧编辑器搜索、替换功能 ([3b7d17d](https://github.com/Tencent/cherry-markdown/commit/3b7d17dce78a0f736b011f5c1cd02a4a96156c58))


### Bug Fixes

* [#374](https://github.com/Tencent/cherry-markdown/issues/374) 光标处于编辑区域最低部时，预览区域滚动到了顶部 ([cfdfd0d](https://github.com/Tencent/cherry-markdown/commit/cfdfd0dcec1f9071bb797a2980a8c1f33615b17c))
* [#380](https://github.com/Tencent/cherry-markdown/issues/380) 修复粘贴时转义&的问题，同时修复粘贴table时出现过多换行的问题\n feat: 当表格thead为空的时候，不再渲染<thead> ([266a5f1](https://github.com/Tencent/cherry-markdown/commit/266a5f1716810f2b75348a8ecf3a38c15b510743))

### [0.8.11](https://github.com/Tencent/cherry-markdown/compare/v0.8.10...v0.8.11) (2022-12-28)


### Bug Fixes

* **insert:** Fix insert code instruction failure ([#373](https://github.com/Tencent/cherry-markdown/issues/373)) ([a1b3914](https://github.com/Tencent/cherry-markdown/commit/a1b39142d90861964c9b25f04f76dd38b99f50a0))

### [0.8.10](https://github.com/Tencent/cherry-markdown/compare/v0.8.9...v0.8.10) (2022-12-21)


### Features

* [#370](https://github.com/Tencent/cherry-markdown/issues/370) 增加refreshPreviewer方法，可以强制重新渲染预览区域 ([c347640](https://github.com/Tencent/cherry-markdown/commit/c3476407f5dd12ae85cd0069c18b44d0c09fbe12))


### Bug Fixes

* 跨单元格的行内公式、行内代码语法改成不生效 ([178a6ac](https://github.com/Tencent/cherry-markdown/commit/178a6acddd38c17ec109a194139bba175428a64b))

### [0.8.9](https://github.com/Tencent/cherry-markdown/compare/v0.8.8...v0.8.9) (2022-11-29)


### Features

* delete unnecessary observer to adapt old version browers ([869963c](https://github.com/Tencent/cherry-markdown/commit/869963cfe58a082604a9bd6b7ec9e19d27114e68))
* localisation support ([7ca12b7](https://github.com/Tencent/cherry-markdown/commit/7ca12b7e2de2d79ee5bf8ac6524277f2a76701bf)), closes [#217](https://github.com/Tencent/cherry-markdown/issues/217)
* 增加有序列表、无序列表按钮 ([f52ff42](https://github.com/Tencent/cherry-markdown/commit/f52ff427d752c44855e8a3c57bf3b030de7eee34))


### Bug Fixes

* [#357](https://github.com/Tencent/cherry-markdown/issues/357) 优化z-index的取值 ([729b404](https://github.com/Tencent/cherry-markdown/commit/729b404386c72005bb028a4e6d209cabfb1b0669))
* [#358](https://github.com/Tencent/cherry-markdown/issues/358) ([56ceedc](https://github.com/Tencent/cherry-markdown/commit/56ceedc498d256af89a265adb84a8c1efd27a3bd))
* issue 350 ([ebce611](https://github.com/Tencent/cherry-markdown/commit/ebce6111ee6fec87434478be6eacd2d5880825b2))
* 修复无浏览器模式报错 [#353](https://github.com/Tencent/cherry-markdown/issues/353) ([5571a4f](https://github.com/Tencent/cherry-markdown/commit/5571a4ff49e03338d8efdf38d4b6ce1d899185d4))

### [0.8.8](https://github.com/Tencent/cherry-markdown/compare/v0.8.6...v0.8.8) (2022-11-08)


### Features

* support more code highlight ([#347](https://github.com/Tencent/cherry-markdown/issues/347)) ([a37c0ac](https://github.com/Tencent/cherry-markdown/commit/a37c0ac13289757f5419d3fd611702d68ff465b1))
* support protobuf code highlight ([ddfd8f6](https://github.com/Tencent/cherry-markdown/commit/ddfd8f6769b1f0f1616613dc2a6d109343b1cfd5))
* 增加切换主题的功能，本次提交实现了切换主题、记忆主题功能 ([c4eeb34](https://github.com/Tencent/cherry-markdown/commit/c4eeb3492302a8a862704ceca36051d00222ec05))
* 增加四个默认的主题 ([d068772](https://github.com/Tencent/cherry-markdown/commit/d0687722fced763dadf39e1013f1ae102376c286))


### Bug Fixes

* **toolbar:** fix missing Toolbar#toolbarHandlers ([#349](https://github.com/Tencent/cherry-markdown/issues/349)) ([e55673f](https://github.com/Tencent/cherry-markdown/commit/e55673f720dfce0c32a134afb25c86f6a1276a61))
* **toolbar:** fix missing Toolbar#toolbarHandlers ([#349](https://github.com/Tencent/cherry-markdown/issues/349)) ([4596b4a](https://github.com/Tencent/cherry-markdown/commit/4596b4a5d4f1bdfc6177c4d1b5a260174e9270dc))
* 优化拖拽时插入的位置 [#338](https://github.com/Tencent/cherry-markdown/issues/338) ([d7269fb](https://github.com/Tencent/cherry-markdown/commit/d7269fb5470bcd12d98efb78577fd076f8f02cc9))
* 修复设置换行模式的时候有报错，增加换行模式本地记忆功能 [#339](https://github.com/Tencent/cherry-markdown/issues/339) ([3facef0](https://github.com/Tencent/cherry-markdown/commit/3facef025f3585879cfd3014712fc74db1307039))
* 复制代码快功能不再受preview bubble控制 [#337](https://github.com/Tencent/cherry-markdown/issues/337)  (同时增加图片懒加载的注释) ([4dbabd0](https://github.com/Tencent/cherry-markdown/commit/4dbabd01ddb0a6d4127cc780a9411a3957ef85db))
* 粘贴企业微信内容时编辑器有报错 [#336](https://github.com/Tencent/cherry-markdown/issues/336) ([d333504](https://github.com/Tencent/cherry-markdown/commit/d33350407279eab4218c52ae3cb75d0d96872002))

### [0.8.7](https://github.com/Tencent/cherry-markdown/compare/v0.8.6...v0.8.7) (2022-11-08)


### Features

* support more code highlight ([#347](https://github.com/Tencent/cherry-markdown/issues/347)) ([a37c0ac](https://github.com/Tencent/cherry-markdown/commit/a37c0ac13289757f5419d3fd611702d68ff465b1))
* support protobuf code highlight ([ddfd8f6](https://github.com/Tencent/cherry-markdown/commit/ddfd8f6769b1f0f1616613dc2a6d109343b1cfd5))
* 增加切换主题的功能，本次提交实现了切换主题、记忆主题功能 ([c4eeb34](https://github.com/Tencent/cherry-markdown/commit/c4eeb3492302a8a862704ceca36051d00222ec05))
* 增加四个默认的主题 ([d068772](https://github.com/Tencent/cherry-markdown/commit/d0687722fced763dadf39e1013f1ae102376c286))


### Bug Fixes

* **toolbar:** fix missing Toolbar#toolbarHandlers ([#349](https://github.com/Tencent/cherry-markdown/issues/349)) ([e55673f](https://github.com/Tencent/cherry-markdown/commit/e55673f720dfce0c32a134afb25c86f6a1276a61))
* **toolbar:** fix missing Toolbar#toolbarHandlers ([#349](https://github.com/Tencent/cherry-markdown/issues/349)) ([4596b4a](https://github.com/Tencent/cherry-markdown/commit/4596b4a5d4f1bdfc6177c4d1b5a260174e9270dc))
* 优化拖拽时插入的位置 [#338](https://github.com/Tencent/cherry-markdown/issues/338) ([d7269fb](https://github.com/Tencent/cherry-markdown/commit/d7269fb5470bcd12d98efb78577fd076f8f02cc9))
* 修复设置换行模式的时候有报错，增加换行模式本地记忆功能 [#339](https://github.com/Tencent/cherry-markdown/issues/339) ([3facef0](https://github.com/Tencent/cherry-markdown/commit/3facef025f3585879cfd3014712fc74db1307039))
* 复制代码快功能不再受preview bubble控制 [#337](https://github.com/Tencent/cherry-markdown/issues/337)  (同时增加图片懒加载的注释) ([4dbabd0](https://github.com/Tencent/cherry-markdown/commit/4dbabd01ddb0a6d4127cc780a9411a3957ef85db))
* 粘贴企业微信内容时编辑器有报错 [#336](https://github.com/Tencent/cherry-markdown/issues/336) ([d333504](https://github.com/Tencent/cherry-markdown/commit/d33350407279eab4218c52ae3cb75d0d96872002))

### [0.8.6](https://github.com/Tencent/cherry-markdown/compare/v0.8.5...v0.8.6) (2022-10-28)


### Bug Fixes

* use appendChild instead of append to adapt chrome version 53 and lower ([a21925a](https://github.com/Tencent/cherry-markdown/commit/a21925a4267cf67c5acb003a44106d8523abbd75))

### [0.8.5](https://github.com/Tencent/cherry-markdown/compare/v0.8.4...v0.8.5) (2022-10-21)


### Features

* transform header id to avoid being sanitized ([#324](https://github.com/Tencent/cherry-markdown/issues/324)) ([44935d9](https://github.com/Tencent/cherry-markdown/commit/44935d97ab87e1fb594d3e9337c1c325d5658bd1))
* 增加上传文件格式限制，优化上传文件回调逻辑，增加视频封面功能 [#328](https://github.com/Tencent/cherry-markdown/issues/328) ([dbf8788](https://github.com/Tencent/cherry-markdown/commit/dbf87885f0272a6edc24f69cf10bdf0adb5d6af9))


### Bug Fixes

* [#321](https://github.com/Tencent/cherry-markdown/issues/321) merge from [@ufec](https://github.com/ufec) ([90fb48e](https://github.com/Tencent/cherry-markdown/commit/90fb48e1fa4491cb89634ddaf23a05a18f534846))
* [#325](https://github.com/Tencent/cherry-markdown/issues/325) 连续字号时出现间隔识别的情况 ([0fb533c](https://github.com/Tencent/cherry-markdown/commit/0fb533c2411dcf87e69d954b1680f638d250f493))
* update babel-jest version to solve conflict in node 16 ([ad4dbd5](https://github.com/Tencent/cherry-markdown/commit/ad4dbd5e3ffa4bcbe3a5f0c630da5e9ee1f8c77f))
* 修复目录不展示的问题 ([8308b5c](https://github.com/Tencent/cherry-markdown/commit/8308b5c1541197fc5dc76c215b13f7e7deea490f))

### [0.8.4](https://github.com/Tencent/cherry-markdown/compare/v0.8.3...v0.8.4) (2022-10-13)

### [0.8.3](https://github.com/Tencent/cherry-markdown/compare/v0.8.2...v0.8.3) (2022-10-13)


### Bug Fixes

* **husky:** init husky in prepare instead of postinstall ([37ada7d](https://github.com/Tencent/cherry-markdown/commit/37ada7d8ed8cdda8126548c245620e40760f03ec))

### [0.8.2](https://github.com/Tencent/cherry-markdown/compare/v0.8.1...v0.8.2) (2022-09-16)


### Features

* 丰富快捷键 ([07f30c9](https://github.com/Tencent/cherry-markdown/commit/07f30c9b93a51456856e8d998b932cd09723c194)), closes [#319](https://github.com/Tencent/cherry-markdown/issues/319)


### Bug Fixes

* 懒加载机制没有考虑预览区域完全撑开的情况 ([a35ce1b](https://github.com/Tencent/cherry-markdown/commit/a35ce1b552205f85da0e29342c021c9ada813d28))
* 修复懒加载时占位图没有展示的问题 ([3dd20fe](https://github.com/Tencent/cherry-markdown/commit/3dd20feb97798e4180107a55ac5b038e4f87ce39))
* 自定义菜单有问题，修复并增加例子 [#317](https://github.com/Tencent/cherry-markdown/issues/317) [#315](https://github.com/Tencent/cherry-markdown/issues/315) ([09ccd30](https://github.com/Tencent/cherry-markdown/commit/09ccd30072cc55d7e27341d3c44c6ece449b32fb))

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
