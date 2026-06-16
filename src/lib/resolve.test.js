import { describe, it, expect } from 'vitest'
import { sanitizeRules, resolveAssignmentConfig, defaultRulesFor, seedRules } from './resolve.js'
import { computeResult } from './calc.js'
import {
  defaultRules,
  defaultBands,
  defaultRubric,
  defaultGradeScales,
  defaultRubrics,
  defaultAssignments,
  vocationalBands,
  strategicRules,
} from '../data/sampleData.js'

const rubEssay = defaultRubrics.find((r) => r.id === 'rub_essay')
const rubStrategic = defaultRubrics.find((r) => r.id === 'rub_strategic')
const state = { gradeScales: defaultGradeScales, rubrics: defaultRubrics }
const asgEssay = defaultAssignments.find((a) => a.id === 'asg_essay')
const asgStrategic = defaultAssignments.find((a) => a.id === 'asg_strategic')

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

describe('grade profile rules', () => {
  it('legacy weighted rules seed with no profile keys (unchanged)', () => {
    const seeded = seedRules(rubEssay.rules, defaultBands)
    expect(seeded.mode).toBeUndefined()
    expect(seeded.profile).toBeUndefined()
    expect(Object.keys(seeded).sort()).toEqual(['gate', 'guarantee', 'passLevelKey'])
  })

  it('keeps profile target bands that are valid on the scale (same scale ⇒ 1:1)', () => {
    const seeded = seedRules(strategicRules, vocationalBands)
    expect(seeded.mode).toBe('profile')
    expect(seeded.profile.overrides.map((o) => o.targetBandId)).toEqual(['band_dist', 'band_merit', 'band_pass'])
    expect(seeded.profile.fallback).toBeUndefined()
  })

  it('re-maps target bands by clamped position when the scale differs', () => {
    const twoBands = [
      { id: 'hi', label: 'Pass', min: 50, max: 100, isPass: true },
      { id: 'lo', label: 'Fail', min: 0, max: 50, isPass: false },
    ]
    const seeded = seedRules(strategicRules, twoBands)
    // band_dist/merit/pass are invalid here → positions 0,1,2 (clamped) → hi, lo, lo
    expect(seeded.profile.overrides.map((o) => o.targetBandId)).toEqual(['hi', 'lo', 'lo'])
  })

  it('re-seeds a dangling target band by position on resolve', () => {
    const broken = {
      mode: 'profile',
      profile: { overrides: [{ id: 'o1', targetBandId: 'ghost', conditions: [] }] },
    }
    const fixed = sanitizeRules(broken, rubStrategic, vocationalBands)
    expect(fixed.profile.overrides[0].targetBandId).toBe('band_dist') // position 0 → top band
  })

  it('drops a condition whose level was deleted but keeps the rule', () => {
    const rules = {
      mode: 'profile',
      profile: {
        overrides: [
          {
            id: 'o1',
            targetBandId: 'band_dist',
            conditions: [
              { id: 'c1', quantifier: 'atLeast', count: 4, matcher: 'reach', levelKey: 'distinction' },
              { id: 'c2', quantifier: 'atLeast', count: 1, matcher: 'reach', levelKey: 'ghost_level' },
            ],
          },
        ],
      },
    }
    const fixed = sanitizeRules(rules, rubStrategic, vocationalBands)
    expect(fixed.profile.overrides).toHaveLength(1)
    expect(fixed.profile.overrides[0].conditions).toHaveLength(1)
    expect(fixed.profile.overrides[0].conditions[0].levelKey).toBe('distinction')
  })

  it('resolves the strategic assignment to a profile config', () => {
    const cfg = resolveAssignmentConfig(state, asgStrategic)
    expect(cfg.passFailEnabled).toBe(true)
    expect(cfg.rules.mode).toBe('profile')
    expect(cfg.rules.profile.overrides).toHaveLength(3)
    expect(cfg.rules.profile.fallback).toBeUndefined()
  })

  it('grades the seeded strategic assignment end-to-end (resolver → engine)', () => {
    const cfg = resolveAssignmentConfig(state, asgStrategic)
    const pts = { distinction: 4, merit: 3, pass: 2, fail: 1 }
    const grade = (levelKey) =>
      Object.fromEntries(cfg.rubric.criteria.map((c, i) => [c.id, { levelKey: levelKey(i), points: pts[levelKey(i)] }]))
    const compute = (levelKey) =>
      computeResult({ ...cfg, evaluation: grade(levelKey), override: { bandId: null, reason: '' } }).finalBand.label

    // 6 criteria, levels distinction/merit/pass/fail — reproduce the user's scenarios.
    expect(compute((i) => (i < 4 ? 'distinction' : 'merit'))).toBe('Distinction') // ≥4 Distinction, ≤2 Merit
    expect(compute((i) => (i < 4 ? 'merit' : 'pass'))).toBe('Merit') // ≥4 Merit, ≤2 Pass
    expect(compute(() => 'pass')).toBe('Pass') // all reach Pass
    expect(compute((i) => (i === 0 ? 'fail' : 'pass'))).toBe('Fail') // one below Pass → weighted fallback → Fail
  })
})
