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
  'welcome.practice': 'Or try the practice shop',
  'welcome.practiceHint': 'A small shop built with the usual mistakes, to try the experiences on.',

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
  'exp.tunnelVision': 'Tunnel and central vision loss',
  'exp.haze': 'Cataracts and glare',
  'exp.darkMode': 'Dark mode',
  'exp.tremor': 'Tremor and unsteady hands',
  'exp.switchAccess': 'Switch access',
  'exp.voiceControl': 'Voice control',
  'exp.readingAids': 'Dyslexia and reading aids',
  'exp.plainLanguage': 'Plain language',
  'exp.flashing': 'Seizure risk from flashing',

  'area.vision': 'Sight and blindness',
  'area.lowVision': 'Low vision and light sensitivity',
  'area.motor': 'Moving and clicking',
  'area.hearing': 'Hearing',
  'area.cognitive': 'Focus and reading',
  'area.check': 'For every visitor',

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
  'about.updates': 'Updates',
  'about.privacy': 'Privacy note',

  'update.checkNow': 'Check now',
  'update.checking': 'Checking…',
  'update.none': 'Ansy {version} is up to date.',
  'update.downloading': 'Downloading Ansy {version}… {percent}%',
  'update.ready': 'Ansy {version} is ready. Restart to update.',
  'update.restart': 'Restart now',
  'update.later': 'Later',
  'update.error': 'Could not check for updates. Try again later.',
  'update.unsupported': 'This build is updated by the store or package it came from.',
  'update.privacy':
    'The update check asks GitHub Releases for the latest version and sends nothing about you or your sites.',

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
  'menu.checkUpdates': 'Check for updates…',
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
  'fidelity.low': 'A rough impression',

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

  'exp.tunnelVision.what':
    'Ansy blacks out all but a small circle around the mouse and the keyboard focus, the way glaucoma or retinitis pigmentosa narrows the view. Or the opposite: a grey patch wherever the eye looks, as with macular degeneration, the most common cause of low vision in older people.',
  'exp.tunnelVision.look':
    'The cart, the menu or the search, far from where you are looking.\nError messages that appear somewhere else on the page than the field.\nPop-ups and notices at the edge of the screen that nobody sees.',
  'exp.tunnelVision.fidelity':
    'Real field loss differs from person to person, and people who live with it learn to scan. Many use a screen magnifier; try Zoom to 400% for the tool itself.',
  'exp.tunnelVision.mode': 'Kind',
  'exp.field.tunnel': 'Tunnel vision: only the middle is left (glaucoma, retinitis pigmentosa)',
  'exp.field.central': 'Central loss: the middle is gone (macular degeneration)',

  'exp.haze.what':
    'Ansy lays a veil over your site: the cloudy, yellowed view of a cataract, or a screen flooded with sunlight. Both drain contrast, and that is where faint design fails first.',
  'exp.haze.look':
    'Light grey text, thin fonts and placeholder text that disappear.\nButtons and fields whose edges fade into the background.\nText laid over photos.',
  'exp.haze.fidelity':
    'Only the loss of contrast, roughly. The tools people reach for are high contrast, dark mode and larger text, each one in this list.',
  'exp.haze.mode': 'Kind',
  'exp.haze.cataract': 'Cataracts: cloudy and yellowed',
  'exp.haze.glare': 'Glare: bright sun on the screen',

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

  'exp.darkMode.what':
    'Ansy tells your site the visitor prefers dark mode, as a phone or computer set to dark does. People with light sensitivity, migraines and some kinds of low vision rely on it. Sites with a dark theme switch to it; the rest stay bright.',
  'exp.darkMode.look':
    'A page that stays bright white.\nText, icons or logos that vanish against a dark background.\nImages and charts with white boxes around them.',
  'exp.darkMode.fidelity':
    'The same dark preference the operating system sends; the darkening option is Chrome’s own auto dark mode.',
  'exp.darkMode.force': 'Also darken sites that have no dark theme',
  'exp.darkMode.forceHint':
    'Like Chrome’s auto dark mode or a dark-mode extension, which many light-sensitive visitors use.',
  'exp.darkMode.has': 'The site switched to a dark theme',
  'exp.darkMode.none': 'The site stayed light: it has no dark theme of its own',

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
    'Ansy reads your site the way a screen reader does: from the page’s accessibility tree, in order, one item at a time, with the keys screen reader users press. Everything it says appears in the transcript, so you see exactly what a blind visitor hears, and nothing else.',
  'exp.reader.look':
    'Buttons, links and images announced with no name, or a name that means nothing out of context.\nForm fields that don’t say what to type.\nHeadings that skip levels or are missing, so there is no outline to jump through.\nNo landmarks: no “main”, no “navigation” to jump to.\nAnything you only understand by seeing it.',
  'exp.reader.fidelity':
    'Ansy Reader reads Chromium’s accessibility tree, the same tree real screen readers are given, with the everyday keys of NVDA and JAWS. It is not NVDA, JAWS or VoiceOver: those have many more commands and their own ways. Testers who use a real screen reader should still have the last word.',
  'exp.reader.voice': 'Speak aloud',
  'exp.reader.rate': 'Speed',
  'exp.reader.rate.slow': 'Slow',
  'exp.reader.rate.normal': 'Normal',
  'exp.reader.rate.fast': 'Fast',
  'exp.reader.cover': 'Cover the screen',
  'exp.reader.coverHint': 'The site goes black. Your ears are all you have, like a blind visitor.',
  'exp.reader.voiceOk': 'Voice: {name}',
  'exp.reader.noVoice':
    'No {language} voice is installed on this computer, so Ansy Reader shows the transcript only.',
  'exp.reader.noVoice.linux':
    'On Linux, install speech-dispatcher and a voice such as espeak-ng, then start Ansy again.',
  'exp.reader.noVoice.darwin':
    'On a Mac, add one under System Settings, Accessibility, Spoken Content, System Voice.',
  'exp.reader.noVoice.win32': 'On Windows, add one under Settings, Time & language, Speech.',
  'exp.reader.language.en': 'English',
  'exp.reader.language.he': 'Hebrew',
  'exp.reader.current': 'Reading now',
  'exp.reader.nothing':
    'Nothing read yet. Click into the site and press the down arrow, or use the buttons here.',
  'exp.reader.counts':
    'Headings {headings} · Links {links} · Form fields {fields} · Landmarks {landmarks}',
  'exp.reader.prev': 'Previous',
  'exp.reader.next': 'Next',
  'exp.reader.activate': 'Activate',
  'exp.reader.readAll': 'Read on from here',
  'exp.reader.stop': 'Stop reading',
  'exp.reader.refresh': 'Read the page again',
  'exp.reader.saveCurrent': 'Save as finding',
  'exp.reader.keys': 'Keys, while the site has focus',
  'exp.reader.keys.list':
    '↓ and ↑: next and previous item\nTab and Shift+Tab: next and previous control, like any visitor\nH: next heading · 1 to 6: a heading of that level\nK: link · B: button · F: form field · E: text field · L: list · G: graphic · D: landmark · T: table\nShift with a letter: the previous one\nEnter or Space: activate what is being read\nCtrl+Home and Ctrl+End: top and bottom of the page\nCtrl on its own: stop speaking\nEscape: leave a text field and read on',
  'exp.reader.transcript': 'Transcript',
  'exp.reader.transcriptEmpty': 'What Ansy Reader says appears here.',
  'exp.reader.clear': 'Clear the transcript',
  'exp.reader.mode.browse': 'Browse mode: the keys move the reader',
  'exp.reader.mode.focus': 'Focus mode: the keys go to the field',

  'reader.page':
    '{title}. Page loaded. Headings: {headings}. Links: {links}. Form fields: {fields}. Landmarks: {landmarks}.',
  'reader.untitled': 'Untitled page',
  'reader.truncated': 'The page is long; Ansy reads its first {count} items.',
  'reader.empty': 'Nothing to read. Open a page first.',
  'reader.top': 'Top',
  'reader.bottom': 'Bottom',
  'reader.noNext': 'No next {what}',
  'reader.noPrev': 'No previous {what}',
  'reader.what.heading': 'heading',
  'reader.what.headingLevel': 'heading level {level}',
  'reader.what.link': 'link',
  'reader.what.button': 'button',
  'reader.what.field': 'form field',
  'reader.what.edit': 'edit field',
  'reader.what.list': 'list',
  'reader.what.image': 'graphic',
  'reader.what.landmark': 'landmark',
  'reader.what.table': 'table',
  'reader.mode.browse': 'Browse mode',
  'reader.mode.focus': 'Focus mode',
  'reader.blank': 'blank',
  'reader.unnamed': '(no name)',
  'reader.wholePage': 'The whole page',
  'reader.role.heading': 'heading level {level}',
  'reader.role.link': 'link',
  'reader.role.button': 'button',
  'reader.role.edit': 'edit',
  'reader.role.multiline': 'multi line',
  'reader.role.combobox': 'combo box',
  'reader.role.listbox': 'list box',
  'reader.role.checkbox': 'check box',
  'reader.role.radio': 'radio button',
  'reader.role.switch': 'switch',
  'reader.role.slider': 'slider',
  'reader.role.spinbutton': 'spin button',
  'reader.role.image': 'graphic',
  'reader.role.list': 'list with {count} items',
  'reader.role.listOne': 'list with 1 item',
  'reader.role.listEnd': 'out of list',
  'reader.role.table': 'table with {rows} rows and {columns} columns',
  'reader.role.tableEnd': 'out of table',
  'reader.role.header': 'column header',
  'reader.role.dialog': 'dialog',
  'reader.role.figure': 'figure',
  'reader.role.separator': 'separator',
  'reader.role.tab': 'tab',
  'reader.role.menuitem': 'menu item',
  'reader.role.option': 'option',
  'reader.role.progressbar': 'progress bar',
  'reader.role.video': 'video',
  'reader.role.audio': 'audio',
  'reader.role.frame': 'frame',
  'reader.landmark.navigation': 'navigation landmark',
  'reader.landmark.main': 'main landmark',
  'reader.landmark.banner': 'banner landmark',
  'reader.landmark.contentinfo': 'content info landmark',
  'reader.landmark.complementary': 'complementary landmark',
  'reader.landmark.search': 'search landmark',
  'reader.landmark.form': 'form landmark',
  'reader.landmark.region': 'region landmark',
  'reader.state.checked': 'checked',
  'reader.state.unchecked': 'not checked',
  'reader.state.mixed': 'half checked',
  'reader.state.pressed': 'pressed',
  'reader.state.notPressed': 'not pressed',
  'reader.state.expanded': 'expanded',
  'reader.state.collapsed': 'collapsed',
  'reader.state.disabled': 'unavailable',
  'reader.state.required': 'required',
  'reader.state.invalid': 'invalid entry',
  'reader.state.readonly': 'read only',
  'reader.state.selected': 'selected',
  'reader.state.current': 'current',
  'reader.state.on': 'on',
  'reader.state.off': 'off',
  'reader.rule.reader-image-name': 'An image with no text alternative',
  'reader.rule.reader-link-name': 'A link with no name',
  'reader.rule.reader-button-name': 'A button with no name',
  'reader.rule.reader-field-name': 'A form field with no label',
  'reader.rule.reader-heading-empty': 'A heading with no text',
  'reader.rule.reader-heading-order': 'A heading that skips a level',
  'reader.rule.reader-no-landmarks': 'No landmarks on this page',
  'panel.show': 'Show on page',
  'panel.showMissing': 'Ansy can’t find it on the page any more.',

  'exp.keyboard.what':
    'Ansy takes the mouse away, draws a bold ring on whatever has focus and numbers every stop, so you use the page the way someone who can’t hold a mouse does. It also notes where Tab gets stuck, where focus shows nothing, and what only a click can reach.',
  'exp.keyboard.look':
    'Something you can click but can’t Tab to.\nFocus that vanishes: you press Tab and can’t tell where you are.\nA place Tab can’t leave.\nAn order that jumps around the page instead of following it.',
  'exp.keyboard.fidelity':
    'A real keyboard with no mouse. The ring and the numbers are Ansy’s; that person sees only the site’s own focus style, which may be faint or missing.',
  'exp.keyboard.mouseOff': 'Take the mouse away too',
  'exp.keyboard.hint':
    'Click into the site, or use “Jump into the site”, then move with Tab, Shift+Tab, Enter and Space.',
  'exp.keyboard.stops': '{count} focus stops so far',
  'exp.keyboard.noStops': 'No stops yet. Tab through the site and the trail appears.',
  'exp.keyboard.traps': 'Tab gets stuck here',
  'exp.keyboard.invisible': 'Focus shows nothing here',
  'exp.keyboard.unreachable': 'Clickable, but the keyboard can’t reach it',
  'exp.keyboard.clear': 'Clear the trail',

  'exp.tremor.what':
    'Ansy swaps your pointer for one that shakes, and a click lands wherever the shake carries it, as it does for people with Parkinson’s, essential tremor or an unsteady hand. It also checks every control for the 24-pixel size WCAG asks for.',
  'exp.tremor.look':
    'Small links and buttons that are hard to hit.\nControls packed so close that a miss presses the neighbour.\nCheckboxes and close buttons the size of a letter.',
  'exp.tremor.fidelity':
    'The shake is a rough impression; the size check is exact. People with a tremor often use the keyboard, a switch or their voice instead, all in this list.',
  'exp.tremor.clicks': 'Clicks: {clicks}. Landed somewhere else: {misses}.',
  'exp.tremor.noClicks': 'Click around the site and see where the clicks land.',

  'exp.switchAccess.what':
    'Ansy lights up each control on the page in turn, and Space picks the one that is lit, the way a single switch works for people who can move only a hand, their head or a foot. Fields take your typing; Escape hands control back to the scan.',
  'exp.switchAccess.look':
    'How long it takes to reach checkout, one control at a time.\nClickable things the scan never lands on.\nMenus and pop-ups that close before the scan reaches them.',
  'exp.switchAccess.fidelity':
    'Auto-scanning with one switch, as on iPhone and Android. Real setups vary in grouping, speed and the number of switches.',
  'exp.switchAccess.speed': 'Speed',
  'exp.switchAccess.speed.slow': 'Slow (2 seconds a step)',
  'exp.switchAccess.speed.normal': 'Normal (1.3 seconds)',
  'exp.switchAccess.speed.fast': 'Fast (0.8 seconds)',
  'exp.switchAccess.hint':
    'Click into the site first, then press Space when the control you want is lit.',
  'exp.switchAccess.steps': 'Moves so far: {steps}. Picks: {picks}.',
  'exp.switchAccess.noSteps': 'The scan starts in a moment.',
  'exp.switchAccess.lastPick': 'Moves to reach the last pick: {count}',
  'exp.switchAccess.skipped': 'Clickable, but the scan never lands on it',
  'exp.switchAccess.clear': 'Start counting again',

  'exp.voiceControl.what':
    'Ansy takes commands the way voice control on a Mac, on Windows or in Dragon does: “click” and the name of a button, “show numbers” to number everything you can click, then “click 4”. Type them, or speak them into the box with your computer’s own dictation. People who can’t use their hands run whole sites this way.',
  'exp.voiceControl.look':
    'Buttons that show one thing and are named another, so saying what you see finds nothing.\nIcons with no name at all, reachable only by number.\nThe same name on many things, like a row of “Read more” links.',
  'exp.voiceControl.fidelity':
    'Commands find controls by the name the page gives them, as real voice control does. Real tools understand more ways of saying things and fix their own mistakes; Ansy only reads what is typed or dictated into the box.',
  'exp.voiceControl.command': 'Command',
  'exp.voiceControl.run': 'Run',
  'exp.voiceControl.examples':
    'Try: click Buy now · show numbers · click 3 · scroll down · type hello',
  'exp.voiceControl.examplesOther': 'Hebrew works too:',
  'exp.voiceControl.results': 'What the commands did',
  'exp.voiceControl.dictation.mac':
    'To speak instead, click in the box and start your Mac’s dictation: press the microphone key, or Fn twice. Ansy itself sends nothing anywhere.',
  'exp.voiceControl.dictation.windows':
    'To speak instead, click in the box and press Windows+H to start voice typing. Ansy itself sends nothing anywhere.',
  'exp.voiceControl.dictation.other':
    'Type the commands here. If your computer has a dictation tool, it can fill the box too; Ansy itself sends nothing anywhere.',
  'exp.voiceControl.nothingYet': 'Run a command and Ansy says what happened.',
  'exp.voiceControl.result.clicked': 'Clicked “{name}”.',
  'exp.voiceControl.result.focused': '“{name}” has focus. Say “type” and the words.',
  'exp.voiceControl.result.numbers':
    'Numbered {count} things you can click. Say “click” and a number.',
  'exp.voiceControl.result.hidden': 'The numbers are gone.',
  'exp.voiceControl.result.scrolled': 'Scrolled.',
  'exp.voiceControl.result.typed': 'Typed into the field.',
  'exp.voiceControl.result.noField': 'No field has focus. Click one by name first.',
  'exp.voiceControl.result.choose':
    'Things that answer to that name: {count}. Each has a number now; say “click” and its number.',
  'exp.voiceControl.result.mismatch':
    'Nothing is named “{said}”. The control that shows those words is named “{name}”, so voice control can’t find it by what it shows.',
  'exp.voiceControl.result.notFound': 'Nothing on the page is named “{said}”.',
  'exp.voiceControl.result.unknown':
    'Ansy didn’t understand. Try “click” and a name, “show numbers” or “scroll down”.',
  'exp.voiceControl.result.noPage': 'There is no page to give the command to.',
  'exp.voiceControl.missed': 'Shows one name, answers to another',
  'exp.voiceControl.shows': 'Shows “{visible}”, named “{name}”',

  'exp.readingAids.what':
    'Ansy sets the page the way many people with dyslexia set their own browser: a plainer font, more space between letters, words and lines, and a ruler that dims everything but the line being read. It can also read the text you select aloud. It changes what you see, as their own setting would, and nothing on the site.',
  'exp.readingAids.look':
    'Text cut off or overlapping once the font or spacing changes.\nButtons and menus whose labels no longer fit.\nWalls of text with no headings to rest on.',
  'exp.readingAids.fidelity':
    'These are the tools people with dyslexia really use. How easy the text then is to read differs from person to person; Ansy shows no jumbled letters, because that isn’t what dyslexia is.',
  'exp.readingAids.font': 'Readable font',
  'exp.readingAids.spacing': 'Wider spacing (the WCAG 1.4.12 values)',
  'exp.readingAids.ruler': 'Line-focus ruler that follows the mouse',
  'exp.readingAids.hint': 'Move the mouse down the page and read through the ruler’s clear band.',
  'exp.readingAids.readAloud': 'Read aloud',
  'exp.readingAids.read': 'Read the selected text',
  'exp.readingAids.stop': 'Stop',
  'exp.readingAids.noSelection': 'Select some text on the page first.',
  'exp.readingAids.noVoice':
    'No voice for this language is installed, so here is the text instead.',
  'exp.readingAids.clipped': 'Text cut off by the new font or spacing',
  'exp.readingAids.noClipped': 'No text was cut off by the new font or spacing.',

  'exp.plainLanguage.what':
    'Ansy scores how hard the page’s text is to read and rings the hardest paragraphs. People with a learning disability, ADHD, a brain injury, or a language that isn’t their first, read short sentences and common words far more easily.',
  'exp.plainLanguage.look':
    'Sentences that run past twenty words.\nLong words where a short one would do.\nInstructions and errors that only make sense on a second read.',
  'exp.plainLanguage.fidelity':
    'English pages get the Flesch-Kincaid grade, a standard formula. Hebrew has no accepted formula, so Hebrew pages get a rough level from sentence and word length, marked as rough. Either way it measures length, not meaning.',
  'exp.plainLanguage.scoring': 'Reading the page…',
  'exp.plainLanguage.tooLittle': 'There is too little running text on this page to score.',
  'exp.plainLanguage.rough': 'Rough measure',
  'exp.plainLanguage.level.easy': 'Easy to read',
  'exp.plainLanguage.level.plain': 'Plain enough',
  'exp.plainLanguage.level.hard': 'Hard to read',
  'exp.plainLanguage.level.veryHard': 'Very hard to read',
  'exp.plainLanguage.grade':
    'Flesch-Kincaid grade {grade}. WCAG 3.1.5 (level AAA) asks for about grade 9, the end of lower secondary school.',
  'exp.plainLanguage.hebrew':
    'Worked out from sentence and word length only, since Hebrew has no standard formula.',
  'exp.plainLanguage.counts':
    'Words: {words}. Sentences: {sentences}. Words per sentence: {sentenceLength}. Letters per word: {wordLength}.',
  'exp.plainLanguage.hardest': 'The hardest paragraphs, ringed on the page',
  'exp.plainLanguage.perSentence': '{count} words a sentence',
  'exp.plainLanguage.noHardest': 'No paragraph stands out as hard.',

  'exp.flashing.what':
    'Ansy watches the page as it plays and counts flashes in every second. More than three flashes a second over a large area can cause seizures in people with photosensitive epilepsy, and migraines in many more.',
  'exp.flashing.look':
    'Sale banners and buttons that blink.\nVideos with strobe effects or fast cuts between light and dark.\nCarousels that switch bright slides quickly.',
  'exp.flashing.fidelity':
    'A rough check: it counts changes in brightness over large areas, as WCAG 2.3.1 defines them, but not red flashes, and only what plays while you watch. If flashing affects you, don’t use this one; Ansy watches the page but can’t stop it.',
  'exp.flashing.watching': 'Frames looked at so far: {frames}.',
  'exp.flashing.none': 'No flashing yet. Play the page’s videos and animations while this runs.',
  'exp.flashing.under':
    'The fastest flashing so far: {count} in a second, within the limit of three.',
  'exp.flashing.over':
    'The fastest flashing so far: {count} in a second. That is over the limit of three.',
  'exp.flashing.where': 'Where it flashes',

  'exp.scan.what':
    'Ansy runs axe-core, the checker behind Lighthouse and most accessibility tools, on the page as it is right now, and explains each result in plain words. Automatic checks catch roughly a third of the barriers; the other experiences are for the rest.',
  'exp.scan.look':
    'Critical and serious first: those stop someone outright.\nThe same rule on many elements usually means one fix in a template.\n“Needs a look” is where only a person can decide.',
  'exp.scan.fidelity':
    'axe-core’s own rules, unchanged. What it flags is real; what it misses still needs you.',
  'exp.scan.run': 'Scan this page',
  'exp.scan.again': 'Scan again',
  'exp.scan.scanning': 'Scanning…',
  'exp.scan.failed': 'The scan could not run on this page. Reload it and try again.',
  'exp.scan.summary': '{issues} problems on {elements} elements',
  'exp.scan.clean':
    'The automatic check found nothing. That doesn’t make the page accessible: about two thirds of barriers need a person. Try the other experiences.',
  'exp.scan.passed': '{count} checks passed',
  'exp.scan.incomplete': 'Needs a look',
  'exp.scan.incompleteIntro': 'axe could not decide these by itself. Look at each one.',
  'exp.scan.elements': '{count} elements',
  'exp.scan.element': '1 element',
  'exp.scan.wcag': 'WCAG {sc}, level {level}',
  'exp.scan.wcagNoLevel': 'WCAG {sc}',
  'exp.scan.bestPractice': 'Best practice, not a WCAG rule',
  'exp.scan.more': 'More about this rule',
  'exp.scan.impact.critical': 'Critical',
  'exp.scan.impact.serious': 'Serious',
  'exp.scan.impact.moderate': 'Moderate',
  'exp.scan.impact.minor': 'Minor',

  'panel.region': 'Experiences, tasks and findings',
  'tabs.experiences': 'Experiences',
  'tabs.tasks': 'Tasks',
  'tabs.findings': 'Findings',

  'tasks.title': 'Guided tasks',
  'tasks.intro':
    'Three things every visitor tries to do. Pick one, follow its steps with an experience on, and save whatever gets in the way.',
  'tasks.goal': 'Goal',
  'tasks.steps': 'Steps',
  'tasks.try': 'Try it with',
  'tasks.start': 'Start this task',
  'tasks.current': 'Current task',
  'tasks.finish': 'Finish the task',
  'tasks.status.started': 'Task started: {name}',
  'tasks.status.finished': 'Task finished',
  'tasks.turnOn': 'Turn on {name}',

  'task.contact': 'Find the contact details',
  'task.contact.goal': 'Find a phone number, an email address or a contact form, and get to it.',
  'task.contact.steps':
    'Start from the home page.\nLook for “Contact” in the menu, the header or the footer.\nReach the details, and open the form if there is one.',
  'task.form': 'Fill in a form',
  'task.form.goal': 'Complete a form on the site, from the first field to the confirmation.',
  'task.form.steps':
    'Open a form: contact, newsletter, booking or sign-up.\nFill in every field, including any drop-down or checkbox.\nSubmit it, and make sure you can tell that it worked, or what went wrong.',
  'task.purchase': 'Complete a purchase or booking',
  'task.purchase.goal': 'Choose a product or a slot, and get as far as the site lets you.',
  'task.purchase.steps':
    'Pick a product, a service or a date.\nChange a choice: colour, size, quantity or time.\nGo through the cart or the booking steps, up to payment.',

  'findings.title': 'Findings',
  'findings.intro':
    'What you saved while using the site. Export it as a report for whoever builds the site.',
  'findings.empty':
    'Nothing saved yet. While an experience runs, use “Save as finding” on what Ansy noticed, or “Note a finding” for what you met yourself.',
  'findings.site': 'Site',
  'findings.count': '{count} findings',
  'findings.one': '1 finding',
  'findings.noteNew': 'Note a finding',
  'findings.save': 'Save as finding',
  'findings.exportPdf': 'Export PDF…',
  'findings.saveText': 'Save as text…',
  'findings.copy': 'Copy as text',
  'findings.copied': 'Copied. Paste it into an email or a ticket.',
  'findings.saved': 'Saved to {path}',
  'findings.exportFailed': 'The report could not be made. Try again.',
  'findings.slikkLink': 'End reports with an “Ask Slikk.Dev to fix this” link',
  'findings.page': 'Page',
  'findings.when': 'When',
  'findings.experience': 'Experience',
  'findings.task': 'Task',
  'findings.noTask': 'No task',
  'findings.noExperience': 'No experience on',
  'findings.note': 'Your note',
  'findings.saw': 'What Ansy saw',
  'findings.element': 'Element',
  'findings.severity': 'Severity',
  'findings.severity.owner': 'Reported by the owner',
  'findings.screenshot': 'Screenshot',
  'findings.screenshotAlt': 'Screenshot of {title}, with the element ringed',
  'findings.screenshotShow': 'Show the screenshot',
  'findings.steps': 'Keys to get there',
  'findings.stepsBody': 'Open the page, then press: {keys}.',
  'findings.retest': 'Check again',
  'findings.retesting': 'Opening the page and checking…',
  'findings.retest.fixed': 'Fixed',
  'findings.retest.failing': 'Still there',
  'findings.retest.unknown': 'Ansy couldn’t tell',
  'findings.retest.ask': 'Ansy reopened the page with the experience on. Look at it, then say:',
  'findings.retest.at': 'Checked {date}: {outcome}',
  'findings.retest.busy': 'Another check is still running.',
  'findings.delete': 'Delete',
  'findings.deleteSure': 'Delete for good',
  'findings.keep': 'Keep',
  'findings.status.deleted': 'Finding deleted',
  'findings.status.saved': 'Finding saved',

  'capture.title': 'Save a finding',
  'capture.saw': 'What Ansy saw',
  'capture.page': 'Page',
  'capture.note': 'Your note',
  'capture.noteHint': 'What you tried, what happened, and what you expected instead.',
  'capture.needNote': 'Write what you noticed first.',
  'capture.task': 'Task',
  'capture.experience': 'Experience',
  'capture.none': 'None',
  'capture.screenshot': 'Keep the screenshot',
  'capture.screenshotAlt': 'The page as it looks now',
  'capture.noScreenshot': 'Ansy couldn’t take a screenshot of the page.',
  'capture.save': 'Save finding',
  'capture.cancel': 'Cancel',
  'capture.saved': 'Saved. It is waiting under Findings.',
  'capture.failed': 'The finding could not be saved.',

  'report.title': 'Accessibility findings for {site}',
  'report.subtitle': 'Made with Ansy {version} on {date}',
  'report.what': 'What this is',
  'report.whatBody':
    'The owner of this site used it the way people with disabilities do, with Ansy, a free testing tool, and saved what got in the way. Each finding names the page, the element and, where there is one, the WCAG success criterion it breaks. Every one points to a change in the site’s own code.',
  'report.severityIntro':
    'Critical and Serious stop someone outright. Moderate and Minor make things harder than they should be. “Reported by the owner” is something the owner met while using the site; Ansy did not measure it.',
  'report.finding': 'Finding {n} of {total}',
  'report.closing': 'Sending this to your developer',
  'report.closingBody':
    'Hand this report to whoever builds or maintains the site. Ask them to fix each finding in the site’s own code, worst first, and to send it back for another check: Ansy can open every page again. An overlay or a plug-in that promises to fix accessibility will not; the fixes belong in the site.',
  'report.slikk': 'Ask Slikk.Dev to fix this',
  'report.slikkBody': 'Slikk.Dev, the studio that built Ansy, fixes sites like this one.',
  'report.madeWith': 'Made with Ansy, free and open source',

  // Ansy's own rules for what the keyboard helper finds, in the same voice as the scan's.
  'rule.keyboard-trap':
    'Once Tab lands here, it cannot leave. Someone without a mouse is stuck on this element, and the only way out is closing the page. Let Tab and Escape move on.',
  'rule.focus-visible':
    'When this element has keyboard focus, nothing shows it. Someone moving with Tab cannot tell where they are. Give it a visible focus style, or leave the browser’s own in place.',
  'rule.keyboard-unreachable':
    'This reacts to a click, but Tab never reaches it. Someone without a mouse cannot use it at all. Make it a real button or link, or give it tabindex=0 and a key handler.',
  'rule.reader-image-name':
    'A screen reader has nothing to say for this image: it announces “graphic” and moves on. Give it an alt text that says what the image shows, or alt="" if it is decoration.',
  'rule.reader-link-name':
    'This link is announced as “link” and nothing else, so a screen reader user cannot tell where it goes. Give it text, or an aria-label, that says where it leads.',
  'rule.reader-button-name':
    'This button is announced as “button” and nothing else. Someone who cannot see the icon has no idea what it does. Give it a name: visible text, or an aria-label.',
  'rule.reader-field-name':
    'This field is announced as “edit” with no label, so a screen reader user does not know what to type. Give it a label element, or an aria-label.',
  'rule.reader-heading-empty':
    'An empty heading is announced as “heading level” and nothing, and it breaks the outline a screen reader user jumps through. Put text in it or remove it.',
  'rule.reader-heading-order':
    'Heading levels are the page’s outline: a level 3 straight after a level 1 reads like a chapter with no section. Keep the levels in order, and style them however you like.',
  'rule.reader-no-landmarks':
    'Landmarks (main, navigation, banner, content info) let a screen reader user jump straight to the part they want. This page has none, so they read from the top every time. Use main, nav, header and footer elements.',

  // The scan's rules in Ansy's words: who it stops, and what to do. Keys match axe-core rule ids.
  'rule.color-contrast':
    'The text is too close in colour to its background. People with low vision or colour blindness, and anyone in sunlight, lose it. Aim for 4.5:1, or 3:1 for large text.',
  'rule.image-alt':
    'This image has no text alternative. A screen reader says “image” or reads the file name. Describe what the image shows, or mark it decorative with an empty alt.',
  'rule.input-image-alt':
    'An image used as a button has no name. Screen reader users can’t tell what pressing it does. Give it an alt that says the action.',
  'rule.role-img-alt':
    'An element marked as an image has no name. Add an aria-label that says what it shows.',
  'rule.svg-img-alt':
    'An SVG marked as an image has no name. Add a title or an aria-label that says what it shows.',
  'rule.object-alt':
    'An embedded object has no text alternative. Put text inside it that says what it is.',
  'rule.label':
    'This form field has no label. A screen reader can’t say what to type here. Add a visible label, connected with for and id.',
  'rule.select-name': 'This drop-down has no name. Add a label that says what the choice is.',
  'rule.label-title-only':
    'This field is named only by a tooltip. Add a visible label: tooltips don’t show on touch screens, and screen readers often skip them.',
  'rule.form-field-multiple-labels':
    'This field has more than one label. Screen readers may read only one of them. Keep one label.',
  'rule.autocomplete-valid':
    'The autocomplete value here isn’t one browsers understand, so they can’t fill the field in. Use a standard value, like email or given-name.',
  'rule.link-name':
    'This link has no text. A screen reader says “link” and nothing else. Add text, or an aria-label, that says where it goes.',
  'rule.button-name':
    'This button has no text. A screen reader says “button” and nothing else. Add text, or an aria-label, that says what it does.',
  'rule.link-in-text-block':
    'This link differs from the text around it by colour alone. People who can’t see that colour can’t find the link. Underline it, or add another cue.',
  'rule.html-has-lang':
    'The page doesn’t say what language it is in. Screen readers then read it with the wrong voice. Add lang to the html element.',
  'rule.html-lang-valid':
    'The page’s language code isn’t valid, so screen readers ignore it. Use a code like en or he.',
  'rule.document-title':
    'The page has no title. It is the first thing a screen reader says, and what the browser tab shows. Add a title.',
  'rule.heading-order':
    'A heading level is skipped. Screen reader users navigate by headings and lose the structure. Go one level at a time.',
  'rule.empty-heading':
    'This heading has no text. Screen reader users jump to it and hear nothing. Put text in it, or remove it.',
  'rule.page-has-heading-one':
    'The page has no main heading (h1). Screen reader users use it to find where the page starts. Add one.',
  'rule.region':
    'Some content sits outside any landmark (header, nav, main, footer). Screen reader users who jump by landmark miss it. Put it inside one.',
  'rule.landmark-one-main':
    'The page has no main landmark, or has more than one. Screen reader users jump to main to skip the chrome. Have exactly one.',
  'rule.bypass':
    'There is no way to skip the repeated top of the page. Keyboard users must Tab through all of it on every page. Add a skip link or landmarks.',
  'rule.list':
    'This list contains things that aren’t list items. Screen readers then misreport its length. Keep only li inside ul or ol.',
  'rule.listitem':
    'This list item sits outside a list. Screen readers won’t announce it as part of one. Wrap it in ul or ol.',
  'rule.frame-title':
    'This frame has no title. Screen reader users can’t tell what it contains. Add a title attribute.',
  'rule.meta-viewport':
    'The page blocks zooming. People with low vision can’t enlarge it. Remove user-scalable=no and maximum-scale.',
  'rule.tabindex':
    'A tabindex above 0 forces its own tab order. Keyboard users then jump around the page unexpectedly. Use 0 or -1 and let the page order decide.',
  'rule.label-content-name-mismatch':
    'The words this control shows aren’t in its name. People using voice control say what they see, and nothing answers. Start the name with the visible words.',
  'rule.target-size':
    'This control is too small to hit. People with a tremor, or big thumbs, miss it. Make it at least 24 by 24 pixels, or give it space.',
  'rule.scrollable-region-focusable':
    'This scrolling area can’t be reached by keyboard, so keyboard users can’t scroll it. Give it tabindex=0.',
  'rule.nested-interactive':
    'A control sits inside another control, like a button inside a link. Screen readers and keyboards can’t work both. Keep one.',
  'rule.aria-hidden-focus':
    'Something hidden from screen readers can still take focus. Keyboard users land on a thing that isn’t announced. Take it out of the tab order too.',
  'rule.aria-required-attr':
    'An ARIA role here is missing an attribute it needs, so screen readers can’t report its state. Add the required attribute.',
  'rule.aria-valid-attr-value':
    'An ARIA attribute has a value it doesn’t allow. Screen readers ignore it. Use one of the permitted values.',
  'rule.aria-roles':
    'This role isn’t a real ARIA role. Screen readers ignore it. Use a valid role, or none.',
  'rule.aria-allowed-attr':
    'This ARIA attribute isn’t allowed on this role. Screen readers ignore it. Remove it, or change the role.',
  'rule.duplicate-id-aria':
    'Two elements share an id that ARIA points at. Screen readers follow the wrong one. Make ids unique.',
  'rule.video-caption':
    'This video has no captions. Deaf and hard-of-hearing viewers lose what is said. Add a captions track.',
  'rule.image-redundant-alt':
    'The image’s alt repeats the text next to it, so screen readers say it twice. Use an empty alt here.',
  'rule.th-has-data-cells':
    'A table header has no cells it heads. Screen readers can’t match the header to the data. Fix the table structure.',
  'rule.skip-link':
    'The skip link points at something that doesn’t exist. It does nothing when pressed. Point it at the main content.',
} as const

export type MessageKey = keyof typeof en
