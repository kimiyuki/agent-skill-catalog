# よくあるエラーと対処

## GraphQL
- `undefinedField`: バージョン差異 or 誤フィールド名
- `argumentNotAccepted`: Connection/List の混在 or 引数不正
- `Field 'edges' doesn't exist`: List なのに edges を使っている
- `Field 'nodes' doesn't exist`: edges-only の場合

## REST
- 404 Not Found: ID 取り違え or 権限不足
- 422 Unprocessable Entity: type/value 不一致

## 対処の基本
- まず公式ドキュメントで **対象バージョン**を確認
- 最小クエリで再現 → 段階的にフィールド追加
- エラーが出るフィールド単位で切り分け

