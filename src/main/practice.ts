import { app, net, protocol, type Session } from 'electron'
import { join, normalize, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * The practice shop: the sample shop the tests run against, bundled with the
 * app and served at ansy://shop/ so an owner can try every experience on a
 * site built with the usual mistakes before turning to their own.
 */
export const PRACTICE_SCHEME = 'ansy'

/** Before the app is ready: the scheme behaves like https (relative links, same-origin, fetch). */
export function registerPracticeScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: PRACTICE_SCHEME,
      privileges: { standard: true, secure: true, supportFetchAPI: true },
    },
  ])
}

/** Serves the bundled shop on the site's session. Anything else on the scheme is a 404. */
export function servePracticeShop(
  target: Session,
  root = join(app.getAppPath(), 'resources', 'practice-shop'),
): void {
  if (target.protocol.isProtocolHandled(PRACTICE_SCHEME)) return
  target.protocol.handle(PRACTICE_SCHEME, (request) => {
    const url = new URL(request.url)
    if (url.host !== 'shop') return new Response('Not found', { status: 404 })
    const relative =
      normalize(decodeURIComponent(url.pathname)).replace(/^[/\\.]+/, '') || 'index.html'
    const file = resolve(root, relative)
    if (!file.startsWith(resolve(root) + sep)) return new Response('Not found', { status: 404 })
    return net.fetch(pathToFileURL(file).href)
  })
}
