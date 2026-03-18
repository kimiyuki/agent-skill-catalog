# 読み込み順と順序依存

## GASの読み込み順と順序依存の回避
Apps Script ではサーバー側コード（`src/*.js`）が同一グローバルに読み込まれ、各ファイルのトップレベルも評価されます。Nodeのような`require/import`での明示的な依存解決は無いため、ファイル間の「読み込み順」に依存した実装は簡単に`ReferenceError`/`undefined`を招きます。

### 起きやすい落とし穴
- トップレベルで他ファイルの関数やクラスを即時に呼ぶ（IIFEや`new`を含む）
- `const`/`let`/`class`に代入した関数・値を、別ファイルのトップレベルから参照する（関数宣言のようにホイスティングされない）
- 名前空間オブジェクト（例: `App`）を前提にトップレベルで相互参照する

悪い例（順序依存）:

```js
// A.js
// トップレベル実行で、別ファイルの makeConfig に依存してしまう
const cfg = makeConfig();
const svc = new Service(cfg);

// B.js
const makeConfig = () => ({ /* ... */ });
```

良い例（順序非依存 / 1ファイル1名前空間）:

```js
// Runtime/AppRuntime.js
// @ts-check
const AppRuntime = (() => {
  /** @type {{config?: Runtime.Config}} */
  const state = {};

  /**
   * @return {Runtime.Config}
   */
  function getConfig() {
    if (!state.config) {
      state.config = { /* 遅延生成 */ };
    }
    return state.config;
  }

  /**
   * @param {Runtime.Config} cfg
   */
  function doWork(cfg) {
    // ...
  }

  return {
    getConfig,
    doWork,
  };
})();

/** GAS エントリ関数（グローバル公開） */
function runSomething() {
  const cfg = AppRuntime.getConfig();
  AppRuntime.doWork(cfg); // 呼び出し時に依存を取得するので順序に依存しない
}
```

依存する名前空間がある場合は、IIFEの引数で明示的に注入し、トップレベルで存在チェックを行います。

```js
// PaymentNotice.js
const PaymentNotice = ((deps) => {
  const Common = deps.Common;

  /**
   * @param {PaymentNotice.Payload} payload
   * @return {PaymentNotice.Data}
   */
  function prepare(payload) {
    const safePayload = payload || {};
    return {
      issueDate: Common.formatDateValue(safePayload.issueDate, 'yyyy/MM/dd'),
      total: Common.numberOrNull(safePayload.total),
    };
  }

  return {
    prepare,
  };
})((() => {
  if (typeof Common === 'undefined') {
    throw new Error('Common namespace is required before PaymentNotice');
  }
  return { Common };
})());
```

### 設計原則（順序依存を作らない）
1) トップレベルでは「宣言のみ」。実行（`new`や関数呼び出し）はエントリ関数の中で行う。

2) 外部I/Oや重い初期化は「遅延取得（lazy）」に包む。例: `getConfig()`, `mkClient()`。

3) APIは関数宣言（`function f(){}`）で公開。`const f = () => {}` は呼び出し側より前提義にしない。

4) 名前空間はIIFEで構築し`const`で束縛する。別ファイルからの追記（逐次拡張）を前提にしない。

5) 初期化が必要なら「明示的 init」を用意し、エントリから呼ぶ。

```js
function main() {
  AppRuntime.withLock(() => PaymentNotice.initAndRun());
}
```

### filePushOrder の位置づけ
- `clasp` の `filePushOrder` は「push時の並び順」を制御するためのバンドエイドです。
- 実行時のスナップショット整合性やトリガーの一貫性を担保するものではありません（Apps Script は `updateContent` により“丸ごと置き換え”で保存されます）。
- 根本対策は「トップレベル相互依存を無くす」こと。やむを得ないときのみ最小限で使う（例: `src/App.js` を最初に置く）。

例（必要な時だけ設定）:

```jsonc
// .clasp.json
{
  "rootDir": "src",
  "filePushOrder": [
    "src/App.js",
    "src/MyUtils.js",
    "src/logging.js"
  ],
  "skipSubdirectories": true
}
```

### 早期検知のための軽量チェック
以下の `ripgrep` は、順序依存を生みやすい「トップレベル実行」や「new」の行をあらい出す簡易チェックです（完全ではありません）。

```sh
# トップレベルでの関数呼び出し（宣言/コメント行を除外する近似）
rg -n "^(?!\s*(//|/\*|\*|}|\{|var |let |const |function |class )).+\w+\(.*\)\s*;\s*$" src

# トップレベルでの new
rg -n "^(?!\s*(//|/\*|\*|}|\{)).*\bnew\s+\w+" src

# 名前空間のIIFEパターンが揃っているかざっと確認
rg -n "^\s*const\s+[A-Z][A-Za-z0-9_]*\s*=\s*(?:\(function|\(\()" src
```

### 運用Tips（メンテナンスモード）
`clasp push` とトリガーの競合を避けたい場合は、Script Propertiesにフラグを置いて早期returnするガードを入れると安全です。

```js
function guardedEntry() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('MAINTENANCE_MODE') === '1') {
    return;
  }
  // 本処理
}
```
