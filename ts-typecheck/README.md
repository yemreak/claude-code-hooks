---
scheduledFor: 2025-12-17
reddit:
  ClaudeAI:
    flair: Coding
    url: null
  claudecode:
    flair: Tutorial / Guide
    url: null
---

# [Hook] Agent leaves type errors. You find out later.

Two hooks working together: track changes, check at the end.

```
BEFORE                              AFTER (with hooks)
══════                              ══════════════════

Agent                               Agent
  │                                   │
  ├─ Edit file.ts ───►                ├─ Edit file.ts ───► track.ts
  │                                   │                      │
  ├─ Edit another.ts ───►             │                      └─► queue
  │                                   │
  ▼                                   ├─ Edit another.ts ───► track.ts
"Done!"                               │                        │
                                      │                        └─► queue
[type errors exist]                   │
[you discover later]                  ▼
                                    Stop ───► check.ts
                                               │
                                               ├─ read queue
                                               ├─ find tsconfig (reverse lookup)
                                               ├─ tsc --noEmit
                                               │
                                               ├─ errors? ──► BLOCK
                                               │              "Fix these"
                                               │
                                               └─ clean? ──► PASS
```

```
┌─────────────────────────────────────────────────────────────┐
│                        HOOK FLOW                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   PostToolUse (track.ts)           Stop (check.ts)          │
│        │                                │                   │
│        ├─ Write/Edit .ts?               ├─ read queue       │
│        │                                │                   │
│        └─► append to queue              ├─ unique tsconfigs │
│            .claude/.ts-modified         │                   │
│                                         ├─ tsc --noEmit     │
│                                         │                   │
│                                         └─ errors? → BLOCK  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

```
WHY TWO HOOKS?
──────────────
PostToolUse  = track each .ts modification
Stop         = aggregate check (one tsc per project)
```

---

## Setup

```bash
mkdir -p .claude/hooks
curl -o .claude/hooks/typecheck-track.ts https://raw.githubusercontent.com/yemreak/claude-code-hooks/main/typecheck/track.ts
curl -o .claude/hooks/typecheck-check.ts https://raw.githubusercontent.com/yemreak/claude-code-hooks/main/typecheck/check.ts
```

`.claude/settings.json`:
```json
{
  "hooks": {
    "PostToolUse": [
      { "matcher": "Write|Edit", "hooks": ["bun .claude/hooks/typecheck-track.ts"] }
    ],
    "Stop": [
      { "hooks": ["bun .claude/hooks/typecheck-check.ts"] }
    ]
  }
}
```

---

[yemreak/claude-code-hooks • GitHub](https://github.com/yemreak/claude-code-hooks)
