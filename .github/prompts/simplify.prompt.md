---
description: "Review PR changes for safe, requirement-focused simplifications"
name: "Simplify PR changes"
argument-hint: "Optional: specify a PR, diff, or area to review"
agent: "agent"
---

Review the current PR changes and suggest ways to make them more minimal, focusing only on changes related to the user's requested behavior.

- Use the user's request as the requirement. Inspect the diff and only the surrounding code needed to judge each suggestion.
- Look for unnecessary code, duplicated logic, redundant abstractions, and changes broader than the request.
- Preserve behavior, tests, validation, authorization, error handling, accessibility, and existing project conventions. Do not recommend removing safeguards just to reduce lines.
- Ignore unrelated cleanup and stylistic preferences.
- Do not edit files or implement suggestions; this prompt is for review and recommendations only.
- If the request or relevant diff is unavailable, state what is missing rather than guessing. Follow the user's approval requirements before running any terminal command.

Return concise findings, highest-value first. For each, include:

1. The file or changed area.
2. The specific simplification.
3. Why it is safe and how it relates to the request.
4. Any trade-off or behavior risk.

If no worthwhile, safe simplifications are apparent, say so plainly.
