import { useStore } from '../state/store.jsx'
import { resolveAssignmentConfig } from '../lib/resolve.js'
import { Button, EmptyState } from '../components/ui.jsx'
import ResultView from '../components/views/ResultView.jsx'

export default function ResultPage() {
  const { state, navigate } = useStore()
  const id = state.route.params.id
  const assignment = state.assignments.find((a) => a.id === id)
  const instructor = state.role === 'instructor'

  if (!assignment) {
    return <EmptyState title="Assignment not found" action={<Button onClick={() => navigate('assignments')}>Back</Button>} />
  }

  const session = state.session
  if (!session || session.assignmentId !== id) {
    return (
      <EmptyState
        icon="⏳"
        title="Not graded yet"
        subtitle={instructor ? 'Evaluate the submission to produce a result.' : 'Your instructor has not released a grade yet.'}
        action={
          instructor ? (
            <Button onClick={() => navigate('evaluate', { id })}>Go to evaluation</Button>
          ) : (
            <Button onClick={() => navigate('assignment', { id })}>Back to assignment</Button>
          )
        }
      />
    )
  }

  const config = resolveAssignmentConfig(state, assignment)

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
        <span className="text-sm font-semibold text-slate-700">{instructor ? 'Evaluation result' : 'Your result'}</span>
      </div>

      <ResultView
        config={config}
        evaluation={session.evaluation}
        feedback={session.feedback}
        override={session.override}
        onBack={instructor ? () => navigate('evaluate', { id }) : undefined}
      />
    </div>
  )
}
