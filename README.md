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
