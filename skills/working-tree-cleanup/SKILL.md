---
name: working-tree-cleanup
description: Safely inspect and clean the current git working tree by classifying changes into commit, stash, discard, and keep-untracked.
---

# Working Tree Cleanup

This skill helps make the current git working tree clean or near-clean safely.

## Goal

Inspect the current repository state, classify all changes, and reduce noise in the working tree
without making product changes.

## Safety principles

- Do not implement features.
- Do not refactor.
- Do not alter product behavior.
- Do not delete tracked changes unless explicitly authorized.
- Prefer non-destructive actions.
- When in doubt, stash or propose a plan.
- Protect user work first.

## Required inspection steps

Run:

```bash
git status --short --branch
git diff --stat
git diff --cached --stat
git ls-files --others --exclude-standard
