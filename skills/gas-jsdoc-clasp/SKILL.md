---
name: gas-jsdoc-clasp
description: JSDoc型注釈と`// @ts-check`で型安全なGAS(JavaScript)を開発し、claspでローカル同期するための構成・運用ガイド。GASのローカル開発、clasp設定、順序依存の回避、型定義導入、ESLint/Prettier運用を相談する時に使う。
---

# GAS JSDoc + clasp

## 目的
JSDoc型注釈とclaspを使ったGAS開発の設計/運用を決める。

## スコープ境界
- Webアプリ deployment の version 差し替え、`/exec` URL 固定更新、shadow運用は `$gas-deploy-url-shadow` を使う。
- Git commit/tag と `clasp push` の追跡可能性を固定化する運用は `$gas-release-linkage` を使う。

## よくある相談例
- `clasp` でローカルとGASエディタを同期しつつ運用方針を決めたい
- `// @ts-check` とJSDocで型補完と型エラーを強化したい
- 読み込み順やトップレベル実行の順序依存を解消したい

## 進め方
1. 目的と制約を確認する（GASエディタ互換、トランスパイル不要、チーム運用など）。
2. 参照ファイルを読み、該当セクションを抽出して提案する。
3. 具体的な構成/設定/コード方針に落とし込む。
4. 依存順序やトップレベル実行のリスクを洗い出し、回避策を提示する。
5. 必要ならclaspのpush/pull運用とlint/format/ts-check設定を整理する。
6. 仕上げに `references/checklist.md` で抜け漏れを確認する。

## 参照
- `references/jsdoc.md` を読む。JSDoc、`@types`、`// @ts-check`、型運用の方針。
- `references/clasp.md` を読む。ディレクトリ構成、clasp設定、運用、互換性、サンプル。
- `references/ordering.md` を読む。順序依存の回避、`filePushOrder`、検知コマンド、メンテナンス。
- `references/checklist.md` を読む。最小限の運用チェック。
