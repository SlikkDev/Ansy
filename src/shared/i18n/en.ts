// English strings. Every key here must exist in he.ts too (tests/unit/i18n.test.ts checks).
// Keys are grouped by screen. Placeholders use {name}.
export const en = {
  'app.name': 'Ansy',
  'app.by': 'by Slikk.Dev',
  'app.tagline': 'Your website looks great. To you.',

  'skip.site': 'Jump to the site',
  'skip.panel': 'Jump to the experiences',

  'toolbar.back': 'Back',
  'toolbar.forward': 'Forward',
  'toolbar.reload': 'Reload',
  'toolbar.stop': 'Stop',
  'toolbar.settings': 'Settings',
  'toolbar.about': 'About Ansy',
  'toolbar.theme': 'Light theme',

  'address.label': 'Site address',
  'address.placeholder': 'Type your site’s address, like example.com',
  'address.go': 'Open',
  'address.invalid': 'That doesn’t look like a web address. Try something like example.com.',

  'site.loading': 'Loading…',
  'site.empty': 'No site open',
  'site.focus': 'Jump into the site',
  'site.region': 'Your site',

  'welcome.title': 'Your website looks great. To you.',
  'welcome.body':
    'Ansy lets you use your own site the way people with disabilities do, with the tools they rely on. Type your site’s address above to begin.',
  'welcome.hint': 'Tip: press {shortcut} at any time to get back to the address bar.',

  'error.title': 'Ansy couldn’t open this page',
  'error.body': 'Check the address and your internet connection, then try again.',
  'error.retry': 'Try again',

  'panel.title': 'Experiences',
  'panel.intro':
    'Each experience changes how your site looks, sounds or responds, so you meet the barrier yourself. They arrive in the next steps of the build:',
  'panel.soon': 'Coming next',

  'exp.colorBlindness': 'Color blindness',
  'exp.blurLowContrast': 'Blurred vision and low contrast',
  'exp.reader': 'Ansy Reader (screen reader)',
  'exp.zoom': 'Zoom to 200% and 400%',
  'exp.largeText': 'Large text and wider spacing',
  'exp.highContrast': 'High contrast',
  'exp.keyboard': 'Keyboard only',
  'exp.noSound': 'No sound',
  'exp.motion': 'Motion sensitivity',
  'exp.scan': 'Automatic scan',

  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.theme': 'Theme',
  'settings.theme.dark': 'Dark',
  'settings.theme.light': 'Light',
  'settings.theme.system': 'Follow the system',
  'settings.updates': 'Check for updates when Ansy starts',
  'settings.close': 'Close',

  'lang.en': 'English',
  'lang.he': 'עברית',

  'about.title': 'About Ansy',
  'about.version': 'Version {version}',
  'about.body':
    'A free, open-source desktop browser for experiencing your own website the way people with disabilities do, including the tools they use. Ansy is a testing and empathy tool. It never changes your site.',
  'about.disclaimer':
    'Ansy shows how your site behaves for some people with disabilities and the tools they use. It cannot certify that your site meets WCAG, IS 5568, the ADA or the European Accessibility Act. Only a full audit by a qualified person can.',
  'about.license':
    'The code is released under the MIT License. The Slikk.Dev name and logo are trademarks of Slikk.Dev, all rights reserved.',
  'about.source': 'Source code on GitHub',
  'about.builtBy': 'Built by',
  'about.credit': 'Built by Slikk.Dev, opens slikk.dev in your browser',
  'about.close': 'Close',

  'menu.file': 'File',
  'menu.edit': 'Edit',
  'menu.view': 'View',
  'menu.window': 'Window',
  'menu.help': 'Help',
  'menu.quit': 'Quit Ansy',
  'menu.undo': 'Undo',
  'menu.redo': 'Redo',
  'menu.cut': 'Cut',
  'menu.copy': 'Copy',
  'menu.paste': 'Paste',
  'menu.selectAll': 'Select all',
  'menu.toggleFullScreen': 'Full screen',
  'menu.minimize': 'Minimize',
  'menu.close': 'Close window',
  'menu.about': 'About Ansy',
  'menu.github': 'Ansy on GitHub',
  'menu.website': 'Ansy website',
} as const

export type MessageKey = keyof typeof en
