# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

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
