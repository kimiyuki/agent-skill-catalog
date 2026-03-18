# GraphQL (Admin API)

## 使いどころ
- 複数フィールドを一括取得したいとき
- メタフィールド取得など、1リクエストで完結させたいとき

## 基本原則
- Connection には **必ず `first`** を付ける
- まず最小限のフィールドで動作確認 → 追加
- フィールド名/構造は **必ず公式 docs で確認**

## 典型パターン
### Order + Metafields
```
query ($id: ID!, $namespace: String!) {
  order(id: $id) {
    createdAt
    cancelledAt
    displayFinancialStatus
    refunds(first: 1) {
      nodes { id }
    }
    metafields(first: 50, namespace: $namespace) {
      edges { node { key value } }
    }
  }
}
```

### Connection/List 形状の差分
- `refunds` が **Connection** の場合:
  - `refunds(first: 1) { nodes { id } }`
- `refunds` が **List** の場合:
  - `refunds { id }`

**対策**: Connection を第一候補にし、schema mismatch の場合は List にフォールバック。

## 注意点
- `undefinedField` エラーは **バージョン差異**の可能性大。
- `argumentNotAccepted` や `edges`/`nodes` のエラーは **Connection vs List** の誤認が多い。

