import { useStore } from '../../state/store.jsx'
import { IconDashboard, IconAssignments, IconScale, IconRubric } from './Icons.jsx'

// Routes that should highlight a given nav item (so detail/edit pages keep the
// parent item active).
const GROUP = {
  dashboard: ['dashboard'],
  assignments: ['assignments', 'assignment', 'assignment-new', 'assignment-edit', 'evaluate', 'result'],
  'grade-scales': ['grade-scales', 'grade-scale'],
  rubrics: ['rubrics', 'rubric'],
}

function NavItem({ icon: Icon, label, routeName, group }) {
  const { state, navigate } = useStore()
  const active = (GROUP[group] ?? [group]).includes(state.route.name)
  return (
    <button
      type="button"
      onClick={() => navigate(routeName)}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
        active
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-400'}`} />
      {label}
    </button>
  )
}

export default function Sidebar() {
  const { state } = useStore()
  const instructor = state.role === 'instructor'

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
          ◈
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-slate-900">Lumen LMS</p>
          <p className="text-[11px] text-slate-400">Rubric-based assessment</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        <NavItem icon={IconDashboard} label="Dashboard" routeName="dashboard" group="dashboard" />
        <NavItem icon={IconAssignments} label="Assignments" routeName="assignments" group="assignments" />

        {instructor && (
          <>
            <p className="px-3 pt-5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Configuration
            </p>
            <NavItem icon={IconScale} label="Grade Scales" routeName="grade-scales" group="grade-scales" />
            <NavItem icon={IconRubric} label="Rubrics" routeName="rubrics" group="rubrics" />
          </>
        )}
      </nav>

      <div className="px-5 py-4 text-[11px] leading-relaxed text-slate-400">
        Prototype — data is in-memory and resets on reload.
      </div>
    </aside>
  )
}
