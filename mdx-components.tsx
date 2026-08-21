import type { MDXComponents } from 'mdx/types'
import Link from 'next/link'

/**
 * How MDX prose renders. Required at the project root by `@next/mdx` in the App Router.
 *
 * Every element maps onto the existing type system. No new colour tokens and no new type
 * sizes: a legal document is body copy with headings, and the site already has both.
 *
 * Internal links go through `next/link` so the legal pages behave like every other route,
 * and anything absolute stays an anchor.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: ({ children }) => (
      <h2 className="text-title text-fg mt-16 font-bold first:mt-0">{children}</h2>
    ),
    h3: ({ children }) => <h3 className="text-body text-fg mt-10 font-bold">{children}</h3>,
    p: ({ children }) => <p className="measure text-body text-fg-muted mt-4">{children}</p>,
    ul: ({ children }) => (
      <ul className="measure text-body text-fg-muted mt-4 flex list-disc flex-col gap-2 pl-6">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="measure text-body text-fg-muted mt-4 flex list-decimal flex-col gap-2 pl-6">
        {children}
      </ol>
    ),
    li: ({ children }) => <li>{children}</li>,
    strong: ({ children }) => <strong className="text-fg font-bold">{children}</strong>,
    a: ({ href, children }) => {
      const target = href ?? '#'
      const internal = target.startsWith('/')
      const className = 'text-fg underline decoration-border underline-offset-4 hover:decoration-fg'
      return internal ? (
        <Link href={target} className={className}>
          {children}
        </Link>
      ) : (
        <a href={target} className={className}>
          {children}
        </a>
      )
    },
    ...components,
  }
}
