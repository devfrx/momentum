/**
 * cloud.ipc.ts — IPC handlers for GitHub Gist cloud save operations
 */
import { ipcMain } from 'electron'
import {
  cloudSave,
  cloudLoad,
  storeToken,
  deleteToken,
  hasToken,
  getCloudInfo,
  validateToken,
  clearCloudConfig
} from '../services/gist.service'
import { exportSave, importSave } from '../database/db'

export function registerCloudIpc(): void {
  // ─── Cloud save ─────────────────────────────────────────────────
  ipcMain.handle('cloud:save', async () => {
    try {
      const json = exportSave()
      const gistId = await cloudSave(json)
      return { success: true, gistId }
    } catch (error) {
      console.error('[IPC cloud:save]', error)
      return { success: false, error: String(error) }
    }
  })

  // ─── Cloud load ─────────────────────────────────────────────────
  ipcMain.handle('cloud:load', async (_event, gistId?: string) => {
    try {
      const json = await cloudLoad(gistId)
      if (!json) return { success: false, error: 'No cloud save found' }

      const data = importSave(json)
      return { success: true, data }
    } catch (error) {
      console.error('[IPC cloud:load]', error)
      return { success: false, error: String(error) }
    }
  })

  // ─── Set GitHub token ──────────────────────────────────────────
  ipcMain.handle('cloud:setToken', async (_event, token: string) => {
    try {
      const stored = storeToken(token)
      if (!stored) return { success: false, error: 'Encryption not available' }

      // Validate the token
      const valid = await validateToken()
      if (!valid) {
        deleteToken()
        return { success: false, error: 'Invalid token' }
      }

      return { success: true }
    } catch (error) {
      console.error('[IPC cloud:setToken]', error)
      return { success: false, error: String(error) }
    }
  })

  // ─── Remove GitHub token ──────────────────────────────────────
  ipcMain.handle('cloud:removeToken', async () => {
    try {
      deleteToken()
      clearCloudConfig()
      return { success: true }
    } catch (error) {
      console.error('[IPC cloud:removeToken]', error)
      return { success: false, error: String(error) }
    }
  })

  // ─── Get cloud info ───────────────────────────────────────────
  ipcMain.handle('cloud:info', async () => {
    try {
      const info = getCloudInfo()
      return { success: true, ...info }
    } catch (error) {
      console.error('[IPC cloud:info]', error)
      return { success: false, error: String(error) }
    }
  })

  // ─── Validate token ──────────────────────────────────────────
  ipcMain.handle('cloud:validateToken', async () => {
    try {
      if (!hasToken()) return { success: false, error: 'No token configured' }
      const valid = await validateToken()
      return { success: true, valid }
    } catch (error) {
      console.error('[IPC cloud:validateToken]', error)
      return { success: false, error: String(error) }
    }
  })
}
