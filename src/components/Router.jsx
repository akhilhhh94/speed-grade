import { useEffect } from 'react'
import { useStore } from '../state/store.jsx'
import { EmptyState } from './ui.jsx'

// Instructor role
import DashboardPage from '../pages/DashboardPage.jsx'
import AssignmentsPage from '../pages/AssignmentsPage.jsx'
import AssignmentDetailInstructor from '../pages/AssignmentDetailInstructor.jsx'
import CreateAssignmentPage from '../pages/CreateAssignmentPage.jsx'
import EvaluatePage from '../pages/EvaluatePage.jsx'
import ResultPage from '../pages/ResultPage.jsx'
import GradeScalesPage from '../pages/GradeScalesPage.jsx'
import GradeScaleEditPage from '../pages/GradeScaleEditPage.jsx'
import RubricsPage from '../pages/RubricsPage.jsx'
import RubricEditPage from '../pages/RubricEditPage.jsx'

// Learner role
import LearnerDashboardPage from '../pages/LearnerDashboardPage.jsx'
import LearnerAssignmentsPage from '../pages/LearnerAssignmentsPage.jsx'
import AssignmentDetailLearner from '../pages/AssignmentDetailLearner.jsx'

// Routes the learner role must never reach.
const INSTRUCTOR_ONLY = new Set([
  'grade-scales',
  'grade-scale',
  'rubrics',
  'rubric',
  'assignment-new',
  'assignment-edit',
  'evaluate',
])

const PAGES = {
  dashboard: { instructor: DashboardPage, learner: LearnerDashboardPage },
  assignments: { instructor: AssignmentsPage, learner: LearnerAssignmentsPage },
  assignment: { instructor: AssignmentDetailInstructor, learner: AssignmentDetailLearner },
  'assignment-new': { instructor: CreateAssignmentPage },
  'assignment-edit': { instructor: CreateAssignmentPage },
  evaluate: { instructor: EvaluatePage },
  result: { instructor: ResultPage, learner: ResultPage },
  'grade-scales': { instructor: GradeScalesPage },
  'grade-scale': { instructor: GradeScaleEditPage },
  rubrics: { instructor: RubricsPage },
  rubric: { instructor: RubricEditPage },
}

export default function Router() {
  const { state, navigate } = useStore()
  const { route, role } = state

  // Guard: learners can't be on instructor-only routes.
  const blocked = role === 'learner' && INSTRUCTOR_ONLY.has(route.name)
  useEffect(() => {
    if (blocked) navigate('dashboard')
  }, [blocked, navigate])

  if (blocked) return null

  const entry = PAGES[route.name]
  const Page = entry?.[role]
  if (!Page) {
    return (
      <EmptyState
        icon="∅"
        title="Page not found"
        subtitle={`No “${route.name}” page for the ${role} role.`}
      />
    )
  }
  return <Page />
}
