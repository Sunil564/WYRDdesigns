/**
 * Refuse to verify while a stale production server is answering on port 3000.
 * Development only.
 *
 * A `next start` was left on 3000 for most of this build while verification served 3100.
 * It answered every request happily with a build from hours earlier, and the operator
 * spent several turns looking at it and concluding nothing had changed. Same class as the
 * harness reading invisible elements: a tool quietly serving something other than what
 * was asked for.
 *
 * The discriminator is the hashed page chunk. Two production builds of this app differ in
 * `/_next/static/chunks/app/page-<hash>.js`, and the hash is in the served HTML and in the
 * dist directory on disk, so they can be compared without trusting either side's word.
 *
 * A `next dev` server on 3000 is left alone on purpose. It compiles on demand, so it
 * cannot be stale, and killing a developer's dev server to run a check would be worse
 * than the problem.
 */

import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

const PORT = 3000

/** The page chunk this build produced, from the dist directory. */
function builtPageChunk(dist) {
  try {
    return readdirSync(join(dist, 'static', 'chunks', 'app')).find((name) =>
      /^page-[a-f0-9]+\.js$/.test(name),
    )
  } catch {
    return undefined
  }
}

/** The page chunk a running server is serving, from its HTML. */
async function servedPageChunk(port) {
  try {
    const response = await fetch(`http://localhost:${port}/`, {
      signal: AbortSignal.timeout(2500),
    })
    const html = await response.text()
    // Development builds carry no content hash, and are not the failure mode.
    if (/\/_next\/static\/chunks\/app\/page\.js/.test(html)) return 'development'
    return html.match(/\/_next\/static\/chunks\/app\/(page-[a-f0-9]+\.js)/)?.[1]
  } catch {
    return undefined
  }
}

export async function assertNoStalePort({ dist = '.next-verify' } = {}) {
  const served = await servedPageChunk(PORT)
  if (served === undefined) return { port: PORT, state: 'nothing listening' }
  if (served === 'development') return { port: PORT, state: 'a dev server, self updating' }

  const built = builtPageChunk(dist)
  if (built && served === built) return { port: PORT, state: `serving the current build, ${served}` }

  throw new Error(
    `STALE SERVER on port ${PORT}. It is answering with a different build from the one ` +
      `under verification, so anything looked at there is not this code.\n` +
      `  port ${PORT} serves  ${served}\n` +
      `  ${dist} built     ${built ?? '(no page chunk found)'}\n` +
      `Stop it, or rebuild and restart it, then run again:\n` +
      `  bash scripts/verify-server.sh`,
  )
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = await assertNoStalePort({ dist: process.env.NEXT_DIST_DIR ?? '.next-verify' })
    console.log(`port ${result.port}: ${result.state}`)
  } catch (error) {
    console.error(String(error.message))
    process.exit(1)
  }
}
