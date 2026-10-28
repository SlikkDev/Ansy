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
  shared/    code both sides use: the string tables, settings, address parsing
tests/
  unit/      Vitest
  e2e/       Playwright, launching the built app
  fixtures/  the sample shop the tests browse
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
