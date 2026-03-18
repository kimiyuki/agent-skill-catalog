---
name: shopify-admin-api
description: "Shopify Admin API (GraphQL first, REST fallback) の設計・実装時に、公式ドキュメント参照とよくある落とし穴回避をガイドするスキル。Triggers: Shopify Admin API, GraphQL, REST, metafield, refund, order."
---

# Shopify Admin API

## 目的
- Shopify Admin API の設計・実装で **公式ドキュメントを優先参照** し、典型的なミスを避ける。
- **GraphQL を第一選択**にし、必要な場合のみ REST を使う。

## 使い方（短いワークフロー）
1) **対象を確定**: どのリソース（Order / Metafield / Refund など）を扱うかを明確化。
2) **API とバージョンを決める**:
   - GraphQL を優先。
   - REST は GraphQL で取れない/扱いづらい場合のみ。
   - バージョンは **リポジトリ設定が最優先**。不明な場合は「最新の安定版」を公式で確認。
3) **公式ドキュメント参照**:
   - 仕様が変わりやすいので、**必ず公式 docs を確認**する。
4) **クエリ設計**:
   - 接続（Connection）には `first` を必ず付ける。
   - まず最小限のフィールドで動作確認し、徐々に拡張。
5) **落とし穴チェック**:
   - ID 形式、権限、メタフィールド type、接続の形、返却 null など。

## 公式ドキュメント参照ルール
- 必ず **Shopify 公式ドメイン**（shopify.dev / developers.shopify.com など）を参照。
- フィールド差分やバージョン差異は公式で確認。
- 最新情報が必要なときは web.run で検索して裏取りする。

## よくあるミス（抜粋）
- **ID の取り違え**: GID / legacy numeric / Order name を混同する。
- **GraphQL の Connection を List と誤認**: `first` なし、`edges/nodes` の取り違え。
- **バージョン差異**: `financialStatus` など、バージョンで消える/変わるフィールド。
- **metafield type 不一致**: `type` と `value` の組み合わせが誤り。
- **権限不足**: Admin API scope が足りない。

## 参照ファイル
- GraphQL の設計 / Connection / 例: `references/graphql.md`
- REST の使いどころ / ID ルール: `references/rest.md`
- Metafield 運用: `references/metafield.md`
- よくあるエラーと対処: `references/errors.md`
- バージョン運用: `references/versioning.md`
