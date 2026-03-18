# Metafield

## 基本
- `namespace`, `key`, `type`, `value` の整合が必須
- `type` は Admin API で厳格に検証される

## 典型ミス
- `type` と `value` の不一致（例: number_integer なのに文字列）
- namespace/key の typo
- scope 権限不足（read/write）

## 例（GraphQL 取得）
```
metafields(first: 50, namespace: "custom") {
  edges { node { key value } }
}
```

## 例（REST 更新）
```
POST /orders/<id>/metafields.json
{
  "metafield": {
    "namespace": "custom",
    "key": "receipt_url",
    "type": "url",
    "value": "https://..."
  }
}
```

