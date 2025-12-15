/**
 * IMPACT: Auto-redirect agent to your preferred tool when it uses wrong one
 * QUERY: "How to make agent use X instead of Y?"
 * YIELDS: PreToolUse hook - redirects Bash commands
 * CONSTRAINTS: Only affects Bash tool, Read/Write not affected
 */

export {}

const REDIRECTS: Record<string, string> = {
	'xcodebuild': 'make dev',
	'^pip\\s+install': 'uv pip install',
	'\\b(grep|find|rg)\\b': 'mcp__serena__search_for_pattern'
}

const input = JSON.parse(await Bun.stdin.text())
const tool = input.tool_name
const command = input.tool_input?.command || ''

if (tool !== 'Bash') {
	console.log(JSON.stringify({
		hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow', permissionDecisionReason: '' }
	}))
	process.exit(0)
}

for (const [pattern, replacement] of Object.entries(REDIRECTS)) {
	if (new RegExp(pattern).test(command)) {
		console.log(JSON.stringify({
			hookSpecificOutput: {
				hookEventName: 'PreToolUse',
				permissionDecision: 'deny',
				permissionDecisionReason: `[redirect] Use: ${replacement}`
			}
		}))
		process.exit(0)
	}
}

console.log(JSON.stringify({
	hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow', permissionDecisionReason: '' }
}))
