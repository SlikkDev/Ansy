/** Vite inlines a file's text when it is imported with `?raw`. */
declare module '*?raw' {
  const source: string
  export default source
}
