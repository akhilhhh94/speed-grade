import { useStore, newRubric } from '../state/store.jsx'
import { Card, Button, Badge, EmptyState } from '../components/ui.jsx'
import { IconPlus } from '../components/layout/Icons.jsx'

export default function RubricsPage() {
  const { state, dispatch, navigate } = useStore()
  const { rubrics, assignments } = state

  const create = () => {
    const rub = newRubric()
    dispatch({ type: 'ADD_RUBRIC', item: rub })
    navigate('rubric', { id: rub.id })
  }

  const usageCount = (id) => assignments.filter((a) => a.rubricId === id).length

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rubrics</h1>
          <p className="mt-1 text-sm text-slate-500">Reusable criteria × performance-level grids with rich descriptors.</p>
        </div>
        <Button onClick={create} className="flex items-center gap-1.5">
          <IconPlus className="h-4 w-4" /> New rubric
        </Button>
      </div>

      {rubrics.length === 0 ? (
        <EmptyState title="No rubrics yet" subtitle="Create one to get started." action={<Button onClick={create}>New rubric</Button>} />
      ) : (
        <div className="space-y-3">
          {rubrics.map((r) => {
            const used = usageCount(r.id)
            return (
              <Card key={r.id} className="transition hover:ring-indigo-200">
                <div className="flex items-center justify-between gap-4">
                  <button type="button" onClick={() => navigate('rubric', { id: r.id })} className="min-w-0 flex-1 text-left">
                    <p className="truncate font-semibold text-slate-800">{r.name}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {r.criteria.map((c) => (
                        <Badge key={c.id} tone="slate">{c.name}</Badge>
                      ))}
                    </div>
                    <p className="mt-1.5 text-xs text-slate-400">
                      {r.criteria.length} criteria · {r.levels.length} levels
                      {used > 0 ? ` · used by ${used} assignment${used > 1 ? 's' : ''}` : ''}
                    </p>
                  </button>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => navigate('rubric', { id: r.id })}>
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      disabled={used > 0}
                      title={used > 0 ? 'In use by an assignment' : 'Delete'}
                      onClick={() => dispatch({ type: 'REMOVE_RUBRIC', id: r.id })}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
