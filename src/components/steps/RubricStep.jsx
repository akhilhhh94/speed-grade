import { useStore } from '../../state/store.jsx'
import { uid } from '../../data/sampleData.js'
import { pointsRange } from '../../lib/calc.js'
import { Card, Button, Toggle, SegmentedControl } from '../ui.jsx'

export default function RubricStep() {
  const { state, dispatch } = useStore()
  const { rubric, rules, bands, passFailEnabled } = state

  const setRubric = (next) => dispatch({ type: 'SET_RUBRIC', rubric: next })

  const updateLevel = (key, patch) =>
    setRubric({ ...rubric, levels: rubric.levels.map((l) => (l.key === key ? { ...l, ...patch } : l)) })

  const setLevelPointsMode = (key, mode) => {
    const lvl = rubric.levels.find((l) => l.key === key)
    const r = pointsRange(lvl)
    updateLevel(key, { points: mode === 'range' ? { min: r.min, max: r.max } : r.max })
  }

  // --- Performance levels (columns) are fully dynamic --------------------------
  // Adding a column gives every criterion a blank descriptor cell; removing one
  // prunes those cells, fixes the pass-level rule, and drops any scores that used
  // it; reordering changes rank (leftmost = best), which the engine reads by index.
  const addLevel = () => {
    const newKey = uid('lvl')
    setRubric({
      ...rubric,
      levels: [...rubric.levels, { key: newKey, label: 'New level', points: 0 }],
      criteria: rubric.criteria.map((c) => ({ ...c, cells: { ...c.cells, [newKey]: '' } })),
    })
  }

  const removeLevel = (key) => {
    if (rubric.levels.length <= 1) return
    const nextLevels = rubric.levels.filter((l) => l.key !== key)
    setRubric({
      ...rubric,
      levels: nextLevels,
      criteria: rubric.criteria.map((c) => {
        const { [key]: _drop, ...rest } = c.cells
        return { ...c, cells: rest }
      }),
    })
    // The pass-level rule may point at the removed column — fall back to the best.
    if (rules.passLevelKey === key) {
      dispatch({ type: 'SET_RULES', rules: { ...rules, passLevelKey: nextLevels[0].key } })
    }
    // Drop any learner scores that referenced the removed column.
    const prunedEntries = Object.entries(state.evaluation).filter(([, v]) => v.levelKey !== key)
    if (prunedEntries.length !== Object.keys(state.evaluation).length) {
      dispatch({ type: 'SET_EVALUATION', evaluation: Object.fromEntries(prunedEntries) })
    }
  }

  const moveLevel = (key, dir) => {
    const i = rubric.levels.findIndex((l) => l.key === key)
    const j = i + dir
    if (i < 0 || j < 0 || j >= rubric.levels.length) return
    const next = [...rubric.levels]
    ;[next[i], next[j]] = [next[j], next[i]]
    setRubric({ ...rubric, levels: next })
  }

  const updateCriterion = (id, patch) =>
    setRubric({ ...rubric, criteria: rubric.criteria.map((c) => (c.id === id ? { ...c, ...patch } : c)) })

  const updateCell = (id, levelKey, text) => {
    const crit = rubric.criteria.find((c) => c.id === id)
    updateCriterion(id, { cells: { ...crit.cells, [levelKey]: text } })
  }

  const addCriterion = () => {
    const cells = Object.fromEntries(rubric.levels.map((l) => [l.key, '']))
    setRubric({
      ...rubric,
      criteria: [...rubric.criteria, { id: uid('crit'), name: 'New criterion', weight: 1, cells }],
    })
  }

  const removeCriterion = (id) =>
    setRubric({ ...rubric, criteria: rubric.criteria.filter((c) => c.id !== id) })

  return (
    <div className="space-y-6">
      <Card
        title={rubric.name}
        subtitle="Rows are evaluation criteria; columns are performance levels. A level's points can be a single value or a range — when it's a range, the teacher fine-tunes the exact points with a slider while evaluating."
      >
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-48 min-w-48 rounded-tl-lg bg-slate-50 p-3 text-left align-bottom">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Criteria</span>
                </th>
                {rubric.levels.map((lvl, idx) => {
                  const isRange = typeof lvl.points !== 'number'
                  const r = pointsRange(lvl)
                  const onlyOne = rubric.levels.length === 1
                  return (
                    <th key={lvl.key} className="min-w-56 border-l border-slate-100 bg-slate-50 p-3 text-left align-top">
                      {/* Column controls: move left/right, remove */}
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                          Level {idx + 1}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => moveLevel(lvl.key, -1)}
                            disabled={idx === 0}
                            title="Move left (higher rank)"
                            className="rounded px-1 py-0.5 text-xs text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            ◀
                          </button>
                          <button
                            type="button"
                            onClick={() => moveLevel(lvl.key, 1)}
                            disabled={idx === rubric.levels.length - 1}
                            title="Move right (lower rank)"
                            className="rounded px-1 py-0.5 text-xs text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            ▶
                          </button>
                          <button
                            type="button"
                            onClick={() => removeLevel(lvl.key)}
                            disabled={onlyOne}
                            title={onlyOne ? 'A rubric needs at least one level' : 'Remove level'}
                            className="rounded px-1 py-0.5 text-xs text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-red-400"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <input
                        value={lvl.label}
                        onChange={(e) => updateLevel(lvl.key, { label: e.target.value })}
                        className="mb-2 w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 text-sm font-semibold text-slate-800 hover:border-slate-200 focus:border-slate-300 focus:bg-white"
                      />
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        {isRange ? (
                          <>
                            <input
                              type="number"
                              value={r.min}
                              onChange={(e) => updateLevel(lvl.key, { points: { min: Number(e.target.value), max: r.max } })}
                              className="w-14 rounded border border-slate-200 px-1.5 py-1"
                            />
                            <span>–</span>
                            <input
                              type="number"
                              value={r.max}
                              onChange={(e) => updateLevel(lvl.key, { points: { min: r.min, max: Number(e.target.value) } })}
                              className="w-14 rounded border border-slate-200 px-1.5 py-1"
                            />
                          </>
                        ) : (
                          <input
                            type="number"
                            value={lvl.points}
                            onChange={(e) => updateLevel(lvl.key, { points: Number(e.target.value) })}
                            className="w-16 rounded border border-slate-200 px-1.5 py-1"
                          />
                        )}
                        <span>pts</span>
                        <button
                          type="button"
                          onClick={() => setLevelPointsMode(lvl.key, isRange ? 'single' : 'range')}
                          className="ml-1 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 hover:bg-slate-300"
                        >
                          {isRange ? 'range' : 'single'}
                        </button>
                      </div>
                    </th>
                  )
                })}
                <th className="w-24 min-w-24 border-l border-slate-100 bg-slate-50 p-3 align-bottom text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Weight
                </th>
              </tr>
            </thead>
            <tbody>
              {rubric.criteria.map((c) => (
                <tr key={c.id} className="align-top">
                  <td className="sticky left-0 z-10 bg-white p-2">
                    <input
                      value={c.name}
                      onChange={(e) => updateCriterion(c.id, { name: e.target.value })}
                      className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm font-semibold text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => removeCriterion(c.id)}
                      className="mt-1.5 text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                  {rubric.levels.map((lvl) => (
                    <td key={lvl.key} className="border-l border-t border-slate-100 p-2">
                      <textarea
                        value={c.cells[lvl.key] ?? ''}
                        onChange={(e) => updateCell(c.id, lvl.key, e.target.value)}
                        rows={4}
                        className="w-full resize-y rounded-md border border-slate-200 px-2 py-1.5 text-xs leading-relaxed text-slate-600"
                      />
                    </td>
                  ))}
                  <td className="border-l border-t border-slate-100 p-2">
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={c.weight}
                      onChange={(e) => updateCriterion(c.id, { weight: Number(e.target.value) })}
                      className="w-16 rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="subtle" onClick={addCriterion}>
            + Add criterion
          </Button>
          <Button variant="subtle" onClick={addLevel}>
            + Add level (column)
          </Button>
        </div>
      </Card>

      <RulesConfig rules={rules} bands={bands} rubric={rubric} passFailEnabled={passFailEnabled} dispatch={dispatch} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Grade rules — shown only when Pass/Fail grading is enabled (Step 1).
// One shared definition of "a passing criterion" drives the gate & guarantee.
// ---------------------------------------------------------------------------
function RulesConfig({ rules, bands, rubric, passFailEnabled, dispatch }) {
  const set = (next) => dispatch({ type: 'SET_RULES', rules: next })
  const setGate = (patch) => set({ ...rules, gate: { ...rules.gate, ...patch } })
  const setGuarantee = (patch) => set({ ...rules, guarantee: { ...rules.guarantee, ...patch } })

  const levelOptions = rubric.levels.map((l) => ({ value: l.key, label: l.label }))
  const bandOptions = bands.map((b) => ({ value: b.id, label: b.label }))

  const Select = ({ value, onChange, options }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )

  // When Pass/Fail grading is off there are no grade rules — just a pointer.
  if (!passFailEnabled) {
    return (
      <Card title="Grade rules">
        <p className="text-sm text-slate-500">
          Enable <span className="font-medium text-slate-700">Pass/Fail grading</span> in Step 1 to configure
          grade rules (minimum to pass, grade guarantee).
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
          <Select value={rules.passLevelKey} onChange={(v) => set({ ...rules, passLevelKey: v })} options={levelOptions} />
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
              {rubric.criteria.map((c) => {
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
            <span>of the selected criteria pass → guarantee at least</span>
            <Select value={g.minBandId} onChange={(v) => setGuarantee({ minBandId: v })} options={bandOptions} />
            <span className="text-slate-400">(a higher score still wins).</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
