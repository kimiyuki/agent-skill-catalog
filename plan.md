# Agent Skill Catalog 実装計画

## 目的
- GitHub repo 上の skill ファイルを正本にした、静的な skill カタログサイトを作る。
- 社内向けに skill の一覧、検索、絞り込み、詳細閲覧をできるようにする。
- 初期は 10 件前後、将来的には数百件まで増えても破綻しにくい file-based 構成にする。
- 公開 repo + GitHub Pages で動かしつつ、将来 private repo や別ホスティングへ移しても崩れにくくする。

## v1 の方針
- Astro + TypeScript で実装する。
- 重い UI ライブラリは入れない。
- React/Vue/Svelte は使わない。
- client-side JavaScript は検索と絞り込みに必要な最小限に留める。
- fail fast を徹底し、整合性エラーは build error にする。
- 「ショーケース」ではなく「実用カタログ」を目指す。
- `catalog` の初稿は Codex が作り、人間が後で編集できる前提にする。
- 今回は公開サイト前提なので、`SKILL.md` body はそのまま詳細ページに出す。
- deploy は `main` push で自動実行する。

## 2 層構造

### Layer 1: skill runtime layer
実際に agent / codex が読む skill bundle。本番の正本。

- `skills/<slug>/SKILL.md`
- `skills/<slug>/scripts/`
- `skills/<slug>/assets/`

必須は `SKILL.md` のみ。

### Layer 2: catalog metadata layer
サイトの一覧、絞り込み、表示順、短文表示のための site-specific metadata。

- `catalog/<slug>.yaml`

## canonical data rules

### SKILL.md
runtime 用 metadata と本文を持つ。

front matter で最低限これを必須にする。
- `name`
- `description`

`SKILL.md` の body は詳細ページ本文の正本として使う。

### catalog/<slug>.yaml
サイト表示用 metadata を持つ。runtime 用の `name` / `description` と意味を分けるため、表示用コピーは `title` / `summary` にする。

必須:
- `title`: string
- `summary`: string  # 100文字以内
- `category`: string
- `tags`: string[]
- `audience`: string[]
- `owner`: string
- `status`: `"active" | "experimental" | "deprecated"`
- `risk`: `"safe" | "review" | "restricted"`
- `lastValidated`: string  # YYYY-MM-DD
- `featured`: boolean

任意:
- `order`: number
- `links`: array
- `notes`: string

### summary のルール
- hard limit は 100 文字。
- 実運用の目標は 80〜90 文字。
- カードに収まることを優先する。

### category / tags の運用ルール
- `category` は最大 5 種類程度の語彙に寄せる。
- `tags` は最大 15 種類程度の語彙に寄せる。
- 初稿は Codex が作るが、人間が後で編集できる形にする。

## 絶対に避けること
- `content/skills/<slug>.md` のような別本文レイヤーを v1 に持ち込むこと。
- `catalog/<slug>.yaml` に runtime 用の `name` / `description` をそのまま重複させること。
- layer 間不整合を黙って無視して build を通すこと。
- summary が長すぎるまま表示崩れに頼ること。

## 想定ディレクトリ構成
```text
.
├─ skills/
│  └─ <slug>/
│     ├─ SKILL.md
│     ├─ scripts/
│     └─ assets/
├─ catalog/
│  └─ <slug>.yaml
├─ src/
│  └─ ...
├─ scripts/
│  └─ validate-skill-catalog.ts
├─ docs/
│  └─ skill-template/
└─ .github/
   └─ workflows/
```

## validate 要件
`scripts/validate-skill-catalog.ts` を作成し、`npm run validate` で実行できるようにする。  
`npm run build` の前に必ず validate を実行し、不整合があれば build を失敗させる。

### validate で確認すること
1. `skills/<slug>/SKILL.md` が存在すること。
2. `SKILL.md` の front matter が parse できること。
3. `SKILL.md` に `name` と `description` があること。
4. `catalog/<slug>.yaml` が存在すること。
5. `catalog/<slug>.yaml` が schema を満たすこと。
6. `catalog.title` が空でないこと。
7. `catalog.summary` が空でないこと。
8. `catalog.summary` が 100 文字以下であること。
9. `catalog/` にある slug に対応する `skills/<slug>/SKILL.md` が存在すること。
10. `skills/` にある slug に対して `catalog/<slug>.yaml` が存在すること。
11. slug の重複がないこと。
12. `lastValidated` が `YYYY-MM-DD` 形式で妥当な日付であること。
13. `status` / `risk` が許可値のみであること。

### validate のエラー出力
以下がすぐ分かる形で出す。

- 何が足りないか
- どの slug が壊れているか
- どのファイルを直せばよいか

warning ではなく原則 build error とする。

## Astro 側のデータ取得方針
- 一覧ページ用の index は build 時に組み立てる。
- `title`, `summary`, `category`, `tags`, `audience`, `owner`, `status`, `risk`, `featured`, `order`, `lastValidated` は `catalog/<slug>.yaml` から読む。
- runtime の `name`, `description` と `SKILL.md` body は `skills/<slug>/SKILL.md` から読む。
- 詳細ページ本文は `SKILL.md` body を render する。
- 数百件を想定し、データ読み込み処理は分離しておく。
- 外部検索基盤は入れず、v1 は client-side 検索でよい。

## サイト要件

### 一覧ページ
- skill カード一覧を表示する。
- 各カードに最低限以下を出す。
  - `title`
  - `summary`
  - `category`
  - `tags`
  - `owner`
  - `status`
  - `risk`
  - `lastValidated`
- `summary` は 2 行程度で clamp してカード高さを安定させる。
- カードクリックで詳細ページへ遷移できる。

### 検索と絞り込み
- テキスト検索対象:
  - `title`
  - `summary`
  - runtime `name`
  - `slug`
  - `category`
  - `tags`
  - `owner`
- `category` 絞り込み
- `status` 絞り込み
- `risk` 絞り込み
- 件数表示
- 0 件時の empty state

### 並び順
デフォルト順は以下。

1. `featured = true`
2. `order` 昇順
3. `lastValidated` 新しい順
4. `title` 昇順

### 詳細ページ
`/skills/[slug]/` を作る。表示項目は以下。

- `title`
- `summary`
- runtime `name`
- `category`
- `tags`
- `audience`
- `owner`
- `status`
- `risk`
- `lastValidated`
- `SKILL.md` body の rendered 本文
- skill ファイルへのリンク
  - `SKILL.md`
  - `scripts/` があれば存在を示す
  - `assets/` があれば存在を示す

## ドキュメント要件

### README に入れること
- この repo の目的
- 2 層構造の説明
- どの情報をどこに置くか
- 新しい skill の追加方法
- validate の考え方
- build / local run 方法
- GitHub Pages への deploy 方法
- 将来の拡張方針

### docs/skill-template/
以下を作る。

1. `docs/skill-template/SKILL.md`
   - `name`
   - `description`
   を持つ最小テンプレート
2. `docs/skill-template/catalog.yaml`
   - `title`
   - `summary`
   を含む site metadata 用テンプレート

## 運用支援
- repo 固有の `catalog-edit` 系 skill を用意し、`SKILL.md` を読んで `catalog/<slug>.yaml` を生成・更新できるようにする。
- その skill は `summary` を 100 文字以内に整える責務を持つ。
- `catalog` の初稿をまとめて作り、最初の実データから分類方針を固められるようにする。

## GitHub Pages
- GitHub Actions workflow を作る。
- `main` ブランチ push で build & deploy できるようにする。
- README に GitHub Pages 側で必要な設定を書く。
- static site generator 向けの一般的な Pages workflow を使う。
- deploy は自動実行でよく、v1 では手動承認ステップは不要。

## credential 混入チェック
- commit 前に credential 混入を検出するチェックを入れる。
- ローカルでは Git hook で止める。
- CI でも同じチェックを走らせる。
- hook をすり抜けても PR チェックで落とす。

## 非機能要件
- 数百件になっても破綻しにくい構成
- layer の責務が明確
- 追加時に迷いにくい
- validate でズレを早期に検出できる
- 実データ 0 件でも build 可能
- preview 用 placeholder を置く場合は sample と明記する
- 不要な外部依存を増やさない

## やらないこと
- 投稿フォーム
- CMS
- 認証
- Firestore
- Cloud Run
- 管理画面
- 外部 search service
- analytics
- 過剰な UI 演出

## 実装時の注意
- 既存 repo を壊さない。
- 変更は必要最小限に留める。
- 実データの skill を勝手に大量生成しない。
- preview 用サンプルが必要なら 1 件までに留め、README に sample と明記する。

## 受け入れ条件
1. Astro サイトが起動する。
2. build が通る。
3. `npm run validate` がある。
4. validate が 2 層不整合を検知できる。
5. skill 一覧ページがある。
6. 検索が動く。
7. `category` / `status` / `risk` 絞り込みが動く。
8. 詳細ページがあり、`SKILL.md` body が表示される。
9. GitHub Actions の Pages workflow がある。
10. README と template 群がある。
11. 実データ 0 件でも build できる。
