/**
 * save.ipc.ts — IPC handlers for local save/load operations
 *
 * Registered in the main process. Renderer invokes via window.api.
 */
import { ipcMain, dialog, BrowserWindow } from 'electron'
import { readFileSync, writeFileSync } from 'fs'
import {
  saveGame,
  loadGame,
  resetSave,
  importSave,
  exportSave,
  updateGameState
} from '../database/db'
import type { GameSave } from '../database/schema'

export function registerSaveIpc(): void {
  // ─── Save game locally ──────────────────────────────────────────
  ipcMain.handle('save:local', async (_event, partialState?: Partial<GameSave>) => {
    try {
      if (partialState) {
        updateGameState(partialState)
      }
      saveGame()
      return { success: true }
    } catch (error) {
      console.error('[IPC save:local]', error)
      return { success: false, error: String(error) }
    }
  })

  // ─── Load game from disk ────────────────────────────────────────
  ipcMain.handle('save:load', async () => {
    try {
      const data = loadGame()
      return { success: true, data }
    } catch (error) {
      console.error('[IPC save:load]', error)
      return { success: false, error: String(error) }
    }
  })

  // ─── Reset (new game) ──────────────────────────────────────────
  ipcMain.handle('save:reset', async () => {
    try {
      const data = resetSave()
      return { success: true, data }
    } catch (error) {
      console.error('[IPC save:reset]', error)
      return { success: false, error: String(error) }
    }
  })

  // ─── Export save to file (user picks location) ──────────────────
  ipcMain.handle('save:exportFile', async (event) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (!win) throw new Error('No window found')

      const { filePath, canceled } = await dialog.showSaveDialog(win, {
        title: 'Export Save',
        defaultPath: 'business-tycoon-save.json',
        filters: [{ name: 'JSON Save File', extensions: ['json'] }]
      })

      if (canceled || !filePath) return { success: false, error: 'canceled' }

      const json = exportSave()
      writeFileSync(filePath, json, 'utf-8')
      return { success: true, path: filePath }
    } catch (error) {
      console.error('[IPC save:exportFile]', error)
      return { success: false, error: String(error) }
    }
  })

  // ─── Import save from file ────────────────────────────────────
  ipcMain.handle('save:importFile', async (event) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (!win) throw new Error('No window found')

      const { filePaths, canceled } = await dialog.showOpenDialog(win, {
        title: 'Import Save',
        filters: [{ name: 'JSON Save File', extensions: ['json'] }],
        properties: ['openFile']
      })

      if (canceled || filePaths.length === 0) return { success: false, error: 'canceled' }

      const json = readFileSync(filePaths[0], 'utf-8')
      const data = importSave(json)
      return { success: true, data }
    } catch (error) {
      console.error('[IPC save:importFile]', error)
      return { success: false, error: String(error) }
    }
  })

  // ─── Update partial state (from renderer auto-save) ─────────────
  ipcMain.handle('save:updateState', async (_event, partialState: Partial<GameSave>) => {
    try {
      updateGameState(partialState)
      saveGame()
      return { success: true }
    } catch (error) {
      console.error('[IPC save:updateState]', error)
      return { success: false, error: String(error) }
    }
  })
}
