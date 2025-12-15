#!/usr/bin/env bun
/**
 * Stop hook: Type check tracked .ts files
 * Reads .claude/.ts-modified, runs tsc --noEmit, blocks on errors
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync, unlinkSync } from 'fs'
import { dirname, join, resolve } from 'path'

type StopInput = {
	hook_event_name: 'Stop'
	cwd: string
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

	const queueFile = resolve(input.cwd, '.claude', '.ts-modified')

	if (!existsSync(queueFile)) {
		console.log(JSON.stringify({ decision: 'approve', reason: '' }))
		return
	}

	const content = readFileSync(queueFile, 'utf-8')
	const files = [...new Set(content.split('\n').filter(Boolean))]

	// Clean up queue file
	unlinkSync(queueFile)

	if (files.length === 0) {
		console.log(JSON.stringify({ decision: 'approve', reason: '' }))
		return
	}

	// Find unique tsconfig directories
	const projectDirs = new Set<string>()
	for (const file of files) {
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

	console.log(JSON.stringify({
		decision: 'block',
		reason: `[typecheck] Type errors found:\n\n${allErrors.join('\n\n')}\n\nFix these errors.`
	}))
	process.exit(2)
}

main()
