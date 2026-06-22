Look at what has changed recently — use `git diff HEAD~1` or the current uncommitted changes if relevant — and add a single bullet point to `RELEASE_NOTES.md` under the latest version section.

Rules for the bullet point:
- One short sentence, no technical details (no file names, function names, variable names, or code)
- Describe what the user-facing change is, not how it was implemented
- Use the same style as existing entries: **Bold label** — short description
- Add it under the most appropriate section heading (Rules & Validation, Schedule Planning, etc.); create a new section heading if none fits
- Do not create a new version block — always append to the existing latest version
