import { describe, it, expect } from 'vitest'
import { computeResult, bandForPercent } from './calc.js'

const bands = [
  { id: 'A', label: 'A', min: 75, max: 100, isPass: true },
  { id: 'C', label: 'C', min: 50, max: 75, isPass: true },
  { id: 'F', label: 'F', min: 0, max: 50, isPass: false },
]

const levels = [
  { key: 'ex', label: 'Excellent', points: 4 },
  { key: 'pr', label: 'Proficient', points: 3 },
  { key: 'de', label: 'Developing', points: 2 },
  { key: 'ni', label: 'Needs Improvement', points: 1 },
]

const rubric = {
  name: 'T',
  levels,
  criteria: [
    { id: 'c1', name: 'C1', weight: 1, cells: {} },
    { id: 'c2', name: 'C2', weight: 1, cells: {} },
  ],
}

const run = (evaluation, { rules = {}, passFailEnabled = false, override = {} } = {}) =>
  computeResult({ bands, rubric, rules, evaluation, override, passFailEnabled })

describe('bandForPercent', () => {
  it('matches by highest cleared min, boundary belongs to the higher band', () => {
    expect(bandForPercent(bands, 100).id).toBe('A')
    expect(bandForPercent(bands, 75).id).toBe('A')
    expect(bandForPercent(bands, 74.9).id).toBe('C')
    expect(bandForPercent(bands, 0).id).toBe('F')
  })
})

describe('computeResult', () => {
  it('reports incomplete until every criterion is scored', () => {
    expect(run({ c1: { levelKey: 'ex', points: 4 } }).complete).toBe(false)
  })

  it('simple grading (pass/fail off) maps the score straight to a band, no rules', () => {
    // 4 + 1 = 5 of 8 = 62.5% -> C; gate/guarantee never run
    const r = run({ c1: { levelKey: 'ex', points: 4 }, c2: { levelKey: 'ni', points: 1 } })
    expect(r.rawPercent).toBe(62.5)
    expect(r.finalBand.id).toBe('C')
    expect(r.passFailEnabled).toBe(false)
    expect(r.gate.triggered).toBe(false)
    expect(r.guarantee.triggered).toBe(false)
    expect(r.failReasons).toEqual([])
  })

  it('computes a weighted percentage and maps it to a band', () => {
    // 4 + 3 = 7 of 8 = 87.5% -> A
    const r = run({ c1: { levelKey: 'ex', points: 4 }, c2: { levelKey: 'pr', points: 3 } })
    expect(r.rawPercent).toBe(87.5)
    expect(r.finalBand.id).toBe('A')
  })

  it('pass/fail on (no rules): pass vs fail is decided by the band the score lands in', () => {
    const rules = { passLevelKey: 'de', gate: { enabled: false }, guarantee: { enabled: false } }
    // 2 + 1.2 = 3.2 of 8 = 40% -> F band (isPass:false)
    const r = run({ c1: { levelKey: 'de', points: 2 }, c2: { levelKey: 'ni', points: 1.2 } }, { rules, passFailEnabled: true })
    expect(r.rawPercent).toBe(40)
    expect(r.finalBand.id).toBe('F')
    expect(r.isPass).toBe(false)
    expect(r.passFailEnabled).toBe(true)
  })

  it('gate forces the lowest fail band when any criterion does not pass', () => {
    const rules = { passLevelKey: 'de', gate: { enabled: true }, guarantee: { enabled: false } }
    // 4 + 1 = 62.5% -> C, but c2 is below the pass level "de" -> forced to F
    const r = run({ c1: { levelKey: 'ex', points: 4 }, c2: { levelKey: 'ni', points: 1 } }, { rules, passFailEnabled: true })
    expect(r.finalBand.id).toBe('F')
    expect(r.isPass).toBe(false)
    expect(r.gate.triggered).toBe(true)
    expect(r.failReasons.length).toBeGreaterThan(0)
  })

  it('guarantee (mode "all") lifts only when every selected criterion passes', () => {
    const rules = {
      passLevelKey: 'de',
      gate: { enabled: false },
      guarantee: { enabled: true, criterionIds: ['c1', 'c2'], mode: 'all', minBandId: 'A' },
    }
    // both Developing -> 50% -> C; all selected pass so lifts to A
    const lifted = run({ c1: { levelKey: 'de', points: 2 }, c2: { levelKey: 'de', points: 2 } }, { rules, passFailEnabled: true })
    expect(lifted.guarantee.triggered).toBe(true)
    expect(lifted.finalBand.id).toBe('A')
    // c2 does not pass -> "all" not met -> stays at computed band
    const notMet = run({ c1: { levelKey: 'de', points: 2 }, c2: { levelKey: 'ni', points: 1 } }, { rules, passFailEnabled: true })
    expect(notMet.guarantee.triggered).toBe(false)
  })

  it('guarantee (mode "any") lifts when at least one selected criterion passes', () => {
    const rules = {
      passLevelKey: 'pr',
      gate: { enabled: false },
      guarantee: { enabled: true, criterionIds: ['c1', 'c2'], mode: 'any', minBandId: 'A' },
    }
    // c1 Proficient (passes), c2 Needs Improvement -> 3+1=4/8=50% -> C; any => lift to A
    const r = run({ c1: { levelKey: 'pr', points: 3 }, c2: { levelKey: 'ni', points: 1 } }, { rules, passFailEnabled: true })
    expect(r.guarantee.triggered).toBe(true)
    expect(r.finalBand.id).toBe('A')
  })

  it('grade rules are ignored when pass/fail is off', () => {
    const rules = { passLevelKey: 'de', gate: { enabled: true }, guarantee: { enabled: false } }
    // c2 below pass level, but pass/fail OFF -> gate does not run -> stays at computed C
    const r = run({ c1: { levelKey: 'ex', points: 4 }, c2: { levelKey: 'ni', points: 1 } }, { rules, passFailEnabled: false })
    expect(r.finalBand.id).toBe('C')
    expect(r.gate.triggered).toBe(false)
  })

  it('works with an arbitrary number of performance levels (not hard-coded to four)', () => {
    const levels3 = [
      { key: 'ex', label: 'Excellent', points: 10 },
      { key: 'ok', label: 'OK', points: 5 },
      { key: 'bad', label: 'Bad', points: 0 },
    ]
    const rubric3 = {
      name: 'T3',
      levels: levels3,
      criteria: [
        { id: 'c1', name: 'C1', weight: 1, cells: {} },
        { id: 'c2', name: 'C2', weight: 1, cells: {} },
      ],
    }
    // 10 + 5 = 15 of 20 = 75% -> A band
    const r = computeResult({
      bands,
      rubric: rubric3,
      rules: {},
      evaluation: { c1: { levelKey: 'ex', points: 10 }, c2: { levelKey: 'ok', points: 5 } },
      override: {},
      passFailEnabled: false,
    })
    expect(r.complete).toBe(true)
    expect(r.rawPercent).toBe(75)
    expect(r.finalBand.id).toBe('A')
  })

  it('override supersedes everything', () => {
    const r = run(
      { c1: { levelKey: 'ni', points: 1 }, c2: { levelKey: 'ni', points: 1 } },
      { override: { bandId: 'A', reason: 'manual' } },
    )
    expect(r.finalBand.id).toBe('A')
    expect(r.override.active).toBe(true)
  })
})
