import type { MessageKey, Vars } from './i18n'

/**
 * Where a self-update stands. The main process pushes every change to Ansy's
 * screens; direct downloads update through GitHub Releases, the Store and
 * package managers through their own channels.
 */
export type UpdateStatus =
  | { phase: 'idle' }
  /** A development build, a Store build, or a Linux package the system manages. */
  | { phase: 'unsupported' }
  | { phase: 'checking' }
  | { phase: 'none'; version: string }
  | { phase: 'downloading'; version: string; percent: number }
  | { phase: 'ready'; version: string }
  | { phase: 'error' }

export const idleUpdate: UpdateStatus = { phase: 'idle' }

type Translate = (key: MessageKey, vars?: Vars) => string

/** One line for the About screen, or nothing while there is nothing to say. */
export function describeUpdate(status: UpdateStatus, t: Translate): string {
  switch (status.phase) {
    case 'idle':
      return ''
    case 'unsupported':
      return t('update.unsupported')
    case 'checking':
      return t('update.checking')
    case 'none':
      return t('update.none', { version: status.version })
    case 'downloading':
      return t('update.downloading', { version: status.version, percent: status.percent })
    case 'ready':
      return t('update.ready', { version: status.version })
    case 'error':
      return t('update.error')
  }
}
