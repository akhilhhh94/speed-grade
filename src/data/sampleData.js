// ---------------------------------------------------------------------------
// Seed data for the proof-of-concept.
//
// Everything here is fully editable from the UI at runtime; this is just the
// starting point so a teacher can jump straight to evaluating a submission and
// immediately see the concept working end-to-end.
// ---------------------------------------------------------------------------

let _id = 0
export const uid = (prefix = 'id') => `${prefix}_${++_id}`

// --- Grade bands (Step 1) --------------------------------------------------
// A band owns a percentage range [min, max], a fully custom label, and a
// pass/fail flag. `color` is just a visual swatch token. Selection at runtime
// uses `min` only (highest matching band wins) so contiguous bands never clash.
export const defaultBands = [
  { id: 'band_a_plus', label: 'A+ · Excellent', min: 90, max: 100, isPass: true, color: 'emerald' },
  { id: 'band_a', label: 'A · Proficient', min: 75, max: 90, isPass: true, color: 'green' },
  { id: 'band_b', label: 'B · Satisfactory', min: 60, max: 75, isPass: true, color: 'lime' },
  { id: 'band_c', label: 'C · Developing', min: 50, max: 60, isPass: true, color: 'amber' },
  { id: 'band_f', label: 'F · Needs Resubmission', min: 0, max: 50, isPass: false, color: 'red' },
]

// --- Rubric (Step 2) -------------------------------------------------------
// Performance levels are the shared columns. Each level carries `points` which
// is either a single number OR a { min, max } range. When a level is a range,
// the teacher fine-tunes the exact points with a slider during evaluation.
export const defaultLevels = [
  { key: 'excellent', label: 'Excellent (A)', points: 4 },
  { key: 'proficient', label: 'Proficient (B)', points: 3 },
  { key: 'developing', label: 'Developing (C)', points: 2 },
  { key: 'needs_improvement', label: 'Needs Improvement (F)', points: 1 },
]

// Criteria are the rows. `cells` holds the descriptor text per level. `weight`
// scales a criterion's contribution to the final score.
export const defaultRubric = {
  name: 'Argumentative Essay Rubric',
  levels: defaultLevels,
  criteria: [
    {
      id: 'crit_thesis',
      name: 'Thesis & Argument',
      weight: 1,
      cells: {
        excellent: 'Central argument is clear, compelling, and fully sustained throughout the paper.',
        proficient: 'Central argument is clear but may lack depth in certain areas.',
        developing: 'Argument is present but frequently wanders or lacks focus.',
        needs_improvement: 'No clear argument or central thesis established.',
      },
    },
    {
      id: 'crit_evidence',
      name: 'Evidence & Analysis',
      weight: 1,
      cells: {
        excellent: 'Sources are seamlessly integrated; analysis goes beyond summary to prove the thesis.',
        proficient: 'Evidence supports claims, but analysis is occasionally superficial.',
        developing: 'Evidence is weak, generalized, or improperly connected to claims.',
        needs_improvement: 'Uses few to no relevant sources; relies entirely on unsupported opinion.',
      },
    },
    {
      id: 'crit_citations',
      name: 'Citations & Formatting',
      weight: 1,
      cells: {
        excellent: 'Flawless adherence to citation style (e.g., APA/MLA). In-text citations and reference list match perfectly.',
        proficient: 'Citation style is correct, with only minor formatting inconsistencies.',
        developing: 'Citations are formatted inconsistently or some sources are missing.',
        needs_improvement: 'Fails to cite sources; severe lack of academic integrity.',
      },
    },
    {
      id: 'crit_grammar',
      name: 'Grammar & Mechanics',
      weight: 1,
      cells: {
        excellent: 'Writing is flawless, with varied sentence structure and professional vocabulary.',
        proficient: 'Generally clear writing with only minor, infrequent grammatical errors.',
        developing: 'Noticeable errors in spelling, grammar, or punctuation impede readability.',
        needs_improvement: 'Unacceptable level of errors; severely distracts from the content.',
      },
    },
  ],
}

// --- Grade rules (Step 2) --------------------------------------------------
// Only used when Pass/Fail grading is enabled (top-level toggle). A single
// shared definition of "a passing criterion" drives two optional rules:
//
// passLevelKey – a criterion PASSES when it reaches at least this level.
// gate         – every criterion must pass; if any fails, the submission is
//                forced to the lowest fail band (resubmission).
// guarantee    – if ANY/ALL (per `mode`) of the selected criteria PASS, guarantee
//                a minimum grade of `minBandId` (a higher computed grade still wins).
export const defaultRules = {
  passLevelKey: 'developing', // a criterion passes at >= "Developing"
  gate: {
    enabled: true, // every criterion must pass, otherwise resubmission
  },
  guarantee: {
    enabled: true,
    criterionIds: ['crit_thesis'], // key criteria whose passing locks a minimum grade
    mode: 'any', // 'all' | 'any' of the selected must pass
    minBandId: 'band_b', // …guarantee at least a "B"
  },
}

// --- Dummy student submission (shown on the evaluation page) ----------------
export const sampleSubmission = {
  student: 'Jordan Avery',
  title: 'Should Standardized Testing Determine Academic Success?',
  body: [
    'Standardized testing has long been treated as the definitive yardstick of academic ability, yet this assumption deserves serious scrutiny. While such tests offer a convenient, scalable way to compare students, reducing a learner’s worth to a single score misrepresents the breadth of human intelligence and undermines genuine education.',
    'Proponents argue that standardized tests provide objectivity. A multiple-choice exam, after all, is graded identically for every student. However, objectivity in scoring is not the same as fairness in measurement. Research consistently shows that test performance correlates strongly with family income and access to preparation resources, meaning the "objective" score often measures privilege as much as aptitude.',
    'Furthermore, an overreliance on testing distorts what happens in the classroom. When results carry high stakes, instruction narrows to what can be tested: teachers "teach to the test," and subjects such as art, critical discussion, and creative problem-solving are pushed aside. The very skills most valued in the modern workforce are the ones standardized exams are least able to capture.',
    'This is not to say that assessment has no place. Well-designed rubrics, portfolios, and project-based evaluation can capture depth that a timed exam cannot, rewarding reasoning and revision rather than recall alone. A balanced system uses tests as one signal among many, not as the sole gatekeeper of opportunity.',
    'In conclusion, standardized testing should inform, not define, academic success. Treating a single number as the measure of a student’s potential is both statistically fragile and ethically questionable. A fairer model evaluates learners across multiple, authentic dimensions — exactly the kind of holistic judgment a thoughtful rubric is designed to support.',
  ],
}
