# Changelog

All notable changes to Ansy are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## Unreleased

### Added

- The experiences panel grouped by area: sight and blindness, low vision and
  light sensitivity, moving and clicking, hearing, focus and reading, and the
  automatic scan for every visitor.
- A third fidelity level, "A rough impression", for the experiences that can
  only suggest what a person meets. Each such card names the tool that person
  uses.
- Tunnel and central vision loss: everything but a small circle around the
  mouse and the keyboard focus goes dark, or a grey patch covers the spot the
  eye looks at. A rough impression.
- Cataracts and glare: a cloudy, yellowed veil or a sun-flooded screen over the
  site. A rough impression. Screenshots for findings are taken without the
  veil, so the developer sees the page.
- Dark mode: the site is told the visitor prefers dark, Ansy says whether it has
  a dark theme of its own, and an option darkens sites that don't, as Chrome's
  auto dark mode does.
- Tremor and unsteady hands: the pointer shakes, and a click lands wherever the
  shake carries it. A rough impression. The card also runs axe's 24-pixel
  target size check (WCAG 2.5.8), which the automatic scan now includes too.
- Switch access: a highlight steps through the site's controls by itself, at a
  slow, normal or fast pace, and Space picks the one it rests on, as a
  single-switch device does. The card counts the moves each pick took and lists
  what looks clickable but is never reached.
- The practice shop has two tiny quantity buttons, for the target size check.
- Voice control: commands typed, or spoken through the system's own dictation,
  into a command box: "click" and a name, "show numbers" and "click 4",
  "scroll down", "type" and the words, in English or Hebrew. A command that
  misses a control because it shows one name and is called another is listed,
  and can be saved as a label-in-name finding (WCAG 2.5.3) that Check again
  re-tests. The card also runs axe's label-in-name rule on the whole page.
- The practice shop has a button that shows "Add to basket" and is named
  "Purchase item", for voice control to miss.

- Dyslexia and reading aids: a readable font, the WCAG 1.4.12 spacing and a
  line-focus ruler, each on its own switch, and read-aloud of the text you
  select with the system's voice. Text the new font or spacing cuts off is
  listed and can be saved as a finding (WCAG 1.4.12).
- Plain language: a reading score for the page, the Flesch-Kincaid grade in
  English and a rough level from sentence and word length in Hebrew, marked as
  rough, with the hardest paragraphs ringed on the page (WCAG 3.1.5).
- Seizure risk from flashing: Ansy watches the page's frames and counts flashes
  in every second over large areas, names where it flashes when there are more
  than three (WCAG 2.3.1), and can save that as a finding. A rough check.
- Findings of a new kind, "check", for what Ansy's own page checks find.
- The practice shop has a label that the reading aids cut off, a paragraph of
  legal words, and a flashing sale banner on a page of its own, which plays
  only when asked and stops after three seconds.

### Fixed

- Switch access no longer loses the count of a pick that opens a new page.

## 1.0.0

### Added

- Self-updates for direct downloads: Ansy checks GitHub Releases when it
  starts (About Ansy has the switch, and the Help menu a "Check for updates"
  item), downloads a newer version in the background and offers a restart.
  Copies from the Microsoft Store or a Linux package leave updates to those.
- The release workflow: a version tag runs the checks, builds the installers
  for macOS (Intel and Apple silicon, signed and notarized when the Apple
  secrets are set), Windows (the installer and a Microsoft Store package) and
  Linux (AppImage and .deb), and attaches them to a draft GitHub release.
- A privacy note listing every network request the app can make, linked from
  About Ansy, and a code signing policy in the README.
- Ansy Reader: a built-in screen reader that reads the page's accessibility
  tree in order, with the everyday keys of NVDA and JAWS (arrows, H, K, B, F,
  E, L, G, D, T, 1 to 6, Enter, Tab followed, Escape), the system's own voice in
  English or Hebrew, a visible transcript of every word, a screen cover, and
  its own findings: images, links, buttons and fields with no name, headings
  that skip a level, pages with no landmarks, saved and checked again like any
  other.
- The practice shop, built into the app at ansy://shop/, now with a checkout
  and a thank-you page, so a purchase can be tried end to end.
- Three guided tasks (find the contact details, fill in a form, complete a
  purchase or booking), each with a goal, steps and the experiences to try it
  with.
- Findings: anything Ansy noticed, or the owner met, saved with the page, the
  element, a screenshot with it ringed, the WCAG rule and a note; kept per site
  in the app's data folder, with "Show on page" and "Check again", which
  reopens the page with the same experience and says whether the problem is
  still there.
- Reports: the findings for a site as a PDF (cover, a page per finding,
  how to send it) or as plain text, saved or copied, in English or Hebrew, with
  the no-certificate disclaimer and an optional "Ask Slikk.Dev to fix this"
  line.
- Keyboard only: the mouse taken away, a bold focus ring and a numbered trail,
  with what the keyboard could not do noted as it happens: where Tab gets
  stuck, where focus shows nothing, and what only a click can reach.
- The automatic scan: axe-core on the page as it stands, each result explained
  in plain words in English and Hebrew and mapped to its WCAG success
  criterion, with "Show on page" for every element and a scan of each new page.
- The first seven experiences, each a task card with what to look for and a
  fidelity label: color blindness (four types), blurred vision and low
  contrast, zoom to 200% and 400% with a 320-pixel view, large text and text
  spacing, high contrast, motion sensitivity (which counts what keeps moving)
  and no sound (which checks for captions).
- The app skeleton: an Electron browser shell with an address bar, back,
  forward and reload, and a sandboxed view of the site.
- English and Hebrew interface with full right-to-left layout, chosen from the
  system language and switchable in the app.
- Dark and light themes in the Slikk.Dev look.
- The About screen with the no-compliance disclaimer, licence and trademark
  notice.
- Security baseline: sandboxed renderers, context isolation, denied
  permissions, blocked pop-ups and non-web navigation, a strict content
  security policy.
- Continuous integration: lint, types, unit and end-to-end tests, and unsigned
  builds for macOS, Windows and Linux on every push.
