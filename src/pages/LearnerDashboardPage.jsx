import { useStore } from '../state/store.jsx'
import { Card, Badge } from '../components/ui.jsx'
import { IconClock, IconCheck, IconChevronRight } from '../components/layout/Icons.jsx'

export default function LearnerDashboardPage() {
  const { state, navigate } = useStore()
  const published = state.assignments.filter((a) => a.status === 'published')
  const todo = published.filter((a) => !a.submitted)
  const done = published.filter((a) => a.submitted)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My courses</h1>
        <p className="mt-1 text-sm text-slate-500">Your upcoming and submitted assignments.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <IconClock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold leading-none text-slate-900">{todo.length}</div>
            <div className="mt-1 text-xs text-slate-500">To submit</div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <IconCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold leading-none text-slate-900">{done.length}</div>
            <div className="mt-1 text-xs text-slate-500">Submitted</div>
          </div>
        </div>
      </div>

      <Card title="Assignments" subtitle="Open an assignment to read the brief and submit your work.">
        <ul className="divide-y divide-slate-100">
          {published.map((a) => (
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
                  {a.submitted ? <Badge tone="emerald">Submitted</Badge> : <Badge tone="amber">Open</Badge>}
                  <IconChevronRight className="h-4 w-4 text-slate-300" />
                </div>
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
