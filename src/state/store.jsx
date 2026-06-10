import { createContext, useContext, useReducer, useCallback, useMemo } from 'react'
import { uid, defaultGradeScales, defaultRubrics, defaultAssignments } from '../data/sampleData.js'

// ===========================================================================
// In-memory store for the whole LMS prototype. State resets on reload and
// re-seeds from sampleData.js (no persistence — no local/session storage).
//
// Shape:
//   role        'instructor' | 'learner'
//   route       { name, params } — lightweight in-memory router
//   gradeScales / rubrics / outcomes — global configuration libraries
//   assignments — reference library items by id
//   draft       — create/edit assignment wizard working copy ({ step, ... })
//   session     — active grading session ({ assignmentId, evaluation, ... })
// ===========================================================================

const initialState = {
  role: 'instructor',
  route: { name: 'dashboard', params: {} },
  gradeScales: defaultGradeScales,
  rubrics: defaultRubrics,
  assignments: defaultAssignments,
  draft: null,
  session: null,
}

// --- Factories for new library items / drafts ------------------------------

export const newGradeScale = () => ({
  id: uid('gs'),
  name: 'New grade scale',
  passFailEnabled: false,
  bands: [
    { id: uid('band'), label: 'Pass', min: 50, max: 100, isPass: true, color: 'green' },
    { id: uid('band'), label: 'Fail', min: 0, max: 50, isPass: false, color: 'red' },
  ],
})

export const newRubric = () => {
  const levels = [
    { key: uid('lvl'), label: 'Excellent', points: 4 },
    { key: uid('lvl'), label: 'Proficient', points: 3 },
    { key: uid('lvl'), label: 'Developing', points: 1 },
  ]
  const cells = Object.fromEntries(levels.map((l) => [l.key, '']))
  return {
    id: uid('rub'),
    name: 'New rubric',
    levels,
    criteria: [{ id: uid('crit'), name: 'New criterion', weight: 1, cells: { ...cells } }],
    outcomes: '',
    // Grade rules (applied when used with a Pass/Fail scale). No band reference —
    // the guarantee's minimum band is chosen on the assignment.
    rules: {
      passLevelKey: levels[Math.min(1, levels.length - 1)].key,
      gate: { enabled: true },
      guarantee: { enabled: false, criterionIds: [], mode: 'any' },
    },
  }
}

export const newAssignmentDraft = () => ({
  id: uid('asg'),
  title: '',
  content: '',
  gradeScaleId: null,
  rubricId: null,
  outcomes: '', // rich text, seeded from the chosen rubric and editable here
  rules: null,
  dueDate: '',
  points: 100,
  status: 'draft',
  submitted: false,
  step: 0, // wizard position (stripped on publish)
})

const emptySession = (assignmentId) => ({
  assignmentId,
  evaluation: {}, // { [criterionId]: { levelKey, points } }
  feedback: '',
  override: { bandId: null, reason: '' },
})

// --- Reducer ---------------------------------------------------------------

const upsert = (list, id, value) => list.map((x) => (x.id === id ? value : x))

function reducer(state, action) {
  switch (action.type) {
    // Navigation / role
    case 'NAVIGATE':
      return { ...state, route: { name: action.name, params: action.params ?? {} } }
    case 'SET_ROLE':
      return { ...state, role: action.role }

    // Grade scales
    case 'ADD_GRADE_SCALE':
      return { ...state, gradeScales: [...state.gradeScales, action.item] }
    case 'UPDATE_GRADE_SCALE':
      return { ...state, gradeScales: upsert(state.gradeScales, action.id, action.value) }
    case 'REMOVE_GRADE_SCALE':
      return { ...state, gradeScales: state.gradeScales.filter((s) => s.id !== action.id) }

    // Rubrics
    case 'ADD_RUBRIC':
      return { ...state, rubrics: [...state.rubrics, action.item] }
    case 'UPDATE_RUBRIC':
      return { ...state, rubrics: upsert(state.rubrics, action.id, action.value) }
    case 'REMOVE_RUBRIC':
      return { ...state, rubrics: state.rubrics.filter((r) => r.id !== action.id) }

    // Assignments
    case 'ADD_ASSIGNMENT':
      return { ...state, assignments: [...state.assignments, action.item] }
    case 'UPDATE_ASSIGNMENT':
      return { ...state, assignments: upsert(state.assignments, action.id, action.value) }
    case 'REMOVE_ASSIGNMENT':
      return { ...state, assignments: state.assignments.filter((a) => a.id !== action.id) }
    case 'SUBMIT_ASSIGNMENT':
      return {
        ...state,
        assignments: state.assignments.map((a) =>
          a.id === action.id ? { ...a, submitted: true } : a,
        ),
      }

    // Draft wizard
    case 'START_DRAFT':
      return { ...state, draft: action.draft }
    case 'SET_DRAFT_FIELD':
      return { ...state, draft: { ...state.draft, [action.key]: action.value } }
    case 'SET_DRAFT_STEP':
      return { ...state, draft: { ...state.draft, step: action.step } }
    case 'PUBLISH_DRAFT': {
      if (!state.draft) return state
      const { step: _step, ...rest } = state.draft
      const assignment = { ...rest, status: 'published' }
      const exists = state.assignments.some((a) => a.id === assignment.id)
      return {
        ...state,
        assignments: exists ? upsert(state.assignments, assignment.id, assignment) : [...state.assignments, assignment],
        draft: null,
      }
    }
    case 'DISCARD_DRAFT':
      return { ...state, draft: null }

    // Evaluation session
    case 'START_SESSION':
      return { ...state, session: emptySession(action.assignmentId) }
    case 'SET_SESSION_CRITERION':
      return {
        ...state,
        session: {
          ...state.session,
          evaluation: { ...state.session.evaluation, [action.criterionId]: action.value },
        },
      }
    case 'SET_SESSION_FEEDBACK':
      return { ...state, session: { ...state.session, feedback: action.feedback } }
    case 'SET_SESSION_OVERRIDE':
      return { ...state, session: { ...state.session, override: action.override } }
    case 'RESET_SESSION':
      return { ...state, session: emptySession(state.session?.assignmentId) }
    case 'END_SESSION':
      return { ...state, session: null }

    default:
      return state
  }
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const navigate = useCallback((name, params = {}) => dispatch({ type: 'NAVIGATE', name, params }), [])

  const value = useMemo(() => ({ state, dispatch, navigate }), [state, navigate])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
