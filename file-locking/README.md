# You run 2 agents. Both edit config.ts. One overwrites the other.

Your changes are gone.

```
Agent A                              Agent B
   │                                    │
   │  Edit(config.ts)                   │  Edit(config.ts)
   │  + add feature X                   │  + fix bug Y
   │                                    │
   ▼                                    ▼
┌──────────────────────────────────────────────────────────────┐
│                        config.ts                             │
│                                                              │
│  feature X? ✗ gone                                           │
│  bug fix Y? ✓ saved                                          │
│                                                              │
│  Last write wins. First write lost.                          │
└──────────────────────────────────────────────────────────────┘
```

**Agents don't know about each other.**

---

## With file locking:

```
┌─────────────────────────────────────────────────────────────────┐
│  Agent A                           Agent B                      │
│     │                                 │                         │
│     │ Edit(config.ts)                 │                         │
│     ▼                                 │                         │
│  ┌──────┐                             │                         │
│  │ LOCK │ config.ts                   │                         │
│  └──────┘ session_a|1734001234567     │                         │
│     │                                 │                         │
│     │                                 │ Edit(config.ts)         │
│     │                                 ▼                         │
│     │                              ┌──────┐                     │
│     │                              │ DENY │                     │
│     │                              └──────┘                     │
│     │                                 │                         │
│     │                    ┌────────────┴────────────┐            │
│     │                    │ [lock] session: a       │            │
│     │                    │ remaining: 45 seconds   │            │
│     │                    │                         │            │
│     │                    │ Bash(sleep 45)          │            │
│     │                    └─────────────────────────┘            │
│     │                                 │                         │
│     │ ✓ done                          │ ... waits ...           │
│     ▼                                 │                         │
│  ┌───────┐                            │                         │
│  │ CLEAR │ session_a locks            │                         │
│  └───────┘                            │                         │
│                                       │                         │
│                                       │ Edit(config.ts)         │
│                                       ▼                         │
│                                    ┌───────┐                    │
│                                    │ ALLOW │                    │
│                                    └───────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────┐
│                        STALE LOCK RECOVERY                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Agent A crashes                   Agent B                      │
│     │                                 │                         │
│     │ Edit(file.ts)                   │                         │
│     ▼                                 │                         │
│  ┌──────┐                             │                         │
│  │ LOCK │ file.ts                     │                         │
│  └──────┘ session_a|1734001234567     │                         │
│     │                                 │                         │
│     X crash! (lock remains)           │                         │
│                                       │                         │
│          ... 1 minute passes ...      │                         │
│                                       │                         │
│                                       │ Edit(file.ts)           │
│                                       ▼                         │
│                          ┌────────────────────────┐             │
│                          │ lock.timestamp = 0:00  │             │
│                          │ now = 1:30             │             │
│                          │ stale? YES (> 1 min)   │             │
│                          └────────────────────────┘             │
│                                       │                         │
│                                       ▼                         │
│                                 ┌───────────┐                   │
│                                 │ DELETE    │ stale lock        │
│                                 │ ALLOW     │ edit              │
│                                 └───────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────┐
│                          LOCK FORMAT                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  .cache/claude/locks/                                           │
│  └── {base64url(file_path)}.lock                                │
│                                                                 │
│  Content: {session_id}|{timestamp}                              │
│                                                                 │
│  Example:                                                       │
│  └── L1VzZXJzLi4uY29uZmlnLnRz.lock                              │
│      → "955b4d85-3977-40ff|1734001234567"                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────┐
│                           HOOK FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PreToolUse(Write/Edit)                                         │
│       │                                                         │
│       ├─ no lock? ──────────────────────────────► ALLOW         │
│       │                                                         │
│       ├─ my lock? ──────────────────────────────► ALLOW         │
│       │                                                         │
│       ├─ stale lock? ───► delete ───────────────► ALLOW         │
│       │                                                         │
│       └─ other's lock? ─────────────────────────► DENY          │
│                                                   + remaining   │
│                                                     seconds     │
│                                                                 │
│  PostToolUse(Write/Edit)                                        │
│       │                                                         │
│       └─ write lock: {session_id}|{timestamp}                   │
│                                                                 │
│  Stop                                                           │
│       │                                                         │
│       └─ delete all locks owned by this session                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Setup

```bash
mkdir -p .claude/hooks
curl -o .claude/hooks/lock.ts https://raw.githubusercontent.com/.../lock.ts
```

`.claude/settings.json`:
```json
{
  "hooks": {
    "PreToolUse": [{ "matcher": "Edit|Write", "hooks": ["bun .claude/hooks/lock.ts"] }],
    "PostToolUse": [{ "matcher": "Edit|Write", "hooks": ["bun .claude/hooks/lock.ts"] }],
    "Stop": [{ "matcher": "", "hooks": ["bun .claude/hooks/lock.ts"] }]
  }
}
```

---

If you've built something similar, drop your implementation in the comments.
