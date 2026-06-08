import { createContext, useContext, useReducer } from 'react'
import { defaultBands, defaultRubric, defaultRules } from '../data/sampleData.js'

// In-memory store for the whole app. State resets on reload and re-seeds with
// the sample rubric, default bands and default rules (per the PoC scope).

const initialState = {
  step: 0, // 0=grade setup, 1=rubric+rules, 2=evaluate, 3=result
  passFailEnabled: false, // top-level: off = simple grading (letter grade only)
  bands: defaultBands,
  rubric: defaultRubric,
  rules: defaultRules,
  evaluation: {}, // { [criterionId]: { levelKey, points } }
  feedback: '', // teacher's feedback comment to the student
  override: { bandId: null, reason: '' },
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step }
    case 'SET_PASSFAIL_ENABLED':
      return { ...state, passFailEnabled: action.enabled }
    case 'SET_BANDS':
      return { ...state, bands: action.bands }
    case 'SET_RUBRIC':
      return { ...state, rubric: action.rubric }
    case 'SET_RULES':
      return { ...state, rules: action.rules }
    case 'SET_EVAL_CRITERION':
      return {
        ...state,
        evaluation: { ...state.evaluation, [action.criterionId]: action.value },
      }
    case 'SET_EVALUATION':
      return { ...state, evaluation: action.evaluation }
    case 'RESET_EVAL':
      return { ...state, evaluation: {}, feedback: '', override: { bandId: null, reason: '' } }
    case 'SET_FEEDBACK':
      return { ...state, feedback: action.feedback }
    case 'SET_OVERRIDE':
      return { ...state, override: action.override }
    default:
      return state
  }
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
