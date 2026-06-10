import { useStore, newAssignmentDraft } from '../state/store.jsx'
import { Card, Button, Badge, EmptyState } from '../components/ui.jsx'
import { IconPlus, IconChevronRight } from '../components/layout/Icons.jsx'

export default function AssignmentsPage() {
  const { state, dispatch, navigate } = useStore()
  const { assignments, rubrics, gradeScales } = state

  const create = () => {
    dispatch({ type: 'START_DRAFT', draft: newAssignmentDraft() })
    navigate('assignment-new')
  }

  const edit = (a) => {
    dispatch({ type: 'START_DRAFT', draft: { ...a, step: 0 } })
    navigate('assignment-edit', { id: a.id })
  }

  const nameOf = (list, id) => list.find((x) => x.id === id)?.name ?? '—'

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Assignments</h1>
          <p className="mt-1 text-sm text-slate-500">Create, review and grade assignments.</p>
        </div>
        <Button onClick={create} className="flex items-center gap-1.5">
          <IconPlus className="h-4 w-4" /> Create assignment
        </Button>
      </div>

      {assignments.length === 0 ? (
        <EmptyState
          icon="🗂"
          title="No assignments yet"
          subtitle="Create your first assignment to see it here."
          action={<Button onClick={create}>Create assignment</Button>}
        />
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <Card key={a.id} className="transition hover:ring-indigo-200">
              <div className="flex items-center justify-between gap-4">
                <button type="button" onClick={() => navigate('assignment', { id: a.id })} className="min-w-0 flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-slate-800">{a.title || 'Untitled assignment'}</p>
                    <Badge tone={a.status === 'published' ? 'emerald' : 'amber'}>{a.status}</Badge>
                    {a.submitted && <Badge tone="indigo">Submitted</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Due {a.dueDate || '—'} · {a.points} pts · {nameOf(rubrics, a.rubricId)} · {nameOf(gradeScales, a.gradeScaleId)}
                  </p>
                </button>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => edit(a)}>Edit</Button>
                  <Button variant="danger" onClick={() => dispatch({ type: 'REMOVE_ASSIGNMENT', id: a.id })}>Delete</Button>
                  <IconChevronRight className="h-4 w-4 text-slate-300" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
