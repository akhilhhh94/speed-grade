import { useStore } from '../../state/store.jsx'
import { IconChevronRight } from './Icons.jsx'

const ROUTE_LABEL = {
  dashboard: 'Dashboard',
  assignments: 'Assignments',
  assignment: 'Assignments',
  'assignment-new': 'Assignments',
  'assignment-edit': 'Assignments',
  evaluate: 'Assignments',
  result: 'Assignments',
  'grade-scales': 'Grade Scales',
  'grade-scale': 'Grade Scales',
  rubrics: 'Rubrics',
  rubric: 'Rubrics',
}

// Build up to two breadcrumb segments from the current route + libraries.
function useCrumbs() {
  const { state } = useStore()
  const { route } = state
  const top = ROUTE_LABEL[route.name] ?? 'Dashboard'
  const crumbs = [top]

  const assignment = state.assignments.find((a) => a.id === route.params.id)
  const scale = state.gradeScales.find((s) => s.id === route.params.id)
  const rubric = state.rubrics.find((r) => r.id === route.params.id)

  if (route.name === 'assignment' && assignment) crumbs.push(assignment.title)
  else if (route.name === 'assignment-new') crumbs.push('New assignment')
  else if (route.name === 'assignment-edit') crumbs.push('Edit assignment')
  else if (route.name === 'evaluate' && assignment) crumbs.push(`Evaluate · ${assignment.title}`)
  else if (route.name === 'result' && assignment) crumbs.push(`Result · ${assignment.title}`)
  else if (route.name === 'grade-scale') crumbs.push(scale ? scale.name : 'New grade scale')
  else if (route.name === 'rubric') crumbs.push(rubric ? rubric.name : 'New rubric')

  return crumbs
}

function RoleSwitch() {
  const { state, dispatch, navigate } = useStore()
  const setRole = (role) => {
    dispatch({ type: 'SET_ROLE', role })
    navigate('dashboard')
  }
  return (
    <div className="inline-flex rounded-xl bg-slate-100 p-1 text-sm">
      {[
        { value: 'instructor', label: 'Instructor' },
        { value: 'learner', label: 'Learner' },
      ].map((r) => {
        const active = state.role === r.value
        return (
          <button
            key={r.value}
            type="button"
            onClick={() => setRole(r.value)}
            className={`rounded-lg px-3 py-1.5 font-medium transition ${
              active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {r.label}
          </button>
        )
      })}
    </div>
  )
}

export default function TopBar() {
  const crumbs = useCrumbs()

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/80 px-8 py-3 backdrop-blur">
      <nav className="flex items-center gap-1.5 text-sm">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <IconChevronRight className="h-3.5 w-3.5 text-slate-300" />}
            <span className={i === crumbs.length - 1 ? 'font-semibold text-slate-900' : 'text-slate-400'}>
              {c}
            </span>
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <RoleSwitch />
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
          {/* prototype avatar */}
          ◇
        </div>
      </div>
    </header>
  )
}
