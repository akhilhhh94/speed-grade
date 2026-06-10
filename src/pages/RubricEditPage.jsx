import { useStore } from '../state/store.jsx'
import { Button, EmptyState } from '../components/ui.jsx'
import RubricEditor from '../components/editors/RubricEditor.jsx'

export default function RubricEditPage() {
  const { state, dispatch, navigate } = useStore()
  const rubric = state.rubrics.find((r) => r.id === state.route.params.id)

  if (!rubric) {
    return (
      <EmptyState
        title="Rubric not found"
        subtitle="It may have been deleted."
        action={<Button onClick={() => navigate('rubrics')}>Back to rubrics</Button>}
      />
    )
  }

  const onChange = (value) => dispatch({ type: 'UPDATE_RUBRIC', id: rubric.id, value })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('rubrics')}
          className="text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          ← Rubrics
        </button>
        <span className="text-xs text-slate-400">Changes are saved automatically</span>
      </div>
      <RubricEditor value={rubric} onChange={onChange} />
    </div>
  )
}
