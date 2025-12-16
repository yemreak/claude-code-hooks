#!/usr/bin/env bun
/**
 * IMPACT: Agent swift dosyası değiştirdiyse Stop'ta build hatası varsa block et
 * QUERY: "Swift check hook nerede?"
 * YIELDS: main() - stdin'den Stop alır, swift build çalıştırır, hata varsa block
 * CONSTRAINTS: Package.swift olan dizinde çalışır
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync, unlinkSync } from 'fs'
import { dirname, join, resolve } from 'path'

type StopInput = {
	hook_event_name: 'Stop'
	cwd: string
}

function findPackageSwift(filePath: string): string | null {
	let dir = dirname(filePath)
	while (dir !== '/') {
		const pkg = join(dir, 'Package.swift')
		if (existsSync(pkg)) return dir
		dir = dirname(dir)
	}
	return null
}

function runSwiftBuild(projectDir: string): string | null {
	try {
		execSync('swift build 2>&1', {
			cwd: projectDir,
			encoding: 'utf-8',
			timeout: 120000
		})
		return null
	} catch (e) {
		const error = e as { stdout?: string; stderr?: string }
		const output = error.stdout || error.stderr || ''
		if (!output.includes('error:')) return null
		return output.trim()
	}
}

async function main() {
	const input: StopInput = await Bun.stdin.json()

	if (input.hook_event_name !== 'Stop') {
		console.log(JSON.stringify({ decision: 'approve', reason: '' }))
		return
	}

	const queueFile = resolve(input.cwd, '.claude', '.swift-modified')

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

	// Find unique Package.swift directories
	const projectDirs = new Set<string>()
	for (const file of files) {
		const dir = findPackageSwift(file)
		if (dir) projectDirs.add(dir)
	}

	if (projectDirs.size === 0) {
		console.log(JSON.stringify({ decision: 'approve', reason: '' }))
		return
	}

	// Run swift build for each project
	const allErrors: string[] = []
	for (const dir of projectDirs) {
		const errors = runSwiftBuild(dir)
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
		reason: `[swift-typecheck] Build errors found:\n\n${allErrors.join('\n\n')}\n\nFix these errors.`
	}))
	process.exit(2)
}

main()
