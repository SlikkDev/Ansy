import { Menu, shell, type MenuItemConstructorOptions } from 'electron'
import { translate, type Locale } from '../shared/i18n'
import type { UiCommand } from '../shared/ipc'
import { ALLOWED_EXTERNAL } from './links'

interface MenuHandlers {
  command: (command: UiCommand) => void
  /** Null for builds that update through a store or package manager: the item is left out. */
  checkUpdates: (() => void) | null
}

/** The app menu, rebuilt whenever the interface language changes. */
export function buildMenu(locale: Locale, handlers: MenuHandlers, isDev: boolean): Menu {
  const t = (key: Parameters<typeof translate>[1]) => translate(locale, key)
  const isMac = process.platform === 'darwin'
  const updates: MenuItemConstructorOptions[] = handlers.checkUpdates
    ? [{ label: t('menu.checkUpdates'), click: handlers.checkUpdates }]
    : []

  const appMenu: MenuItemConstructorOptions[] = isMac
    ? [
        {
          label: t('app.name'),
          submenu: [
            { label: t('menu.about'), click: () => handlers.command('open-about') },
            ...updates,
            { type: 'separator' },
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit', label: t('menu.quit') },
          ],
        },
      ]
    : []

  const fileMenu: MenuItemConstructorOptions[] = isMac
    ? []
    : [{ label: t('menu.file'), submenu: [{ role: 'quit', label: t('menu.quit') }] }]

  const viewItems: MenuItemConstructorOptions[] = [
    { role: 'togglefullscreen', label: t('menu.toggleFullScreen') },
  ]
  if (isDev) viewItems.push({ type: 'separator' }, { role: 'toggleDevTools' })

  const template: MenuItemConstructorOptions[] = [
    ...appMenu,
    ...fileMenu,
    {
      label: t('menu.edit'),
      submenu: [
        { role: 'undo', label: t('menu.undo') },
        { role: 'redo', label: t('menu.redo') },
        { type: 'separator' },
        { role: 'cut', label: t('menu.cut') },
        { role: 'copy', label: t('menu.copy') },
        { role: 'paste', label: t('menu.paste') },
        { role: 'selectAll', label: t('menu.selectAll') },
      ],
    },
    { label: t('menu.view'), submenu: viewItems },
    {
      label: t('menu.window'),
      submenu: [
        { role: 'minimize', label: t('menu.minimize') },
        { role: 'close', label: t('menu.close') },
      ],
    },
    {
      label: t('menu.help'),
      role: 'help',
      submenu: [
        {
          label: t('menu.website'),
          click: () => void shell.openExternal(ALLOWED_EXTERNAL.website),
        },
        { label: t('menu.github'), click: () => void shell.openExternal(ALLOWED_EXTERNAL.github) },
        ...(isMac
          ? []
          : [
              { type: 'separator' } as MenuItemConstructorOptions,
              ...updates,
              { label: t('menu.about'), click: () => handlers.command('open-about') },
            ]),
      ],
    },
  ]

  return Menu.buildFromTemplate(template)
}
