import { uid } from '../../data/sampleData.js'
import { bandsTopToBottom, describeOverride } from '../../lib/calc.js'
import { Button, Select, EmptyState } from '../ui.jsx'

// Controlled editor for a Grade Profile:
//   { overrides: [{ id, targetBandId, conditions:[ primary, floor? ] }], weightedFallback }
//
// Each rule awards a grade (a band, picked from the scale). Its conditions are
// kept simple: a PRIMARY requirement ("at least N criteria reach <level>") and an
// optional FLOOR ("and no criterion is below <level>"). The `weightedFallback`
// flag (default on) controls the no-match behaviour: on ⇒ the weighted-average
// band is used; off ⇒ no grade is set and it must be chosen manually.
//
// The engine (lib/calc.js) supports arbitrary conditions; this editor only emits
// these two shapes:
//   primary → { quantifier:'atLeast', count:N, matcher:'reach', levelKey }
//   floor   → { quantifier:'atMost',  count:0, matcher:'below', levelKey }
export default function ProfileRulesEditor({ profile, rubric, bands = [], onChange }) {
  const overrides = profile?.overrides ?? []
  const weightedFallback = profile?.weightedFallback !== false // default on
  const levels = rubric?.levels ?? []
  const criteriaCount = (rubric?.criteria ?? []).length
  const bandsDesc = bandsTopToBottom(bands)
  const counts = Array.from({ length: Math.max(criteriaCount, 1) }, (_, i) => i + 1)

  const setOverrides = (next) => onChange({ ...profile, overrides: next })
  const setWeightedFallback = (on) => onChange({ ...profile, weightedFallback: on })
  const updateRule = (id, patch) => setOverrides(overrides.map((o) => (o.id === id ? { ...o, ...patch } : o)))
  const removeRule = (id) => setOverrides(overrides.filter((o) => o.id !== id))
  const moveRule = (id, dir) => {
    const i = overrides.findIndex((o) => o.id === id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= overrides.length) return
    const next = [...overrides]
    ;[next[i], next[j]] = [next[j], next[i]]
    setOverrides(next)
  }

  const primaryOf = (o) => o.conditions?.[0]
  const floorOf = (o) => o.conditions?.[1]

  const addRule = () =>
    setOverrides([
      ...overrides,
      {
        id: uid('ov'),
        targetBandId: bandsDesc[0]?.id ?? null,
        conditions: [{ id: uid('cond'), quantifier: 'atLeast', count: 1, matcher: 'reach', levelKey: levels[0]?.key ?? null }],
      },
    ])

  const updatePrimary = (o, patch) => updateRule(o.id, { conditions: [{ ...primaryOf(o), ...patch }, ...(floorOf(o) ? [floorOf(o)] : [])] })

  const toggleFloor = (o, on) => {
    if (on) {
      // Default the floor to the level just below the primary's (e.g. Distinction → Merit).
      const pIdx = levels.findIndex((l) => l.key === primaryOf(o)?.levelKey)
      const floorLevel = levels[Math.min(pIdx + 1, levels.length - 1)]?.key ?? levels[0]?.key ?? null
      updateRule(o.id, {
        conditions: [primaryOf(o), { id: uid('cond'), quantifier: 'atMost', count: 0, matcher: 'below', levelKey: floorLevel }],
      })
    } else {
      updateRule(o.id, { conditions: [primaryOf(o)] })
    }
  }
  const updateFloorLevel = (o, levelKey) => updateRule(o.id, { conditions: [primaryOf(o), { ...floorOf(o), levelKey }] })

  const iconBtn =
    'rounded px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent'

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">
        Rules are checked top to bottom — the{' '}
        <span className="font-medium text-slate-700">first rule whose conditions all hold</span> sets the grade.{' '}
        {weightedFallback ? (
          <>If none match, the weighted-average grade is used.</>
        ) : (
          <>
            If none match, <span className="font-medium text-slate-700">no grade is set automatically</span> — the
            evaluator must choose the final grade manually.
          </>
        )}
      </p>

      {/* No-match behaviour — weighted-average fallback on/off */}
      <label className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={weightedFallback}
          onChange={(e) => setWeightedFallback(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600"
        />
        <span>
          <span className="font-semibold text-slate-800">Use the weighted-average grade when no rule matches</span>
          <span className="mt-0.5 block text-xs text-slate-400">
            {weightedFallback
              ? 'On: if no rule matches, the grade falls back to the band the weighted score maps to.'
              : 'Off: if no rule matches, no grade is chosen — the evaluator must set the final grade manually to complete the evaluation.'}
          </span>
        </span>
      </label>

      {overrides.length === 0 ? (
        <EmptyState
          icon="▦"
          title="No grade rules yet"
          subtitle={
            weightedFallback
              ? 'Without rules the grade is simply the weighted-average band. Add a rule to award a grade based on how many criteria reach each level.'
              : 'Without rules — and with the weighted-average fallback off — no grade is set automatically. Add a rule to award a grade based on how many criteria reach each level.'
          }
          action={
            <Button variant="subtle" onClick={addRule}>
              + Add rule
            </Button>
          }
        />
      ) : (
        <>
          {overrides.map((o, idx) => {
            const primary = primaryOf(o)
            const floor = floorOf(o)
            return (
              <div key={o.id} className="rounded-xl border border-slate-200 p-4">
                {/* Header: priority · award <grade> · reorder/remove */}
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                    {idx + 1}
                    {idx === 0 ? ' · highest' : ''}
                  </span>
                  <span className="text-sm font-semibold text-slate-800">Award</span>
                  <Select
                    value={o.targetBandId ?? ''}
                    onChange={(e) => updateRule(o.id, { targetBandId: e.target.value })}
                    className="w-auto"
                    aria-label="Grade to award"
                  >
                    {bandsDesc.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.label}
                      </option>
                    ))}
                  </Select>
                  <div className="ml-auto flex items-center gap-0.5">
                    <button type="button" onClick={() => moveRule(o.id, -1)} disabled={idx === 0} title="Higher priority" className={iconBtn}>
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveRule(o.id, 1)}
                      disabled={idx === overrides.length - 1}
                      title="Lower priority"
                      className={iconBtn}
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRule(o.id)}
                      title="Remove rule"
                      className="rounded px-1.5 py-0.5 text-xs text-red-400 hover:bg-red-50 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Conditions: primary + optional floor */}
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span>when at least</span>
                    <Select
                      value={primary?.count ?? 1}
                      onChange={(e) => updatePrimary(o, { count: Number(e.target.value) })}
                      className="w-auto"
                      aria-label="How many criteria"
                    >
                      {counts.map((n) => (
                        <option key={n} value={n}>
                          {n === criteriaCount ? `all ${n}` : n}
                        </option>
                      ))}
                    </Select>
                    <span>criteria reach</span>
                    <Select
                      value={primary?.levelKey ?? ''}
                      onChange={(e) => updatePrimary(o, { levelKey: e.target.value })}
                      className="w-auto"
                      aria-label="Level"
                    >
                      {levels.map((l) => (
                        <option key={l.key} value={l.key}>
                          {l.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <input
                      id={`floor-${o.id}`}
                      type="checkbox"
                      checked={!!floor}
                      onChange={(e) => toggleFloor(o, e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                    />
                    <label htmlFor={`floor-${o.id}`}>and no criterion is below</label>
                    {floor ? (
                      <Select
                        value={floor.levelKey ?? ''}
                        onChange={(e) => updateFloorLevel(o, e.target.value)}
                        className="w-auto"
                        aria-label="Floor level"
                      >
                        {levels.map((l) => (
                          <option key={l.key} value={l.key}>
                            {l.label}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <span className="text-slate-400">(optional)</span>
                    )}
                  </div>
                </div>

                {/* Live plain-English preview — the same wording the student sees */}
                <p className="mt-3 rounded-lg bg-indigo-50/60 px-3 py-2 text-xs text-indigo-700">
                  {describeOverride(levels, bands, o)}
                </p>
              </div>
            )
          })}

          <Button variant="subtle" onClick={addRule}>
            + Add rule
          </Button>
        </>
      )}
    </div>
  )
}
