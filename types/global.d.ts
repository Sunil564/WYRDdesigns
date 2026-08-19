import type Lenis from 'lenis'

declare global {
  interface Window {
    /**
     * The running Lenis instance, or undefined under reduced motion where Lenis
     * is never constructed. Published here rather than through a context provider
     * so reaching it does not require a client boundary around the whole tree.
     */
    __lenis?: Lenis
  }
}

export {}
