/**
 * IMPACT: Block first write to see agent's plan before it starts
 * QUERY: "How to see what agent will do before it writes?"
 * YIELDS: PreToolUse hook - blocks first Write/Edit, allows rest
 * CONSTRAINTS: Session-based flag, blocks once per session
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const input = JSON.parse(await Bun.stdin.text())
const cwd = input.cwd
const sessionId = input.session_id
const tool = input.tool_name

if (tool !== 'Write' && tool !== 'Edit') {
	console.log(JSON.stringify({
		hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow', permissionDecisionReason: '' }
	}))
	process.exit(0)
}

const flagDir = join(cwd, '.cache/claude/first-write')
const flagPath = join(flagDir, `${sessionId}.flag`)

if (existsSync(flagPath)) {
	console.log(JSON.stringify({
		hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow', permissionDecisionReason: '' }
	}))
	process.exit(0)
}

if (!existsSync(flagDir)) mkdirSync(flagDir, { recursive: true })
writeFileSync(flagPath, new Date().toISOString())

console.log(JSON.stringify({
	hookSpecificOutput: {
		hookEventName: 'PreToolUse',
		permissionDecision: 'deny',
		permissionDecisionReason: '[first-write] First write blocked.\nShow your plan, then retry.'
	}
}))
