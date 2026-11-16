---
name: scalingo-docs
description: >-
  Answer questions about Scalingo — the European PaaS — grounded in the official
  documentation instead of memory. Use this whenever the user asks anything
  involving Scalingo: deploying or scaling apps, buildpacks, one-off containers,
  review apps, the `scalingo` CLI, regions (osc-fr1, osc-secnum-fr1…), addons,
  managed databases (PostgreSQL, MySQL, MongoDB, Redis, OpenSearch, InfluxDB),
  domains and TLS, environment variables, log drains, cron/scheduler, SCM
  integrations, Dashboard/API/SDK, migrating from Heroku, HDS/SecNumCloud
  compliance, and so on. Trigger it even when the user does not say "docs" and
  even for questions you think you can answer from memory — Scalingo specifics
  (limits, flags, region names, exact CLI commands) change and must come from
  the docs, not recollection.
---

# Scalingo documentation

Answer Scalingo questions from a local, cleaned copy of the official docs
(`github.com/scalingo/documentation`) rather than from memory. Scalingo's exact
limits, CLI flags, region identifiers and addon plans drift over time; grounding
every answer in the corpus keeps them correct and lets you cite a real URL.

## Step 1 — Make sure the corpus exists

The docs are stored, cleaned, under a data directory separate from this skill:
`$SCALINGO_DOCS_HOME` if set, otherwise `~/.claude/scalingo-docs`. The cleaned,
grep-able markdown lives in its `corpus/` subfolder.

Run the setup script bundled with this skill (idempotent — it clones and builds
on first run, and is a no-op afterwards). The script lives at `scripts/setup_docs.py`
relative to this SKILL.md; when the skill is installed as a Claude Code plugin it
resolves to `${CLAUDE_PLUGIN_ROOT}/skills/scalingo-docs/scripts/setup_docs.py`.

```bash
python3 scripts/setup_docs.py
```

On first use this shallow-clones the repo and builds the corpus (~15 MB download,
a few seconds). If the corpus already exists it returns immediately. If the docs
feel stale (a release the corpus predates, or it's been weeks), refresh them:

```bash
python3 scripts/setup_docs.py --refresh   # git pull + rebuild
```

The build keeps only the real documentation (`_posts` + `_tutorials`, ~395 docs),
drops the ~1200 changelog files and all site machinery, resolves internal links
to real `doc.scalingo.com` URLs, inlines shared partials, and flattens callouts —
so what you read is clean prose. Front matter carries `source_url` (the public
URL) and `source_path`.

## Step 2 — Find the relevant documents

Two complementary entry points inside `corpus/`:

- `corpus/INDEX.md` — every doc as `[Title](public_url) — path`. Skim it to map a
  question to the right area (e.g. databases, networking, cli, languages).
- `grep -rl` / ripgrep over `corpus/` for keyword matches in the content.

Prefer a couple of targeted searches over reading broadly. Example:

```bash
grep -rli "review app" "$SCALINGO_DOCS_HOME/corpus" 2>/dev/null || \
  grep -rli "review app" ~/.claude/scalingo-docs/corpus
```

Then read the 1–3 most relevant files in full before answering.

## Step 3 — Answer, grounded and cited

Base the answer **primarily on the corpus**. Quote exact CLI commands, flags and
limits as written in the docs rather than paraphrasing them from memory. End with
the source URL(s) — the `source_url` field in each file's front matter — so the
user can go deeper.

If the corpus genuinely doesn't cover the question, say so plainly instead of
inventing details; suggest the closest relevant page and, if useful, that the
user check Scalingo Support or the dashboard. Don't pad a thin answer with
half-remembered specifics.

The corpus is **English only** (the repo has no French locale). Answer in the
user's language — translate freely — but the underlying facts come from the
English source.

## Escape hatch — a faithful Jekyll build

The cleaner resolves the site's templating deterministically, which covers the
docs well. In the rare case a specific page reads oddly (leftover templating,
missing snippet), the untouched source is in `<home>/repo/src/_posts/…`, and the
repo ships a Docker setup for a fully faithful render:

```bash
cd "$SCALINGO_DOCS_HOME/repo" && docker compose run --rm jekyll bundle exec jekyll build
# → _site/ contains the exact published HTML for that page
```

Reach for this only when the cleaned markdown is insufficient for a specific
answer; the corpus is the default path.

## Notes

- Requires `git` and `python3` (standard library only — no packages to install).
- The corpus is a cache: safe to delete `<home>/corpus` and rebuild any time.
- To include the changelog (release history) in the corpus, rebuild with
  `python3 scripts/setup_docs.py --refresh --keep-changelog`.
