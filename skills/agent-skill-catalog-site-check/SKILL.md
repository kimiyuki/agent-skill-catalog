---
name: agent-skill-catalog-site-check
description: 公開中の Agent Skill Catalog を CDP と curl で巡回し、主要ページや GitHub 導線の 404 を確認する skill。
---

# Agent Skill Catalog Site Check

この repo の公開サイトを、実際のブラウザ表示と network/console を見ながら確認するための skill。
トップページだけでなく、主要な詳細ページ、`raw preview`、GitHub への導線、`references/*.md` のリンク切れまで確認する。

## 使うタイミング

- ユーザーが公開サイトの表示やリンク切れを確認したいとき
- GitHub Pages / custom domain の反映後に、主要導線の健全性を見たいとき
- `Source on GitHub` や `references/*.md` を追加・変更したあと

## Repo 固有の前提

- 公開サイトの基準 URL は `https://abc-analytics.com/agent-skill-catalog/`
- 詳細ページでは `Source on GitHub` セクションを確認する
- `references/*.md` が本文にある skill は優先確認する
- 2026-03-18 時点では `gas-jsdoc-clasp` と `shopify-admin-api` が主要確認対象
- `/favicon.ico` の 404 は現時点では既知で、ユーザーが無視でよいとしている

## 基本手順

1. Chrome DevTools / CDP でトップページを開く。
2. top の network requests と console messages を確認する。
3. 代表的な詳細ページを少なくとも 1 件開き、internal link が 200 で遷移するかを見る。
4. `raw preview` を 1 件開き、`/source/<slug>.md` が 200 で返ることを確認する。
5. `Source on GitHub` と本文中の `references/*.md` の URL をページから取得する。
6. GitHub URL 群は `curl -L -s -o /dev/null -w '%{http_code}'` でまとめて確認する。
7. 404 や console error があれば、URL を添えて報告する。

## 重点確認ポイント

- トップページ
  - `200`
  - console error なし
  - CSS 読み込み成功
- 詳細ページ
  - `200`
  - back link が catalog top に戻る
  - `Source on GitHub` セクションが表示される
- `raw preview`
  - `200`
- GitHub 導線
  - `skills/<slug>/`
  - `SKILL.md`
  - `references/*.md`
  - すべて `200`

## 実行メモ

- DevTools では `.detail-links a, .detail-body a` を拾うと対象 URL を集めやすい
- GitHub への外部リンクは、ブラウザ遷移より `curl` で一括確認したほうが速い
- 主要 skill が増えたら、「`references/*.md` を持つ skill」を優先確認対象に追加する

## 報告フォーマット

- 見たページ
- 404 の有無
- console error の有無
- 確認した GitHub / reference URL 数
- 既知の例外があれば明記
