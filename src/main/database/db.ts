/**
 * db.ts — LowDB initialization for the Electron main process
 *
 * Uses JSONFileSync adapter (synchronous writes, safe for Electron main).
 * Save location: app.getPath('userData')/savegame.json
 *
 * IMPORTANT: LowDB v7 is ESM-only. We use dynamic import() in the init function.
 */
import { app } from 'electron'
import { join } from 'path'
import { type GameSave, createDefaultSave, CURRENT_SAVE_VERSION } from './schema'

// LowDB types (resolved at runtime via dynamic import)
type LowSync<T> = import('lowdb').LowSync<T>

let db: LowSync<GameSave> | null = null

/**
 * Initialize the database. Must be called after app.whenReady().
 * Uses dynamic import because lowdb v7 is ESM-only.
 */
export async function initDatabase(): Promise<LowSync<GameSave>> {
  if (db) return db

  const { LowSync } = await import('lowdb')
  const { JSONFileSync } = await import('lowdb/node')

  const savePath = join(app.getPath('userData'), 'savegame.json')
  console.log('[DB] Save file path:', savePath)

  const defaultData = createDefaultSave()
  const adapter = new JSONFileSync<GameSave>(savePath)

  db = new LowSync<GameSave>(adapter, defaultData)
  db.read()

  // Run migrations if needed
  if (db.data.version < CURRENT_SAVE_VERSION) {
    runMigrations(db.data)
    db.write()
  }

  return db
}

/**
 * Get the database instance. Throws if not initialized.
 */
export function getDatabase(): LowSync<GameSave> {
  if (!db) throw new Error('[DB] Database not initialized. Call initDatabase() first.')
  return db
}

/**
 * Save current state to disk.
 */
export function saveGame(): void {
  const database = getDatabase()
  database.data.savedAt = Date.now()
  database.write()
}

/**
 * Load saved state from disk.
 */
export function loadGame(): GameSave {
  const database = getDatabase()
  database.read()
  return database.data
}

/**
 * Reset save to default (new game).
 */
export function resetSave(): GameSave {
  const database = getDatabase()
  const fresh = createDefaultSave()
  database.data = fresh
  database.write()
  return fresh
}

/**
 * Import a save from a JSON string (e.g. from file import or cloud).
 */
export function importSave(jsonString: string): GameSave {
  const database = getDatabase()
  const parsed = JSON.parse(jsonString) as GameSave

  // Validate version
  if (typeof parsed.version !== 'number') {
    throw new Error('Invalid save file: missing version field')
  }

  // Run migrations if needed
  if (parsed.version < CURRENT_SAVE_VERSION) {
    runMigrations(parsed)
  }

  database.data = parsed
  database.write()
  return parsed
}

/**
 * Export current save as a JSON string.
 */
export function exportSave(): string {
  const database = getDatabase()
  database.data.savedAt = Date.now()
  return JSON.stringify(database.data, null, 2)
}

/**
 * Update a portion of the game state (partial update from renderer via IPC).
 */
export function updateGameState(partial: Partial<GameSave>): void {
  const database = getDatabase()
  Object.assign(database.data, partial)
}

// ─── Migrations ─────────────────────────────────────────────────────

/**
 * Run sequential migrations from saveData.version to CURRENT_SAVE_VERSION.
 * Each migration function mutates the save in place and bumps the version.
 */
function runMigrations(saveData: GameSave): void {
  const migrations: Record<number, (data: GameSave) => void> = {
    // Version 1 → 2: Add loans, deposits, storage, and ensure all new fields exist
    1: (data) => {
      // Ensure loans structure exists
      if (!data.loans || typeof data.loans !== 'object') {
        (data as unknown as Record<string, unknown>).loans = { loans: [], creditScore: 50, creditScoreFactors: { paymentHistory: 10, creditUtilization: 30, creditAge: 0, creditMix: 0, newCredit: 10 }, loanHistory: [], totalTicksWithCredit: 0, recentApplications: [], totalLoansTaken: 0, totalLoansRepaidOnTime: 0, totalLoansDefaulted: 0, totalInterestPaidEver: { m: 0, e: 0 } }
      }
      // Ensure deposits structure exists
      if (!data.deposits || typeof data.deposits !== 'object') {
        (data as unknown as Record<string, unknown>).deposits = { deposits: [], depositHistory: [], totalDeposited: { m: 0, e: 0 }, totalInterestEarnedEver: { m: 0, e: 0 }, totalDepositsOpened: 0, totalDepositsMatured: 0, totalEarlyWithdrawals: 0 }
      }
      // Ensure event state exists
      if (!data.eventState) {
        data.eventState = { activeEvents: [], cooldowns: {}, pendingChoices: [], totalTicks: 0 }
      }
      // Ensure totalPlayTime exists
      if (typeof data.totalPlayTime !== 'number') {
        data.totalPlayTime = 0
      }
      data.version = 2
    }
  }

  while (saveData.version < CURRENT_SAVE_VERSION) {
    const migrateFn = migrations[saveData.version]
    if (migrateFn) {
      console.log(`[DB] Running migration v${saveData.version} → v${saveData.version + 1}`)
      migrateFn(saveData)
    } else {
      // No migration defined, just bump version
      saveData.version++
    }
  }
}
