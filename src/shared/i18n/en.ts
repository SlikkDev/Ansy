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
    'Pick an experience. Each one changes how your site looks, sounds or responds, so you meet the barrier yourself.',
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
  'panel.on': 'On',
  'panel.turnOn': 'Turn on',
  'panel.turnOff': 'Turn off',
  'panel.noSite': 'Open your site first, then turn an experience on.',
  'panel.whatHappens': 'What changes',
  'panel.lookFor': 'What to look for',
  'panel.noticed': 'What Ansy noticed on this page',
  'panel.noticedPending': 'Looking at the page…',
  'panel.status.on': '{name} is on',
  'panel.status.off': '{name} is off',
  'panel.options': 'Options',
  'panel.back': 'All experiences',

  'fidelity.label': 'Fidelity',
  'fidelity.high': 'Close to the real thing',
  'fidelity.medium': 'An approximation',

  'exp.colorBlindness.what':
    'Ansy repaints your site the way Chrome’s own simulation does for the type of color blindness you pick. About 1 in 12 men and 1 in 200 women see color this way.',
  'exp.colorBlindness.look':
    'Anything told by color alone: a red error, a green “in stock”, a highlighted step.\nLinks that only differ from the text around them by color.\nCharts, sizes or swatches you can no longer tell apart.',
  'exp.colorBlindness.fidelity': 'Chromium’s own simulation, the same one Chrome DevTools uses.',
  'exp.colorBlindness.mode': 'Type',
  'exp.vision.deuteranopia': 'Red-green (deuteranopia, the most common)',
  'exp.vision.protanopia': 'Red-green (protanopia)',
  'exp.vision.tritanopia': 'Blue-yellow (tritanopia)',
  'exp.vision.achromatopsia': 'No color at all (achromatopsia)',

  'exp.blurLowContrast.what':
    'Ansy blurs the page or drains its contrast, the way it looks to someone with low vision, cataracts, or a cracked phone in the sun.',
  'exp.blurLowContrast.look':
    'Small or thin text you can’t read anymore.\nGrey-on-white text, placeholders and light labels that fade away.\nButtons and fields whose edges disappear.',
  'exp.blurLowContrast.fidelity':
    'One blur and one contrast level; real low vision differs a lot from person to person.',
  'exp.blurLowContrast.mode': 'Kind',
  'exp.blur.blurredVision': 'Blurred vision',
  'exp.blur.reducedContrast': 'Low contrast',

  'exp.zoom.what':
    'Ansy zooms your site the way a browser does, or shows it 320 pixels wide, the narrowest width a page must still work at.',
  'exp.zoom.look':
    'Sideways scrolling to read a line.\nContent cut off, overlapping, or hidden behind something else.\nMenus and buttons you can no longer reach.',
  'exp.zoom.fidelity': 'Real browser zoom, the same as pressing Ctrl and plus.',
  'exp.zoom.level': 'Zoom',
  'exp.zoom.200': '200%',
  'exp.zoom.400': '400%',
  'exp.zoom.narrow': 'Show the site 320 pixels wide instead',

  'exp.largeText.what':
    'Ansy doubles the browser’s default text size, as many people set it in their own browser, and widens the spacing between lines, words and letters.',
  'exp.largeText.look':
    'Text that didn’t grow at all.\nText cut off, overlapping, or pushed out of its box.\nButtons whose label no longer fits.',
  'exp.largeText.fidelity':
    'The browser’s own font-size setting, and the exact spacing WCAG tests with.',
  'exp.largeText.size': 'Text at 200%',
  'exp.largeText.spacing': 'Wider spacing between lines, words and letters',

  'exp.highContrast.what':
    'Ansy repaints your site with a high-contrast system theme, as Windows does for people who turn one on. Colors and backgrounds are replaced; only outlines and text remain.',
  'exp.highContrast.look':
    'Buttons, links or fields that vanished.\nText baked into images, which stays exactly as it was.\nStates told by color only: which tab is open, which field has an error.',
  'exp.highContrast.fidelity':
    'Chromium’s forced-colors mode, the same engine behind Windows contrast themes.',

  'exp.motion.what':
    'Ansy tells your site the visitor asked for less motion, then counts what keeps moving. Motion can bring on dizziness, nausea or a migraine.',
  'exp.motion.look':
    'Animations that keep running after the request.\nVideo or audio that starts by itself.\nCarousels and tickers with no way to pause them.',
  'exp.motion.fidelity': 'The same “reduce motion” signal an operating system sends.',
  'exp.motion.animations': '{count} animations still running',
  'exp.motion.autoplay': '{count} media playing by themselves',
  'exp.motion.calm': 'Nothing kept moving',

  'exp.noSound.what':
    'Ansy mutes your site and checks every video and player for captions. Without them, whatever the sound said is gone.',
  'exp.noSound.look':
    'Videos without captions.\nAnything explained by sound alone: a chime, a voice, a beep for an error.\nPlayers from YouTube or Vimeo: check their captions by hand.',
  'exp.noSound.fidelity':
    'The mute is exact; the caption check covers the page’s own media and names the players it can’t see into.',
  'exp.noSound.media': '{count} video or audio elements',
  'exp.noSound.noCaptions': '{count} without captions',
  'exp.noSound.players': '{count} embedded players to check by hand',
  'exp.noSound.none': 'No video or audio on this page',

  'exp.reader.what':
    'A built-in screen reader with a virtual cursor and a visible transcript. Coming in a later step.',
  'exp.keyboard.what':
    'Mouse off, a bold focus ring and a tab-order trail. Coming in a later step.',
  'exp.scan.what':
    'An automatic check of the page against WCAG, explained in plain words. Coming in a later step.',
} as const

export type MessageKey = keyof typeof en
