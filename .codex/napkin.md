# Napkin

## Corrections
| Date | Source | What Went Wrong | What To Do Instead |
|------|--------|----------------|-------------------|
| 2026-03-18 | self | `.codex/napkin.md` がある前提で読み始めたが、repo 初期状態では未作成だった | セッション開始時に napkin の有無を確認し、無ければ先に作成する |
| 2026-03-18 | self | `npm init -y` と `npm install ...` を並列実行して、依存の保存が不安定になった | `package.json` を作る操作と依存インストールは順番に実行し、保存結果を `package.json` で確認する |
| 2026-03-18 | self | `SITE_BASE` を末尾 `/` なしで渡すケースを見落とし、Pages 配下リンクが `...catalogskills/...` で壊れた | `base` は config 側で必ず先頭 `/`・末尾 `/` に正規化し、デプロイ想定値で build 後の href まで確認する |
| 2026-03-19 | self | `src/pages/skills/[slug].astro` を zsh で未クォート指定して glob 展開エラーになった | `[` `]` を含むパスは `sed` や `rg` でも必ずシングルクォートで囲む |
| 2026-03-19 | self | `.gitignore` の apply_patch に余計なテキストを混ぜて失敗させた | パッチ本文にツール出力を混在させず、失敗時はまず現物を確認してから最小差分でやり直す |
| 2026-03-19 | self | 同じ `.gitignore` パッチ失敗を繰り返した | apply_patch 前に送信内容を見直し、パッチ以外の文字列が混ざっていないことを確認する |
| 2026-03-19 | self | `.detail-hero::after` の装飾 pseudo-element が wide viewport で CTA の上に重なり、クリックを奪うケースを見落とした | 装飾用 pseudo-element には `pointer-events: none` を基本にし、追加した CTA は `elementFromPoint` でも確認する |

## User Preferences
- 返答は日本語で行う。
- 不明点は推測で進めず、実装前に確認する。
- 変更は必要最小限に留め、不要なリファクタや依存追加はしない。
- 既存のテストやリンタを実行できるなら実行し、結果または未実行理由を明記する。
- `.codex/napkin.md` は Git 管理対象として扱い、関連する変更と同じコミットに含める運用を基本にする。ただし毎回必須ではない。
- skill の `description` はカードに収まる長さを優先し、100 字を上限にしたい。
- 一覧トップは hero/header を薄くして、skill 一覧の閲覧性を優先したい。
- 個別 skill ページは runtime name / runtime description を縦 2 段で見せ、他のメタ情報は header 側へ寄せたい。

## Patterns That Work
- 実装前レビューでは、`plan.md` 単体だけでなく repo の現状ファイル数も見て、初期構築コストと運用負荷を分けて評価すると判断しやすい。

## Patterns That Don't Work
- repo の実在構成を見ずに、`plan.md` の理想設計だけで実装負荷を判断すること。
- 仕様書の先頭崩れや文中混入を無視して、そのまま実装要求として扱うこと。

## Domain Notes
- 2026-03-18 時点の repo には `plan.md` しかなく、まだ Astro や package 設定は存在しない。
- この repo の方針は fail fast を優先し、内部互換レイヤーや黙ったフォールバックを増やさないこと。
- `plan.md` は先頭付近と責務説明の一部に文の崩れがあり、そのままだと実装時に解釈ぶれが出る。
- 2026-03-18 時点の作業パスには `.git` が無く、`git status` は使えなかった。
- 実データ投入後は `.git` があり、`skills/` 配下に 6 件の `SKILL.md` がある。
- 一覧カードは `.catalog-card { display: grid; }` を使っているため、JS で `hidden` を切り替えるときは `.catalog-card[hidden] { display: none; }` を明示しないと author CSS が勝つ。
