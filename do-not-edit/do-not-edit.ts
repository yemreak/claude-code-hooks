/**
 * GOAL: Korumalı dosyalar/bloklar yanlışlıkla değiştirilmesin
 * QUERY: "do-not-edit hook nerede?"
 * YIELDS: PreToolUse hook - marker kontrolü
 */

import { existsSync, readFileSync } from 'fs'

const MARKER_FULL = '[HOOK:DO NOT EDIT]'
const MARKER_START = '[HOOK:DO NOT EDIT:START]'
const MARKER_END = '[HOOK:DO NOT EDIT:END]'

const input = JSON.parse(await Bun.stdin.text())
const event = input.hook_event_name
const toolName = input.tool_name
const filePath = input.tool_input?.file_path
const oldString = input.tool_input?.old_string
const newContent = input.tool_input?.content

if (event !== 'PreToolUse' || !filePath || !existsSync(filePath)) {
	console.log(JSON.stringify({
		hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow', permissionDecisionReason: '' }
	}))
	process.exit(0)
}

const content = readFileSync(filePath, 'utf-8')

if (!content.includes(MARKER_FULL) && !content.includes(MARKER_START)) {
	console.log(JSON.stringify({
		hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow', permissionDecisionReason: '' }
	}))
	process.exit(0)
}

function extractProtectedBlock(content: string): string | null {
	const startIdx = content.indexOf(MARKER_START)
	const endIdx = content.indexOf(MARKER_END)
	if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) return null
	return content.slice(startIdx, endIdx + MARKER_END.length)
}

function getMarkerReason(content: string): string | null {
	const idx = content.indexOf(MARKER_FULL)
	if (idx === -1) return null
	const lineStart = content.lastIndexOf('\n', idx) + 1
	const lineEnd = content.indexOf('\n', idx)
	const line = content.slice(lineStart, lineEnd === -1 ? undefined : lineEnd).trim()
	const afterMarker = line.slice(line.indexOf(MARKER_FULL) + MARKER_FULL.length).trim()
	return afterMarker || 'Protected file'
}

const protectedBlock = extractProtectedBlock(content)

if (protectedBlock) {
	const isEditingProtectedBlock =
		(toolName === 'Write' && newContent && !newContent.includes(protectedBlock)) ||
		(toolName === 'Edit' && oldString && protectedBlock.includes(oldString))

	if (isEditingProtectedBlock) {
		console.log(JSON.stringify({
			hookSpecificOutput: {
				hookEventName: 'PreToolUse',
				permissionDecision: 'deny',
				permissionDecisionReason: `[do-not-edit] Protected block in ${filePath}\nDo not modify content between ${MARKER_START} and ${MARKER_END}`
			}
		}))
		process.exit(0)
	}

	console.log(JSON.stringify({
		hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow', permissionDecisionReason: '' }
	}))
	process.exit(0)
}

const reason = getMarkerReason(content)
console.log(JSON.stringify({
	hookSpecificOutput: {
		hookEventName: 'PreToolUse',
		permissionDecision: 'deny',
		permissionDecisionReason: `[do-not-edit] ${filePath}\nReason: ${reason}`
	}
}))
