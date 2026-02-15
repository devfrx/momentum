import { ElectronAPI } from '@electron-toolkit/preload'

interface GameAPI {
  // Local save/load
  saveLocal: (partialState?: unknown) => Promise<{ success: boolean; error?: string }>
  saveLocalSync: () => { success: boolean; error?: string }
  loadLocal: () => Promise<{ success: boolean; data?: unknown; error?: string }>
  resetSave: () => Promise<{ success: boolean; data?: unknown; error?: string }>
  exportFile: () => Promise<{ success: boolean; path?: string; error?: string }>
  importFile: () => Promise<{ success: boolean; data?: unknown; error?: string }>
  updateState: (partialState: unknown) => Promise<{ success: boolean; error?: string }>

  // Cloud save (GitHub Gist)
  cloudSave: () => Promise<{ success: boolean; gistId?: string; error?: string }>
  cloudLoad: (gistId?: string) => Promise<{ success: boolean; data?: unknown; error?: string }>
  cloudSetToken: (token: string) => Promise<{ success: boolean; error?: string }>
  cloudRemoveToken: () => Promise<{ success: boolean; error?: string }>
  cloudInfo: () => Promise<{
    success: boolean
    hasToken?: boolean
    gistId?: string | null
    lastCloudSaveAt?: number | null
    error?: string
  }>
  cloudValidateToken: () => Promise<{ success: boolean; valid?: boolean; error?: string }>

  // Window controls
  minimize: () => void
  maximize: () => void
  close: () => void

  // App info
  getVersion: () => Promise<string>

  // App lifecycle
  onBeforeClose: (callback: () => void) => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: GameAPI
  }
}
