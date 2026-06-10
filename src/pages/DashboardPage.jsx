import { useStore, newAssignmentDraft } from '../state/store.jsx'
import { Card, Button, Badge } from '../components/ui.jsx'
import { IconPlus, IconScale, IconRubric, IconAssignments } from '../components/layout/Icons.jsx'

function Stat({ icon: Icon, label, value, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-4 rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-slate-200 transition hover:ring-indigo-200"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-2xl font-bold leading-none text-slate-900">{value}</div>
        <div className="mt-1 text-xs text-slate-500">{label}</div>
      </div>
    </button>
  )
}

export default function DashboardPage() {
  const { state, dispatch, navigate } = useStore()
  const { assignments, gradeScales, rubrics } = state

  const createAssignment = () => {
    dispatch({ type: 'START_DRAFT', draft: newAssignmentDraft() })
    navigate('assignment-new')
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back 👋</h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure your assessment building blocks, then create and grade assignments.
          </p>
        </div>
        <Button onClick={createAssignment} className="flex items-center gap-1.5">
          <IconPlus className="h-4 w-4" /> Create assignment
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Stat icon={IconAssignments} label="Assignments" value={assignments.length} onClick={() => navigate('assignments')} />
        <Stat icon={IconScale} label="Grade scales" value={gradeScales.length} onClick={() => navigate('grade-scales')} />
        <Stat icon={IconRubric} label="Rubrics" value={rubrics.length} onClick={() => navigate('rubrics')} />
      </div>

      <Card title="Recent assignments" subtitle="Jump back into an assignment to review or grade it.">
        <ul className="divide-y divide-slate-100">
          {assignments.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => navigate('assignment', { id: a.id })}
                className="flex w-full items-center justify-between gap-4 py-3 text-left transition hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{a.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">Due {a.dueDate || '—'} · {a.points} pts</p>
                </div>
                <div className="flex items-center gap-2">
                  {a.submitted && <Badge tone="indigo">Submitted</Badge>}
                  <Badge tone={a.status === 'published' ? 'emerald' : 'amber'}>{a.status}</Badge>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
