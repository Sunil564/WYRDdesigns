/**
 * `npm audit`, split by whether the vulnerable package can reach a visitor.
 *
 * Development only. This does not fix anything and does not gate anything: it exists because
 * `npm audit` answers a question nobody asked. It reports "3 high severity vulnerabilities"
 * whether the package is in the request path or is a test runner that never leaves the laptop,
 * and a number that treats those two the same is a number people learn to ignore.
 *
 * The split is taken from the dependency graph rather than guessed. A package is **shipped** if
 * every path from it reaches the root through `dependencies`. It is **development only** if
 * every path passes through a `devDependencies` edge at least once. Anything reachable both
 * ways is reported as shipped, because the worse reading is the true one.
 *
 * What this cannot tell you is whether a shipped advisory is *exploitable*. `sharp` is shipped
 * by that definition and is still not exposure, because the optimizer refuses every input
 * except our own files. Reachability in the graph is the cheap half of the question and this
 * automates it. The expensive half is ADR 0021 and stays a human judgement.
 *
 * Usage: node scripts/check-audit.mjs
 */

import { execFileSync } from 'node:child_process'

/** Direct dependencies of this project, split by section, from package.json. */
function manifestSections() {
  const pkg = JSON.parse(
    execFileSync('npm', ['pkg', 'get', 'dependencies', 'devDependencies'], {
      encoding: 'utf8',
      shell: process.platform === 'win32',
    }),
  )
  return {
    prod: new Set(Object.keys(pkg.dependencies ?? {})),
    dev: new Set(Object.keys(pkg.devDependencies ?? {})),
  }
}

function audit() {
  try {
    const raw = execFileSync('npm', ['audit', '--json'], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      shell: process.platform === 'win32',
    })
    return JSON.parse(raw)
  } catch (error) {
    /*
      `npm audit` exits non zero when it finds anything, which is the normal case here. The
      report is still on stdout, so a non zero exit is not a failure to read.
    */
    if (error.stdout) return JSON.parse(error.stdout)
    throw error
  }
}

const { prod, dev } = manifestSections()
const report = audit()
const vulns = report.vulnerabilities ?? {}

/**
 * Walk `effects` up to the roots and decide whether any path is entirely production.
 *
 * `npm audit` gives each vulnerable package the list of packages it affects. Following that to
 * a direct dependency tells you which section of `package.json` the chain lands in.
 */
function reachesProduction(name, seen = new Set()) {
  if (seen.has(name)) return false
  seen.add(name)
  if (prod.has(name)) return true
  if (dev.has(name)) return false

  const entry = vulns[name]
  if (!entry) return false
  return (entry.effects ?? []).some((effect) => reachesProduction(effect, seen))
}

/** The direct dependencies a chain ends at, for the report line. */
function rootsOf(name, seen = new Set()) {
  if (seen.has(name)) return []
  seen.add(name)
  if (prod.has(name)) return [`${name} (dependency)`]
  if (dev.has(name)) return [`${name} (devDependency)`]

  const entry = vulns[name]
  if (!entry) return []
  return [...new Set((entry.effects ?? []).flatMap((effect) => rootsOf(effect, seen)))]
}

const shipped = []
const development = []

for (const [name, entry] of Object.entries(vulns)) {
  /* Only the packages carrying an advisory of their own, not the ones merely affected by one. */
  const advisories = (entry.via ?? []).filter((via) => typeof via === 'object')
  if (advisories.length === 0) continue

  const row = {
    name,
    severity: entry.severity,
    range: entry.range,
    roots: rootsOf(name),
    titles: advisories.map((via) => ({
      title: via.title,
      score: via.cvss?.score || null,
    })),
  }
  ;(reachesProduction(name) ? shipped : development).push(row)
}

const bySeverity = { critical: 0, high: 1, moderate: 2, low: 3, info: 4 }
const order = (a, b) => (bySeverity[a.severity] ?? 9) - (bySeverity[b.severity] ?? 9)
shipped.sort(order)
development.sort(order)

function print(label, rows) {
  console.log(`\n${label}: ${rows.length}`)
  if (rows.length === 0) {
    console.log('  none')
    return
  }
  for (const row of rows) {
    console.log(`  ${row.severity.toUpperCase()}  ${row.name}  ${row.range}`)
    console.log(`      via: ${row.roots.join(', ') || 'unknown'}`)
    for (const advisory of row.titles) {
      /*
        The score is printed, including when it is absent. An advisory with no CVSS vector is
        inherited severity rather than a scored assessment, and "no score" is the finding.
      */
      const score = advisory.score ? `CVSS ${advisory.score}` : 'no CVSS score'
      console.log(`      ${score}: ${advisory.title.slice(0, 96)}`)
    }
  }
}

console.log('npm audit, split by whether the package can reach a visitor')
print('SHIPPED, reachable in the deployed application', shipped)
print('DEVELOPMENT ONLY, never leaves the repository', development)

console.log(
  `\n${shipped.length} shipped, ${development.length} development only. Reachability in the ` +
    'dependency graph is not the same as exploitability: see docs/BLOCKERS.md item 13 and ' +
    'ADR 0021 for what the shipped ones actually expose.',
)
