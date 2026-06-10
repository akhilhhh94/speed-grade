// Generic horizontal step rail for the Create-Assignment wizard. Generalized
// from the original Stepper: takes the step list + current index as props.
export default function WizardStepper({ steps, current, onStepClick }) {
  return (
    <nav className="flex items-center">
      {steps.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={s.label} className="flex flex-1 items-center last:flex-none">
            <button
              type="button"
              onClick={() => onStepClick?.(i)}
              className="group flex items-center gap-3 text-left"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ring-1 transition ${
                  active
                    ? 'bg-indigo-600 text-white ring-indigo-600'
                    : done
                      ? 'bg-indigo-100 text-indigo-700 ring-indigo-200'
                      : 'bg-white text-slate-400 ring-slate-200 group-hover:ring-slate-300'
                }`}
              >
                {done ? '✓' : i + 1}
              </span>
              <span className="hidden md:block">
                <span className={`block text-sm font-semibold ${active ? 'text-indigo-700' : done ? 'text-slate-700' : 'text-slate-400'}`}>
                  {s.label}
                </span>
                {s.hint && <span className="block text-xs text-slate-400">{s.hint}</span>}
              </span>
            </button>
            {i < steps.length - 1 && <span className={`mx-3 h-px flex-1 ${done ? 'bg-indigo-300' : 'bg-slate-200'}`} />}
          </div>
        )
      })}
    </nav>
  )
}
