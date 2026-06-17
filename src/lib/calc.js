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

// --- Grade Profile helpers -------------------------------------------------
// A "grade profile" decides the final grade from how many criteria reach each
// level (rather than from the weighted percentage). Authors define N ordered
// override rules; the first whose count-based conditions ALL hold wins. If none
// match, behaviour depends on the profile's `weightedFallback` flag (default on):
// on ⇒ the grade is the weighted-average band; off ⇒ no band is chosen
// (finalBand is null) and a grade must be set manually. These helpers are pure
// and shared by the engine, the editor (live preview) and the tests — one source
// of truth for the phrasing.

/** Bands ordered best → worst (highest `min` first). */
export function bandsTopToBottom(bands) {
  return [...bands].sort((a, b) => b.min - a.min)
}

/** Does a single criterion (its level rank vs. the reference level) satisfy a matcher? */
function criterionMatches(rank, refRank, matcher) {
  if (matcher === 'exactly') return rank === refRank
  if (matcher === 'below') return rank > refRank // strictly worse
  return rank <= refRank // 'reach' — this level or better
}

/** Count criteria whose selected level matches `matcher` relative to `levelKey`. */
export function countMatching(perCriterion, levels, matcher, levelKey) {
  const refRank = levelRank(levels, levelKey)
  return perCriterion.reduce((n, pc) => {
    const rank = levelRank(levels, pc.levelKey)
    return n + (rank >= 0 && criterionMatches(rank, refRank, matcher) ? 1 : 0)
  }, 0)
}

/** Evaluate one condition. Returns the live count + whether it holds. */
export function conditionHolds(perCriterion, levels, condition) {
  const actual = countMatching(perCriterion, levels, condition.matcher, condition.levelKey)
  const count = Number(condition.count) || 0
  const ok =
    condition.quantifier === 'atMost' ? actual <= count : condition.quantifier === 'exactly' ? actual === count : actual >= count
  return { actual, ok }
}

/**
 * Evaluate one override rule. Conditions are AND-ed. An override with NO
 * conditions never matches (the catch-all is the fallback, not an empty rule).
 */
export function overrideMatches(perCriterion, levels, override) {
  const conditions = (override.conditions ?? []).map((c) => ({ ...c, ...conditionHolds(perCriterion, levels, c) }))
  const matched = conditions.length > 0 && conditions.every((c) => c.ok)
  const firstUnmet = conditions.find((c) => !c.ok) ?? null
  return { matched, conditions, firstUnmet }
}

/**
 * Run the whole profile: the first matching override wins (its target band).
 * If none match, the configurable `weightedFallback` flag (default on) decides:
 * on ⇒ fall back to the weighted-average band; off ⇒ return a null band (no
 * auto-selection — a grade must be set manually). Returns the chosen band plus a
 * per-rule trace so the UI can explain the decision.
 */
export function evaluateProfile({ perCriterion, levels, bands, profile, computedBand }) {
  const overrides = profile?.overrides ?? []
  const useFallback = profile?.weightedFallback !== false // default on
  const evaluated = overrides.map((o) => ({ override: o, ...overrideMatches(perCriterion, levels, o) }))
  const winnerIdx = evaluated.findIndex((e) => e.matched)

  const noMatch = winnerIdx < 0
  const finalBand = noMatch
    ? useFallback
      ? computedBand
      : null
    : bandById(bands, evaluated[winnerIdx].override.targetBandId) ?? computedBand
  return {
    active: true,
    finalBand,
    winnerIdx,
    fallbackUsed: noMatch && useFallback,
    noGrade: noMatch && !useFallback,
    evaluated,
  }
}

/** Plain-English sentence for a condition — shared by the editor preview and the engine steps. */
export function describeCondition(levels, c) {
  const levelLabel = levelByKey(levels, c.levelKey)?.label ?? '(level)'
  const matcherText = c.matcher === 'exactly' ? 'are exactly' : c.matcher === 'below' ? 'are below' : 'reach'
  const count = Number(c.count) || 0
  // "no criteria are below Merit" reads better than "at most 0 …".
  if (count === 0 && (c.quantifier === 'atMost' || c.quantifier === 'exactly')) {
    return `no criteria ${matcherText} ${levelLabel}`
  }
  const quantText = c.quantifier === 'atMost' ? 'at most' : c.quantifier === 'exactly' ? 'exactly' : 'at least'
  return `${quantText} ${count} criteria ${matcherText} ${levelLabel}`
}

/** Plain-English sentence for a whole override rule (band label, or the rule's own label when band-less). */
export function describeOverride(levels, bands, o) {
  const target = bandById(bands, o.targetBandId)?.label ?? o.label ?? 'this grade'
  const conds = o.conditions ?? []
  if (conds.length === 0) return `Award “${target}” — no conditions yet, so this rule never applies.`
  return `Award “${target}” if ${conds.map((c) => describeCondition(levels, c)).join(' and ')}.`
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

  // Grade Profile mode swaps the weighted gate/guarantee rules for ordered,
  // count-based override rules (see the helpers above). The weighted path stays
  // exactly as it was for every other rule set.
  const profileMode = rulesOn && rules.mode === 'profile'

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
  if (rulesOn && !profileMode && rules.guarantee?.enabled) {
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
  if (rulesOn && !profileMode && rules.gate?.enabled) {
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

  // 4b. Grade Profile (count-based override rules) --------------------------
  // First matching rule (top → bottom) sets the final grade; otherwise the
  // weighted-average fallback applies when enabled, or no grade is set (left for
  // a manual override). Every decision is recorded so the student sees, in plain
  // language, which rule won and why the higher ones (if any) did not.
  let profileOut = { active: false }
  if (profileMode) {
    const pe = evaluateProfile({ perCriterion, levels, bands, profile: rules.profile, computedBand })
    profileOut = pe
    finalBand = pe.finalBand

    // A rule's name is the grade it awards (the target band's label).
    const gradeOf = (o) => bandById(bands, o.targetBandId)?.label ?? 'this grade'

    // Explain each higher-priority rule that did not apply (only those above the
    // winner — keeps the trace short and answers "why didn't I get the top grade?").
    const upTo = pe.winnerIdx >= 0 ? pe.winnerIdx : pe.evaluated.length
    for (let i = 0; i < upTo; i++) {
      const e = pe.evaluated[i]
      const grade = gradeOf(e.override)
      const why =
        e.conditions.length === 0
          ? 'it has no conditions set'
          : `“${describeCondition(levels, e.firstUnmet)}” was not met (${e.firstUnmet.actual} so far)`
      steps.push({
        kind: 'info',
        title: `Grade profile: “${grade}” not applied`,
        detail: `Would award “${grade}”, but ${why}.`,
      })
    }

    if (pe.winnerIdx >= 0) {
      const w = pe.evaluated[pe.winnerIdx]
      const met = w.conditions.map((c) => `${describeCondition(levels, c)} (${c.actual})`).join('; ')
      steps.push({
        kind: 'pass',
        title: `Grade profile: “${gradeOf(w.override)}” awarded`,
        detail: `Conditions met — ${met}. Final grade set to “${pe.finalBand.label}”.`,
      })
    } else if (pe.fallbackUsed) {
      steps.push({
        kind: 'info',
        title: 'Grade profile: no rule matched',
        detail: `No grade-profile rule matched, so the weighted-average band “${pe.finalBand.label}” stands.`,
      })
    } else {
      steps.push({
        kind: 'fail',
        title: 'Grade profile: no rule matched — manual grade required',
        detail:
          'No grade-profile rule matched and the weighted-average fallback is off, so no grade was set automatically. Set the final grade manually using the teacher override.',
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

  // A grade profile with the weighted-average fallback off can leave the grade
  // unset (finalBand null) when no rule matches and there is no teacher override.
  const noGrade = !finalBand
  const isPass = !!finalBand?.isPass
  // Only surface a fail reason when Pass/Fail grading is on and a band exists.
  if (rulesOn && finalBand && !isPass && failReasons.length === 0) {
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
    profile: profileOut,
    override: overrideOut,
    supersededByGate,
    finalBand,
    noGrade,
    isPass,
    steps,
    failReasons,
  }
}
