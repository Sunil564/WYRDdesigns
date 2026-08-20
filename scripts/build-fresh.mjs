/**
 * Build freshness guard for the verification harness. Development only.
 *
 * The verification server is `next start` against a prebuilt directory, so it has no
 * HMR and no way to notice that the source moved on underneath it. It will serve a
 * build from an hour ago, cheerfully, forever. That cost a full round of measurements
 * in this build: the density fix and the whole of the reveal were verified against a
 * page that contained neither, and the numbers looked plausible because a stale build
 * of this site looks almost exactly like a fresh one.
 *
 * That is the same failure as the 16,000 point ceiling: a tool quietly substituting
 * something for what was asked for. The fix is the same too, which is to make the
 * substitution impossible to not notice.
 *
 * Every script that measures through the server calls `assertBuildFresh()` before its
 * first navigation, and `verify-server.sh` calls it before starting. It throws rather
 * than warning, because a warning in a screenful of measurement output is a warning
 * nobody reads.
 */

import { readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * Directories and files whose contents end up in the build. Anything here being newer
 * than the build means the build is out of date.
 *
 * `scripts` is deliberately absent: the harness is not part of the bundle, and
 * including it would mean every edit to a measurement script invalidated the build it
 * was about to measure.
 */
const SOURCES = ['app', 'components', 'lib', 'content', 'types']
/*
  `tsconfig.json` is deliberately absent. Next rewrites it on every build, adding its
  own types glob and reformatting the file, so it is newer than the build it produced
  every single time and would make this guard cry stale on a build that is perfect. It
  is also the wrong signal: it carries type checking and path aliases, and a real change
  to either shows up as a build error rather than as a silently wrong page.
*/
const SOURCE_FILES = ['next.config.ts', 'postcss.config.mjs', 'package.json']

/** Directories inside the sources that hold no build input. */
const SKIP = new Set(['node_modules', '.git', '.next', '.next-verify'])

function newest(path, found) {
  let stat
  try {
    stat = statSync(path)
  } catch {
    return found
  }

  if (stat.isDirectory()) {
    for (const entry of readdirSync(path)) {
      if (SKIP.has(entry)) continue
      found = newest(join(path, entry), found)
    }
    return found
  }

  return stat.mtimeMs > found.mtimeMs ? { mtimeMs: stat.mtimeMs, path } : found
}

/**
 * Throw unless the build in `dist` is newer than every file that feeds it.
 *
 * @param {{ dist?: string, base?: string }} options
 */
export function assertBuildFresh({ dist = '.next-verify', base } = {}) {
  // A dev server compiles on demand, so freshness is not a question there. Only the
  // prebuilt harness port can go stale.
  if (base && !base.includes('3100')) return

  let buildStamp
  try {
    buildStamp = statSync(join(dist, 'BUILD_ID')).mtimeMs
  } catch {
    throw new Error(
      `STALE HARNESS: no build found in ${dist}/. The server on 3100 serves this ` +
        `directory, so there is nothing to measure. Run:\n` +
        `  NEXT_DIST_DIR=${dist} npx next build && bash scripts/verify-server.sh`,
    )
  }

  let latest = { mtimeMs: 0, path: '(none)' }
  for (const source of [...SOURCES, ...SOURCE_FILES]) latest = newest(source, latest)

  const when = (ms) => new Date(ms).toISOString().replace('T', ' ').slice(0, 19)

  if (latest.mtimeMs > buildStamp) {
    const behind = Math.round((latest.mtimeMs - buildStamp) / 1000)
    throw new Error(
      `STALE HARNESS: ${dist}/ was built ${behind}s before the newest source file, so ` +
        `the server on 3100 is not serving the code you are about to measure.\n` +
        `  build      ${when(buildStamp)}\n` +
        `  ${relative('.', latest.path).padEnd(10)} ${when(latest.mtimeMs)}\n` +
        `Rebuild first:\n` +
        `  NEXT_DIST_DIR=${dist} npx next build && bash scripts/verify-server.sh`,
    )
  }

  /*
    Deliberately not compared against HEAD's commit time.

    "Older than HEAD" sounds like the right test and is the wrong one in both
    directions. It misses the failure that actually happened, because the edits that
    went unmeasured were uncommitted, so HEAD had not moved at all. And it fires on the
    ordinary loop of build, verify, commit, verify again, where the build matches the
    tree exactly and is merely older than the commit that recorded it.

    File times catch both: a commit does not touch mtimes, so build then commit passes,
    and a checkout does touch them, so moving to another branch fails. The question the
    harness needs answered is whether the bytes on disk are newer than the bytes it is
    serving, and that is what this measures.
  */

  return { buildStamp, newestSource: latest.path }
}

// CLI mode, so verify-server.sh can gate on it without duplicating the logic.
//
// Compared as file URLs rather than as strings: this path contains a space, which argv
// carries raw and import.meta.url carries percent encoded, so a string compare of the
// two silently never matches and CLI mode silently never runs. It did exactly that on
// the first attempt, which is a small instance of the thing this file exists to stop.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = assertBuildFresh({ dist: process.env.NEXT_DIST_DIR ?? '.next-verify' })
    console.log(`build is current, newest source ${relative('.', result.newestSource)}`)
  } catch (error) {
    console.error(String(error.message))
    process.exit(1)
  }
}
