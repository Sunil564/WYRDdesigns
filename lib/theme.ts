/**
 * The one colour value that has to exist in JavaScript.
 *
 * `theme-color` in the viewport meta paints the browser chrome on mobile, and it
 * is read by the browser before any stylesheet, so it cannot reference a CSS
 * custom property. Every other colour in the build comes from `@theme` in
 * app/globals.css and nothing else duplicates a hex value.
 *
 * If `--color-bg` changes, this changes with it. That is the whole reason it
 * lives in its own file instead of inline in the layout.
 */
export const THEME_COLOR_BG = '#08080A'
