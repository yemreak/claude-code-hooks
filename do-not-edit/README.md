# [Hook] You mark a file "DO NOT EDIT". Claude edits it anyway.

Your critical code is gone.

```
You                                  Claude
 │                                      │
 │  // [HOOK:DO NOT EDIT]               │
 │  // Critical auth logic              │
 │                                      │
 │  "Refactor the auth module"          │
 │  ─────────────────────────────────►  │
 │                                      │
 │                                      │  Edit(auth.ts)
 │                                      │  + "improved" version
 │                                      │
 │                                      ▼
 │                              ┌──────────────────┐
 │                              │    auth.ts       │
 │                              │                  │
 │                              │  your marker?    │
 │                              │  ✗ ignored       │
 │                              │                  │
 │                              │  original code?  │
 │                              │  ✗ gone          │
 │                              └──────────────────┘
```

**Comments are suggestions. Claude doesn't treat them as rules.**

> I wrote about [why hooks scale better than prompts and MCPs](https://www.reddit.com/r/ClaudeAI/comments/1pco8tc/prompts_dont_scale_mcps_dont_scale_hooks_do/). Then I made a [TLDR checklist](https://www.reddit.com/r/ClaudeAI/comments/1pet056/tldr_prompts_dont_scale_mcps_dont_scale_hooks_do/). Neither worked. So I made consumable implementations instead.

## With do-not-edit hook:

```
┌─────────────────────────────────────────────────────────────────┐
│                      FULL FILE PROTECTION                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  // [HOOK:DO NOT EDIT] Critical auth logic                      │
│  export function validateToken() { ... }                        │
│                                                                 │
│  Claude tries Edit(auth.ts)                                     │
│       │                                                         │
│       ▼                                                         │
│  ┌──────────────────────────────────┐                           │
│  │ SCAN: [HOOK:DO NOT EDIT] found   │                           │
│  │ ACTION: DENY                     │                           │
│  │ REASON: "Critical auth logic"    │                           │
│  └──────────────────────────────────┘                           │
│       │                                                         │
│       ▼                                                         │
│  Claude receives denial → works elsewhere                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────┐
│                      BLOCK PROTECTION                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  config.ts:                                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ // [HOOK:DO NOT EDIT:START]                                │ │
│  │ const API_KEY = "..."                                      │ │
│  │ const SECRET = "..."                                       │ │
│  │ // [HOOK:DO NOT EDIT:END]                                  │ │
│  │                                                            │ │
│  │ export const settings = { ... }  ← editable                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Claude tries Edit(config.ts, old="API_KEY")                    │
│       │                                                         │
│       ├─ target inside protected block?                         │
│       │       │                                                 │
│       │       ├─ YES ────────────────────────────► DENY         │
│       │       │                                                 │
│       │       └─ NO ─────────────────────────────► ALLOW        │
│       │                                                         │
└─────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────┐
│                          HOOK FLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PreToolUse(Write/Edit)                                         │
│       │                                                         │
│       ├─ no marker? ───────────────────────────────► ALLOW      │
│       │                                                         │
│       ├─ [HOOK:DO NOT EDIT] found? ────────────────► DENY       │
│       │   (full file protection)                                │
│       │                                                         │
│       ├─ [HOOK:DO NOT EDIT:START/END] found?                    │
│       │       │                                                 │
│       │       ├─ editing inside block? ────────────► DENY       │
│       │       │                                                 │
│       │       └─ editing outside block? ───────────► ALLOW      │
│       │                                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Setup

```bash
mkdir -p .claude/hooks
curl -o .claude/hooks/do-not-edit.ts https://raw.githubusercontent.com/yemreak/claude-code-hooks/main/do-not-edit/do-not-edit.ts
```

`.claude/settings.json`:
```json
{
  "hooks": {
    "PreToolUse": [{ "matcher": "Edit|Write", "hooks": ["bun .claude/hooks/do-not-edit.ts"] }]
  }
}
```

## Usage

Full file protection:
```typescript
// [HOOK:DO NOT EDIT] Critical authentication logic
export function validateToken() { ... }
```

Block protection:
```typescript
// [HOOK:DO NOT EDIT:START]
const API_KEY = "sk-..."
const DATABASE_URL = "postgres://..."
// [HOOK:DO NOT EDIT:END]

// This part can be edited
export const config = { ... }
```

---

[yemreak/claude-code-hooks • GitHub](https://github.com/yemreak/claude-code-hooks) | If you've built something similar, drop your implementation in the comments.
