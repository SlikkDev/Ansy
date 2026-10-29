# AGENTS.md — how to work in this repository

This file is for anyone, human or tool, changing Ansy's code. It is short on
purpose. The product plan lives outside the repo; the rules that keep the code
honest live here.

## What Ansy is

A free, open-source desktop browser (Electron) that lets business owners
experience their own website the way people with disabilities do, together
with the tools those people use. It is a testing and empathy tool. It **never
changes the site**, it is **not an accessibility overlay**, and it is **not a
compliance certificate**. Every finding points to a change in the site's own
code, made by its developer.

## Hard rules

- **No AI identifiers anywhere.** Not in commit messages, pull request titles
  or bodies, code comments, or docs. No "Co-Authored-By" lines for tools, no
  "generated with", no model names.
- **Ansy must be at least as accessible as the sites it tests.** WCAG 2.2 AA
  throughout, 7:1 contrast for text, every control reachable by keyboard and
  named for a screen reader, visible focus, reduced motion respected. CI runs
  axe on Ansy's own screens and fails on a violation.
- **The site view is sandboxed and driven only from the main process.**
  `sandbox: true`, `contextIsolation: true`, no `nodeIntegration`, permissions
  denied, pop-ups and non-web navigation blocked. Anything that changes how the
  site renders goes through the DevTools protocol (`webContents.debugger`) or
  the in-page helper, never through code that the site could reach.
- **No accounts, no tracking, no analytics.** The only network traffic is the
  site the owner opens and the optional update check against GitHub Releases.
  Nothing leaves the computer unless the owner exports a report. `PRIVACY.md`
  lists every request; a change that adds one changes that file too.
- **Two languages, one layout.** Every user-facing string lives in
  `src/shared/i18n/` in English _and_ Hebrew. Hebrew is written in Hebrew,
  never translated from the English. Layout uses logical CSS properties
  (`inset-inline-start`, `padding-inline`, `text-start`) so right-to-left needs
  no second design. The string tables are shaped so a third language is one
  more dictionary.
- **The Hebrew name is always אָנְסִי, with nikud.** Never אנסי.
- **Locked brand constants.** Accent `#FF2D6B` (`#CC0046` in light); white text
  only on `accent-strong`. The Slikk.Dev wordmark SVG paths and
  `viewBox="25 -738 3844 756"` are copied byte for byte from the attribution
  kit, never redrawn. Credit links to slikk.dev carry
  `rel="nofollow noopener noreferrer"` and open in the system browser.
- **Fidelity is labelled.** An experience that renders exactly what that user's
  setup renders is High. A faithful approximation of a real tool is Medium. An
  impression is Low and says so in the interface. Nothing is presented as "what
  it is like to be disabled"; every experience is a task on the site.
- **Code is MIT; the brand is not.** See `TRADEMARKS.md`.

## Layout

```
src/
  main/      Electron main process: window, site view, security, settings, menu, IPC,
             the experience engine (DevTools switches), the in-page helpers
             (observe, keyboard trail, vision overlay, axe scan, highlight,
             check again) shipped as
             source text, Ansy Reader's engine (the accessibility tree over the
             DevTools protocol, the virtual cursor, the keys), the practice shop
             served at ansy://shop/, the findings store, the PDF/text report and
             the self-updater (electron-updater against GitHub Releases)
  preload/   contextBridge API for Ansy's own screens (sandboxed; no Node)
  renderer/  Ansy's screens: React 19 + Tailwind 4, strict TypeScript
  shared/    types, the experience and task tables, the findings model, the report
             builders, the reader's pure parts (reading order, findings, speech)
             and the i18n string tables, used by main and renderer
tests/
  unit/      Vitest
  e2e/       Playwright driving the real Electron app
  fixtures/  accessibility trees captured from the practice shop, for the reader
resources/   app icon, the practice shop (resources/practice-shop, which the tests
             serve over http too), the Mac entitlements and build resources for
             electron-builder
docs/        release.md: how a release is cut, and what the signing needs
site/        the project website (GitHub Pages); separate from the app
```

## Commands

- `npm run dev` — the app with hot reload
- `npm run build` — production bundles into `out/`
- `npm run lint` / `npm run typecheck` / `npm run format`
- `npm test` — unit tests; `npm run test:e2e` — Playwright against the built app
  (on a headless Linux box: `xvfb-run -a npm run test:e2e`)
- `npm run dist` — unsigned installers for this platform into `dist/`
- a `v*` tag — the release workflow: signed builds on a draft GitHub release

## Conventions

- Commit messages: a plain-English summary line in the imperative ("Add the
  address bar"), a body when the why isn't obvious. No trailers.
- Pull requests: say what changed and how it was checked. One reviewable step
  per pull request.
- Prettier formats, ESLint lints (including `jsx-a11y` on Ansy's own screens).
- Keep First Load lean. No animation libraries, no UI kits; CSS and a few
  hundred lines of purpose-built code do the job.
