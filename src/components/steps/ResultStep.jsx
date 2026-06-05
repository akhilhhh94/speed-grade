import { useStore } from '../../state/store.jsx'
import { computeResult } from '../../lib/calc.js'
import { Card, BandPill, Button } from '../ui.jsx'

const STEP_STYLES = {
  info: 'border-slate-200 bg-slate-50 text-slate-600',
  pass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  fail: 'border-red-200 bg-red-50 text-red-700',
  override: 'border-indigo-200 bg-indigo-50 text-indigo-700',
}
const STEP_ICON = { info: 'ⓘ', pass: '✓', fail: '✕', override: '✎' }

export default function ResultStep() {
  const { state, dispatch } = useStore()
  const { rubric, bands, rules, evaluation, feedback, override, passFailEnabled } = state
  const result = computeResult({ bands, rubric, rules, evaluation, override, passFailEnabled })

  if (!result.complete) {
    return (
      <Card>
        <div className="py-10 text-center">
          <p className="text-lg font-semibold text-slate-700">Evaluation not finished</p>
          <p className="mt-1 text-sm text-slate-500">Score every criterion to see the final grade.</p>
          <Button className="mt-4" onClick={() => dispatch({ type: 'SET_STEP', step: 2 })}>
            ← Back to evaluation
          </Button>
        </div>
      </Card>
    )
  }

  const pf = result.passFailEnabled
  const pass = result.isPass
  const setOverride = (patch) =>
    dispatch({ type: 'SET_OVERRIDE', override: { ...override, ...patch } })

  // Hero theme: neutral for simple grading; green/red when pass/fail is on.
  const theme = !pf
    ? { box: 'bg-indigo-50 ring-indigo-200', icon: 'bg-indigo-500', title: 'text-indigo-900', text: 'text-indigo-700' }
    : pass
      ? { box: 'bg-emerald-50 ring-emerald-200', icon: 'bg-emerald-500', title: 'text-emerald-800', text: 'text-emerald-700' }
      : { box: 'bg-red-50 ring-red-200', icon: 'bg-red-500', title: 'text-red-800', text: 'text-red-700' }
  const heading = !pf ? 'Evaluation complete' : pass ? 'Congratulations — Passed!' : 'Resubmission Required'
  const subtext = !pf
    ? 'This submission has been graded.'
    : pass
      ? 'This submission meets the grading criteria.'
      : 'This submission did not meet the minimum criteria and should be resubmitted.'
  const icon = !pf ? '✓' : pass ? '🎉' : '↻'

  return (
    <div className="space-y-6">
      {/* Hero status */}
      <div className={`rounded-2xl p-6 ring-1 ${theme.box}`}>
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className={`flex h-10 w-10 items-center justify-center rounded-full text-xl text-white ${theme.icon}`}>
                {icon}
              </span>
              <h2 className={`text-2xl font-bold ${theme.title}`}>{heading}</h2>
            </div>
            <p className={`mt-2 text-sm ${theme.text}`}>{subtext}</p>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-slate-500">Final grade</div>
            <div className="mt-1">
              <BandPill band={result.finalBand} className="text-sm" />
            </div>
            <div className="mt-1 text-2xl font-bold text-slate-900">{result.rawPercent}%</div>
            {result.override.active && (
              <div className="mt-1 text-xs font-medium text-indigo-600">manually overridden</div>
            )}
          </div>
        </div>

        {pf && !pass && result.failReasons.length > 0 && (
          <div className="mt-4 rounded-xl bg-white/70 p-4">
            <p className="mb-1.5 text-sm font-semibold text-red-800">Why it failed:</p>
            <ul className="list-inside list-disc space-y-1 text-sm text-red-700">
              {result.failReasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Teacher feedback */}
      {feedback.trim() && (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-sm text-indigo-700">
              💬
            </span>
            <h3 className="font-semibold text-slate-900">Teacher feedback</h3>
          </div>
          <p className="whitespace-pre-wrap border-l-2 border-indigo-200 pl-3 text-sm leading-relaxed text-slate-600">
            {feedback}
          </p>
        </div>
      )}

      {/* Score breakdown table */}
      <Card title="Score breakdown" subtitle="Every criterion's contribution to the weighted total.">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-4">Criterion</th>
                <th className="py-2 pr-4">Selected level</th>
                <th className="py-2 pr-4 text-center">Weight</th>
                <th className="py-2 pr-4 text-right">Points</th>
                <th className="py-2 text-right">Weighted</th>
              </tr>
            </thead>
            <tbody>
              {result.perCriterion.map((pc) => (
                <tr key={pc.id} className="border-b border-slate-100">
                  <td className="py-2.5 pr-4 font-medium text-slate-800">{pc.name}</td>
                  <td className="py-2.5 pr-4 text-slate-600">{pc.levelLabel}</td>
                  <td className="py-2.5 pr-4 text-center text-slate-500">×{pc.weight}</td>
                  <td className="py-2.5 pr-4 text-right text-slate-600">
                    {pc.points} / {pc.maxPoints}
                  </td>
                  <td className="py-2.5 text-right font-semibold text-slate-800">
                    {pc.earned} / {pc.max}
                  </td>
                </tr>
              ))}
              <tr className="font-semibold text-slate-900">
                <td className="py-3 pr-4" colSpan={4}>
                  Total
                </td>
                <td className="py-3 text-right">
                  {result.totalEarned} / {result.totalMax}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-3 rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
          {result.totalEarned} ÷ {result.totalMax} × 100 ={' '}
          <span className="font-bold">{result.rawPercent}%</span> → computed band{' '}
          <span className="font-semibold">“{result.computedBand.label}”</span>
        </div>
      </Card>

      {/* Step-by-step explanation */}
      <Card title="How the final grade was reached" subtitle="Each rule applied, in order.">
        <ol className="space-y-2.5">
          {result.steps.map((s, i) => (
            <li key={i} className={`flex gap-3 rounded-xl border p-3 ${STEP_STYLES[s.kind]}`}>
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/70 text-xs font-bold">
                {STEP_ICON[s.kind]}
              </span>
              <div>
                <p className="text-sm font-semibold">{s.title}</p>
                <p className="text-sm opacity-90">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      {/* Teacher override */}
      <Card title="Teacher override" subtitle="Manually set the final grade. This supersedes all computed rules and is recorded with your reason.">
        <div className="grid gap-3 sm:grid-cols-[220px_1fr_auto] sm:items-end">
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
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Reason</label>
            <input
              value={override.reason}
              onChange={(e) => setOverride({ reason: e.target.value })}
              placeholder="e.g. Late penalty waived due to extension"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          {override.bandId && (
            <Button variant="danger" onClick={() => setOverride({ bandId: null, reason: '' })}>
              Clear
            </Button>
          )}
        </div>
        {override.bandId && !override.reason.trim() && (
          <p className="mt-2 text-xs text-amber-600">Tip: add a reason — overrides should always be justified.</p>
        )}
      </Card>
    </div>
  )
}
