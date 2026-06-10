import { Card, Toggle, SegmentedControl, Select } from '../ui.jsx'

// Controlled grade-rules editor, reused in two places:
//   • the rubric editor — band-less (showBand={false}); the guarantee target is
//     chosen later, on the assignment.
//   • the Create-Assignment wizard — full (showBand={true}) with the chosen
//     scale's bands, so the guarantee's minimum band can be picked.
//
// value = { passLevelKey, gate:{enabled}, guarantee:{enabled,criterionIds,mode[,minBandId]} }
export default function RulesConfig({ value: rules, rubric, bands = [], passFailEnabled, onChange, showBand = true }) {
  const set = (next) => onChange(next)
  const setGate = (patch) => set({ ...rules, gate: { ...rules.gate, ...patch } })
  const setGuarantee = (patch) => set({ ...rules, guarantee: { ...rules.guarantee, ...patch } })

  const levelOptions = (rubric?.levels ?? []).map((l) => ({ value: l.key, label: l.label }))
  const bandOptions = (bands ?? []).map((b) => ({ value: b.id, label: b.label }))

  if (!passFailEnabled) {
    return (
      <Card title="Grade rules">
        <p className="text-sm text-slate-500">
          The chosen grade scale uses <span className="font-medium text-slate-700">simple grading</span> (no
          pass/fail), so there are no grade rules — the score maps directly to a band.
        </p>
      </Card>
    )
  }

  const g = rules.guarantee

  return (
    <Card title="Grade rules (optional)" subtitle="Shape the pass/fail outcome beyond the raw score. Each rule is optional.">
      <div className="space-y-3">
        {/* Shared definition of a passing criterion */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-indigo-50/60 px-4 py-3 text-sm text-slate-600 ring-1 ring-indigo-100">
          <span className="font-semibold text-slate-800">A criterion passes</span>
          <span>when it reaches at least</span>
          <Select
            value={rules.passLevelKey}
            onChange={(e) => set({ ...rules, passLevelKey: e.target.value })}
            className="w-auto"
          >
            {levelOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <span className="text-slate-400">— used by both rules below.</span>
        </div>

        {/* Gate — minimum to pass */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
          <Toggle checked={rules.gate.enabled} onChange={(v) => setGate({ enabled: v })} />
          <span className="font-semibold text-slate-800">Minimum to pass:</span>
          <span>every criterion must pass</span>
          <span className="text-slate-400">— otherwise the submission needs resubmission.</span>
        </div>

        {/* Guarantee — criterion-targeted minimum grade */}
        <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
          <div className="mb-3 flex items-center gap-2">
            <Toggle checked={g.enabled} onChange={(v) => setGuarantee({ enabled: v })} />
            <span className="font-semibold text-slate-800">Grade guarantee:</span>
            <span className="text-slate-400">if key criteria pass, lock in a minimum grade.</span>
          </div>

          <div className="mb-3">
            <span className="mb-1.5 block text-xs font-medium text-slate-500">Key criteria</span>
            <div className="flex flex-wrap gap-2">
              {(rubric?.criteria ?? []).map((c) => {
                const checked = g.criterionIds.includes(c.id)
                return (
                  <label
                    key={c.id}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs ${
                      checked ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        setGuarantee({
                          criterionIds: e.target.checked
                            ? [...g.criterionIds, c.id]
                            : g.criterionIds.filter((x) => x !== c.id),
                        })
                      }
                    />
                    {c.name}
                  </label>
                )
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span>If</span>
            <SegmentedControl
              value={g.mode}
              onChange={(v) => setGuarantee({ mode: v })}
              options={[
                { value: 'any', label: 'any' },
                { value: 'all', label: 'all' },
              ]}
            />
            {showBand ? (
              <>
                <span>of the selected criteria pass → guarantee at least</span>
                <Select
                  value={g.minBandId}
                  onChange={(e) => setGuarantee({ minBandId: e.target.value })}
                  className="w-auto"
                >
                  {bandOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
                <span className="text-slate-400">(a higher score still wins).</span>
              </>
            ) : (
              <span>of the selected criteria pass → guarantee a minimum grade.</span>
            )}
          </div>
          {!showBand && (
            <p className="mt-2 text-xs text-slate-400">
              The exact minimum grade is chosen on each assignment (from its grade scale).
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}
