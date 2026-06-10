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
 * Seed an assignment's full rules from a rubric's (band-less) rules, defaulting
 * the guarantee's minimum band to the lowest passing band of the chosen scale.
 * Used when a rubric is selected in the Create-Assignment wizard.
 */
export function seedRules(rubricRules, bands) {
  const passBands = bands.filter((b) => b.isPass)
  const minBandId = (passBands[passBands.length - 1] ?? bands[0])?.id ?? null
  return {
    passLevelKey: rubricRules?.passLevelKey ?? null,
    gate: { enabled: !!rubricRules?.gate?.enabled },
    guarantee: {
      enabled: !!rubricRules?.guarantee?.enabled,
      criterionIds: rubricRules?.guarantee?.criterionIds ?? [],
      mode: rubricRules?.guarantee?.mode === 'all' ? 'all' : 'any',
      minBandId,
    },
  }
}

/** Coerce `rules` into a valid shape for the given rubric + bands. */
export function sanitizeRules(rules, rubric, bands) {
  const base = defaultRulesFor(rubric, bands)
  if (!rules) return base

  const levelKeys = new Set((rubric?.levels ?? []).map((l) => l.key))
  const critIds = new Set((rubric?.criteria ?? []).map((c) => c.id))
  const bandIds = new Set(bands.map((b) => b.id))

  return {
    passLevelKey: levelKeys.has(rules.passLevelKey) ? rules.passLevelKey : base.passLevelKey,
    gate: { enabled: !!rules.gate?.enabled },
    guarantee: {
      enabled: !!rules.guarantee?.enabled,
      criterionIds: (rules.guarantee?.criterionIds ?? []).filter((id) => critIds.has(id)),
      mode: rules.guarantee?.mode === 'all' ? 'all' : 'any',
      minBandId: bandIds.has(rules.guarantee?.minBandId) ? rules.guarantee.minBandId : base.guarantee.minBandId,
    },
  }
}

/**
 * Resolve an assignment into its full grading configuration.
 * Returns the engine-ready fields plus the `scale`/`rubric` objects for the UI.
 */
export function resolveAssignmentConfig(state, assignment) {
  const scale = state.gradeScales.find((s) => s.id === assignment?.gradeScaleId) ?? null
  const rubric = state.rubrics.find((r) => r.id === assignment?.rubricId) ?? null
  const bands = scale?.bands ?? []
  return {
    scale,
    rubric,
    bands,
    rules: sanitizeRules(assignment?.rules, rubric, bands),
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
