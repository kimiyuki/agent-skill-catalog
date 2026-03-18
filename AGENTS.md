# AGENTS.md

## Repo Policy

- 返答は日本語で行う。
- 変更は必要最小限に留める。
- 可能なら既存の検証コマンドを実行し、結果または未実行理由を明記する。

## Deployed Site Checks

- この repo で公開サイト確認を依頼されたら、まず実サイトを CDP で確認する。
- 基準 URL は `https://abc-analytics.com/agent-skill-catalog/` とする。
- トップページだけでなく、主要な詳細ページ、`raw preview`、`Source on GitHub`、`references/*.md` まで確認する。
- network requests と console messages を見て、404 や実害のある error がないかを確認する。
- GitHub への外部リンクや `references/*.md` は、必要に応じて `curl -L -s -o /dev/null -w '%{http_code}'` でも確認する。
- この確認では repo-local skill [`agent-skill-catalog-site-check`](./.codex/skills/agent-skill-catalog-site-check/SKILL.md) を優先して使う。
- `/favicon.ico` の 404 は現時点の既知事項なので、ユーザーが明示的に求めない限り修正対象にしない。
