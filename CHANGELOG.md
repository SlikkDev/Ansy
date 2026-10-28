# Changelog

All notable changes to Ansy are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## Unreleased

### Added

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
