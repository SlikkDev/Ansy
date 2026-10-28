# Contributing to Ansy

Thanks for helping make the web work for everyone. Ansy is small and opinionated,
so here is what makes a contribution land smoothly.

## Before you start

- Read [`AGENTS.md`](AGENTS.md). It holds the rules that keep Ansy honest: never
  change the site, never track the owner, stay accessible, two languages, one
  layout.
- Open an issue for anything bigger than a bug fix, so we can agree on the
  shape before you write it.

## Setting up

```sh
git clone https://github.com/SlikkDev/Ansy.git
cd Ansy
npm ci
npm run dev
```

Node 22 or newer. The first `npm ci` downloads Electron (about 100 MB).

## Checks

Run these before opening a pull request; CI runs the same:

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e      # on headless Linux: xvfb-run -a npm run test:e2e
```

## Strings and languages

Every user-facing string lives in `src/shared/i18n/en.ts` and `he.ts`. Add
the key to both. Write the Hebrew in Hebrew; a line that reads like a
translation gets rewritten. The unit tests fail if a key is missing from a
language or if אנסי appears without nikud.

## Accessibility of Ansy itself

Ansy's own screens target WCAG 2.2 AA with 7:1 text contrast. The end-to-end
tests run axe on them; a violation fails the build. Check your change with a
keyboard only and, if you can, with a screen reader.

## Commit messages and pull requests

A plain-English summary line in the imperative, a body when the why isn't
obvious, no trailers, and no AI identifiers of any kind. Pull requests say what
changed and how it was checked.

## Licence

By contributing you agree that your code is released under the
[MIT License](LICENSE). The Slikk.Dev and Ansy names and logos stay trademarks;
see [`TRADEMARKS.md`](TRADEMARKS.md).
