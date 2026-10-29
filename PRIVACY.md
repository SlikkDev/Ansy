# Privacy

Ansy runs on your computer and keeps what it makes there. There are no
accounts, no analytics, no crash reports and no telemetry. This note lists
every network request the app can make, so the claim can be checked against
the code.

## What goes out, and when

1. **The website you open.** Ansy is a browser: when you type an address, it
   loads that site, and the site loads whatever it loads (its images, scripts,
   fonts, third-party widgets). Those requests go to the site and its
   providers, the same as in any browser, with a standard Chrome user-agent
   string. Ansy adds nothing to them, and never automates the site.
2. **The update check**, for direct downloads only (the Mac disk image, the
   Windows installer, the Linux AppImage). When Ansy starts, and when you
   choose "Check for updates", it asks GitHub Releases for the newest version
   of Ansy. The request goes to `github.com` and, for a download, to the
   release's file storage. It carries the version of Ansy you run so the
   newer one can be picked; it carries nothing about you or the sites you
   test. GitHub sees your IP address, as any download does. Turn the check
   off in About Ansy under Updates, and nothing is sent. Copies installed
   from the Microsoft Store or a Linux package are updated by those instead
   and make no check of their own.
3. **Links you click.** "Source code on GitHub", "Ansy website", "Built by
   Slikk.Dev", "More about this rule" and the "Ask Slikk.Dev to fix this"
   line in a report open in your system browser, only when you click them.
   Each goes to the page named on it.

That is the whole list. In particular, Ansy does not contact Google's
services (Chromium's component updater and safe-browsing lookups are off), it
loads no fonts, scripts or images for its own screens from anywhere but the
app itself, and the built-in practice shop is served from the app's own files.

## What stays on your computer

- **Settings** (language, theme, the update check, the Slikk.Dev line) in the
  app's data folder, as `settings.json`.
- **Findings**: the page address, the element, the screenshot, the rule, your
  note and the check-again result, in the same folder, as `findings.json` and
  one PNG per screenshot. A keyboard or reader finding also keeps the keys
  pressed on the page before it was saved (Tab, Enter, the arrows, the
  reader's letter keys), so Check again can press them again; the letters you
  type into a page are never kept. Nothing in them leaves the computer unless you
  export a report and send it.
- **The site's own cookies and storage**, in a session of their own, like a
  browser profile. They never reach Ansy's screens.

The data folder is the system's usual place for the app: on macOS
`~/Library/Application Support/Ansy`, on Windows `%APPDATA%\Ansy`, on Linux
`~/.config/Ansy`. Delete it and Ansy starts fresh.

## Reports

A PDF or plain-text report holds the findings you chose to export, with the
site address and the date. It is written where you save it and goes only
where you send it. The optional last line, "Ask Slikk.Dev to fix this", is a
plain link to https://slikk.dev/ and carries no information about you; it can
be switched off in the Findings tab.

## The voice

Ansy Reader speaks through the voices installed on your computer, using the
system's own speech engine. The text it reads is the page's accessibility
tree, which stays on the computer.

## Reading aloud and the flash watcher

The reading aids read the text you select through the same system voices.
The flash watcher looks at small copies of the page's frames as they are
drawn, counts brightness changes and keeps nothing: no frame is saved or
sent anywhere.

## Voice control

Ansy has no microphone access and records no audio. Voice control reads only
the text in its command box, typed or put there by your system's own
dictation, and that text stays on the computer. Dictation is a feature of
macOS or Windows, not of Ansy, and your system's own privacy terms cover it.

## Questions

Open an issue at https://github.com/SlikkDev/Ansy/issues, or report a
security problem privately as described in [SECURITY.md](SECURITY.md).
