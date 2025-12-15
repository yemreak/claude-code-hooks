#!/usr/bin/env bun
/**
 * Stop hook: Type check changed .ts files before agent finishes
 *
 * Flow:
 * 1. git diff --name-only to find changed .ts files
 * 2. For each file, walk up to find tsconfig.json
 * 3. Run tsc --noEmit for each unique tsconfig dir
 * 4. Block if errors, pass if clean
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { dirname, join, resolve } from 'path'

type StopInput = {
	hook_event_name: 'Stop'
	cwd: string
}

type StopOutput = {
	decision: 'approve' | 'block'
	reason: string
}

function findTsConfig(filePath: string): string | null {
	let dir = dirname(filePath)
	while (dir !== '/') {
		const tsconfig = join(dir, 'tsconfig.json')
		if (existsSync(tsconfig)) return dir
		dir = dirname(dir)
	}
	return null
}

function getChangedTsFiles(cwd: string): string[] {
	try {
		// Get both staged and unstaged changes
		const output = execSync('git diff --name-only HEAD 2>/dev/null || git diff --name-only', {
			cwd,
			encoding: 'utf-8',
			timeout: 5000
		})
		return output
			.split('\n')
			.filter(f => f.endsWith('.ts') || f.endsWith('.tsx'))
			.map(f => resolve(cwd, f))
	} catch {
		return []
	}
}

function runTypeCheck(projectDir: string): string | null {
	try {
		execSync('npx tsc --noEmit 2>&1', {
			cwd: projectDir,
			encoding: 'utf-8',
			timeout: 30000
		})
		return null
	} catch (e) {
		const error = e as { stdout?: string; stderr?: string }
		const output = error.stdout || error.stderr || ''
		if (!output.includes('error TS')) return null
		return output.trim()
	}
}

async function main() {
	const input: StopInput = await Bun.stdin.json()

	if (input.hook_event_name !== 'Stop') {
		console.log(JSON.stringify({ decision: 'approve', reason: '' }))
		return
	}

	const changedFiles = getChangedTsFiles(input.cwd)

	if (changedFiles.length === 0) {
		console.log(JSON.stringify({ decision: 'approve', reason: '' }))
		return
	}

	// Find unique tsconfig directories
	const projectDirs = new Set<string>()
	for (const file of changedFiles) {
		const dir = findTsConfig(file)
		if (dir) projectDirs.add(dir)
	}

	if (projectDirs.size === 0) {
		console.log(JSON.stringify({ decision: 'approve', reason: '' }))
		return
	}

	// Run type check for each project
	const allErrors: string[] = []
	for (const dir of projectDirs) {
		const errors = runTypeCheck(dir)
		if (errors) {
			allErrors.push(`── ${dir} ──\n${errors}`)
		}
	}

	if (allErrors.length === 0) {
		console.log(JSON.stringify({ decision: 'approve', reason: '' }))
		return
	}

	const output: StopOutput = {
		decision: 'block',
		reason: `[typecheck] Type errors found:\n\n${allErrors.join('\n\n')}\n\nFix these errors before finishing.`
	}

	console.log(JSON.stringify(output))
	process.exit(2)
}

main()
