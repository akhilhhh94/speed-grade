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

// --- Grade Profile mode ----------------------------------------------------
// Bands tuned (like the seeded Vocational scale) so the weighted-average fallback
// puts sub-Pass work in "Fail" when no rule matches.
const vbands = [
  { id: 'D', label: 'Distinction', min: 80, max: 100, isPass: true },
  { id: 'M', label: 'Merit', min: 65, max: 80, isPass: true },
  { id: 'P', label: 'Pass', min: 50, max: 65, isPass: true },
  { id: 'X', label: 'Fail', min: 0, max: 50, isPass: false },
]
const vlevels = [
  { key: 'd', label: 'Distinction', points: 4 },
  { key: 'm', label: 'Merit', points: 3 },
  { key: 'p', label: 'Pass', points: 2 },
  { key: 'f', label: 'Fail', points: 1 },
]
const vrubric = {
  name: 'V',
  levels: vlevels,
  criteria: Array.from({ length: 6 }, (_, i) => ({ id: `k${i + 1}`, name: `K${i + 1}`, weight: 1, cells: {} })),
}

// The user's real "overall assessment rules" (Distinction / Merit / Pass).
// No `label`, no `fallback` — a rule's name is its target band; non-match → weighted band.
const profileRules = {
  mode: 'profile',
  profile: {
    overrides: [
      {
        id: 'od',
        targetBandId: 'D',
        conditions: [
          { id: 'a', quantifier: 'atLeast', count: 4, matcher: 'reach', levelKey: 'd' },
          { id: 'b', quantifier: 'atMost', count: 0, matcher: 'below', levelKey: 'm' },
        ],
      },
      {
        id: 'om',
        targetBandId: 'M',
        conditions: [
          { id: 'c', quantifier: 'atLeast', count: 4, matcher: 'reach', levelKey: 'm' },
          { id: 'e', quantifier: 'atMost', count: 0, matcher: 'below', levelKey: 'p' },
        ],
      },
      {
        id: 'op',
        targetBandId: 'P',
        conditions: [{ id: 'g', quantifier: 'atLeast', count: 6, matcher: 'reach', levelKey: 'p' }],
      },
    ],
  },
}

const ptsOf = (key) => vlevels.find((l) => l.key === key).points
const evalOf = (keys) => Object.fromEntries(keys.map((k, i) => [`k${i + 1}`, { levelKey: k, points: ptsOf(k) }]))
const runV = (keys, { rules = profileRules, passFailEnabled = true, override = {} } = {}) =>
  computeResult({ bands: vbands, rubric: vrubric, rules, evaluation: evalOf(keys), override, passFailEnabled })

describe('computeResult — grade profile mode', () => {
  it('awards Distinction when ≥4 reach Distinction and none below Merit', () => {
    expect(runV(['d', 'd', 'd', 'd', 'd', 'd']).finalBand.id).toBe('D')
    expect(runV(['d', 'd', 'd', 'd', 'm', 'm']).finalBand.id).toBe('D') // up to 2 at Merit
  })

  it('falls through to Merit when Distinction is missed', () => {
    expect(runV(['d', 'd', 'd', 'm', 'm', 'm']).finalBand.id).toBe('M') // only 3 reach Distinction
    expect(runV(['m', 'm', 'm', 'm', 'p', 'p']).finalBand.id).toBe('M') // ≥4 reach Merit, up to 2 at Pass
  })

  it('falls through to Pass when Merit is missed but all reach Pass', () => {
    expect(runV(['m', 'm', 'm', 'p', 'p', 'p']).finalBand.id).toBe('P')
    expect(runV(['p', 'p', 'p', 'p', 'p', 'p']).finalBand.id).toBe('P')
  })

  it('falls back to the weighted-average band (Fail) when no rule matches', () => {
    const r = runV(['p', 'p', 'p', 'p', 'p', 'f']) // one criterion below Pass → 45.8% → Fail
    expect(r.finalBand.id).toBe('X')
    expect(r.isPass).toBe(false)
    expect(r.profile.fallbackUsed).toBe(true)
  })

  it('records the matched rule and inert gate/guarantee', () => {
    const r = runV(['d', 'd', 'd', 'd', 'd', 'd'])
    expect(r.profile.active).toBe(true)
    expect(r.gate.triggered).toBe(false)
    expect(r.guarantee.triggered).toBe(false)
    expect(r.steps.some((s) => s.kind === 'pass' && /Distinction/.test(s.title))).toBe(true)
  })

  it('an override with no conditions never matches (weighted band stands)', () => {
    const rules = { mode: 'profile', profile: { overrides: [{ id: 'x', targetBandId: 'X', conditions: [] }] } }
    // all Distinction → 100% → computed band D; the empty rule must NOT fire to X
    expect(runV(['d', 'd', 'd', 'd', 'd', 'd'], { rules }).finalBand.id).toBe('D')
  })

  it('a condition asking for more criteria than exist never fires', () => {
    const rules = {
      mode: 'profile',
      profile: {
        overrides: [{ id: 'x', targetBandId: 'X', conditions: [{ id: 'a', quantifier: 'atLeast', count: 7, matcher: 'reach', levelKey: 'd' }] }],
      },
    }
    // 6 criteria, needs 7 → never fires → weighted band D stands
    expect(runV(['d', 'd', 'd', 'd', 'd', 'd'], { rules }).finalBand.id).toBe('D')
  })

  it('supports a negative top rule (any criterion below Pass → Fail)', () => {
    const rules = {
      mode: 'profile',
      profile: {
        overrides: [
          { id: 'neg', targetBandId: 'X', conditions: [{ id: 'a', quantifier: 'atLeast', count: 1, matcher: 'below', levelKey: 'p' }] },
          { id: 'op', targetBandId: 'P', conditions: [{ id: 'g', quantifier: 'atMost', count: 0, matcher: 'below', levelKey: 'p' }] },
        ],
      },
    }
    expect(runV(['d', 'd', 'd', 'd', 'd', 'f'], { rules }).finalBand.id).toBe('X')
    expect(runV(['p', 'p', 'p', 'p', 'p', 'p'], { rules }).finalBand.id).toBe('P')
  })

  it('no rules → the weighted-average band is used', () => {
    const rules = { mode: 'profile', profile: { overrides: [] } }
    // all Merit → 18/24 = 75% → Merit band
    expect(runV(['m', 'm', 'm', 'm', 'm', 'm'], { rules }).finalBand.id).toBe('M')
  })

  it('is ignored when pass/fail grading is off (simple grading)', () => {
    const rules = {
      mode: 'profile',
      profile: {
        overrides: [{ id: 'neg', targetBandId: 'X', conditions: [{ id: 'a', quantifier: 'atLeast', count: 1, matcher: 'below', levelKey: 'p' }] }],
      },
    }
    // 5×Distinction + 1×Fail → 21/24 = 87.5% → D; profile not applied
    const r = runV(['d', 'd', 'd', 'd', 'd', 'f'], { rules, passFailEnabled: false })
    expect(r.finalBand.id).toBe('D')
    expect(r.profile.active).toBe(false)
  })

  it('teacher override still supersedes the profile', () => {
    const r = runV(['d', 'd', 'd', 'd', 'd', 'd'], { override: { bandId: 'X', reason: 'flagged' } })
    expect(r.finalBand.id).toBe('X')
    expect(r.override.active).toBe(true)
  })

  it('defends against a dangling target band (falls back to the computed band)', () => {
    const rules = {
      mode: 'profile',
      profile: {
        overrides: [{ id: 'x', targetBandId: 'GHOST', conditions: [{ id: 'a', quantifier: 'atLeast', count: 1, matcher: 'reach', levelKey: 'd' }] }],
      },
    }
    // all Distinction → 100% → computed band D; rule matches but band is gone → D stands
    expect(runV(['d', 'd', 'd', 'd', 'd', 'd'], { rules }).finalBand.id).toBe('D')
  })
})

describe('computeResult — grade profile weighted-average fallback toggle', () => {
  // Same rules as profileRules but with the weighted-average fallback turned OFF.
  const noFallbackRules = {
    ...profileRules,
    profile: { ...profileRules.profile, weightedFallback: false },
  }

  it('still uses the weighted band when no rule matches and fallback is on (default)', () => {
    const r = runV(['p', 'p', 'p', 'p', 'p', 'f']) // no rule matches → 45.8% → Fail
    expect(r.finalBand.id).toBe('X')
    expect(r.noGrade).toBe(false)
    expect(r.profile.fallbackUsed).toBe(true)
  })

  it('leaves the grade unset when no rule matches and fallback is off', () => {
    const r = runV(['p', 'p', 'p', 'p', 'p', 'f'], { rules: noFallbackRules })
    expect(r.finalBand).toBe(null)
    expect(r.noGrade).toBe(true)
    expect(r.isPass).toBe(false)
    expect(r.profile.fallbackUsed).toBe(false)
    expect(r.profile.noGrade).toBe(true)
    // No band-based fail reason is fabricated when there is no band.
    expect(r.failReasons).toEqual([])
  })

  it('still awards a matching rule even when fallback is off', () => {
    const r = runV(['d', 'd', 'd', 'd', 'd', 'd'], { rules: noFallbackRules })
    expect(r.finalBand.id).toBe('D')
    expect(r.noGrade).toBe(false)
  })

  it('a teacher override resolves the unset grade', () => {
    const r = runV(['p', 'p', 'p', 'p', 'p', 'f'], {
      rules: noFallbackRules,
      override: { bandId: 'P', reason: 'manual call' },
    })
    expect(r.finalBand.id).toBe('P')
    expect(r.noGrade).toBe(false)
    expect(r.override.active).toBe(true)
  })
})
