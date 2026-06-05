// ===========================================================================
// Calculation engine — the core "concept & solution" of this PoC.
//
// This module is PURE: given the configuration (bands, rubric, rules) and the
// teacher's evaluation, it returns a fully-explained result object. Every
// decision the engine makes is recorded in `steps[]` so the UI can render a
// transparent, human-readable breakdown of exactly how the grade was reached.
// ===========================================================================

// --- Low-level helpers -----------------------------------------------------

/** Normalize a level's points to a { min, max } range (single values become min==max). */
export function pointsRange(level) {
  const p = level.points
  if (typeof p === 'number') return { min: p, max: p }
  return { min: Number(p.min), max: Number(p.max) }
}

/** Highest points any single criterion can earn (= the top level's max points). */
export function topLevelMaxPoints(levels) {
  return Math.max(...levels.map((l) => pointsRange(l).max))
}

/**
 * Rank of a level: 0 = best (first column), higher = worse.
 * Used for "does this selection reach at least level X?" comparisons.
 */
export function levelRank(levels, key) {
  return levels.findIndex((l) => l.key === key)
}

export const levelByKey = (levels, key) => levels.find((l) => l.key === key)
export const bandById = (bands, id) => bands.find((b) => b.id === id)

/**
 * Map a percentage to a band. Bands are matched by `min` (highest min that the
 * percentage clears wins), which keeps contiguous bands unambiguous at their
 * shared boundaries. Falls back to the lowest band.
 */
export function bandForPercent(bands, percent) {
  const sorted = [...bands].sort((a, b) => b.min - a.min)
  return sorted.find((b) => percent >= b.min) ?? sorted[sorted.length - 1]
}

/** Returns whichever band sits higher on the scale (by min). */
function higherBand(a, b) {
  if (!a) return b
  if (!b) return a
  return a.min >= b.min ? a : b
}

/** The lowest failing band (used as the target when the minimum gate fails). */
export function lowestFailBand(bands) {
  const fails = bands.filter((b) => !b.isPass).sort((a, b) => a.min - b.min)
  return fails[0] ?? [...bands].sort((a, b) => a.min - b.min)[0]
}

const round = (n, d = 1) => {
  const f = 10 ** d
  return Math.round(n * f) / f
}

// --- Main engine -----------------------------------------------------------

/**
 * @returns {object} result
 *   complete      – every criterion has been evaluated
 *   perCriterion  – per-row breakdown (points, weight, earned, max, meetsMin)
 *   totalEarned/totalMax/rawPercent
 *   computedBand  – band derived purely from the percentage
 *   gate/guarantee – rule outcomes (triggered? why?)
 *   override      – teacher override outcome
 *   finalBand/isPass
 *   steps[]       – ordered, plain-language explanation of every decision
 *   failReasons[] – why the submission did not pass (for the result screen)
 */
export function computeResult({ bands, rubric, rules, evaluation, override, passFailEnabled = false }) {
  const { levels, criteria } = rubric
  const topMax = topLevelMaxPoints(levels)

  // 1. Per-criterion scoring -------------------------------------------------
  const perCriterion = criteria.map((c) => {
    const sel = evaluation[c.id]
    const level = sel ? levelByKey(levels, sel.levelKey) : null
    const points = sel ? Number(sel.points) : null
    const weight = Number(c.weight) || 0
    const earned = points == null ? 0 : points * weight
    const max = topMax * weight
    return {
      id: c.id,
      name: c.name,
      weight,
      levelKey: sel?.levelKey ?? null,
      levelLabel: level?.label ?? null,
      points,
      maxPoints: topMax,
      earned,
      max,
    }
  })

  const complete = perCriterion.every((pc) => pc.levelKey != null)
  if (!complete) {
    return { complete: false, perCriterion }
  }

  const totalEarned = perCriterion.reduce((s, pc) => s + pc.earned, 0)
  const totalMax = perCriterion.reduce((s, pc) => s + pc.max, 0)
  const rawPercent = totalMax > 0 ? round((totalEarned / totalMax) * 100) : 0

  const steps = []
  const failReasons = []

  // 2. Base band from percentage --------------------------------------------
  const computedBand = bandForPercent(bands, rawPercent)
  steps.push({
    kind: 'info',
    title: 'Weighted score',
    detail: `Earned ${round(totalEarned)} of ${round(totalMax)} possible points = ${rawPercent}%, which falls in band “${computedBand.label}”.`,
  })

  let finalBand = computedBand
  let supersededByGate = false

  // Pass/Fail grading is optional. When off, the final grade is simply the band
  // the percentage maps to (simple grading — no pass/fail, no rules).
  const rulesOn = !!passFailEnabled

  // Shared definition of a passing criterion: it reaches at least `passLevelKey`.
  const passRank = levelRank(levels, rules.passLevelKey)
  const passLevelLabel = levelByKey(levels, rules.passLevelKey)?.label
  const criterionPasses = (pc) => levelRank(levels, pc.levelKey) <= passRank

  if (!rulesOn) {
    steps.push({
      kind: 'info',
      title: 'Simple grading',
      detail: 'Pass/Fail grading is off, so the final grade is simply the band the score maps to.',
    })
  }

  // 3. Grade guarantee (reward) ---------------------------------------------
  // If ANY/ALL (per `mode`) of the selected criteria PASS, guarantee a minimum
  // band — a higher computed grade still wins.
  const guarantee = { triggered: false }
  if (rulesOn && rules.guarantee?.enabled) {
    const minBand = bandById(bands, rules.guarantee.minBandId)
    const mode = rules.guarantee.mode === 'all' ? 'all' : 'any'
    const selected = (rules.guarantee.criterionIds ?? [])
      .map((id) => perCriterion.find((pc) => pc.id === id))
      .filter(Boolean)
    const met = selected.length > 0 && (mode === 'all' ? selected.every(criterionPasses) : selected.some(criterionPasses))

    guarantee.triggered = met
    const names = selected.map((pc) => pc.name).join(', ')

    if (met && minBand) {
      const lifted = higherBand(finalBand, minBand)
      const didLift = lifted.id !== finalBand.id
      finalBand = lifted
      steps.push({
        kind: 'pass',
        title: 'Grade guarantee met',
        detail: `${mode === 'all' ? 'All of' : 'At least one of'} the key criteria (${names}) passed (reached at least “${passLevelLabel}”), guaranteeing a minimum of “${minBand.label}”.${didLift ? ` Final grade lifted to “${finalBand.label}”.` : ` Computed grade “${finalBand.label}” is already higher, so it stands.`}`,
      })
    } else if (minBand) {
      steps.push({
        kind: 'info',
        title: 'Grade guarantee not met',
        detail: `Minimum guarantee of “${minBand.label}” not applied — ${mode === 'all' ? 'not all' : 'none'} of the key criteria (${names}) passed.`,
      })
    }
  }

  // 4. Gate rule (hard safety net) ------------------------------------------
  // Every criterion must pass; if any fails, the submission fails. Applied AFTER
  // the guarantee so a failure always wins.
  const gate = { triggered: false }
  if (rulesOn && rules.gate?.enabled) {
    const failBand = lowestFailBand(bands)
    const failing = perCriterion.filter((pc) => !criterionPasses(pc))

    gate.triggered = failing.length >= 1
    gate.failing = failing.map((pc) => ({ name: pc.name, levelLabel: pc.levelLabel }))

    if (gate.triggered && failBand) {
      supersededByGate = finalBand.id !== failBand.id
      finalBand = failBand
      steps.push({
        kind: 'fail',
        title: 'Minimum to pass not met',
        detail: `Every criterion must pass (reach at least “${passLevelLabel}”). These did not: ${gate.failing.map((f) => `${f.name} (${f.levelLabel})`).join('; ')}. Final grade forced to “${failBand.label}”${supersededByGate ? ' (overrides the computed grade).' : '.'}`,
      })
      failing.forEach((pc) =>
        failReasons.push(`${pc.name} scored “${pc.levelLabel}”, below the pass level “${passLevelLabel}”.`),
      )
    } else {
      steps.push({
        kind: 'info',
        title: 'Minimum to pass met',
        detail: `Every criterion passed (reached at least “${passLevelLabel}”).`,
      })
    }
  }

  // 5. Teacher override (final say) -----------------------------------------
  const overrideOut = { active: false }
  if (override?.bandId) {
    const overrideBand = bandById(bands, override.bandId)
    if (overrideBand) {
      overrideOut.active = true
      overrideOut.from = finalBand
      finalBand = overrideBand
      steps.push({
        kind: 'override',
        title: 'Teacher override',
        detail: `Grade manually set to “${overrideBand.label}”. Reason: ${override.reason?.trim() ? override.reason.trim() : '(no reason provided)'}.`,
      })
    }
  }

  const isPass = !!finalBand.isPass
  // Only surface a fail reason when Pass/Fail grading is on.
  if (rulesOn && !isPass && failReasons.length === 0) {
    failReasons.push(`The overall score of ${rawPercent}% falls in the failing band “${finalBand.label}”.`)
  }

  return {
    complete: true,
    passFailEnabled: rulesOn,
    perCriterion,
    totalEarned: round(totalEarned),
    totalMax: round(totalMax),
    rawPercent,
    computedBand,
    guarantee,
    gate,
    override: overrideOut,
    supersededByGate,
    finalBand,
    isPass,
    steps,
    failReasons,
  }
}
