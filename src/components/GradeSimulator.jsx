import { useState } from 'react'
import { useStore } from '../state/store.jsx'
import { resolveAssignmentConfig } from '../lib/resolve.js'
import { Field, Select, Badge, EmptyState } from './ui.jsx'
import EvaluationView from './views/EvaluationView.jsx'
import ResultView from './views/ResultView.jsx'

// Grade simulator — a read-only sandbox over the grading engine. Pick an EXISTING
// rubric + grade scale, score the criteria, and see exactly how the final grade is
// reached (full calculation breakdown + plain-language steps). No creating/editing,
// no student feedback, no teacher override — just simulate and verify.
const EMPTY_OVERRIDE = { bandId: null, reason: '' }
const noop = () => {}

export default function GradeSimulator({ initialRubricId = null, initialScaleId = null }) {
  const { state } = useStore()

  // Pre-load when launched from a rubric context; the pickers stay switchable.
  const [rubricId, setRubricId] = useState(initialRubricId)
  const [scaleId, setScaleId] = useState(initialScaleId)
  const [evaluation, setEvaluation] = useState({})
  const [view, setView] = useState('evaluate') // 'evaluate' | 'result'

  // Switching the rubric invalidates the per-criterion scores; always drop back to evaluate.
  const chooseRubric = (id) => {
    setRubricId(id)
    setEvaluation({})
    setView('evaluate')
    // Adopt the rubric's associated scale if none is chosen yet.
    const r = state.rubrics.find((x) => x.id === id)
    if (id && r?.gradeScaleId && !scaleId) setScaleId(r.gradeScaleId)
  }
  const chooseScale = (id) => {
    setScaleId(id)
    setView('evaluate')
  }

  const currentRubric = state.rubrics.find((r) => r.id === rubricId) ?? null
  const config = resolveAssignmentConfig(state, { rubricId, gradeScaleId: scaleId })
  const ready = !!config.rubric && !!config.scale

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        Try an existing rubric and grade scale together, score the criteria, and see how the final grade is reached —
        with the full calculation and the plain-language explanation.
      </p>

      {/* Pickers (existing only) */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Rubric">
          <Select value={rubricId ?? ''} onChange={(e) => chooseRubric(e.target.value || null)}>
            <option value="">— Select a rubric —</option>
            {state.rubrics.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Grade scale">
          <Select value={scaleId ?? ''} onChange={(e) => chooseScale(e.target.value || null)}>
            <option value="">— Select a grade scale —</option>
            {state.gradeScales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          {currentRubric?.gradeScaleId && currentRubric.gradeScaleId !== scaleId && (
            <div className="mt-1">
              <Badge tone="indigo">
                Rubric suggests “{state.gradeScales.find((s) => s.id === currentRubric.gradeScaleId)?.name ?? '—'}”
              </Badge>
            </div>
          )}
        </Field>
      </div>

      {/* Sandbox body */}
      {ready ? (
        view === 'result' ? (
          <ResultView
            config={config}
            evaluation={evaluation}
            feedback=""
            override={EMPTY_OVERRIDE}
            onBack={() => setView('evaluate')}
          />
        ) : (
          <EvaluationView
            config={config}
            submission={null}
            evaluation={evaluation}
            feedback=""
            override={EMPTY_OVERRIDE}
            onCriterion={(criterionId, value) => setEvaluation((prev) => ({ ...prev, [criterionId]: value }))}
            onFeedback={noop}
            onOverride={noop}
            onSeeResult={() => setView('result')}
            onReset={() => setEvaluation({})}
            showFeedback={false}
            showOverride={false}
          />
        )
      ) : (
        <EmptyState
          icon="🧪"
          title="Pick a rubric and a grade scale"
          subtitle="Choose an existing rubric and grade scale above to simulate how the final grade is decided."
        />
      )}
    </div>
  )
}
