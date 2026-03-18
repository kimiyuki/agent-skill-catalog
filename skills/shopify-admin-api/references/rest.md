# REST (Admin API)

## 使いどころ
- GraphQL で扱いづらい/未対応のエンドポイント
- 既存コードの互換維持

## ID の注意
- REST は legacy numeric id を使うケースが多い
- Order name (#1001) は **ID ではない**
- 404 の場合は ID 取り違えを疑う

## 典型パターン
- `GET /admin/api/<version>/orders/<id>.json`
- `GET /admin/api/<version>/orders/<id>/metafields.json`
- `POST /admin/api/<version>/orders/<id>/metafields.json`

## 注意点
- API バージョンは必ず明示
- 返却の型や null は **仕様変更**があるため公式 docs を確認

