#!/usr/bin/env python3
"""
Set up (and refresh) a clean, grep-able local copy of the Scalingo documentation.

Pipeline:
  1. Shallow-clone (or `git pull`) github.com/scalingo/documentation into <home>/repo
  2. Keep only the real docs (src/_posts + src/_tutorials); drop changelog & site machinery
  3. Clean each markdown file:
       - resolve {% post_url ... %} internal links to real doc.scalingo.com URLs
       - inline {% include foo.md %} shared partials
       - turn {% note %}/{% warning %} blocks into plain labelled text
       - drop leftover presentational tags ({% icon %}, {% raw %}, esbuild helpers...)
       - inject `source_url` / `source_path` into the front matter so any reader
         instantly knows the public URL to cite
  4. Write the result to <home>/corpus/ (date prefixes stripped from filenames)
  5. Write corpus/INDEX.md (title -> url -> path) and a .last_refresh marker

No third-party dependencies: standard library only, so it runs anywhere Python 3.8+ does.

Usage:
    python setup_docs.py            # create if missing, otherwise no-op
    python setup_docs.py --refresh  # git pull + rebuild the corpus
    python setup_docs.py --home /custom/path
    python setup_docs.py --keep-changelog   # also process src/changelog (noisy)

The home directory defaults to $SCALINGO_DOCS_HOME, else ~/.claude/scalingo-docs
"""

from __future__ import annotations

import argparse
import datetime as _dt
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

REPO_URL = "https://github.com/scalingo/documentation.git"
BASE_URL = "https://doc.scalingo.com"
DEFAULT_HOME = Path(os.environ.get("SCALINGO_DOCS_HOME", "~/.claude/scalingo-docs")).expanduser()

DATE_PREFIX = re.compile(r"^\d{4}-\d{2}-\d{2}-")
MD_SUFFIXES = (".md", ".markdown")


# --------------------------------------------------------------------------- #
# git
# --------------------------------------------------------------------------- #
def ensure_repo(repo_dir: Path, refresh: bool) -> None:
    """Shallow-clone the docs repo, or refresh it if it already exists."""
    if repo_dir.exists() and (repo_dir / ".git").exists():
        if refresh:
            print(f"↻ refreshing {repo_dir} (git pull)")
            _run(["git", "-C", str(repo_dir), "pull", "--depth", "1", "--ff-only"])
        else:
            print(f"✓ repo already present at {repo_dir} (use --refresh to update)")
        return
    repo_dir.parent.mkdir(parents=True, exist_ok=True)
    print(f"⇣ cloning {REPO_URL} → {repo_dir}")
    _run(["git", "clone", "--depth", "1", REPO_URL, str(repo_dir)])


def _run(cmd: list[str]) -> None:
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        sys.exit(f"command failed: {' '.join(cmd)}\n{result.stderr.strip()}")


# --------------------------------------------------------------------------- #
# URL mapping
# --------------------------------------------------------------------------- #
def slug_of(filename: str) -> str:
    """`2000-01-01-custom.md` -> `custom` (Jekyll strips the date prefix)."""
    stem = filename
    for suf in MD_SUFFIXES:
        if stem.endswith(suf):
            stem = stem[: -len(suf)]
            break
    return DATE_PREFIX.sub("", stem)


def post_rel_to_url(rel_no_ext: str) -> str:
    """
    Turn a path relative to _posts (as used by {% post_url %}) into a public URL.
    e.g. `tools/cli/2000-01-01-start` -> https://doc.scalingo.com/tools/cli/start
    Permalink is /:categories/:slug where :categories are the directory parts.
    """
    parts = rel_no_ext.strip("/").split("/")
    *dirs, last = parts
    slug = DATE_PREFIX.sub("", last)
    return "/".join([BASE_URL, *dirs, slug])


def tutorial_rel_to_url(rel_no_ext: str) -> str:
    """Collection permalink is /:collection/:path -> /tutorials/<path>."""
    parts = [p for p in rel_no_ext.strip("/").split("/") if p]
    parts = [DATE_PREFIX.sub("", p) for p in parts]
    return "/".join([BASE_URL, "tutorials", *parts])


# --------------------------------------------------------------------------- #
# content cleaning
# --------------------------------------------------------------------------- #
POST_URL_RE = re.compile(r"\{%\s*post_url\s+([^\s%]+)\s*%\}")
INCLUDE_RE = re.compile(r"\{%\s*include\s+([^\s%]+)([^%]*)%\}")
NOTE_OPEN = re.compile(r"\{%\s*note\s*%\}")
NOTE_CLOSE = re.compile(r"\{%\s*endnote\s*%\}")
WARN_OPEN = re.compile(r"\{%\s*warning\s*%\}")
WARN_CLOSE = re.compile(r"\{%\s*endwarning\s*%\}")
RAW_TAG = re.compile(r"\{%\s*(end)?raw\s*%\}")
ICON_RE = re.compile(r"\{%\s*icon\s+[^%]*%\}")
# {% link path %} — like post_url but for any source file (tolerates line breaks)
LINK_RE = re.compile(r"\{%\s*link\s+([^%]+?)\s*%\}", re.DOTALL)
# {% pndn app.region %} — renders a private-network domain name inline
PNDN_RE = re.compile(r"\{%\s*pndn\s*([^%]*?)\s*%\}")
# Purely presentational / logic tags: drop them (inner content of for-loops stays)
DROP_TAG_RE = re.compile(r"\{%\s*(?:assign|for|endfor|deploytl|breadcrumb)\b[^%]*%\}")


def resolve_post_urls(text: str, misses: set[str]) -> str:
    def repl(m: re.Match) -> str:
        arg = m.group(1)
        try:
            return post_rel_to_url(arg)
        except Exception:
            misses.add(arg)
            return m.group(0)

    return POST_URL_RE.sub(repl, text)


def resolve_links(text: str) -> str:
    def repl(m: re.Match) -> str:
        p = m.group(1).split()[0].strip("\"'")
        p = re.sub(r"\.(md|markdown|html)$", "", p)
        if p.startswith("_tutorials/"):
            return tutorial_rel_to_url(p[len("_tutorials/"):])
        if p.startswith("_posts/"):
            return post_rel_to_url(p[len("_posts/"):])
        return f"{BASE_URL}/{p.lstrip('/')}"

    return LINK_RE.sub(repl, text)


def resolve_pndn(text: str) -> str:
    def repl(m: re.Match) -> str:
        arg = m.group(1).strip()
        return arg if arg else "<private-network-domain>"

    return PNDN_RE.sub(repl, text)


def inline_includes(text: str, includes_dir: Path, depth: int = 0) -> str:
    """Replace {% include foo.md %} with the partial's content (best effort).

    Only .md partials without parameters are inlined; presentational .html
    helpers (images, etc.) or parameterised includes are dropped, since they
    carry no answerable prose and would leave Liquid residue.
    """
    if depth > 3:
        return text

    def repl(m: re.Match) -> str:
        name = m.group(1).strip().strip("\"'")
        params = m.group(2).strip()
        part = includes_dir / name
        if name.endswith(".md") and not params and part.is_file():
            inner = part.read_text(encoding="utf-8", errors="replace")
            return inline_includes(inner, includes_dir, depth + 1)
        return ""  # drop non-prose / parameterised includes

    return INCLUDE_RE.sub(repl, text)


def clean_callouts(text: str) -> str:
    text = NOTE_OPEN.sub("**Note:**", text)
    text = WARN_OPEN.sub("**Warning:**", text)
    text = NOTE_CLOSE.sub("", text)
    text = WARN_CLOSE.sub("", text)
    return text


def clean_body(text: str, includes_dir: Path, misses: set[str]) -> str:
    text = inline_includes(text, includes_dir)
    text = resolve_post_urls(text, misses)
    text = resolve_links(text)
    text = clean_callouts(text)
    text = resolve_pndn(text)
    text = RAW_TAG.sub("", text)
    text = ICON_RE.sub("", text)
    text = DROP_TAG_RE.sub("", text)
    # Anything still bearing {% %}/{{ }} is deliberately left untouched: it may be
    # literal content (e.g. a templating code sample) rather than site machinery.
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip() + "\n"


# --------------------------------------------------------------------------- #
# front matter
# --------------------------------------------------------------------------- #
def split_front_matter(raw: str) -> tuple[dict, str]:
    """Very small front-matter parser (key: value on single lines)."""
    if not raw.startswith("---"):
        return {}, raw
    end = raw.find("\n---", 3)
    if end == -1:
        return {}, raw
    header = raw[3:end].strip("\n")
    body = raw[end + 4 :].lstrip("\n")
    meta: dict[str, str] = {}
    for line in header.splitlines():
        if ":" in line and not line.lstrip().startswith("#"):
            k, _, v = line.partition(":")
            meta[k.strip()] = v.strip().strip("\"'")
    return meta, body


def render_front_matter(meta: dict, url: str, source_path: str) -> str:
    title = meta.get("title") or meta.get("nav") or ""
    lines = ["---"]
    if title:
        lines.append(f"title: {title}")
    if meta.get("nav") and meta.get("nav") != title:
        lines.append(f"nav: {meta['nav']}")
    lines.append(f"source_url: {url}")
    lines.append(f"source_path: {source_path}")
    if meta.get("modified_at"):
        lines.append(f"modified_at: {meta['modified_at']}")
    lines.append("---")
    return "\n".join(lines) + "\n\n"


# --------------------------------------------------------------------------- #
# main build
# --------------------------------------------------------------------------- #
def out_relpath(rel_no_ext: str) -> str:
    """Mirror the source tree but strip date prefixes from every segment."""
    parts = [DATE_PREFIX.sub("", p) for p in rel_no_ext.split("/")]
    return "/".join(parts) + ".md"


def build_corpus(repo: Path, corpus: Path, keep_changelog: bool) -> list[tuple[str, str, str]]:
    src = repo / "src"
    includes_dir = src / "_includes"
    if corpus.exists():
        shutil.rmtree(corpus)
    corpus.mkdir(parents=True)

    sections = [("_posts", post_rel_to_url), ("_tutorials", tutorial_rel_to_url)]
    if keep_changelog:
        sections.append(("changelog", lambda r: f"{BASE_URL}/changelog"))

    index: list[tuple[str, str, str]] = []  # (title, url, corpus_relpath)
    misses: set[str] = set()

    for section, url_fn in sections:
        root = src / section
        if not root.is_dir():
            continue
        for path in sorted(root.rglob("*")):
            if path.suffix not in MD_SUFFIXES or not path.is_file():
                continue
            rel = path.relative_to(root).as_posix()
            rel_no_ext = rel.rsplit(".", 1)[0]
            url = url_fn(rel_no_ext)

            meta, body = split_front_matter(path.read_text(encoding="utf-8", errors="replace"))
            cleaned = clean_body(body, includes_dir, misses)

            out_rel = f"{section.lstrip('_')}/{out_relpath(rel_no_ext)}"
            out_path = corpus / out_rel
            out_path.parent.mkdir(parents=True, exist_ok=True)
            out_path.write_text(render_front_matter(meta, url, out_rel) + cleaned, encoding="utf-8")

            title = meta.get("title") or meta.get("nav") or slug_of(path.name).replace("-", " ").title()
            index.append((title, url, out_rel))

    write_index(corpus, index)
    if misses:
        print(f"⚠ {len(misses)} post_url reference(s) could not be resolved (left as-is)")
    return index


def write_index(corpus: Path, index: list[tuple[str, str, str]]) -> None:
    lines = ["# Scalingo documentation — corpus index", "",
             f"{len(index)} documents. Format: `[Title](public_url) — corpus/path`", ""]
    for title, url, rel in sorted(index, key=lambda x: x[2]):
        lines.append(f"- [{title}]({url}) — `{rel}`")
    (corpus / "INDEX.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser(description="Build a clean local Scalingo docs corpus.")
    ap.add_argument("--home", type=Path, default=DEFAULT_HOME,
                    help="data directory (default: $SCALINGO_DOCS_HOME or ~/.claude/scalingo-docs)")
    ap.add_argument("--refresh", action="store_true", help="git pull and rebuild even if present")
    ap.add_argument("--keep-changelog", action="store_true", help="also include src/changelog (noisy)")
    args = ap.parse_args()

    home: Path = args.home.expanduser()
    repo = home / "repo"
    corpus = home / "corpus"

    already_built = corpus.exists() and (corpus / "INDEX.md").exists()
    if already_built and not args.refresh:
        print(f"✓ corpus already built at {corpus} (use --refresh to rebuild)")
        return

    ensure_repo(repo, refresh=args.refresh)
    print("⚙ building corpus …")
    index = build_corpus(repo, corpus, keep_changelog=args.keep_changelog)

    (home / ".last_refresh").write_text(
        _dt.datetime.now(_dt.timezone.utc).isoformat() + "\n", encoding="utf-8"
    )
    print(f"✓ done — {len(index)} documents in {corpus}")
    print(f"  index: {corpus / 'INDEX.md'}")


if __name__ == "__main__":
    main()
