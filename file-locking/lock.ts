import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, unlinkSync } from 'fs'
import { join } from 'path'

const STALE_MS = 60 * 1000

const input = JSON.parse(await Bun.stdin.text())
const cwd = input.cwd
const sessionId = input.session_id
const filePath = input.tool_input?.file_path
const event = input.hook_event_name

const locksDir = join(cwd, '.cache/claude/locks')

function getLockFile(path: string) {
	return join(locksDir, Buffer.from(path).toString('base64url') + '.lock')
}

function readLock(path: string) {
	const lockFile = getLockFile(path)
	if (!existsSync(lockFile)) return null
	const [sid, ts] = readFileSync(lockFile, 'utf-8').split('|')
	return { sessionId: sid, timestamp: parseInt(ts) || 0 }
}

function writeLock(path: string) {
	if (!existsSync(locksDir)) mkdirSync(locksDir, { recursive: true })
	writeFileSync(getLockFile(path), `${sessionId}|${Date.now()}`)
}

function clearLocks() {
	if (!existsSync(locksDir)) return
	for (const f of readdirSync(locksDir)) {
		if (!f.endsWith('.lock')) continue
		const content = readFileSync(join(locksDir, f), 'utf-8')
		const owner = content.split('|')[0]
		if (owner === sessionId) unlinkSync(join(locksDir, f))
	}
}

if (event === 'Stop') {
	clearLocks()
	console.log(JSON.stringify({ decision: 'allow' }))
	process.exit(0)
}

if (event === 'PostToolUse') {
	if (filePath) writeLock(filePath)
	console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: '' } }))
	process.exit(0)
}

if (event === 'PreToolUse' && filePath) {
	const lock = readLock(filePath)
	const isStale = lock && (Date.now() - lock.timestamp > STALE_MS || lock.timestamp === 0)

	if (lock && lock.sessionId !== sessionId && !isStale) {
		const remaining = Math.ceil((lock.timestamp + STALE_MS - Date.now()) / 1000)
		console.log(JSON.stringify({
			hookSpecificOutput: {
				hookEventName: 'PreToolUse',
				permissionDecision: 'deny',
				permissionDecisionReason: `[lock] session: ${lock.sessionId}\nremaining: ${remaining}s\n\nBash(sleep ${remaining})`
			}
		}))
		process.exit(0)
	}

	if (isStale) unlinkSync(getLockFile(filePath))
}

console.log(JSON.stringify({
	hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow', permissionDecisionReason: '' }
}))
