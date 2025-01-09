<p align="center"><img src="logo/new_logo.png" alt="cherry logo" width="50%"/></p>

# Cherry Markdown Writer

[![Cloud Studio Template](https://cs-res.codehub.cn/common/assets/icon-badge.svg)](https://cloudstudio.net#https://github.com/Tencent/cherry-markdown)

日本語 | [English](./README.md) | [简体中文](./README.CN.md)

### ドキュメント
- [初識cherry markdown 編集器](https://github.com/Tencent/cherry-markdown/wiki/%E5%88%9D%E8%AF%86cherry-markdown-%E7%BC%96%E8%BE%91%E5%99%A8)
- [hello world](https://github.com/Tencent/cherry-markdown/wiki/hello-world)
- [画像&ファイルアップロードインターフェースの設定](https://github.com/Tencent/cherry-markdown/wiki/%E9%85%8D%E7%BD%AE%E5%9B%BE%E7%89%87&%E6%96%87%E4%BB%B6%E4%B8%8A%E4%BC%A0%E6%8E%A5%E5%8F%A3)
- [ツールバーの調整](https://github.com/Tencent/cherry-markdown/wiki/%E8%B0%83%E6%95%B4%E5%B7%A5%E5%85%B7%E6%A0%8F)
- [カスタムシンタックス](https://github.com/Tencent/cherry-markdown/wiki/%E8%87%AA%E5%AE%9A%E4%B9%89%E8%AF%AD%E6%B3%95)
- [設定項目の全解](https://github.com/Tencent/cherry-markdown/wiki/%E9%85%8D%E7%BD%AE%E9%A1%B9%E5%85%A8%E8%A7%A3)
- [テーマの設定](https://github.com/Tencent/cherry-markdown/wiki/%E9%85%8D%E7%BD%AE%E4%B8%BB%E9%A2%98)
- [コードブロックシンタックスの拡張](https://github.com/Tencent/cherry-markdown/wiki/%E6%89%A9%E5%B1%95%E4%BB%A3%E7%A0%81%E5%9D%97%E8%AF%AD%E6%B3%95)
- [イベント&コールバック](https://github.com/Tencent/cherry-markdown/wiki/%E4%BA%8B%E4%BB%B6&%E5%9B%9E%E8%B0%83)
- [API](https://tencent.github.io/cherry-markdown/examples/api.html)

### デモ

- [フルモデル](https://tencent.github.io/cherry-markdown/examples/index.html)
- [ベーシック](https://tencent.github.io/cherry-markdown/examples/basic.html)
- [モバイル](https://tencent.github.io/cherry-markdown/examples/h5.html)
- [複数インスタンス](https://tencent.github.io/cherry-markdown/examples/multiple.html)
- [ツールバーなしエディタ](https://tencent.github.io/cherry-markdown/examples/notoolbar.html)
- [純プレビュー](https://tencent.github.io/cherry-markdown/examples/preview_only.html)
- [XSS](https://tencent.github.io/cherry-markdown/examples/xss.html)（デフォルトでは許可されていません）
- [画像WYSIWYG](https://tencent.github.io/cherry-markdown/examples/img.html)
- [テーブルWYSIWYG](https://tencent.github.io/cherry-markdown/examples/table.html)
- [自動番号付きヘッダー](https://tencent.github.io/cherry-markdown/examples/head_num.html)
- [ストリーム入力モード（AIチャートシナリオ）](https://tencent.github.io/cherry-markdown/examples/ai_chat.html)

-----

## 紹介

Cherry Markdown Editorは、Javascriptで書かれたMarkdownエディタです。Cherry Markdown Editorは、すぐに使える、軽量でシンプル、拡張が容易などの利点があります。ブラウザやサーバー（NodeJs）で動作します。

### **すぐに使える**

開発者は非常に簡単な方法でCherry Markdown Editorを呼び出してインスタンス化できます。インスタンス化されたエディタは、デフォルトでほとんどの一般的なMarkdownシンタックス（タイトル、目次、フローチャート、数式など）をサポートします。

### **拡張が容易**

Cherry Markdown Editorがサポートするシンタックスが開発者のニーズを満たさない場合、迅速に二次開発や機能拡張を行うことができます。同時に、Cherry Markdown Editorは純粋なJavaScriptで実装されるべきであり、angular、vue、reactなどのフレームワーク技術に依存すべきではありません。フレームワークはコンテナ環境を提供するだけです。

## 特徴

### シンタックスの特徴

1. 画像のズーム、配置、引用
2. テーブルの内容に基づいてチャートを生成
3. フォントの色とサイズの調整
4. フォントの背景色、上付き文字、下付き文字
5. チェックリストの挿入
6. オーディオやビデオの挿入

### 複数のモード

1. スクロール同期付きのライブプレビュー
2. プレビューのみのモード
3. ツールバーなしのモード（ミニマリスト編集モード）
4. モバイルプレビューモード

### 機能の特徴

1. リッチテキストからコピーしてMarkdownテキストとして貼り付け
2. クラシック改行＆通常改行
3. マルチカーソル編集
4. 画像サイズの編集
5. 画像やPDFとしてエクスポート
6. 新しい行の先頭に表示されるフロートツールバー
7. テキストを選択すると表示されるバブルツールバー

### パフォーマンスの特徴

1. 部分的なレンダリング
2. 部分的な更新

### セキュリティ

Cherry Markdownには組み込みのセキュリティフックがあり、ホワイトリストのフィルタリングとDomPurifyを使用してスキャンとフィルタリングを行います。

### スタイルテーマ

Cherry Markdownにはさまざまなスタイルテーマが用意されています。

### 特徴の表示

詳細については[こちら](https://github.com/Tencent/cherry-markdown/wiki/%E7%89%B9%E6%80%A7%E5%B1%95%E7%A4%BA-features)をクリックしてください。

## インストール

yarnを使用

```bash
yarn add cherry-markdown
```

npmを使用

```bash
npm install cherry-markdown --save
```

`mermaid`描画とテーブル自動チャート機能を有効にする必要がある場合は、`mermaid`と`echarts`パッケージを同時に追加する必要があります。

現在、**Cherry**が推奨するプラグインバージョンは`echarts@4.6.0`、`mermaid@9.4.3`です。

```bash
# mermaid依存関係をインストールしてmermaid描画機能を有効にする
yarn add mermaid@9.4.3
# echarts依存関係をインストールしてテーブル自動チャート機能を有効にする
yarn add echarts@4.6.0
```

## クイックスタート

### ブラウザ

#### UMD

```html
<link href="cherry-editor.min.css" />
<div id="markdown-container"></div>
<script src="cherry-editor.min.js"></script>
<script>
  new Cherry({
    id: 'markdown-container',
    value: '# welcome to cherry editor!',
  });
</script>
```

#### ESM

```javascript
import 'cherry-markdown/dist/cherry-markdown.css';
import Cherry from 'cherry-markdown';
const cherryInstance = new Cherry({
  id: 'markdown-container',
  value: '# welcome to cherry editor!',
});
```

### Node

```javascript
const { default: CherryEngine } = require('cherry-markdown/dist/cherry-markdown.engine.core.common');
const cherryEngineInstance = new CherryEngine();
const htmlContent = cherryEngineInstance.makeHtml('# welcome to cherry editor!');
```

## ライトバージョンの使用

mermaidライブラリのサイズが非常に大きいため、cherryビルド製品にはmermaidを内蔵しないコアビルドパッケージが含まれています。コアビルドは以下の方法でインポートできます。

### フルモード（UIインターフェース付き）

```javascript
import 'cherry-markdown/dist/cherry-markdown.css';
import Cherry from 'cherry-markdown/dist/cherry-markdown.core';
const cherryInstance = new Cherry({
  id: 'markdown-container',
  value: '# welcome to cherry editor!',
});
```

### エンジンモード（シンタックスコンパイルのみ）

```javascript
// Cherryエンジンコアビルドをインポート
// エンジンの設定項目はCherryの設定項目と同じです。以下のドキュメント内容はCherryコアパッケージのみを紹介します。
import CherryEngine from 'cherry-markdown/dist/cherry-markdown.engine.core';
const cherryEngineInstance = new CherryEngine();
const htmlContent = cherryEngineInstance.makeHtml('# welcome to cherry editor!');

// --> <h1>welcome to cherry editor!</h1>
```

### ⚠️ mermaidについて

コアビルドパッケージにはmermaid依存関係が含まれていないため、関連プラグインを手動でインポートする必要があります。

```javascript
import 'cherry-markdown/dist/cherry-markdown.css';
import Cherry from 'cherry-markdown/dist/cherry-markdown.core';
import CherryMermaidPlugin from 'cherry-markdown/dist/addons/cherry-code-block-mermaid-plugin';
import mermaid from 'mermaid';

// プラグインの登録はCherryのインスタンス化前に行う必要があります
Cherry.usePlugin(CherryMermaidPlugin, {
  mermaid, // mermaidオブジェクトを渡す
  // mermaidAPI: mermaid.mermaidAPI, // mermaid APIを渡すこともできます
  // 同時にここでmermaidの動作を設定できます。詳細はmermaid公式ドキュメントを参照してください。
  // theme: 'neutral',
  // sequence: { useMaxWidth: false, showSequenceNumbers: true }
});

const cherryInstance = new Cherry({
  id: 'markdown-container',
  value: '# welcome to cherry editor!',
});
```

### 動的インポート

**推奨** 動的インポートを使用します。以下はwebpackの動的インポートの例です。

```javascript
import 'cherry-markdown/dist/cherry-markdown.css';
import Cherry from 'cherry-markdown/dist/cherry-markdown.core';

const registerPlugin = async () => {
  const [{ default: CherryMermaidPlugin }, mermaid] = await Promise.all([
    import('cherry-markdown/src/addons/cherry-code-block-mermaid-plugin'),
    import('mermaid'),
  ]);
  Cherry.usePlugin(CherryMermaidPlugin, {
    mermaid, // mermaidオブジェクトを渡す
  });
};

registerPlugin().then(() => {
  // プラグインの登録はCherryのインスタンス化前に行う必要があります
  const cherryInstance = new Cherry({
    id: 'markdown-container',
    value: '# welcome to cherry editor!',
  });
});
```

## 設定
`/src/Cherry.config.js`を参照するか、[こちら](https://github.com/Tencent/cherry-markdown/wiki/%E9%85%8D%E7%BD%AE%E9%A1%B9%E5%85%A8%E8%A7%A3)をクリックしてください。

## 例

詳細な例については[こちら](https://github.com/Tencent/cherry-markdown/wiki)をクリックしてください。

### クライアント
開発中です。詳細は`/client/`ディレクトリを参照してください。

## 拡張

### カスタムシンタックス
[こちら](https://github.com/Tencent/cherry-markdown/wiki/%E8%87%AA%E5%AE%9A%E4%B9%89%E8%AF%AD%E6%B3%95)をクリックしてください。

### カスタムツールバー
[こちら](https://github.com/Tencent/cherry-markdown/wiki/%E8%B0%83%E6%95%B4%E5%B7%A5%E5%85%B7%E6%A0%8F)をクリックしてください。

## ユニットテスト

Jestはそのアサーション、非同期サポート、スナップショット機能のために選ばれました。ユニットテストにはCommonMarkテストとスナップショットテストが含まれます。

### CommonMarkテスト

`yarn run test:commonmark`を実行して公式のCommonMarkスイートをテストします。このコマンドは高速で実行されます。

スイートは`test/suites/commonmark.spec.json`にあります。例えば：

```json
{
  "markdown": " \tfoo\tbaz\t\tbim\n",
  "html": "<pre><code>foo\tbaz\t\tbim\n</code></pre>\n",
  "example": 2,
  "start_line": 363,
  "end_line": 368,
  "section": "Tabs"
},
```

この場合、Jestは`Cherry.makeHtml(" \tfoo\tbaz\t\tbim\n")`によって生成されたHTMLを期待される結果`"<pre><code>foo\tbaz\t \tbim\n</code></pre>\n"`と比較します。Cherry Markdownのマッチャーは`data-line`などのプライベート属性を無視しています。

CommonMarkの仕様とスイートは次の場所から取得できます：https://spec.commonmark.org/ 。

### スナップショットテスト

`yarn run test:snapshot`を実行してスナップショットテストを実行します。`test/core/hooks/List.spec.ts`のようにスナップショットスイートを書くことができます。最初の実行時にスナップショットが自動的に生成されます。その後、Jestはスナップショットと生成されたHTMLを比較できます。スナップショットを再生成する必要がある場合は、`test/core/hooks/__snapshots__`の下にある古いスナップショットを削除してこのコマンドを再度実行します。

スナップショットテストは遅く実行されます。エラーが発生しやすく、Cherry Markdownの特別なシンタックスを含むフックをテストするためにのみ使用されるべきです。

## 貢献

より強力なMarkdownエディタを構築するために参加してください。もちろん、機能リクエストを提出することもできます。作業を始める前に[こちら](https://github.com/Tencent/cherry-markdown/wiki/%E5%88%9D%E8%AF%86cherry-markdown-%E7%BC%96%E8%BE%91%E5%99%A8)を読んでください。

## Stargazers over time

[![Stargazers over time](https://starchart.cc/Tencent/cherry-markdown.svg)](https://starchart.cc/Tencent/cherry-markdown)

## ライセンス

Apache-2.0
