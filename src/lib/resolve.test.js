import { describe, it, expect } from 'vitest'
import { sanitizeRules, resolveAssignmentConfig, defaultRulesFor } from './resolve.js'
import { computeResult } from './calc.js'
import {
  defaultRules,
  defaultBands,
  defaultRubric,
  defaultGradeScales,
  defaultRubrics,
  defaultAssignments,
} from '../data/sampleData.js'

const rubEssay = defaultRubrics.find((r) => r.id === 'rub_essay')
const state = { gradeScales: defaultGradeScales, rubrics: defaultRubrics }
const asgEssay = defaultAssignments.find((a) => a.id === 'asg_essay')

describe('sanitizeRules', () => {
  it('passes valid rules through unchanged', () => {
    expect(sanitizeRules(defaultRules, rubEssay, defaultBands)).toEqual(defaultRules)
  })

  it('falls back to a default when rules are null', () => {
    expect(sanitizeRules(null, rubEssay, defaultBands)).toEqual(defaultRulesFor(rubEssay, defaultBands))
  })

  it('repairs dangling references', () => {
    const broken = {
      passLevelKey: 'ghost_level',
      gate: { enabled: true },
      guarantee: { enabled: true, criterionIds: ['ghost_crit', 'crit_thesis'], mode: 'all', minBandId: 'ghost_band' },
    }
    const fixed = sanitizeRules(broken, rubEssay, defaultBands)
    expect(rubEssay.levels.some((l) => l.key === fixed.passLevelKey)).toBe(true)
    expect(fixed.guarantee.criterionIds).toEqual(['crit_thesis'])
    expect(defaultBands.some((b) => b.id === fixed.guarantee.minBandId)).toBe(true)
    expect(fixed.guarantee.mode).toBe('all')
  })
})

describe('resolveAssignmentConfig', () => {
  it('resolves the essay assignment to the original engine inputs', () => {
    const cfg = resolveAssignmentConfig(state, asgEssay)
    expect(cfg.bands).toBe(defaultBands)
    expect(cfg.passFailEnabled).toBe(true)
    expect(cfg.rubric.criteria).toEqual(defaultRubric.criteria)
    expect(cfg.rules).toEqual(defaultRules)
  })

  it('produces a result identical to calling the engine directly', () => {
    const cfg = resolveAssignmentConfig(state, asgEssay)
    const evaluation = Object.fromEntries(
      cfg.rubric.criteria.map((c) => [c.id, { levelKey: 'proficient', points: 3 }]),
    )
    const viaResolver = computeResult({ ...cfg, evaluation, override: { bandId: null, reason: '' } })
    const direct = computeResult({
      bands: defaultBands,
      rubric: defaultRubric,
      rules: defaultRules,
      passFailEnabled: true,
      evaluation,
      override: { bandId: null, reason: '' },
    })
    expect(viaResolver.finalBand).toEqual(direct.finalBand)
    expect(viaResolver.rawPercent).toBe(direct.rawPercent)
    expect(viaResolver.steps).toEqual(direct.steps)
  })
})
