---
name: shopify-theme-dev
description: Shopify テーマ開発で `shopify theme dev` を起動・ログ監視・ローカルプレビュー確認を行う時に使う。store.yaml の設定を読み、localhost の `/` と `/cart` を確認する必要がある作業に適用する。Use when running Shopify theme dev, checking CLI output, and verifying localhost preview pages.
---

# Shopify Theme Dev

## 基本手順
1) リポジトリ直下の `store.yaml` を読む。
   - `SHOP_NAME` と `THEME_DEV`、`CHECK_URLS` を参照する。
   - `store.yaml` が無い/項目不足なら不足分を質問する。

2) `shopify theme dev` を起動する。
   - `THEME_DEV.FLAGS` があればそれをそのまま使う。
   - 例: `shopify theme dev --store=... --host=... --port=... 2>&1 | tee tmp/shopify-theme-dev.log`
   - 落ちる場合は常駐化: `nohup shopify theme dev --store=... --host=... --port=... > tmp/shopify-theme-dev.log 2>&1 &`
   - 常駐時は PID を控える（`echo $!`）。

3) 起動ログを継続監視する。
   - `exec_command` で起動し、返ってきた `session_id` を保持する。
   - `write_stdin` で定期的に出力を読み、起動成功/エラーを判断する。
   - 失敗している場合はエラー原因を要約して報告する。
   - ユーザーと同じログを共有する場合は `tmp/shopify-theme-dev.log` を使い、ユーザー側に `tail -f tmp/shopify-theme-dev.log` を案内する。
   - 常駐時の停止は `kill <PID>` を案内する。

4) ローカルプレビューを確認する。
   - `http://localhost:<PORT>` を基準に `CHECK_URLS` を開く。
   - DevTools で `new_page` → `navigate` → `take_snapshot` を使い、表示崩れや想定外の遷移をチェックする。

5) 停止が必要な場合のみ、`write_stdin` で Ctrl+C を送る。

## 既定の設定例（store.yaml）
```
SHOP_NAME: example.myshopify.com
THEME_DEV:
  HOST: 127.0.0.1
  PORT: 9292
  FLAGS:
    - "--store=example.myshopify.com"
    - "--host=127.0.0.1"
    - "--port=9292"
    - "--no-open"
CHECK_URLS:
  - "/"
  - "/cart"
```

## 注意
- `shopify` CLI が未インストール/未ログインの場合はユーザーに確認する。
- ポート競合時は `THEME_DEV.PORT` と `FLAGS` を合わせて更新する。
