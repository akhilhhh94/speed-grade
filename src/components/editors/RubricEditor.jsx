import { useState } from 'react'
import { uid } from '../../data/sampleData.js'
import { pointsRange } from '../../lib/calc.js'
import { Card, Button, Field, TextInput, Textarea } from '../ui.jsx'
import Markdown from '../Markdown.jsx'
import RulesConfig from './RulesConfig.jsx'

// Controlled editor for a single rubric:
//   { id, name, levels, criteria, outcomes, rules }
// Descriptor cells are plain text. Learning outcomes are a rich-text field
// (markdown — tables/bullets). Grading rules are band-less here; the guarantee's
// minimum band is chosen on the assignment.
//
// NOTE: removeLevel is PURE — it only removes the level and prunes its cells.
// Rule fixups happen downstream (resolve.sanitizeRules / the evaluation view).
export default function RubricEditor({ value, onChange }) {
  const rubric = value
  const [outcomesPreview, setOutcomesPreview] = useState(false)
  const setRubric = (next) => onChange(next)

  const updateLevel = (key, patch) =>
    setRubric({ ...rubric, levels: rubric.levels.map((l) => (l.key === key ? { ...l, ...patch } : l)) })

  const setLevelPointsMode = (key, mode) => {
    const lvl = rubric.levels.find((l) => l.key === key)
    const r = pointsRange(lvl)
    updateLevel(key, { points: mode === 'range' ? { min: r.min, max: r.max } : r.max })
  }

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
    setRubric({
      ...rubric,
      levels: rubric.levels.filter((l) => l.key !== key),
      criteria: rubric.criteria.map((c) => {
        const { [key]: _drop, ...rest } = c.cells
        return { ...c, cells: rest }
      }),
    })
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
      <Card title="Rubric details">
        <Field label="Rubric name">
          <TextInput value={rubric.name} onChange={(e) => setRubric({ ...rubric, name: e.target.value })} />
        </Field>
      </Card>

      <Card
        title="Criteria & performance levels"
        subtitle="Rows are criteria; columns are levels. A level's points can be a single value or a range. Descriptors are short, plain-text statements."
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
                        placeholder="Short descriptor…"
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

      {/* Learning outcomes — rich text */}
      <Card title="Learning outcomes" subtitle="What this rubric assesses. Supports rich text — headings, bullets and tables.">
        <div className="mb-1 flex items-center justify-end">
          <button
            type="button"
            onClick={() => setOutcomesPreview((p) => !p)}
            className="text-xs font-medium text-indigo-600 hover:underline"
          >
            {outcomesPreview ? 'Edit' : 'Preview'}
          </button>
        </div>
        {outcomesPreview ? (
          <div className="min-h-[10rem] rounded-lg border border-slate-200 bg-white px-4 py-3">
            <Markdown>{rubric.outcomes || '_Nothing to preview yet._'}</Markdown>
          </div>
        ) : (
          <Textarea
            value={rubric.outcomes ?? ''}
            rows={8}
            placeholder="Describe the learning outcomes in markdown — bullets and tables are supported."
            onChange={(e) => setRubric({ ...rubric, outcomes: e.target.value })}
          />
        )}
      </Card>

      {/* Grading rules — band-less; applied when used with a Pass/Fail scale */}
      <RulesConfig
        value={rubric.rules}
        rubric={rubric}
        passFailEnabled
        showBand={false}
        onChange={(next) => setRubric({ ...rubric, rules: next })}
      />
    </div>
  )
}
