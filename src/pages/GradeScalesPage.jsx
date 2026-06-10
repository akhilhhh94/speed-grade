import { useStore, newGradeScale } from '../state/store.jsx'
import { Card, Button, Badge, EmptyState, colorOf } from '../components/ui.jsx'
import { IconPlus } from '../components/layout/Icons.jsx'

export default function GradeScalesPage() {
  const { state, dispatch, navigate } = useStore()
  const { gradeScales, assignments } = state

  const create = () => {
    const scale = newGradeScale()
    dispatch({ type: 'ADD_GRADE_SCALE', item: scale })
    navigate('grade-scale', { id: scale.id })
  }

  const usageCount = (id) => assignments.filter((a) => a.gradeScaleId === id).length

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Grade scales</h1>
          <p className="mt-1 text-sm text-slate-500">Reusable banding schemes. Assignments pick one of these.</p>
        </div>
        <Button onClick={create} className="flex items-center gap-1.5">
          <IconPlus className="h-4 w-4" /> New scale
        </Button>
      </div>

      {gradeScales.length === 0 ? (
        <EmptyState title="No grade scales yet" subtitle="Create one to get started." action={<Button onClick={create}>New scale</Button>} />
      ) : (
        <div className="space-y-3">
          {gradeScales.map((s) => {
            const sorted = [...s.bands].sort((a, b) => a.min - b.min)
            const used = usageCount(s.id)
            return (
              <Card key={s.id} className="transition hover:ring-indigo-200">
                <div className="flex items-center justify-between gap-4">
                  <button type="button" onClick={() => navigate('grade-scale', { id: s.id })} className="min-w-0 flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-slate-800">{s.name}</p>
                      <Badge tone={s.passFailEnabled ? 'indigo' : 'slate'}>
                        {s.passFailEnabled ? 'Pass / Fail' : 'Simple'}
                      </Badge>
                    </div>
                    <div className="mt-2 flex h-2.5 w-full max-w-md overflow-hidden rounded-full ring-1 ring-slate-200">
                      {sorted.map((b) => (
                        <div
                          key={b.id}
                          className={colorOf(b.color).bar}
                          style={{ width: `${Math.max(0, Math.min(100, b.max) - Math.max(0, b.min))}%` }}
                          title={`${b.label}: ${b.min}–${b.max}%`}
                        />
                      ))}
                    </div>
                    <p className="mt-1.5 text-xs text-slate-400">
                      {s.bands.length} bands{used > 0 ? ` · used by ${used} assignment${used > 1 ? 's' : ''}` : ''}
                    </p>
                  </button>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => navigate('grade-scale', { id: s.id })}>
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      disabled={used > 0}
                      title={used > 0 ? 'In use by an assignment' : 'Delete'}
                      onClick={() => dispatch({ type: 'REMOVE_GRADE_SCALE', id: s.id })}
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
