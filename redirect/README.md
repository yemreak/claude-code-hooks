---
scheduledFor: 2025-12-16
reddit:
  ClaudeAI:
    flair: Coding
    url: null
  claudecode:
    flair: Tutorial / Guide
    url: null
---

# [Hook] You say "use X, not Y". Next session: Y again.

Prompts don't persist. Hooks do.

```
BEFORE                              AFTER (with hook)
══════                              ═════════════════

Agent                               Agent
  │                                   │
  ├─ Y command ───►                   ├─ Y command ───► Hook
  │                                   │                  │
  ▼                                   │◄── BLOCK ───────┘
[not what you want]                   │    "Use: X"
                                      │
                                      ├─ X command ───►
                                      ▼
                                     [your preferred tool]
```

```
Y (agent's default)       X (your preference)
───────────────────       ──────────────────
pip install        →      uv pip install
grep/find          →      your MCP tool
any command        →      your script
```

```
┌─────────────────────────────────────────────────────────────┐
│                        HOOK FLOW                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   PreToolUse(Bash)                                          │
│        │                                                    │
│        ├─ command matches pattern? ────────────► DENY       │
│        │                             + "Use: X"             │
│        │                                                    │
│        └─ no match? ───────────────────────────► ALLOW      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Edit `REDIRECTS` in redirect.ts to add your own.

---

## Setup

```bash
mkdir -p .claude/hooks
curl -o .claude/hooks/redirect.ts https://raw.githubusercontent.com/yemreak/claude-code-hooks/main/redirect/redirect.ts
```

`.claude/settings.json`:
```json
{
  "hooks": {
    "PreToolUse": [{ "matcher": "Bash", "hooks": ["bun .claude/hooks/redirect.ts"] }]
  }
}
```

---

[yemreak/claude-code-hooks • GitHub](https://github.com/yemreak/claude-code-hooks)
