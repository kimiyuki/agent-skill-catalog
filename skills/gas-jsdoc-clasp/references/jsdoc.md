# JSDocと型付け

## 変数宣言とES2015構文ポリシー
- **`const` をデフォルトにする**: 再代入しない値や名前空間は `const` で束縛し、明示的に不変であることを示します。  
- **必要な場面だけ `let`**: ループカウンタや再代入が避けられない一時変数のみ `let` を使います。`const` にしておきたいが内部状態を持ちたい場合は、IIFE 内に `const state = {};` を置いてクロージャで管理します。  
- **`var` は排除する**: 再宣言や巻き上げにより読み込み順トラブルが発生しやすいため、`var` は例外的なレガシー環境以外では使用しません。  
- **トップレベルの依存チェック**: `const` は再宣言不可のため、1ファイル1名前空間ポリシーとセットで運用します。依存する名前空間が必要な場合は、`typeof OtherNamespace !== 'undefined'` を確認してから利用するか、IIFEの引数として受け取ります。

## JSDocによる型定義と型チェック
- **JSDocコメントの活用**: 全ての関数やグローバル定数に対してJSDocコメントを記述し、引数や戻り値の型、説明を書くようにします。例えば:  
  ```js
  /**
   * 与えられたユーザー名で挨拶メッセージを返します。
   * @param {string} name ユーザー名
   * @return {string} 挨拶メッセージ
   */
  function greet(name) {
    return `Hello, ${name}!`;
  }
  ```  
  これによりエディタ上で補完が効き、関数使用時に型情報や説明が表示されます。  
- **カスタム型の定義**: オブジェクト構造など複雑な型は、JSDocの`@typedef`で定義して再利用します。例えばユーザー情報オブジェクトを定義し、関数の戻り値型に利用できます:  
  ```js
  /**
   * ユーザー情報型定義
   * @typedef {Object} UserInfo
   * @property {string} id ユーザーID
   * @property {string} name 名前
   * @property {number} age 年齢
   * @property {UserInfo[]} friends 友達リスト（再帰的にUserInfo型）
   */
  /**
   * 全ユーザー情報を取得する
   * @return {UserInfo[]} ユーザー情報配列
   */
  function getAllUsers() { /* ... */ }
  ```  
- **GAS組み込みオブジェクトの型**: `SpreadsheetApp`や`DocumentApp`などGASの組み込みオブジェクトも型として扱えます。JSDoc内で`@param {SpreadsheetApp.Sheet} sheet`のように書けば、対象がスプレッドシートのSheetオブジェクトであることを明示できます。ローカル環境でそれらを補完・チェックするには、型定義をプロジェクトに導入します。  
  - **型定義の導入**: npm経由で`@types/google-apps-script`を**devDependencies**にインストールし（`npm i -D @types/google-apps-script`）、VSCodeやTypeScriptにGASの型情報を認識させます。  
  - **型定義の参照**: 上記をインストール後、VSCodeは自動で型を参照しますが、必要に応じて`/// <reference types="google-apps-script" />`をファイル先頭に追加して明示的に参照させても構いません。  
- **静的型チェックの有効化**: JSDocを書くだけではエディタ上に型エラーが表示されないため、TypeScriptのチェック機能を使います。方法はシンプルで、**各ファイルの先頭**に `// @ts-check` コメントを記載するか、プロジェクトに`jsconfig.json/tsconfig.json`を配置して`checkJs: true`を有効にします。例えば:  
  ```js
  // @ts-check
  /** @type {number} */
  let count = "10";  // 文字列を代入しているのでエラーを検出
  ```  
  このように書くと、VSCode上で型不一致のエラーが即座に表示され、リファクタリング時の安心感が高まります。  
- **VSCodeでの補完とリファクタ**: 上記設定により、VSCodeはJavaScriptでもTypeScript同等の型チェックと補完を行います。変数や関数のリネームも型情報に基づいて安全に行えるため、ローカルで大規模なリファクタリングが容易になります。  

## リネーム機能とコード構成の工夫について
Google Apps Script（GAS）でグローバル関数を直接定義している場合、IDE（例：VS Code）のリネーム機能（F2）がシンボル間の関係を正確に把握できず、プロジェクト全体でのリネームがうまく機能しないという問題があります。この問題に対する対策としては、内部ロジックや共通処理をグローバル関数として定義するのではなく、ひとつの名前空間（例：`MyApp` などのオブジェクト）にまとめる方法が有効です。

【具体例】  
- **内部処理のまとめ**  
  内部のロジックや共通の処理は、グローバルオブジェクト（例：`MyApp`）に属する関数として定義し、IDE上でのリネームやリファクタリングを容易にする。たとえば、`MyApp.processData` として関数をまとめることで、関数名の変更が各ファイル間で正しく反映されやすくなる。
  
- **エントリーポイントのグローバル定義**  
  一方、GAS の実行トリガーやウェブエディタ上で直接実行する必要がある「エントリーポイント」や、個別に実行させたい関数は、グローバル関数として定義する。これらのグローバル関数は、内部処理を呼び出す薄いラッパーとして機能させることで、GAS の実行環境とローカル開発環境の双方の要件を満たす。

【実装例】

```js
// 内部処理：名前空間にまとめる
const MyApp = (() => {
  /**
   * 入力された文字列を大文字に変換する処理
   * @param {string} input
   * @return {string}
   */
  function processData(input) {
    return input.toUpperCase();
  }

  return {
    processData,
  };
})();

// エントリーポイント：グローバル関数として定義
function myEntryPoint() {
  const result = MyApp.processData('hello world');
  Logger.log(result);
}
```

このような構成にすることで、内部ロジック部分は IDE の補完やリファクタリング機能を十分に活用でき、エントリーポイントは GAS の実行要件を満たすというメリットがあります。開発効率と保守性の両面で、非常にバランスのとれた設計と言えるでしょう。

## types.d.ts の利用
```typescript
declare namespace MyUtils {
  function deleteEmptyRows(sheet: GoogleAppsScript.Spreadsheet.Sheet): void;
}
```
のような形で型定義ファイルを作成する。
