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

# [Hook] Agent writes 10 files before you see what it's doing.

You said "implement feature". Agent wrote 10 files. Hope it's right.

```
BEFORE                              AFTER (with hook)
══════                              ═════════════════

Agent                               Agent
  │                                   │
  ├─ Write file1.ts                   ├─ Write file1.ts ──► Hook
  ├─ Write file2.ts                   │                      │
  ├─ Write file3.ts                   │◄── BLOCK ───────────┘
  ├─ ...                              │    "Show your plan"
  │                                   │
  ▼                                  You
[10 files changed                     │
 hope it's right]                     ├─"ok" ───►
                                      │
                                     Agent
                                      │
                                      ├─ flag = true
                                      ├─ Write file1.ts ✓
                                      ├─ Write file2.ts ✓
                                      ▼
                                     [you approved first]
```

```
┌─────────────────────────────────────────────────────────────┐
│                      HOW FLAG WORKS                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   First Write/Edit in session:                              │
│        │                                                    │
│        ├─ flag exists? ────────────────────────► ALLOW      │
│        │                                                    │
│        └─ no flag? ─────► create flag ─────────► DENY       │
│                           + "Show your plan"                │
│                                                             │
│   All subsequent writes: ALLOW (flag exists)                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────┐
│                       FLAG FORMAT                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   {project}/.cache/claude/first-write/                      │
│   └── {session_id}.flag                                     │
│                                                             │
│   Content: timestamp (for debugging)                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Setup

```bash
mkdir -p .claude/hooks
curl -o .claude/hooks/first-write.ts https://raw.githubusercontent.com/yemreak/claude-code-hooks/main/first-write/first-write.ts
```

`.claude/settings.json`:
```json
{
  "hooks": {
    "PreToolUse": [{ "matcher": "Edit|Write", "hooks": ["bun .claude/hooks/first-write.ts"] }]
  }
}
```

---

[yemreak/claude-code-hooks • GitHub](https://github.com/yemreak/claude-code-hooks)
