import { useState, useEffect } from 'react'
import { useStore, newRubric, newGradeScale } from '../state/store.jsx'
import { resolveAssignmentConfig } from '../lib/resolve.js'
import { Card, Button, Field, TextInput, Textarea, Badge } from '../components/ui.jsx'
import WizardStepper from '../components/WizardStepper.jsx'
import RubricEditor from '../components/editors/RubricEditor.jsx'
import GradeScaleEditor from '../components/editors/GradeScaleEditor.jsx'
import Markdown from '../components/Markdown.jsx'

const STEPS = [
  { label: 'Details', hint: 'Title & content' },
  { label: 'Rubric & grade scale', hint: 'Criteria & banding' },
  { label: 'Outcomes', hint: 'What it assesses' },
  { label: 'Deadline', hint: 'Due date' },
  { label: 'Review', hint: 'Publish' },
]

function SelectCard({ selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left transition ${
        selected ? 'border-indigo-400 bg-indigo-50/40 ring-2 ring-indigo-100' : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      {children}
    </button>
  )
}

function rulesSummary(passFailEnabled, rules, rubric, bands) {
  if (!passFailEnabled) return 'Simple grading — no pass/fail rules.'
  if (rules.mode === 'profile') {
    const n = rules.profile?.overrides?.length ?? 0
    const fb = rules.profile?.weightedFallback === false ? ' · manual grade if none match' : ''
    return `Grade profile · ${n} rule${n === 1 ? '' : 's'}${fb}`
  }
  const passLabel = rubric?.levels.find((l) => l.key === rules.passLevelKey)?.label ?? '—'
  const parts = [`Pass at ≥ ${passLabel}`]
  if (rules.gate?.enabled) parts.push('every criterion must pass')
  if (rules.guarantee?.enabled) {
    const band = bands.find((b) => b.id === rules.guarantee.minBandId)?.label ?? '—'
    parts.push(`guarantee ≥ ${band}`)
  }
  return parts.join(' · ')
}

export default function CreateAssignmentPage() {
  const { state, dispatch, navigate } = useStore()
  const { draft } = state
  const [contentPreview, setContentPreview] = useState(false)
  const [outcomesPreview, setOutcomesPreview] = useState(false)
  // Inline create/edit of a brand-new global rubric / grade scale within the wizard.
  const [editingRubricId, setEditingRubricId] = useState(null)
  const [editingScaleId, setEditingScaleId] = useState(null)

  useEffect(() => {
    if (!draft) navigate('assignments')
  }, [draft, navigate])
  if (!draft) return null

  const step = draft.step
  const set = (key, value) => dispatch({ type: 'SET_DRAFT_FIELD', key, value })
  const goStep = (i) => dispatch({ type: 'SET_DRAFT_STEP', step: Math.max(0, Math.min(STEPS.length - 1, i)) })

  const config = resolveAssignmentConfig(state, draft)
  const isEdit = state.route.name === 'assignment-edit'

  // Choosing a rubric seeds the assignment's outcomes from it, and adopts the
  // rubric's associated grade scale when none has been picked yet (the assignment
  // may still override the scale — assignment priority). Grade rules are NOT copied
  // to the assignment: they live on the rubric (single source of truth) and are
  // resolved at grade time.
  const chooseRubric = (rubric) => {
    set('rubricId', rubric.id)
    set('outcomes', rubric.outcomes ?? '')
    const scaleId = draft.gradeScaleId || rubric.gradeScaleId || null
    if (scaleId !== draft.gradeScaleId) set('gradeScaleId', scaleId)
  }

  const chooseScale = (id) => set('gradeScaleId', id)

  // Create-new buttons add a real, global library item (no project-local config),
  // select it, and drop the user straight into its full editor.
  const createRubric = () => {
    const r = newRubric()
    dispatch({ type: 'ADD_RUBRIC', item: r })
    chooseRubric(r)
    setEditingRubricId(r.id)
  }
  const createScale = () => {
    const s = newGradeScale()
    dispatch({ type: 'ADD_GRADE_SCALE', item: s })
    set('gradeScaleId', s.id)
    setEditingScaleId(s.id)
  }

  const currentRubric = state.rubrics.find((r) => r.id === draft.rubricId) ?? null
  const editingRubric = editingRubricId ? state.rubrics.find((r) => r.id === editingRubricId) ?? null : null
  const editingScale = editingScaleId ? state.gradeScales.find((s) => s.id === editingScaleId) ?? null : null

  const canContinue = [
    draft.title.trim() !== '',
    !!draft.rubricId && !!draft.gradeScaleId,
    true,
    true,
    true,
  ][step]

  const publish = () => {
    const id = draft.id
    dispatch({ type: 'PUBLISH_DRAFT' })
    navigate('assignment', { id })
  }
  const cancel = () => {
    dispatch({ type: 'DISCARD_DRAFT' })
    navigate('assignments')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">{isEdit ? 'Edit assignment' : 'Create assignment'}</h1>
        <button type="button" onClick={cancel} className="text-sm font-medium text-slate-500 hover:text-slate-800">
          Cancel
        </button>
      </div>

      <Card className="!px-6 !py-5">
        <WizardStepper steps={STEPS} current={step} onStepClick={goStep} />
      </Card>

      {/* STEP 0 — Details & content */}
      {step === 0 && (
        <Card title="Assignment details" subtitle="Give it a title and write the brief learners will read.">
          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <Field label="Title" required>
              <TextInput value={draft.title} placeholder="e.g. Argumentative Essay #1" onChange={(e) => set('title', e.target.value)} />
            </Field>
            <Field label="Points">
              <TextInput type="number" value={draft.points} onChange={(e) => set('points', Number(e.target.value))} />
            </Field>
          </div>
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Content / instructions</span>
              <button type="button" onClick={() => setContentPreview((p) => !p)} className="text-xs font-medium text-indigo-600 hover:underline">
                {contentPreview ? 'Edit' : 'Preview'}
              </button>
            </div>
            {contentPreview ? (
              <div className="min-h-[12rem] rounded-lg border border-slate-200 bg-white px-4 py-3">
                <Markdown>{draft.content || '_Nothing to preview yet._'}</Markdown>
              </div>
            ) : (
              <Textarea
                value={draft.content}
                rows={10}
                placeholder="Write the brief in markdown — headings, lists and tables are supported."
                onChange={(e) => set('content', e.target.value)}
              />
            )}
            <p className="mt-1 text-xs text-slate-400">Markdown supported, including tables.</p>
          </div>
        </Card>
      )}

      {/* STEP 1 — Rubric & grade scale (choose existing or create a new global one) */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Rubric — listed first because it can suggest a grade scale */}
          {editingRubricId && editingRubric ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Editing rubric</h2>
                  <p className="text-sm text-slate-500">Saved to your global rubric library and selected for this assignment.</p>
                </div>
                <Button onClick={() => setEditingRubricId(null)}>Done editing rubric</Button>
              </div>
              <RubricEditor
                value={editingRubric}
                gradeScales={state.gradeScales}
                onChange={(next) => dispatch({ type: 'UPDATE_RUBRIC', id: next.id, value: next })}
              />
            </div>
          ) : (
            <Card title="Choose a rubric" subtitle="The criteria the submission is scored against. Its outcomes & rules become the starting point for this assignment.">
              <div className="space-y-3">
                {state.rubrics.map((r) => (
                  <SelectCard key={r.id} selected={draft.rubricId === r.id} onClick={() => chooseRubric(r)}>
                    <p className="font-semibold text-slate-800">{r.name}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.criteria.map((c) => (
                        <Badge key={c.id} tone="slate">{c.name}</Badge>
                      ))}
                    </div>
                    <p className="mt-1.5 text-xs text-slate-400">{r.criteria.length} criteria · {r.levels.length} levels</p>
                  </SelectCard>
                ))}
              </div>
              <div className="mt-4">
                <Button variant="subtle" onClick={createRubric}>
                  + New rubric (saved to your library)
                </Button>
              </div>
            </Card>
          )}

          {/* Grade scale */}
          {editingScaleId && editingScale ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Editing grade scale</h2>
                  <p className="text-sm text-slate-500">Saved to your global grade-scale library and selected for this assignment.</p>
                </div>
                <Button onClick={() => setEditingScaleId(null)}>Done editing scale</Button>
              </div>
              <GradeScaleEditor
                value={editingScale}
                onChange={(next) => dispatch({ type: 'UPDATE_GRADE_SCALE', id: next.id, value: next })}
              />
            </div>
          ) : (
            <Card title="Choose a grade scale" subtitle="How the final percentage maps to a grade.">
              <div className="space-y-3">
                {state.gradeScales.map((s) => {
                  const ordered = [...s.bands].sort((a, b) => b.min - a.min)
                  const suggested = currentRubric?.gradeScaleId === s.id
                  return (
                    <SelectCard key={s.id} selected={draft.gradeScaleId === s.id} onClick={() => chooseScale(s.id)}>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-semibold text-slate-800">{s.name}</span>
                        <span className="text-slate-300">·</span>
                        <Badge tone={s.passFailEnabled ? 'indigo' : 'slate'}>{s.passFailEnabled ? 'Pass / Fail' : 'Simple'}</Badge>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs text-slate-400">{s.bands.length} bands</span>
                        {suggested && <Badge tone="indigo">Suggested by rubric</Badge>}
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {ordered.map((b) => (
                          <span
                            key={b.id}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                            title={`${b.min}–${b.max}%${b.isPass ? ' · pass' : ' · fail'}`}
                          >
                            {b.label}
                            <span className="ml-1 text-slate-400">{b.min}–{b.max}%</span>
                          </span>
                        ))}
                      </div>
                    </SelectCard>
                  )
                })}
              </div>
              <div className="mt-4">
                <Button variant="subtle" onClick={createScale}>
                  + New grade scale (saved to your library)
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* STEP 2 — Outcomes (rich text, customizable per assignment) */}
      {step === 2 && (
        <Card title="Learning outcomes" subtitle="Inherited from the rubric — customize for this assignment. Supports tables & bullets.">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Outcomes</span>
            <button type="button" onClick={() => setOutcomesPreview((p) => !p)} className="text-xs font-medium text-indigo-600 hover:underline">
              {outcomesPreview ? 'Edit' : 'Preview'}
            </button>
          </div>
          {outcomesPreview ? (
            <div className="min-h-[12rem] rounded-lg border border-slate-200 bg-white px-4 py-3">
              <Markdown>{draft.outcomes || '_Nothing to preview yet._'}</Markdown>
            </div>
          ) : (
            <Textarea
              value={draft.outcomes ?? ''}
              rows={12}
              placeholder="Describe what this assignment assesses — markdown, bullets and tables supported."
              onChange={(e) => set('outcomes', e.target.value)}
            />
          )}
        </Card>
      )}

      {/* STEP 3 — Deadline */}
      {step === 3 && (
        <Card title="Deadline" subtitle="When the assignment is due. Grade rules come from the chosen rubric.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Due date">
              <TextInput type="date" value={draft.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
            </Field>
          </div>
        </Card>
      )}

      {/* STEP 4 — Review */}
      {step === 4 && (
        <Card title="Review & publish" subtitle="Check everything, then publish to make it available to learners.">
          <dl className="divide-y divide-slate-100 text-sm">
            <Row label="Title" value={draft.title || '—'} />
            <Row label="Points" value={draft.points} />
            <Row label="Due date" value={draft.dueDate || '—'} />
            <Row
              label="Grade scale"
              value={
                config.scale ? (
                  <span className="flex items-center gap-2">
                    {config.scale.name}
                    <Badge tone={config.passFailEnabled ? 'indigo' : 'slate'}>{config.passFailEnabled ? 'Pass / Fail' : 'Simple'}</Badge>
                  </span>
                ) : '—'
              }
            />
            <Row label="Rubric" value={config.rubric?.name ?? '—'} />
            <Row label="Grading rules (from rubric)" value={rulesSummary(config.passFailEnabled, config.rules, config.rubric, config.bands)} />
          </dl>

          <div className="mt-4">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-400">Learning outcomes</p>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              {draft.outcomes?.trim() ? <Markdown>{draft.outcomes}</Markdown> : <p className="text-sm text-slate-400">None.</p>}
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <Button onClick={publish}>{isEdit ? 'Save & publish' : 'Publish assignment'} →</Button>
          </div>
        </Card>
      )}

      {/* Nav controls */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => goStep(step - 1)} disabled={step === 0}>
          ← Back
        </Button>
        {step < STEPS.length - 1 && (
          <Button onClick={() => goStep(step + 1)} disabled={!canContinue}>
            Continue →
          </Button>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{value}</dd>
    </div>
  )
}
