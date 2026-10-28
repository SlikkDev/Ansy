# Releasing Ansy

A release is a git tag. Pushing `v1.2.3` makes the release workflow
(`.github/workflows/release.yml`) run the checks, build the installers on all
three systems, sign and notarize the Mac build when the Apple secrets exist,
and attach everything to a **draft** GitHub release. Publishing the draft is a
button, and the moment it is pressed, installed copies see the new version.

## Before the first release (once)

### Mac: Developer ID and notarization

Needs an Apple Developer account. The build is signed with a Developer ID
Application certificate and notarized by Apple, so it opens on any Mac
without a warning.

1. In Xcode (or at developer.apple.com, Certificates): create a **Developer ID
   Application** certificate and install it in the keychain. Export it from
   Keychain Access as a `.p12` with a password.
2. Encode the file: `base64 -i certificate.p12 | pbcopy`.
3. At appleid.apple.com, Sign-in and security, **App-specific passwords**:
   make one for "Ansy notarization".
4. The team id is on the Membership page of the developer account.
5. In the repository, Settings, Secrets and variables, Actions, add:

   | Secret                        | Value                        |
   | ----------------------------- | ---------------------------- |
   | `MAC_CERTIFICATE`             | the base64 of the `.p12`     |
   | `MAC_CERTIFICATE_PASSWORD`    | the password given on export |
   | `APPLE_ID`                    | the Apple ID email           |
   | `APPLE_APP_SPECIFIC_PASSWORD` | the app-specific password    |
   | `APPLE_TEAM_ID`               | the 10-character team id     |

Without these the workflow still succeeds and publishes an unsigned Mac build,
which macOS refuses to open until the user right-clicks it and chooses Open,
and which cannot update itself (Squirrel.Mac only installs signed apps).

### Windows: the Store package

The Store package (`.appx`) is built on every release with placeholder
identity values, which the Store rejects on upload. Once the Partner Center
account exists under the company (never a personal account), create the app
there, open **Product identity**, and add these secrets with the values shown:

| Secret                        | Partner Center field                           |
| ----------------------------- | ---------------------------------------------- |
| `APPX_IDENTITY_NAME`          | Package/Identity/Name                          |
| `APPX_PUBLISHER`              | Package/Identity/Publisher (the `CN=...` line) |
| `APPX_PUBLISHER_DISPLAY_NAME` | Package/Properties/PublisherDisplayName        |

The next release's `.appx` is then ready to upload as a new submission. The
Store signs it and delivers updates; the app's own update check stays off in
Store builds.

### Windows: the direct installer and SignPath

The `.exe` installer is unsigned until SignPath Foundation approves the
project, so Windows shows a SmartScreen warning ("Windows protected your
PC"): the user clicks **More info**, then **Run anyway**. The download page
should say so.

Apply at https://signpath.org/apply after the first release. Their
conditions, all met by this repository: a public repository built by CI,
two-factor authentication on the GitHub organization, a code signing policy
in the README, and a published release. The application should mention that
the app carries the Slikk.Dev and Ansy trademarks, which their open-source
terms ask to be stated. Once approved, their signing step is added to the
release workflow and approved builds show "SignPath Foundation" as the
publisher.

## Each release

1. Update `CHANGELOG.md`: rename the `Unreleased` heading to the version and
   the date, and start a new empty `Unreleased` above it.
2. Set the version: `npm version 1.2.3 --no-git-tag-version` (updates
   `package.json` and `package-lock.json`).
3. Commit ("Release 1.2.3"), open the pull request, merge it when CI is green.
4. Tag the merge commit on `main` and push the tag:

   ```sh
   git checkout main && git pull
   git tag v1.2.3
   git push origin v1.2.3
   ```

   The workflow refuses a tag that does not match `package.json`.

5. Wait for the Release workflow (about ten minutes). It creates a draft
   release named after the tag with these files:

   - macOS: `Ansy-1.2.3-arm64.dmg`, `Ansy-1.2.3.dmg` (Intel), the matching
     `.zip` files and `latest-mac.yml`
   - Windows: `Ansy Setup 1.2.3.exe`, its `.blockmap`, `latest.yml`, and
     `Ansy 1.2.3.appx` for the Store
   - Linux: `Ansy-1.2.3.AppImage`, `latest-linux.yml`, and `ansy_1.2.3_amd64.deb`

6. Open the draft on GitHub, paste the changelog section as the notes, and
   **Publish**. Installed copies with the update check on find the new version
   at their next start; the Store and the `.deb` are updated by hand.
7. After the first public release: update the website's download section
   (`site/index.html` and `site/he/index.html`) to point at the release, with
   the SmartScreen note for Windows; and apply to SignPath.

## Checking a build by hand

`npm run dist` makes the installers for the current system into `dist/`,
unsigned. On a Mac with the certificate in the keychain, electron-builder
signs automatically; set `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD` and
`APPLE_TEAM_ID` in the shell to notarize as well.

To try the self-update locally, install a built version, then publish a
higher version as a real (not draft) release on a fork and point
`electron-builder.yml`'s `publish` block at the fork; a draft release is
invisible to the updater.
