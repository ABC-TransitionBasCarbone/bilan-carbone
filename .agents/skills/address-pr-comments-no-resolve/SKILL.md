---
name: address-pr-comments-no-resolve
description: 'Review active pull request comments, suggest code changes, implement appropriate fixes, and draft replies for your review without posting or resolving threads. Use when: responding to PR feedback, suggesting changes, fixing review comments, or drafting comment replies.'
argument-hint: 'Optionally specify a reviewer name, thread, or file to focus on'
---

# Address PR Review Comments Without Resolving Threads

Read the active pull request, identify unresolved review comments and feedback, implement the requested changes, and leave GitHub review threads unresolved.

Apply `/ponytail` while implementing changes. Before the final summary, apply `/ponytail-review` to your own diff and remove unnecessary complexity when it is safe to do so.

## Procedure

### 1. Read the Active PR

Prefer approved read-only `gh` commands to identify the current branch's PR and retrieve its feedback. Ask for approval before every terminal command; approval applies only to that exact command.
Alternatively, discover an available read-only PR tool. Do not depend on one extension-specific tool name or assume every harness exposes the same tools.
Capture the PR URL and retrieve current review threads, reviews, and general comments, including pagination. If the PR cannot be identified, ask the user for its URL or number.
If a selected tool returns cached data, refresh when its timestamp is missing or at least 3 minutes old. Reuse newer data without an unnecessary refresh. If freshness cannot be established, report that limitation.
Capture comment permalinks returned by the selected API. Do not use internal review-thread IDs as visible references.

### 2. Identify Unresolved Comments

From the selected tool's result, collect feedback that needs action:
- Inline review threads: capture their IDs, resolution state, file paths, and nested comments. Focus on unresolved threads; do not infer resolution from a flat comment list.
- General PR comments and reviews: include actionable comments and reviews with `CHANGES_REQUESTED` or `COMMENTED` state.
- Capture the exact comment permalink (`html_url` or GraphQL `url`). If missing, retrieve it with read-only review-comment or PR-comment metadata and match by comment content and author. Never construct or guess a `discussion_r` or `issuecomment` anchor.

Group related threads by file so they can be handled efficiently.

### 3. Assess Comments and Suggest Changes

Before modifying files:
- Read each unresolved comment carefully.
- Identify the file and location each comment refers to.
- Explain what each comment is asking for and recommend a concrete change, including the relevant file or behavior.
- Decide whether a code change is warranted. If the feedback is mistaken, already addressed, or asks a question rather than requesting a change, explain that and recommend an appropriate response instead of making an unnecessary edit.
- Note dependencies between comments, such as a rename that affects multiple files.
- When general feedback asks for a clearer or shorter PR description, inspect and preserve the repository's template, then prepare a concise French draft in chat: put a one-sentence TL;DR near the top, explain or remove ambiguous references, and keep only context reviewers need to understand the change and its impact. Keep technical terms in their original language. Include exact validation commands and results when the template requires them; otherwise avoid repeating CI details. Retain required sections, checklist items, and useful deployment or validation instructions.

Implement minimal, clearly correct fixes by default; do not wait for approval for routine changes. If a comment is ambiguous or has materially different possible interpretations, do not guess for that comment: state the options and a recommended follow-up. Continue with unrelated clear fixes.

### 4. Implement Changes

Work through grouped comments file by file:
- Read the relevant file section before editing.
- Apply the requested change.
- Do not refactor or modify code outside the scope of each comment.
- If a comment is unclear or contradictory, include it as a follow-up question in the final summary rather than guessing.

### 5. Verify

After changes are made:
- Review that each originally unresolved thread has a corresponding code change or a note explaining why no change was made.
- Run the narrowest relevant validation available for the touched files.
- Ensure no unrelated code was modified.

### 6. Do Not Resolve or Write to GitHub

Do not resolve review comments or threads directly on GitHub.
Do not comment on, reply to, close, or otherwise mutate GitHub issues, pull requests, comments, or review threads.

### 7. Summarize

For every unresolved review thread and actionable timeline comment, prepare a concise draft reply that directly addresses the comment. Include URLs to authoritative technical documentation for technical explanations, choosing sources relevant to the specific point (for example, official framework or language documentation). Do not invent or include a link unless it supports the statement; if no suitable documentation exists, say so and distinguish repository-specific behavior from documented technical facts. Keep these replies as drafts in the final response and do not post them to GitHub.
Prefix each drafted reply with a clickable link to the exact actionable comment, using its `html_url`. Use the comment URL for every reply rather than the PR's root URL, and do not identify replies by internal `PRRT_…` IDs. If a comment URL cannot be retrieved, say so instead of guessing or fabricating an anchor.
For inline comments with a current file path and line in the local workspace, also provide an `Open code in VS Code` link using `vscode://file/<absolute-path>:<line>`. This opens the source location only; it does not open the review thread. Keep the GitHub comment permalink for the comment itself. Do not create a VS Code source link for outdated comments or when the local path/line cannot be verified.

Provide a concise summary of:
- For each actionable comment: what it asks, the suggested change, whether it was implemented, and what changed.
- Which comments were intentionally skipped or need clarification, with reasoning and a recommended follow-up.
- Any follow-up questions for the reviewer.
- A concise draft reply for each unresolved comment, with relevant documentation URLs for technical points. Tailor the draft to the action taken (or explain why no code change is recommended) so the user can review and post it themselves.
- A note that GitHub review threads were left unresolved.
