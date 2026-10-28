# Changelog

All notable changes to Ansy are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## Unreleased

### Added

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
