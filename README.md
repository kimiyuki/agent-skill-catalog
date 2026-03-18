# Agent Skill Catalog

GitHub repo 上の skill ファイルを正本にした、社内向けの Agent Skill Catalog です。  
この README はサイト利用者向けではなく、repo を追加・保守・公開する人向けの運用メモです。

## 目的
- skill の一覧、検索、絞り込み、詳細閲覧ができる静的サイトを作る
- skill の正本は repo 上のファイルに置く
- 数件から始めて、将来的に数百件まで増えても破綻しにくい構成にする
- GitHub Pages で公開しつつ、将来の移設にも耐えやすい file-based 構成にする

## 現在の方針
- Astro + TypeScript
- 重い UI ライブラリは使わない
- client-side JS は検索と絞り込みに必要な最小限
- fail fast を優先し、不整合は build error にする
- サイトは「ショーケース」ではなく「実用カタログ」に寄せる
- `catalog` の初稿は Codex が作り、人間が後で編集できる前提にする
- 今回は公開サイト前提とし、`SKILL.md` の本文はそのまま詳細ページに出す
- deploy は `main` push で自動実行する

## データ構造
この repo では情報を 2 層に分ける。

### 1. skill runtime layer
実際に agent / codex が読む正本。

- `skills/<slug>/SKILL.md`
- `skills/<slug>/scripts/`
- `skills/<slug>/assets/`

`SKILL.md` の front matter では少なくとも以下を必須にする。

- `name`
- `description`

`SKILL.md` の body は詳細ページ本文の正本として使う。

### 2. catalog metadata layer
サイト表示用 metadata。

- `catalog/<slug>.yaml`

`catalog/<slug>.yaml` の必須項目:

- `title`
- `summary`
- `category`
- `tags`
- `audience`
- `owner`
- `status`
- `risk`
- `lastValidated`
- `featured`

任意項目:

- `order`
- `links`
- `notes`

## どの情報をどこに置くか
- runtime 用の名前と説明は `skills/<slug>/SKILL.md`
- サイト表示用の見出しと短文は `catalog/<slug>.yaml`
- 詳細ページ本文は `SKILL.md` の body

重要なルール:

- `catalog` には runtime 用の `name` / `description` をそのまま重複させない
- 表示用コピーは `title` / `summary` を使う
- `summary` は 100 文字以内
- 実運用では 80〜90 文字を目安にする
- `category` は最大 5 種類程度の語彙に寄せる
- `tags` は最大 15 種類程度の語彙に寄せる

## 新しい skill の追加方法
1. `skills/<slug>/SKILL.md` を作る
2. 必要なら `scripts/` と `assets/` を追加する
3. `catalog/<slug>.yaml` を作る
4. `title` と `summary` をサイト向けに調整する
5. `summary` が 100 文字以下か確認する
6. validate を通す

`catalog` の初稿作成ルール:

- 最初の草案は Codex が作る
- 人間が後で wording や分類を調整できるようにする
- 初稿でも validate に通る品質を目指す

slug の考え方:

- フォルダ名と `catalog` のファイル名を一致させる
- 英小文字、数字、ハイフンを基本にする

## validate の考え方
build 前に layer 間整合性を検証する。warnings ではなく、原則 fail fast。

想定している主な検証:

- `skills/<slug>/SKILL.md` が存在する
- `SKILL.md` の front matter が parse できる
- `SKILL.md` に `name` と `description` がある
- `catalog/<slug>.yaml` が存在する
- `catalog` が schema を満たす
- `title` / `summary` が空でない
- `summary` が 100 文字以下
- `status` / `risk` が許可値のみ
- `lastValidated` が妥当な `YYYY-MM-DD`
- `skills/` と `catalog/` の slug が一致している

## 使うコマンド
現在の開発では、以下を使う。

```bash
npm install
npm run validate
npm run dev
npm run build
```

`npm install` 時に `prepare` が走り、Git hook は `.githooks/` を使う設定になる。

## Git 運用
今回の基本方針は「`main` が公開対象」「作業は feature branch」「deploy は GitHub Actions」。

### ブランチ戦略
- `main` を本番相当とする
- 作業は `feature/...` ブランチで行う
- PR でレビューする
- merge は `Squash merge` を基本にする

### 生成物の扱い
- `gh-pages` ブランチは使わない
- build 生成物は git に commit しない
- 公開用成果物は GitHub Actions で毎回生成する

### PR ルール
- PR では validate と build を必須チェックにする
- credential 混入チェックも必須にする
- Pages への deploy は `main` への push 時のみ行う
- PR 時点では「公開前の検証」に留める

## GitHub Pages 運用
GitHub Pages の公開元は `GitHub Actions` を使う。

### 基本方針
- Repository Settings > Pages の Source は `GitHub Actions`
- `main` への push で build & deploy
- `workflow_dispatch` を入れて手動再 deploy 可能にする
- `github-pages` environment を使う
- v1 でも deploy は手動承認なしの自動 deploy でよい

### Astro 側の注意
- `site` を正しく設定する
- repo 名配下で公開する場合は `base` も正しく設定する
- base を忘れるとリンク切れしやすい

### Custom Domain
- 独自ドメインを使う場合は GitHub Pages 側で設定する
- 必要なら `public/CNAME` も管理対象にする

## 手動確認ポイント
PR 作成前または merge 前に、最低限以下を確認する。

- 追加した skill に対応する `catalog/<slug>.yaml` がある
- `title` / `summary` が空でない
- `summary` が 100 文字以下
- category や tags の粒度が既存と大きくズレていない
- slug が runtime layer と catalog layer で一致している
- build 後のカード表示で summary が長すぎない
- 誤って token / key / secret / credential が混入していない

## credential 混入チェック
commit 前に credential 混入を検出する軽量チェックを入れる。

方針:

- ローカルでは Git hook で止める
- CI でも同じチェックを走らせる
- hook をすり抜けても PR チェックで落とす
- 依存はできるだけ増やさず、軽量なパターン検出から始める

## 将来の拡張方針
- repo 固有の `catalog-edit` 系 skill を作り、`catalog/<slug>.yaml` の生成・更新を補助する
- 検索性向上のために category / tags の語彙を揃える
- 必要になった時だけ、表示用の追加 metadata や運用 docs を増やす

## 非目標
- CMS
- 投稿フォーム
- 認証
- Firestore
- Cloud Run
- 管理画面
- 外部 search service
- analytics
- 過剰な UI 演出
