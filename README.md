# Claude Code Hooks

I wrote about [why hooks scale better than prompts and MCPs](https://www.reddit.com/r/ClaudeAI/comments/1pco8tc/prompts_dont_scale_mcps_dont_scale_hooks_do/). Then I made a [TLDR checklist](https://www.reddit.com/r/ClaudeAI/comments/1pet056/tldr_prompts_dont_scale_mcps_dont_scale_hooks_do/). Neither worked. So I made consumable implementations instead.

---

| Hook | Problem | Posted |
|------|---------|--------|
| [file-locking](file-locking/) | 2 agents edit same file, one overwrites the other | [r/ClaudeAI](https://reddit.com/r/ClaudeAI/comments/1pkrcsd/) • [r/ClaudeCode](https://reddit.com/r/ClaudeCode/comments/1pkrct3/) |
| [do-not-edit](do-not-edit/) | You mark a file "DO NOT EDIT", Claude edits it anyway | not posted |
| [redirect](redirect/) | You say "use X, not Y". Next session: Y again | not posted |
| [first-write](first-write/) | Agent writes 10 files before you see what it's doing | not posted |
