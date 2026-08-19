import type { ComponentPropsWithRef, FC } from 'react'

/**
 * HTML tags a layout primitive may render as. A closed list on purpose.
 */
export type HtmlTag =
  | 'div'
  | 'span'
  | 'section'
  | 'article'
  | 'aside'
  | 'header'
  | 'footer'
  | 'main'
  | 'nav'
  | 'ul'
  | 'li'
  | 'p'
  | 'figure'

/**
 * Resolves a tag name to something JSX will accept with HTML props.
 *
 * The cast is deliberate and load bearing. React Three Fiber augments
 * `React.JSX.IntrinsicElements` with the whole Three.js object graph, and once it
 * does, `ElementType` widens to a union that includes elements whose `children`
 * is `never`. A polymorphic wrapper then fails to typecheck for reasons that have
 * nothing to do with the wrapper. Narrowing here, at one boundary, keeps `any` out
 * of the components themselves.
 */
export function htmlTag(
  tag: HtmlTag | undefined,
  fallback: HtmlTag,
): FC<ComponentPropsWithRef<'div'>> {
  return (tag ?? fallback) as unknown as FC<ComponentPropsWithRef<'div'>>
}
