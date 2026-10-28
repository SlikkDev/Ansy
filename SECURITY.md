# Security

Ansy is a browser. It opens whatever site the owner types in, so it is built on
the assumption that the site is hostile.

## What Ansy does to stay safe

- The site runs in a separate, sandboxed view with its own session. It has no
  access to Node, to the computer, or to Ansy's own screens.
- Ansy's own screens are sandboxed too, with context isolation and a strict
  content security policy, and they never load remote content.
- Permission requests from the site (camera, microphone, location,
  notifications and the rest) are denied. Pop-ups are opened in the same view
  or dropped. Navigation to anything but http and https is blocked.
- Everything that changes how the site renders goes through the Chromium
  DevTools protocol from the main process, or through a helper that runs in an
  isolated world the site's scripts cannot reach.
- There are no accounts and no tracking. The only network traffic is the site
  itself and the optional update check against GitHub Releases.
- Electron is kept current, because an outdated browser is a risk to its user.

## Reporting a vulnerability

Please do not open a public issue for a security problem. Use GitHub's private
reporting form at
https://github.com/SlikkDev/Ansy/security/advisories/new with what you found
and how to reproduce it. We answer within a week, fix confirmed problems as
fast as we can, and credit you in the release notes if you want.
