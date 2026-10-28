# Ansy

**Your website looks great. To you.**

Ansy (Hebrew: אָנְסִי) is a free, open-source desktop browser that lets business
owners experience their own website the way people with disabilities do: low
vision, colour blindness, keyboard-only use, no sound, motion sensitivity and
more, together with the tools those people rely on, like screen readers, zoom and
high-contrast themes. Spot what breaks, then hand your developer a clear report.

Ansy is a testing and empathy tool. It is not an accessibility overlay, it never
touches your live site, and it is not a compliance certificate.

- Website: https://slikkdev.github.io/Ansy/ (Hebrew: https://slikkdev.github.io/Ansy/he/)
- Status: version 1.0 is in development. Downloads for macOS and Windows are coming soon.

## The app

Ansy is an [Electron](https://www.electronjs.org/) app: a browser of its own, so
the experiences can change how a page looks, sounds and responds without touching
the site. The interface is React with Tailwind CSS, in English and Hebrew (right
to left), in the Slikk.Dev look, with dark and light themes that follow the system
by default. Every site opens in a sandboxed view that the main process controls;
Ansy's own screens and the site never share a process.

Ansy sends nothing anywhere. There are no accounts, no analytics and no crash
reports; the only network traffic is the site you open.

Each experience is a task card: what changes, what to look for, and how close
the simulation is to the real thing. The switches that change how the site
renders (colour vision, forced colours, media preferences, font size, zoom) are
the same DevTools commands Chrome itself uses. Small helpers run inside the
page, in a world the site's scripts cannot see: one counts the animations that
keep moving and the videos without captions, one draws the keyboard-only focus
ring and numbered trail and notes what the keyboard cannot do, and one runs
[axe-core](https://github.com/dequelabs/axe-core) for the automatic scan, whose
results Ansy explains in plain words, in both languages, and maps to their WCAG
success criteria.

Ansy Reader is the built-in screen reader. It reads the page's accessibility
tree, the same tree real screen readers are given, through the DevTools
protocol, in the order a screen reader user hears it, with the everyday keys of
NVDA and JAWS: the arrows, H for headings, K for links, B for buttons, F for
form fields, Enter to activate, Tab followed as the page moves its own focus.
The system's own voice speaks it in English or Hebrew, and every word also
appears in a transcript, so a sighted owner sees exactly what a blind visitor
hears, and nothing else. "Cover the screen" turns the site black for the full
effect. The reader notes what it stumbled on: images, links, buttons and fields
with no name, headings that skip a level, and pages with no landmarks. It is an
approximation, not NVDA or VoiceOver, and the card says so.

A practice shop is built in, at ansy://shop/: a small site with the usual
mistakes, to try every experience on before turning to your own.

Three guided tasks (find the contact details, fill in a form, complete a
purchase or booking) give the owner something to do with each experience, and
whatever gets in the way can be saved as a finding: the page, the element, a
screenshot with it ringed, the WCAG rule and Ansy's explanation, and the owner's
own note. Findings are kept per site, in the app's data folder only, and go out
as a PDF or a plain-text report (with the no-certificate disclaimer, and an
optional "Ask Slikk.Dev to fix this" line) for whoever builds the site. "Check
again" reopens the page with the same experience and tells the owner whether the
problem is still there.

### Develop

Requires Node.js 22 or newer.

```sh
npm install
npm run dev        # the app with hot reload
npm test           # unit tests (Vitest)
npm run test:e2e   # end-to-end tests: the real app, driven by Playwright
npm run lint       # ESLint, with the jsx-a11y rules
npm run typecheck  # strict TypeScript
npm run build      # production build into out/
npm run dist       # installers into dist/ (unsigned until release 1.0)
```

On a Linux machine without a display, run the end-to-end tests under
`xvfb-run -a`. Continuous integration runs all of the above on every pull
request and builds unsigned installers for macOS, Windows and Linux.

```
src/
  main/      Electron main process: window, site view, settings, menu, security
  preload/   the typed bridge between the main process and the interface
  renderer/  the interface (React)
  shared/    code both sides use: the string tables, settings, address parsing,
             the reader's reading order and words
resources/   the app icon and the practice shop (also what the tests browse)
tests/
  unit/      Vitest
  e2e/       Playwright, launching the built app
  fixtures/  accessibility trees captured from the practice shop
```

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for conventions and
[`AGENTS.md`](AGENTS.md) for the rules every change follows.

## The website

The project site lives in [`site/`](site/): plain HTML and CSS with no build
step, in English (`site/index.html`) and Hebrew (`site/he/index.html`, right to
left). Fonts are self-hosted under the SIL Open Font License. The site targets
WCAG 2.2 AA.

Every push to `main` that touches `site/` deploys it through
[`.github/workflows/pages.yml`](.github/workflows/pages.yml). To preview locally,
serve the folder with any static server, for example
`python3 -m http.server -d site`.

## License

The code is released under the [MIT License](LICENSE). The Slikk.Dev name and
logo are trademarks of Slikk.Dev, all rights reserved, and are not covered by the
MIT License.
