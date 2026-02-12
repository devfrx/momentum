/**
 * Gist Service — GitHub Gist API wrapper for cloud saves
 *
 * Handles creating, updating, and reading secret gists.
 * Token is encrypted via Electron's safeStorage.
 * All calls run in the main process (no CORS, token stays server-side).
 */
import { safeStorage } from 'electron'
import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'

const GIST_API_BASE = 'https://api.github.com'
const TOKEN_FILE = 'cloud-token.enc'
const GIST_CONFIG_FILE = 'cloud-config.json'

interface CloudConfig {
  gistId: string | null
  lastCloudSaveAt: number | null
}

// ─── Token management ───────────────────────────────────────────────

function getTokenPath(): string {
  return join(app.getPath('userData'), TOKEN_FILE)
}

function getConfigPath(): string {
  return join(app.getPath('userData'), GIST_CONFIG_FILE)
}

/**
 * Store a GitHub PAT securely using Electron's safeStorage.
 */
export function storeToken(token: string): boolean {
  if (!safeStorage.isEncryptionAvailable()) {
    console.error('[Gist] Encryption not available on this system')
    return false
  }

  const encrypted = safeStorage.encryptString(token)
  writeFileSync(getTokenPath(), encrypted)
  return true
}

/**
 * Retrieve the stored GitHub PAT.
 */
export function getToken(): string | null {
  const path = getTokenPath()
  if (!existsSync(path)) return null
  if (!safeStorage.isEncryptionAvailable()) return null

  try {
    const encrypted = readFileSync(path)
    return safeStorage.decryptString(encrypted)
  } catch {
    console.error('[Gist] Failed to decrypt token')
    return null
  }
}

/**
 * Delete stored token.
 */
export function deleteToken(): void {
  const path = getTokenPath()
  if (existsSync(path)) {
    writeFileSync(path, '')
  }
}

/**
 * Check if a token is configured.
 */
export function hasToken(): boolean {
  return existsSync(getTokenPath()) && readFileSync(getTokenPath()).length > 0
}

// ─── Config management ──────────────────────────────────────────────

function loadConfig(): CloudConfig {
  const path = getConfigPath()
  if (!existsSync(path)) {
    return { gistId: null, lastCloudSaveAt: null }
  }
  try {
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch {
    return { gistId: null, lastCloudSaveAt: null }
  }
}

function saveConfig(config: CloudConfig): void {
  writeFileSync(getConfigPath(), JSON.stringify(config, null, 2))
}

// ─── Gist API ───────────────────────────────────────────────────────

async function gistFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken()
  if (!token) throw new Error('No GitHub token configured')

  const url = `${GIST_API_BASE}${path}`
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {})
  }

  const response = await fetch(url, { ...options, headers })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`GitHub API error ${response.status}: ${body}`)
  }

  return response
}

/**
 * Save game data to a GitHub Gist (create or update).
 * @returns The gist ID
 */
export async function cloudSave(saveJson: string): Promise<string> {
  const config = loadConfig()

  const payload = {
    description: 'Business Tycoon — Cloud Save',
    public: false,
    files: {
      'savegame.json': {
        content: saveJson
      }
    }
  }

  let gistId: string

  if (config.gistId) {
    // Update existing gist
    await gistFetch(`/gists/${config.gistId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    })
    gistId = config.gistId
  } else {
    // Create new gist
    const response = await gistFetch('/gists', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    const data = await response.json()
    gistId = data.id
  }

  // Persist gist ID
  config.gistId = gistId
  config.lastCloudSaveAt = Date.now()
  saveConfig(config)

  return gistId
}

/**
 * Load game data from GitHub Gist.
 * @returns The save JSON string, or null if no cloud save found
 */
export async function cloudLoad(gistIdOverride?: string): Promise<string | null> {
  const config = loadConfig()
  const gistId = gistIdOverride ?? config.gistId

  if (!gistId) return null

  const response = await gistFetch(`/gists/${gistId}`, { method: 'GET' })
  const data = await response.json()

  const file = data.files?.['savegame.json']
  if (!file?.content) return null

  // If using a new gist ID, persist it
  if (gistIdOverride && gistIdOverride !== config.gistId) {
    config.gistId = gistIdOverride
    saveConfig(config)
  }

  return file.content
}

/**
 * Get info about the configured cloud save.
 */
export function getCloudInfo(): {
  hasToken: boolean
  gistId: string | null
  lastCloudSaveAt: number | null
} {
  const config = loadConfig()
  return {
    hasToken: hasToken(),
    gistId: config.gistId,
    lastCloudSaveAt: config.lastCloudSaveAt
  }
}

/**
 * Delete cloud configuration (does not delete the gist itself).
 */
export function clearCloudConfig(): void {
  saveConfig({ gistId: null, lastCloudSaveAt: null })
}

/**
 * Validate the stored token by making a lightweight API call.
 */
export async function validateToken(): Promise<boolean> {
  try {
    await gistFetch('/user', { method: 'GET' })
    return true
  } catch {
    return false
  }
}
