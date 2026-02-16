import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

/**
 * Game API exposed to the renderer process via contextBridge.
 * All calls invoke IPC handlers registered in the main process.
 */
const api = {
  // ─── Local Save/Load ────────────────────────────────────────────
  saveLocal: (partialState?: unknown) => ipcRenderer.invoke('save:local', partialState),
  saveLocalSync: (partialState?: unknown) => ipcRenderer.sendSync('save:sync', partialState) as { success: boolean; error?: string },
  loadLocal: () => ipcRenderer.invoke('save:load'),
  resetSave: () => ipcRenderer.invoke('save:reset'),
  exportFile: () => ipcRenderer.invoke('save:exportFile'),
  importFile: () => ipcRenderer.invoke('save:importFile'),
  updateState: (partialState: unknown) => ipcRenderer.invoke('save:updateState', partialState),

  // ─── Cloud Save (GitHub Gist) ──────────────────────────────────
  cloudSave: () => ipcRenderer.invoke('cloud:save'),
  cloudLoad: (gistId?: string) => ipcRenderer.invoke('cloud:load', gistId),
  cloudSetToken: (token: string) => ipcRenderer.invoke('cloud:setToken', token),
  cloudRemoveToken: () => ipcRenderer.invoke('cloud:removeToken'),
  cloudInfo: () => ipcRenderer.invoke('cloud:info'),
  cloudValidateToken: () => ipcRenderer.invoke('cloud:validateToken'),

  // ─── Window controls ──────────────────────────────────────────
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),

  // ─── App info ─────────────────────────────────────────────────
  getVersion: () => ipcRenderer.invoke('app:version'),

  // ─── App lifecycle ────────────────────────────────────────────
  onBeforeClose: (callback: () => void) => {
    // Remove any previous listener to prevent accumulation on re-mount
    ipcRenderer.removeAllListeners('app:before-close')
    ipcRenderer.once('app:before-close', () => callback())
  }
}

// Expose APIs to renderer
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
