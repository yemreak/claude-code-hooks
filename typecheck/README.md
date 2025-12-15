---
reddit:
  ClaudeAI:
    flair: Coding
    url: https://www.reddit.com/r/ClaudeAI/comments/1pnn04j/hook_agent_leaves_type_errors_you_find_out_later/
  claudecode:
    flair: Tutorial / Guide
    url: https://www.reddit.com/r/ClaudeCode/comments/1pnn05s/hook_agent_leaves_type_errors_you_find_out_later/
---

# [Hook] Agent leaves type errors. You find out later.

Stop hook catches them before agent finishes.

```
BEFORE                              AFTER (with hook)
══════                              ═════════════════

Agent                               Agent
  │                                   │
  ├─ Edit file.ts ───►                ├─ Edit file.ts ───►
  │                                   │
  ├─ Edit another.ts ───►             ├─ Edit another.ts ───►
  │                                   │
  ▼                                   ▼
"Done!"                             Stop Hook
                                      │
[type errors exist]                   ├─ find changed .ts files
[you discover later]                  ├─ find tsconfig.json (reverse lookup)
                                      ├─ tsc --noEmit
                                      │
                                      ├─ errors? ──► BLOCK
                                      │              "Fix these errors"
                                      │
                                      └─ no errors? ──► PASS
```

```
┌─────────────────────────────────────────────────────────────┐
│                      HOOK FLOW                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Stop                                                      │
│     │                                                       │
│     ├─ git diff --name-only *.ts                            │
│     │                                                       │
│     ├─ for each file:                                       │
│     │     └─ walk up → find tsconfig.json                   │
│     │                                                       │
│     ├─ unique tsconfig dirs                                 │
│     │                                                       │
│     ├─ for each dir:                                        │
│     │     └─ tsc --noEmit                                   │
│     │                                                       │
│     ├─ errors? ───────────────────────────────► BLOCK       │
│     │                                                       │
│     └─ no errors? ────────────────────────────► PASS        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

```
WHY STOP HOOK?
──────────────
PreToolUse   = before each edit (too early)
PostToolUse  = after each edit (too many checks)
Stop         = agent finished all edits (one final check)
```

---

## Setup

```bash
mkdir -p .claude/hooks
curl -o .claude/hooks/typecheck.ts https://raw.githubusercontent.com/yemreak/claude-code-hooks/main/typecheck/typecheck.ts
```

`.claude/settings.json`:
```json
{
  "hooks": {
    "Stop": [{ "hooks": ["bun .claude/hooks/typecheck.ts"] }]
  }
}
```

---

[yemreak/claude-code-hooks • GitHub](https://github.com/yemreak/claude-code-hooks)
