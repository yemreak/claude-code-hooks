#!/usr/bin/env bun
/**
 * PostToolUse hook: Track modified .ts files
 * Appends to .claude/.ts-modified for Stop hook to check
 */

import { appendFileSync, mkdirSync } from 'fs'
import { dirname, resolve } from 'path'

type PostToolUseInput = {
	hook_event_name: 'PostToolUse'
	tool_name: string
	tool_input: Record<string, unknown>
	cwd: string
}

const WRITE_TOOLS = ['Write', 'Edit', 'mcp__serena__replace_symbol_body', 'mcp__serena__insert_after_symbol', 'mcp__serena__insert_before_symbol', 'mcp__serena__replace_content', 'mcp__serena__create_text_file']

function extractFilePath(toolName: string, input: Record<string, unknown>): string | null {
	if (input.file_path) return input.file_path as string
	if (input.relative_path) return input.relative_path as string
	return null
}

async function main() {
	const input: PostToolUseInput = await Bun.stdin.json()

	if (input.hook_event_name !== 'PostToolUse') {
		console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: '' } }))
		return
	}

	if (!WRITE_TOOLS.includes(input.tool_name)) {
		console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: '' } }))
		return
	}

	const filePath = extractFilePath(input.tool_name, input.tool_input)
	if (!filePath) {
		console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: '' } }))
		return
	}

	if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) {
		console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: '' } }))
		return
	}

	const absPath = filePath.startsWith('/') ? filePath : resolve(input.cwd, filePath)
	const queueFile = resolve(input.cwd, '.claude', '.ts-modified')

	mkdirSync(dirname(queueFile), { recursive: true })
	appendFileSync(queueFile, absPath + '\n')

	console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: '' } }))
}

main()
