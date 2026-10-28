/// <reference types="vite/client" />
import type { AnsyApi } from '../../preload'

declare global {
  interface Window {
    /** The bridge the preload exposes. See src/preload/index.ts. */
    ansy: AnsyApi
  }
}

export {}
