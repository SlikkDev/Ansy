/** Vite inlines a file's text when it is imported with `?raw`. */
declare module '*?raw' {
  const source: string
  export default source
}

/** A file inlined as a data URL at build time (the brand fonts in the PDF). */
declare module '*?inline' {
  const url: string
  export default url
}
