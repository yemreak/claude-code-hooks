# Claude Code Hooks

I wrote about [why hooks scale better than prompts and MCPs](https://www.reddit.com/r/ClaudeAI/comments/1pco8tc/prompts_dont_scale_mcps_dont_scale_hooks_do/). Then I made a [TLDR checklist](https://www.reddit.com/r/ClaudeAI/comments/1pet056/tldr_prompts_dont_scale_mcps_dont_scale_hooks_do/). Neither worked. So I made consumable implementations instead.

---

| Hook | Problem |
|------|---------|
| [file-locking](file-locking/) | 2 agents edit same file, one overwrites the other |
