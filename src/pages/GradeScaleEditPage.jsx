import { useStore } from '../state/store.jsx'
import { Button, EmptyState } from '../components/ui.jsx'
import GradeScaleEditor from '../components/editors/GradeScaleEditor.jsx'

export default function GradeScaleEditPage() {
  const { state, dispatch, navigate } = useStore()
  const scale = state.gradeScales.find((s) => s.id === state.route.params.id)

  if (!scale) {
    return (
      <EmptyState
        title="Grade scale not found"
        subtitle="It may have been deleted."
        action={<Button onClick={() => navigate('grade-scales')}>Back to grade scales</Button>}
      />
    )
  }

  const onChange = (value) => dispatch({ type: 'UPDATE_GRADE_SCALE', id: scale.id, value })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('grade-scales')}
          className="text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          ← Grade scales
        </button>
        <span className="text-xs text-slate-400">Changes are saved automatically</span>
      </div>
      <GradeScaleEditor value={scale} onChange={onChange} />
    </div>
  )
}
