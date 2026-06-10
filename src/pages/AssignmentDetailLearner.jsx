import { useStore } from '../state/store.jsx'
import { resolveAssignmentConfig } from '../lib/resolve.js'
import { submissionFor } from '../data/sampleData.js'
import { Card, Button, Badge, EmptyState } from '../components/ui.jsx'
import Markdown from '../components/Markdown.jsx'
import RubricView from '../components/views/RubricView.jsx'
import SubmissionPanel from '../components/SubmissionPanel.jsx'
import { IconClock, IconCheck } from '../components/layout/Icons.jsx'

export default function AssignmentDetailLearner() {
  const { state, dispatch, navigate } = useStore()
  const id = state.route.params.id
  const assignment = state.assignments.find((a) => a.id === id)

  if (!assignment || assignment.status !== 'published') {
    return (
      <EmptyState
        title="Assignment unavailable"
        subtitle="This assignment is not published."
        action={<Button onClick={() => navigate('assignments')}>Back to assignments</Button>}
      />
    )
  }

  const config = resolveAssignmentConfig(state, assignment)
  const submission = submissionFor(id)
  const resultReady = state.session?.assignmentId === id

  const submit = () => dispatch({ type: 'SUBMIT_ASSIGNMENT', id })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={() => navigate('assignments')}
          className="mb-1 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          ← My assignments
        </button>
        <h1 className="text-2xl font-bold text-slate-900">{assignment.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1.5">
            <IconClock className="h-4 w-4 text-slate-400" /> Due {assignment.dueDate || '—'}
          </span>
          <span>{assignment.points} points</span>
          <span className="flex items-center gap-2">
            Grading:
            <Badge tone={config.passFailEnabled ? 'indigo' : 'slate'}>
              {config.passFailEnabled ? 'Pass / Fail' : 'Simple'}
            </Badge>
          </span>
        </div>
      </div>

      {/* Submission status banner */}
      {assignment.submitted ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white">
              <IconCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-emerald-800">Submitted</p>
              <p className="text-sm text-emerald-700">Your work is in. You'll see your grade once it's released.</p>
            </div>
          </div>
          {resultReady && <Button onClick={() => navigate('result', { id })}>View result →</Button>}
        </div>
      ) : (
        <div className="rounded-2xl bg-indigo-50 p-5 ring-1 ring-indigo-200">
          <p className="font-semibold text-indigo-900">Ready to submit?</p>
          <p className="mt-0.5 text-sm text-indigo-700">
            Review the brief and rubric below, then submit your work.
          </p>
        </div>
      )}

      {/* Instructions */}
      <Card title="Instructions">
        <Markdown>{assignment.content}</Markdown>
      </Card>

      {/* Outcomes */}
      {assignment.outcomes?.trim() && (
        <Card title="What you'll be assessed on">
          <Markdown>{assignment.outcomes}</Markdown>
        </Card>
      )}

      {/* Rubric */}
      <Card title="How you'll be graded" subtitle="The rubric your submission is scored against.">
        <RubricView rubric={config.rubric} />
      </Card>

      {/* Submission */}
      <Card title="Your submission" subtitle="A sample draft for this prototype.">
        <div className="space-y-4">
          <SubmissionPanel submission={submission} />
          {!assignment.submitted && (
            <div className="flex justify-end">
              <Button onClick={submit}>Submit assignment →</Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
