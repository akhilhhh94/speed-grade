import { useStore } from '../state/store.jsx'
import { Card, Badge, EmptyState } from '../components/ui.jsx'
import { IconClock, IconChevronRight } from '../components/layout/Icons.jsx'

export default function LearnerAssignmentsPage() {
  const { state, navigate } = useStore()
  const published = state.assignments.filter((a) => a.status === 'published')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My assignments</h1>
        <p className="mt-1 text-sm text-slate-500">Everything assigned to you.</p>
      </div>

      {published.length === 0 ? (
        <EmptyState title="Nothing assigned yet" subtitle="Check back later." />
      ) : (
        <div className="space-y-3">
          {published.map((a) => (
            <Card key={a.id} className="transition hover:ring-indigo-200">
              <button
                type="button"
                onClick={() => navigate('assignment', { id: a.id })}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-800">{a.title}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                    <IconClock className="h-3.5 w-3.5" /> Due {a.dueDate || '—'} · {a.points} pts
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {a.submitted ? <Badge tone="emerald">Submitted</Badge> : <Badge tone="amber">Open</Badge>}
                  <IconChevronRight className="h-4 w-4 text-slate-300" />
                </div>
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
