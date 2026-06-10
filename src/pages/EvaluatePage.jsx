import { useEffect } from 'react'
import { useStore } from '../state/store.jsx'
import { resolveAssignmentConfig } from '../lib/resolve.js'
import { submissionFor } from '../data/sampleData.js'
import { Button, EmptyState } from '../components/ui.jsx'
import EvaluationView from '../components/views/EvaluationView.jsx'

export default function EvaluatePage() {
  const { state, dispatch, navigate } = useStore()
  const id = state.route.params.id
  const assignment = state.assignments.find((a) => a.id === id)

  // Ensure a grading session exists for this assignment.
  const sessionReady = state.session?.assignmentId === id
  useEffect(() => {
    if (assignment && !sessionReady) dispatch({ type: 'START_SESSION', assignmentId: id })
  }, [assignment, sessionReady, id, dispatch])

  if (!assignment) {
    return <EmptyState title="Assignment not found" action={<Button onClick={() => navigate('assignments')}>Back</Button>} />
  }
  if (!sessionReady) return null // waiting for the session effect

  const config = resolveAssignmentConfig(state, assignment)
  if (!config.rubric || !config.scale) {
    return (
      <EmptyState
        title="Assignment is missing its rubric or grade scale"
        subtitle="Edit the assignment to attach both before grading."
        action={<Button onClick={() => navigate('assignment', { id })}>Back to assignment</Button>}
      />
    )
  }

  const { session } = state
  const submission = submissionFor(id)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('assignment', { id })}
          className="text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          ← {assignment.title}
        </button>
        <span className="text-sm font-semibold text-slate-700">Evaluate submission</span>
      </div>

      <EvaluationView
        config={config}
        submission={submission}
        evaluation={session.evaluation}
        feedback={session.feedback}
        override={session.override}
        onCriterion={(criterionId, value) => dispatch({ type: 'SET_SESSION_CRITERION', criterionId, value })}
        onFeedback={(feedback) => dispatch({ type: 'SET_SESSION_FEEDBACK', feedback })}
        onOverride={(override) => dispatch({ type: 'SET_SESSION_OVERRIDE', override })}
        onSeeResult={() => navigate('result', { id })}
        onReset={() => dispatch({ type: 'RESET_SESSION' })}
      />
    </div>
  )
}
