// ===========================================================================
// The contract bridge.
//
// An assignment only stores *references* (gradeScaleId, rubricId) plus its own
// `rules`. This module resolves those into the exact input object the grading
// engine expects — { bands, rubric, rules, passFailEnabled } — so calc.js is
// always called with its original signature and stays untouched.
//
// `sanitizeRules` also guards against dangling references that can appear after
// a library item is edited (a level/criterion/band the rules pointed at was
// removed). This replaces the cross-cutting fixups the old wizard did inline.
// ===========================================================================

import { bandsTopToBottom } from './calc.js'

/** A sensible default rule set for a given rubric + grade scale. */
export function defaultRulesFor(rubric, bands) {
  const levels = rubric?.levels ?? []
  // Pass at the second-best level when available (mirrors the seed default).
  const passLevelKey = levels[Math.min(1, levels.length - 1)]?.key ?? levels[0]?.key ?? null
  const passBands = bands.filter((b) => b.isPass)
  const minBandId = (passBands[passBands.length - 1] ?? bands[0])?.id ?? null
  return {
    passLevelKey,
    gate: { enabled: true },
    guarantee: { enabled: false, criterionIds: [], mode: 'any', minBandId },
  }
}

/**
 * An empty Grade Profile. `weightedFallback` (default on) controls what happens
 * when no rule matches: on ⇒ the weighted-average band is used; off ⇒ no grade is
 * chosen automatically and the evaluator must set it manually.
 */
export function defaultProfile() {
  return { overrides: [], weightedFallback: true }
}

/**
 * Bind a profile's rules to a given scale's bands. A target band that is valid
 * on the scale is kept (same scale ⇒ rules carry over 1:1); an invalid/dangling
 * one re-maps to the i-th band from the top, clamped (different scale ⇒ a sane
 * starting point the instructor can adjust — the assignment's scale has priority).
 */
function bindProfile(profile, bands) {
  const desc = bandsTopToBottom(bands)
  const last = desc.length - 1
  const bandIds = new Set(bands.map((b) => b.id))
  const overrides = (profile?.overrides ?? []).map((o, i) => ({
    ...o,
    targetBandId: bandIds.has(o.targetBandId) ? o.targetBandId : desc[Math.min(i, last)]?.id ?? null,
  }))
  return { overrides, weightedFallback: profile?.weightedFallback ?? true }
}

/**
 * Seed an assignment's full rules from a rubric's (band-less) rules, defaulting
 * the guarantee's minimum band to the lowest passing band of the chosen scale.
 * Used when a rubric is selected in the Create-Assignment wizard.
 */
export function seedRules(rubricRules, bands) {
  const passBands = bands.filter((b) => b.isPass)
  const minBandId = (passBands[passBands.length - 1] ?? bands[0])?.id ?? null
  const weighted = {
    passLevelKey: rubricRules?.passLevelKey ?? null,
    gate: { enabled: !!rubricRules?.gate?.enabled },
    guarantee: {
      enabled: !!rubricRules?.guarantee?.enabled,
      criterionIds: rubricRules?.guarantee?.criterionIds ?? [],
      mode: rubricRules?.guarantee?.mode === 'all' ? 'all' : 'any',
      minBandId,
    },
  }
  // Weighted rubrics seed exactly as before. Profile rubrics additionally bind
  // their band-less override rules to the chosen scale's bands by position.
  if (rubricRules?.mode !== 'profile' && !rubricRules?.profile) return weighted
  return { mode: 'profile', ...weighted, profile: bindProfile(rubricRules.profile, bands) }
}

/** Coerce a profile into a valid shape: drop dead conditions, repair dangling target bands. */
function sanitizeProfile(profile, bands, levelKeys, bandIds) {
  const desc = bandsTopToBottom(bands)
  const last = desc.length - 1
  const QUANT = new Set(['atLeast', 'atMost', 'exactly'])
  const MATCH = new Set(['reach', 'exactly', 'below'])

  const overrides = (profile?.overrides ?? []).map((o, i) => ({
    id: o.id,
    // Valid target stays; a dangling one (e.g. after a scale swap) re-binds by position.
    targetBandId: bandIds.has(o.targetBandId) ? o.targetBandId : desc[Math.min(i, last)]?.id ?? null,
    conditions: (o.conditions ?? [])
      .filter((c) => levelKeys.has(c.levelKey)) // drop conditions whose level was deleted
      .map((c) => ({
        id: c.id,
        quantifier: QUANT.has(c.quantifier) ? c.quantifier : 'atLeast',
        count: Math.max(0, Math.round(Number(c.count) || 0)),
        matcher: MATCH.has(c.matcher) ? c.matcher : 'reach',
        levelKey: c.levelKey,
      })),
  }))

  return { overrides, weightedFallback: profile?.weightedFallback ?? true }
}

/** Coerce `rules` into a valid shape for the given rubric + bands. */
export function sanitizeRules(rules, rubric, bands) {
  const base = defaultRulesFor(rubric, bands)
  if (!rules) return base

  const levelKeys = new Set((rubric?.levels ?? []).map((l) => l.key))
  const critIds = new Set((rubric?.criteria ?? []).map((c) => c.id))
  const bandIds = new Set(bands.map((b) => b.id))

  // Weighted fields are always sanitized; for a legacy (mode-less) rule set we
  // return exactly this object, byte-for-byte identical to before.
  const weighted = {
    passLevelKey: levelKeys.has(rules.passLevelKey) ? rules.passLevelKey : base.passLevelKey,
    gate: { enabled: !!rules.gate?.enabled },
    guarantee: {
      enabled: !!rules.guarantee?.enabled,
      criterionIds: (rules.guarantee?.criterionIds ?? []).filter((id) => critIds.has(id)),
      mode: rules.guarantee?.mode === 'all' ? 'all' : 'any',
      minBandId: bandIds.has(rules.guarantee?.minBandId) ? rules.guarantee.minBandId : base.guarantee.minBandId,
    },
  }

  if (rules.mode !== 'profile' && !rules.profile) return weighted
  return { mode: 'profile', ...weighted, profile: sanitizeProfile(rules.profile, bands, levelKeys, bandIds) }
}

/**
 * Resolve an assignment into its full grading configuration.
 * Returns the engine-ready fields plus the `scale`/`rubric` objects for the UI.
 *
 * Grade rules are a single source of truth: they live on the RUBRIC (global) and
 * are bound here to the assignment's chosen scale bands. The assignment itself no
 * longer carries its own rules.
 */
export function resolveAssignmentConfig(state, assignment) {
  const scale = state.gradeScales.find((s) => s.id === assignment?.gradeScaleId) ?? null
  const rubric = state.rubrics.find((r) => r.id === assignment?.rubricId) ?? null
  const bands = scale?.bands ?? []
  return {
    scale,
    rubric,
    bands,
    rules: sanitizeRules(rubric?.rules, rubric, bands),
    passFailEnabled: !!scale?.passFailEnabled,
  }
}

/** The exact object spread into computeResult (engine signature, unchanged). */
export function engineInput(config, evaluation, override) {
  return {
    bands: config.bands,
    rubric: config.rubric,
    rules: config.rules,
    passFailEnabled: config.passFailEnabled,
    evaluation,
    override,
  }
}
