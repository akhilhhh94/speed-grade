import { useStore } from './state/store.jsx'
import Stepper from './components/Stepper.jsx'
import GradeBandsStep from './components/steps/GradeBandsStep.jsx'
import RubricStep from './components/steps/RubricStep.jsx'
import EvaluationStep from './components/steps/EvaluationStep.jsx'
import ResultStep from './components/steps/ResultStep.jsx'
import { Button } from './components/ui.jsx'

const STEP_TITLES = [
  'Set up grades',
  'Build the rubric & rules',
  'Evaluate the submission',
  'Evaluation result',
]

export default function App() {
  const { state, dispatch } = useStore()
  const step = state.step

  const go = (n) => dispatch({ type: 'SET_STEP', step: Math.max(0, Math.min(3, n)) })

  // A teacher override (set on the evaluation step) must carry a reason before
  // the result can be viewed.
  const overrideInvalid = !!state.override.bandId && !state.override.reason.trim()

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
                ◈
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900">Rubric Grade Calculator</h1>
                <p className="text-xs text-slate-500">Assignment submission evaluation · proof of concept</p>
              </div>
            </div>
            <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 sm:block">
              Submission&nbsp;·&nbsp;Essay #1042
            </span>
          </div>
          <div className="mt-5">
            <Stepper />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <h2 className="mb-5 text-xl font-bold text-slate-900">
          <span className="text-indigo-600">Step {step + 1}.</span> {STEP_TITLES[step]}
        </h2>

        {step === 0 && <GradeBandsStep />}
        {step === 1 && <RubricStep />}
        {step === 2 && <EvaluationStep />}
        {step === 3 && <ResultStep />}

        <div className="mt-8 flex items-center justify-between">
          <Button variant="ghost" onClick={() => go(step - 1)} disabled={step === 0}>
            ← Back
          </Button>
          {step < 3 ? (
            <Button onClick={() => go(step + 1)} disabled={step === 2 && overrideInvalid}>
              {step === 2 ? 'See result' : 'Continue'} →
            </Button>
          ) : (
            <Button variant="subtle" onClick={() => go(0)}>
              Start over
            </Button>
          )}
        </div>
      </main>

      <footer className="mx-auto max-w-6xl px-6 pb-10 pt-2 text-center text-xs text-slate-400">
        All grades are computed transparently — every number on the result screen is explained.
      </footer>
    </div>
  )
}
