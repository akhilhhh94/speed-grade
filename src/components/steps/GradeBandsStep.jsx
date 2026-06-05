import { useStore } from '../../state/store.jsx'
import { uid } from '../../data/sampleData.js'
import { Card, Button, Toggle, BAND_COLORS, colorOf } from '../ui.jsx'

const COLOR_KEYS = Object.keys(BAND_COLORS)

// Surface overlaps / gaps / out-of-range bands so the teacher gets immediate
// feedback while defining the grading scale.
function validate(bands, passFailEnabled) {
  const warnings = []
  const sorted = [...bands].sort((a, b) => a.min - b.min)
  sorted.forEach((b) => {
    if (b.min >= b.max) warnings.push(`“${b.label}” has min ≥ max.`)
    if (b.min < 0 || b.max > 100) warnings.push(`“${b.label}” falls outside 0–100%.`)
  })
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    const cur = sorted[i]
    if (cur.min < prev.max) warnings.push(`“${prev.label}” and “${cur.label}” overlap.`)
    else if (cur.min > prev.max) warnings.push(`Gap between “${prev.label}” (${prev.max}%) and “${cur.label}” (${cur.min}%).`)
  }
  if (sorted.length) {
    if (sorted[0].min > 0) warnings.push(`Scale does not start at 0% (lowest band starts at ${sorted[0].min}%).`)
    if (sorted[sorted.length - 1].max < 100) warnings.push(`Scale does not reach 100%.`)
  }
  if (passFailEnabled && !bands.some((b) => b.isPass)) warnings.push('No band is marked as passing.')
  return warnings
}

export default function GradeBandsStep() {
  const { state, dispatch } = useStore()
  const { passFailEnabled } = state
  const bands = state.bands
  const warnings = validate(bands, passFailEnabled)

  const setBands = (next) => dispatch({ type: 'SET_BANDS', bands: next })
  const update = (id, patch) => setBands(bands.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  const remove = (id) => setBands(bands.filter((b) => b.id !== id))
  const add = () =>
    setBands([...bands, { id: uid('band'), label: 'New band', min: 0, max: 10, isPass: false, color: 'slate' }])

  const sorted = [...bands].sort((a, b) => a.min - b.min)
  const rowCols = passFailEnabled
    ? 'md:grid-cols-[auto_1fr_auto_auto_auto]'
    : 'md:grid-cols-[auto_1fr_auto_auto]'

  return (
    <div className="space-y-6">
      {/* Top-level Pass/Fail grading toggle */}
      <Card title="Pass / Fail grading">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            {passFailEnabled
              ? 'On: the result is Pass or Fail (from the bands marked below) and you can add grade rules in the next step.'
              : 'Off: simple grading — the score just maps to a letter grade. No pass/fail, no grade rules.'}
          </p>
          <Toggle
            checked={passFailEnabled}
            onChange={(v) => dispatch({ type: 'SET_PASSFAIL_ENABLED', enabled: v })}
          />
        </div>
      </Card>

      <Card
        title="Grade bands"
        subtitle={
          passFailEnabled
            ? 'Each band owns a percentage range and a custom label. Mark which bands count as a pass.'
            : 'Each band owns a percentage range and a fully custom label.'
        }
      >
        {/* Coverage bar */}
        <div className="mb-5">
          <div className="flex h-7 w-full overflow-hidden rounded-lg ring-1 ring-slate-200">
            {sorted.map((b) => {
              const width = Math.max(0, Math.min(100, b.max) - Math.max(0, b.min))
              return (
                <div
                  key={b.id}
                  className={`flex items-center justify-center ${colorOf(b.color).bar} text-[10px] font-semibold text-white`}
                  style={{ width: `${width}%` }}
                  title={`${b.label}: ${b.min}–${b.max}%`}
                >
                  {width > 7 ? `${b.min}–${b.max}` : ''}
                </div>
              )
            })}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-slate-400">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="space-y-3">
          {bands.map((b) => {
            const c = colorOf(b.color)
            return (
              <div
                key={b.id}
                className={`grid grid-cols-1 items-center gap-3 rounded-xl border border-slate-200 p-3 ${rowCols}`}
              >
                {/* color */}
                <select
                  value={b.color}
                  onChange={(e) => update(b.id, { color: e.target.value })}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm"
                  aria-label="Colour"
                >
                  {COLOR_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
                {/* label */}
                <div className="flex items-center gap-2">
                  <span className={`h-3 w-3 shrink-0 rounded-full ${c.dot}`} />
                  <input
                    value={b.label}
                    onChange={(e) => update(b.id, { label: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium"
                  />
                </div>
                {/* range */}
                <div className="flex items-center gap-1.5 text-sm text-slate-500">
                  <input
                    type="number"
                    value={b.min}
                    onChange={(e) => update(b.id, { min: Number(e.target.value) })}
                    className="w-16 rounded-lg border border-slate-200 px-2 py-2 text-sm"
                  />
                  <span>–</span>
                  <input
                    type="number"
                    value={b.max}
                    onChange={(e) => update(b.id, { max: Number(e.target.value) })}
                    className="w-16 rounded-lg border border-slate-200 px-2 py-2 text-sm"
                  />
                  <span>%</span>
                </div>
                {/* pass — only meaningful when Pass/Fail grading is on */}
                {passFailEnabled && (
                  <Toggle checked={b.isPass} onChange={(v) => update(b.id, { isPass: v })} label="Pass" />
                )}
                {/* delete */}
                <Button variant="danger" onClick={() => remove(b.id)} className="px-3 py-2">
                  ✕
                </Button>
              </div>
            )
          })}
        </div>

        <div className="mt-4">
          <Button variant="subtle" onClick={add}>
            + Add band
          </Button>
        </div>
      </Card>

      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="mb-1 font-semibold">Heads up — check the scale:</p>
          <ul className="list-inside list-disc space-y-0.5">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
