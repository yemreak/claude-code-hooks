---
reddit:
  ClaudeAI:
    flair: Coding
    url: null
  claudecode:
    flair: Tutorial / Guide
    url: null
---

# [Hook] Agent leaves Swift build errors. You find out later.

Two hooks working together: track changes, check at the end.

```
BEFORE                              AFTER (with hooks)
══════                              ══════════════════

Agent                               Agent
  │                                   │
  ├─ Edit File.swift ───►             ├─ Edit File.swift ───► track.ts
  │                                   │                         │
  ├─ Edit Another.swift ───►          │                         └─► queue
  │                                   │
  ▼                                   ├─ Edit Another.swift ───► track.ts
"Done!"                               │                           │
                                      │                           └─► queue
[build errors exist]                  │
[you discover later]                  ▼
                                    Stop ───► check.ts
                                               │
                                               ├─ read queue
                                               ├─ find Package.swift (reverse lookup)
                                               ├─ swift build
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
│        ├─ Write/Edit .swift?            ├─ read queue       │
│        │                                │                   │
│        └─► append to queue              ├─ find Package.swift│
│            .claude/.swift-modified      │                   │
│                                         ├─ swift build      │
│                                         │                   │
│                                         └─ errors? → BLOCK  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Setup

```bash
mkdir -p .claude/hooks
curl -o .claude/hooks/swift-track.ts https://raw.githubusercontent.com/yemreak/claude-code-hooks/main/swift-typecheck/track.ts
curl -o .claude/hooks/swift-check.ts https://raw.githubusercontent.com/yemreak/claude-code-hooks/main/swift-typecheck/check.ts
```

`.claude/settings.json`:
```json
{
  "hooks": {
    "PostToolUse": [
      { "matcher": "Write|Edit", "hooks": ["bun .claude/hooks/swift-track.ts"] }
    ],
    "Stop": [
      { "hooks": ["bun .claude/hooks/swift-check.ts"] }
    ]
  }
}
```

---

[yemreak/claude-code-hooks • GitHub](https://github.com/yemreak/claude-code-hooks)
