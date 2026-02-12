/**
 * useNotify — Toast notification wrapper
 *
 * Wraps PrimeVue's useToast for game-specific notifications.
 */
import { useToast } from 'primevue/usetoast'

export type NotifySeverity = 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast'

export function useNotify() {
  const toast = useToast()

  function notify(
    severity: NotifySeverity,
    summary: string,
    detail?: string,
    life: number = 3000
  ): void {
    toast.add({ severity, summary, detail, life })
  }

  /** Achievement unlocked notification */
  function achievement(name: string, description?: string): void {
    notify('success', `🏆 ${name}`, description, 5000)
  }

  /** Income notification */
  function income(message: string): void {
    notify('info', message, undefined, 2000)
  }

  /** Warning (e.g. not enough cash) */
  function warning(message: string): void {
    notify('warn', message, undefined, 3000)
  }

  /** Error notification */
  function error(message: string, detail?: string): void {
    notify('error', message, detail, 5000)
  }

  /** Event notification */
  function event(name: string, description?: string): void {
    notify('contrast', `📰 ${name}`, description, 6000)
  }

  /** Prestige notification */
  function prestige(message: string): void {
    notify('secondary', `✨ ${message}`, undefined, 5000)
  }

  /** Generic info notification */
  function info(message: string, detail?: string): void {
    notify('info', message, detail, 3000)
  }

  /** Save notification */
  function saved(): void {
    notify('secondary', 'Game saved', undefined, 1500)
  }

  return { notify, achievement, income, warning, error, event, prestige, saved, info }
}
