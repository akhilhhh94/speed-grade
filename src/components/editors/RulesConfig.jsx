import { Card, Toggle, SegmentedControl, Select } from '../ui.jsx'
import { defaultProfile } from '../../lib/resolve.js'
import ProfileRulesEditor from './ProfileRulesEditor.jsx'

// Controlled grade-rules editor, reused in two places:
//   • the rubric editor — passes { gradeScales, gradeScaleId, onGradeScaleChange }.
//     A grade scale is optional there; selecting one provides the bands so Grade
//     Profile rules can target real grades (and the guarantee band can be picked).
//   • the Create-Assignment wizard — passes { bands, passFailEnabled, showBand }
//     from the assignment's chosen scale.
//
// value = { mode?, passLevelKey, gate, guarantee, profile? }
export default function RulesConfig({
  value: rules,
  rubric,
  bands = [],
  passFailEnabled,
  onChange,
  showBand = true,
  gradeScales,
  gradeScaleId,
  onGradeScaleChange,
}) {
  const set = (next) => onChange(next)
  const setGate = (patch) => set({ ...rules, gate: { ...rules.gate, ...patch } })
  const setGuarantee = (patch) => set({ ...rules, guarantee: { ...rules.guarantee, ...patch } })

  // Rubric mode owns its own (optional) grade scale; assignment mode is told its scale.
  const rubricMode = !!onGradeScaleChange
  const selectedScale = rubricMode ? (gradeScales ?? []).find((s) => s.id === gradeScaleId) : null
  const effBands = rubricMode ? selectedScale?.bands ?? [] : bands
  const effPassFail = rubricMode ? (selectedScale ? !!selectedScale.passFailEnabled : true) : passFailEnabled
  const effShowBand = rubricMode ? !!selectedScale : showBand

  const levelOptions = (rubric?.levels ?? []).map((l) => ({ value: l.key, label: l.label }))
  const bandOptions = effBands.map((b) => ({ value: b.id, label: b.label }))

  const scaleSelector = rubricMode ? (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
      <span className="text-sm font-semibold text-slate-800">Grade scale</span>
      <span className="text-xs text-slate-400">(optional)</span>
      <Select value={gradeScaleId ?? ''} onChange={(e) => onGradeScaleChange(e.target.value || null)} className="w-auto">
        <option value="">— None —</option>
        {(gradeScales ?? []).map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>
      <span className="text-xs text-slate-400">Choose a Pass/Fail scale to enable Grade Profile rules.</span>
    </div>
  ) : null

  if (!effPassFail) {
    return (
      <Card title="Grade rules">
        {scaleSelector}
        <p className={`text-sm text-slate-500 ${rubricMode ? 'mt-4' : ''}`}>
          {selectedScale || !rubricMode ? (
            <>
              The chosen grade scale uses <span className="font-medium text-slate-700">simple grading</span> (no
              pass/fail), so there are no grade rules — the score maps directly to a band.
            </>
          ) : (
            <>Select a Pass/Fail grade scale above to add grade rules for this rubric.</>
          )}
        </p>
      </Card>
    )
  }

  const mode = rules.mode === 'profile' ? 'profile' : 'weighted'
  const setMode = (m) =>
    m === 'profile'
      ? set({ ...rules, mode: 'profile', profile: rules.profile ?? defaultProfile() })
      : set({ ...rules, mode: 'weighted' })

  const g = rules.guarantee

  return (
    <Card title="Grade rules (optional)" subtitle="Choose how the final grade is decided, then shape it beyond the raw score.">
      <div className="space-y-4">
        {scaleSelector}

        {/* Grading method — weighted average vs. grade profile */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
          <span className="text-sm font-semibold text-slate-800">Grading method</span>
          <SegmentedControl
            value={mode}
            onChange={setMode}
            options={[
              { value: 'weighted', label: 'Weighted average' },
              { value: 'profile', label: 'Grade profile' },
            ]}
          />
        </div>

        {mode === 'profile' ? (
          effShowBand ? (
            <ProfileRulesEditor
              profile={rules.profile ?? defaultProfile()}
              rubric={rubric}
              bands={effBands}
              onChange={(p) => set({ ...rules, profile: p })}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
              Select a grade scale above to set up grade-profile rules.
            </div>
          )
        ) : (
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
            {effShowBand ? (
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
          {!effShowBand && (
            <p className="mt-2 text-xs text-slate-400">
              The exact minimum grade is chosen on each assignment (from its grade scale).
            </p>
          )}
        </div>
          </div>
        )}
      </div>
    </Card>
  )
}
