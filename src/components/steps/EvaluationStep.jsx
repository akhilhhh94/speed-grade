import { useStore } from '../../state/store.jsx'
import {
  computeResult,
  pointsRange,
  levelByKey,
  topLevelMaxPoints,
} from '../../lib/calc.js'
import { Card, BandPill, Button } from '../ui.jsx'
import CalculationDetails from '../CalculationDetails.jsx'
import SubmissionPanel from '../SubmissionPanel.jsx'

export default function EvaluationStep() {
  const { state, dispatch } = useStore()
  const { rubric, bands, rules, evaluation, feedback, override, passFailEnabled } = state
  const { levels, criteria } = rubric
  const topMax = topLevelMaxPoints(levels)

  const selectLevel = (critId, levelKey) => {
    const r = pointsRange(levelByKey(levels, levelKey))
    dispatch({
      type: 'SET_EVAL_CRITERION',
      criterionId: critId,
      value: { levelKey, points: r.max }, // default to the level's full value; adjustable if a range
    })
  }

  const setPoints = (critId, levelKey, points) =>
    dispatch({ type: 'SET_EVAL_CRITERION', criterionId: critId, value: { levelKey, points } })

  const setOverride = (patch) =>
    dispatch({ type: 'SET_OVERRIDE', override: { ...override, ...patch } })

  // Live running totals across ALL criteria (unscored count as 0 so the bar grows).
  const evaluatedCount = criteria.filter((c) => evaluation[c.id]).length
  const totalMax = criteria.reduce((s, c) => s + topMax * (Number(c.weight) || 0), 0)
  const runningEarned = criteria.reduce((s, c) => {
    const sel = evaluation[c.id]
    return s + (sel ? Number(sel.points) * (Number(c.weight) || 0) : 0)
  }, 0)
  const runningPct = totalMax > 0 ? Math.round((runningEarned / totalMax) * 1000) / 10 : 0

  const complete = evaluatedCount === criteria.length
  // A teacher override must always carry a justification.
  const overrideInvalid = !!override.bandId && !override.reason.trim()
  const result = complete ? computeResult({ bands, rubric, rules, evaluation, override, passFailEnabled }) : null

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      {/* LEFT — student submission */}
      <SubmissionPanel />

      {/* RIGHT — evaluation */}
      <div className="space-y-4">
        {/* Compact, sticky summary bar */}
        <div className="lg:sticky lg:top-6 z-10">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-wrap items-center gap-4">
              <div className="min-w-[140px] flex-1">
                <div className="mb-1 flex justify-between text-xs text-slate-500">
                  <span>Criteria scored</span>
                  <span className="font-semibold text-slate-700">
                    {evaluatedCount} / {criteria.length}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${(evaluatedCount / criteria.length) * 100}%` }}
                  />
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold leading-none text-slate-900">{runningPct}%</div>
                <div className="text-[10px] text-slate-400">
                  {runningEarned}/{totalMax} pts
                </div>
              </div>
              <div className="text-center">
                {complete ? (
                  <BandPill band={result.finalBand} />
                ) : (
                  <span className="text-xs text-slate-400">Provisional grade</span>
                )}
              </div>
              <Button
                disabled={!complete || overrideInvalid}
                onClick={() => dispatch({ type: 'SET_STEP', step: 3 })}
              >
                See result →
              </Button>
            </div>
          </div>
        </div>

        {/* Criteria cards */}
        {criteria.map((c) => {
          const sel = evaluation[c.id]
          const level = sel ? levelByKey(levels, sel.levelKey) : null
          const range = level ? pointsRange(level) : null
          const isRange = level && range.min !== range.max
          return (
            <Card key={c.id}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">{c.name}</h3>
                <span className="text-xs text-slate-400">weight ×{c.weight}</span>
              </div>

              <select
                value={sel?.levelKey ?? ''}
                onChange={(e) => selectLevel(c.id, e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm font-medium ${
                  sel ? 'border-indigo-300 bg-indigo-50 text-indigo-800' : 'border-slate-300 text-slate-500'
                }`}
              >
                <option value="" disabled>
                  Select a performance level…
                </option>
                {levels.map((l) => {
                  const r = pointsRange(l)
                  const pts = r.min === r.max ? `${r.max}` : `${r.min}–${r.max}`
                  return (
                    <option key={l.key} value={l.key}>
                      {l.label} · {pts} pts
                    </option>
                  )
                })}
              </select>

              {level && (
                <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-600">
                  {c.cells[level.key]}
                </p>
              )}

              {isRange && (
                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                    <span>Fine-tune points within “{level.label}”</span>
                    <span className="font-semibold text-indigo-600">{sel.points} pts</span>
                  </div>
                  <input
                    type="range"
                    min={range.min}
                    max={range.max}
                    step={0.5}
                    value={sel.points}
                    onChange={(e) => setPoints(c.id, sel.levelKey, Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{range.min}</span>
                    <span>{range.max}</span>
                  </div>
                </div>
              )}

              {sel && (
                <div className="mt-3 text-right text-xs text-slate-500">
                  Contributes <span className="font-semibold text-slate-700">{sel.points * c.weight}</span> of{' '}
                  {topMax * c.weight} points
                </div>
              )}
            </Card>
          )
        })}

        {/* Teacher feedback */}
        <Card title="Feedback for the student" subtitle="Optional. Shown to the learner on the result screen.">
          <textarea
            value={feedback}
            onChange={(e) => dispatch({ type: 'SET_FEEDBACK', feedback: e.target.value })}
            rows={4}
            placeholder="e.g. Strong, well-structured argument. Tighten your use of evidence in the third paragraph and double-check your citations."
            className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm leading-relaxed text-slate-700"
          />
        </Card>

        {/* Teacher override */}
        <Card title="Teacher override" subtitle="Manually set the final grade. This supersedes all computed rules and is recorded with your reason.">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Override grade</label>
              <select
                value={override.bandId ?? ''}
                onChange={(e) => setOverride({ bandId: e.target.value || null })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">— No override (use computed) —</option>
                {bands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
            {override.bandId && (
              <Button variant="danger" onClick={() => setOverride({ bandId: null, reason: '' })}>
                Clear
              </Button>
            )}
          </div>
          {override.bandId && (
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Reason <span className="text-red-500">*</span>
              </label>
              <input
                value={override.reason}
                onChange={(e) => setOverride({ reason: e.target.value })}
                placeholder="e.g. Late penalty waived due to extension"
                className={`w-full rounded-lg border px-3 py-2 text-sm ${
                  overrideInvalid ? 'border-red-300 bg-red-50' : 'border-slate-200'
                }`}
              />
              {overrideInvalid && (
                <p className="mt-2 text-xs text-red-600">
                  A reason is required when you override the grade.
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Collapsible full calculation (hidden by default) */}
        <CalculationDetails result={result} />

        {evaluatedCount > 0 && (
          <button
            type="button"
            onClick={() => dispatch({ type: 'RESET_EVAL' })}
            className="w-full text-center text-xs text-slate-400 hover:text-slate-600 hover:underline"
          >
            Clear evaluation
          </button>
        )}
      </div>
    </div>
  )
}
