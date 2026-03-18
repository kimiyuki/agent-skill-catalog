# 運用チェックリスト

- `// @ts-check` を有効にする（全ファイル or `jsconfig.json` で `checkJs: true`）
- `@types/google-apps-script` を `devDependencies` に追加する
- `.clasp.json` の `rootDir` が実ディレクトリと一致している
- `.claspignore` で不要ファイルを除外している
- トップレベル実行や `new` の順序依存がない
- `filePushOrder` を使う場合は理由を明記する
- GASエディタでの緊急修正があれば `clasp pull` で同期する
- ESLint/Prettier の方針をチームで合意する
