import { useStore } from '../state/store.jsx'
import { resolveAssignmentConfig } from '../lib/resolve.js'
import { Card, Button, Badge, EmptyState, colorOf } from '../components/ui.jsx'
import Markdown from '../components/Markdown.jsx'
import RubricView from '../components/views/RubricView.jsx'

function MetaItem({ label, children }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-slate-800">{children}</div>
    </div>
  )
}

export default function AssignmentDetailInstructor() {
  const { state, dispatch, navigate } = useStore()
  const id = state.route.params.id
  const assignment = state.assignments.find((a) => a.id === id)

  if (!assignment) {
    return (
      <EmptyState
        title="Assignment not found"
        action={<Button onClick={() => navigate('assignments')}>Back to assignments</Button>}
      />
    )
  }

  const config = resolveAssignmentConfig(state, assignment)
  const sortedBands = config.scale ? [...config.scale.bands].sort((a, b) => a.min - b.min) : []

  const evaluate = () => {
    dispatch({ type: 'START_SESSION', assignmentId: id })
    navigate('evaluate', { id })
  }
  const editAssignment = () => {
    dispatch({ type: 'START_DRAFT', draft: { ...assignment, step: 0 } })
    navigate('assignment-edit', { id })
  }

  const graded = state.session?.assignmentId === id

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('assignments')}
            className="mb-1 text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            ← Assignments
          </button>
          <h1 className="text-2xl font-bold text-slate-900">{assignment.title}</h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge tone={assignment.status === 'published' ? 'emerald' : 'amber'}>{assignment.status}</Badge>
            {assignment.submitted && <Badge tone="indigo">Submission received</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={editAssignment}>Edit</Button>
          <Button onClick={evaluate}>{graded ? 'Continue grading' : 'Evaluate submission'} →</Button>
        </div>
      </div>

      {/* Meta row */}
      <Card>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <MetaItem label="Due date">{assignment.dueDate || '—'}</MetaItem>
          <MetaItem label="Points">{assignment.points}</MetaItem>
          <MetaItem label="Grade scale">
            <span className="flex items-center gap-2">
              {config.scale?.name ?? '—'}
              {config.scale && (
                <Badge tone={config.passFailEnabled ? 'indigo' : 'slate'}>
                  {config.passFailEnabled ? 'Pass / Fail' : 'Simple'}
                </Badge>
              )}
            </span>
          </MetaItem>
          <MetaItem label="Rubric">{config.rubric?.name ?? '—'}</MetaItem>
        </div>
        {sortedBands.length > 0 && (
          <div className="mt-4 flex h-2 w-full overflow-hidden rounded-full ring-1 ring-slate-200">
            {sortedBands.map((b) => (
              <div
                key={b.id}
                className={colorOf(b.color).bar}
                style={{ width: `${Math.max(0, Math.min(100, b.max) - Math.max(0, b.min))}%` }}
                title={`${b.label}: ${b.min}–${b.max}%`}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Content */}
      <Card title="Instructions">
        <Markdown>{assignment.content}</Markdown>
      </Card>

      {/* Outcomes */}
      {assignment.outcomes?.trim() && (
        <Card title="Learning outcomes assessed">
          <Markdown>{assignment.outcomes}</Markdown>
        </Card>
      )}

      {/* Rubric */}
      <Card title="Rubric" subtitle={config.rubric?.name}>
        <RubricView rubric={config.rubric} />
      </Card>
    </div>
  )
}
