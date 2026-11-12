---
name: write-skills
description: "Create or draft AI agent skills. Use when asked to write, create, improve, or validate a skill, SKILL.md, or reusable agent workflow, especially when the skill content must appear at the end of the final response."
---

# Write Agent Skills

Create concise, usable skills for AI coding agents and put the complete skill content at the very end of the final response.

## Workflow

1. Identify the requested skill's purpose, trigger, intended audience, and whether the user wants a file created or only a draft. Use the current project as the default location when creating a project skill.
2. Check the project's existing skill conventions and avoid duplicating an existing skill. Use `.agents/skills/<skill-name>/SKILL.md` for project skills unless the user specifies another supported location.
3. Choose a short, descriptive, lowercase kebab-case name. Keep the directory name and frontmatter `name` identical.
4. Write valid YAML frontmatter with a required `name` and a specific `description` that includes when to invoke the skill. Keep the skill self-contained and focused on one repeatable workflow.
5. Add clear steps, decision points, and validation appropriate to the task. Avoid vague directions, unrelated rules, and unnecessary supporting files.
6. If creating a file, check that the destination does not overwrite existing user work, create the `SKILL.md`, and verify its path, frontmatter, and content. If the destination already exists, preserve it and make only requested changes.
7. In the final response, briefly summarize what was created or drafted. Then include the complete `SKILL.md` in a fenced Markdown block as the final content, with no text after it. When a file was created, make the fenced content match that file exactly.

## Boundaries

- Do not create a skill for unrelated prompts unless the user explicitly asks for one.
- Do not invent requirements or claim the skill was installed, tested, or created as a file unless verified.
- Keep secrets, credentials, and sensitive data out of skill content.
