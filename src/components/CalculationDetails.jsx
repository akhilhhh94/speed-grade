// Collapsible "show the math" panel. Renders the full step-by-step calculation
// from a computeResult() output. Hidden by default via the native <details> tag.

const STEP_STYLES = {
  info: 'border-slate-200 bg-slate-50 text-slate-600',
  pass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  fail: 'border-red-200 bg-red-50 text-red-700',
  override: 'border-indigo-200 bg-indigo-50 text-indigo-700',
}
const STEP_ICON = { info: 'ⓘ', pass: '✓', fail: '✕', override: '✎' }

export default function CalculationDetails({ result, open = false }) {
  if (!result?.complete) return null

  return (
    <details open={open} className="group rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 select-none">
        <span className="flex items-center gap-2 font-semibold text-slate-900">
          <span className="text-indigo-600">∑</span> Show the calculation
        </span>
        <span className="text-sm text-slate-400 group-open:hidden">click to expand ▾</span>
        <span className="hidden text-sm text-slate-400 group-open:inline">click to collapse ▴</span>
      </summary>

      <div className="space-y-5 border-t border-slate-100 px-6 py-5">
        {/* 1. Points per criterion */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            1 · Points earned per criterion
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400">
                  <th className="py-1 pr-4 font-medium">Criterion</th>
                  <th className="py-1 pr-4 font-medium">Level</th>
                  <th className="py-1 pr-4 text-right font-medium">Points × weight</th>
                  <th className="py-1 text-right font-medium">= Weighted</th>
                </tr>
              </thead>
              <tbody>
                {result.perCriterion.map((pc) => (
                  <tr key={pc.id} className="border-t border-slate-100">
                    <td className="py-1.5 pr-4 font-medium text-slate-700">{pc.name}</td>
                    <td className="py-1.5 pr-4 text-slate-500">{pc.levelLabel}</td>
                    <td className="py-1.5 pr-4 text-right text-slate-500">
                      {pc.points} × {pc.weight}
                    </td>
                    <td className="py-1.5 text-right font-semibold text-slate-800">{pc.earned}</td>
                  </tr>
                ))}
                <tr className="border-t border-slate-200 font-semibold text-slate-900">
                  <td className="py-1.5 pr-4" colSpan={3}>
                    Total earned
                  </td>
                  <td className="py-1.5 text-right">{result.totalEarned}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Percentage formula */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            2 · Convert to a percentage
          </p>
          <div className="rounded-lg bg-slate-900 px-4 py-3 font-mono text-sm text-slate-100">
            ({result.totalEarned} ÷ {result.totalMax}) × 100 ={' '}
            <span className="font-bold text-emerald-300">{result.rawPercent}%</span>
          </div>
        </div>

        {/* 3. Band mapping + rules applied */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            3 · Map to a grade & apply rules
          </p>
          <ol className="space-y-2">
            {result.steps.map((s, i) => (
              <li key={i} className={`flex gap-2.5 rounded-lg border p-2.5 ${STEP_STYLES[s.kind]}`}>
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/70 text-[10px] font-bold">
                  {STEP_ICON[s.kind]}
                </span>
                <div>
                  <p className="text-xs font-semibold">{s.title}</p>
                  <p className="text-xs opacity-90">{s.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Final */}
        <div className="flex items-center justify-between rounded-lg bg-indigo-50 px-4 py-3 text-sm">
          <span className="font-medium text-indigo-800">Final grade</span>
          <span className="font-bold text-indigo-900">
            {result.finalBand.label} · {result.isPass ? 'Pass' : 'Resubmission'}
          </span>
        </div>
      </div>
    </details>
  )
}
