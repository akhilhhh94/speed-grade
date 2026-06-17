// ---------------------------------------------------------------------------
// Seed data for the LMS prototype.
//
// Everything here is editable from the UI at runtime; this is just the starting
// point so the app demos end-to-end immediately. State is in-memory only and
// re-seeds from this file on every reload (no persistence).
//
// IMPORTANT: the shapes the grading engine reads (bands, rubric.levels,
// rubric.criteria, rules) are kept identical to the original PoC so the engine
// in lib/calc.js stays untouched and reproduces its exact behavior.
//
// Rubric descriptor cells are plain text. Rich content (markdown + tables) lives
// in each rubric's `outcomes` field and in an assignment's `content`/`outcomes`.
// ---------------------------------------------------------------------------

let _id = 0
export const uid = (prefix = 'id') => `${prefix}_${++_id}`

// === Grade bands ===========================================================
export const defaultBands = [
  { id: 'band_a_plus', label: 'A+ · Excellent', min: 90, max: 100, isPass: true, color: 'emerald' },
  { id: 'band_a', label: 'A · Proficient', min: 75, max: 90, isPass: true, color: 'green' },
  { id: 'band_b', label: 'B · Satisfactory', min: 60, max: 75, isPass: true, color: 'lime' },
  { id: 'band_c', label: 'C · Developing', min: 50, max: 60, isPass: true, color: 'amber' },
  { id: 'band_f', label: 'F · Needs Resubmission', min: 0, max: 50, isPass: false, color: 'red' },
]

export const simpleBands = [
  { id: 'sb_a', label: 'A', min: 75, max: 100, isPass: true, color: 'emerald' },
  { id: 'sb_b', label: 'B', min: 50, max: 75, isPass: true, color: 'lime' },
  { id: 'sb_c', label: 'C', min: 0, max: 50, isPass: true, color: 'amber' },
]

// Vocational outcome grades (BTEC-style). The final grade is decided by a Grade
// Profile (counts of criteria per level) rather than the percentage. The % ranges
// only matter when no profile rule matches and the (configurable, default-on)
// weighted-average fallback is used — the ranges are tuned so sub-Pass work lands
// in "Fail".
export const vocationalBands = [
  { id: 'band_dist', label: 'Distinction', min: 80, max: 100, isPass: true, color: 'emerald' },
  { id: 'band_merit', label: 'Merit', min: 65, max: 80, isPass: true, color: 'green' },
  { id: 'band_pass', label: 'Pass', min: 50, max: 65, isPass: true, color: 'amber' },
  { id: 'band_fail', label: 'Fail', min: 0, max: 50, isPass: false, color: 'red' },
]

// === Rubric ================================================================
export const defaultLevels = [
  { key: 'excellent', label: 'Excellent (A)', points: 4 },
  { key: 'proficient', label: 'Proficient (B)', points: 3 },
  { key: 'developing', label: 'Developing (C)', points: 2 },
  { key: 'needs_improvement', label: 'Needs Improvement (F)', points: 1 },
]

// Criteria are the rows. `cells` holds plain-text descriptors per level.
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

export const labRubric = {
  name: 'Lab Report Rubric',
  levels: [
    { key: 'exemplary', label: 'Exemplary', points: 4 },
    { key: 'competent', label: 'Competent', points: 3 },
    { key: 'emerging', label: 'Emerging', points: 2 },
    { key: 'incomplete', label: 'Incomplete', points: 1 },
  ],
  criteria: [
    {
      id: 'crit_hypothesis',
      name: 'Hypothesis',
      weight: 1,
      cells: {
        exemplary: 'A testable, precisely worded hypothesis with a clear rationale.',
        competent: 'A testable hypothesis, though the rationale is thin.',
        emerging: 'A vague or only partially testable hypothesis.',
        incomplete: 'No identifiable hypothesis.',
      },
    },
    {
      id: 'crit_method',
      name: 'Method',
      weight: 2,
      cells: {
        exemplary: 'Procedure is reproducible, with variables identified and controls clearly justified. Steps are numbered and easy to follow.',
        competent: 'Procedure is mostly reproducible; minor gaps in controls.',
        emerging: 'Procedure has gaps that hinder reproducibility.',
        incomplete: 'Procedure is missing or unusable.',
      },
    },
    {
      id: 'crit_data',
      name: 'Data & Analysis',
      weight: 2,
      cells: {
        exemplary: 'Data is well organized with appropriate units, tables and correct analysis.',
        competent: 'Data is mostly organized; analysis has small errors.',
        emerging: 'Data is disorganized or analysis is superficial.',
        incomplete: 'Little to no usable data or analysis.',
      },
    },
    {
      id: 'crit_conclusion',
      name: 'Conclusion',
      weight: 1,
      cells: {
        exemplary: 'Conclusion is supported by the data and revisits the hypothesis.',
        competent: 'Conclusion is reasonable but only loosely tied to the data.',
        emerging: 'Conclusion is asserted without support.',
        incomplete: 'No conclusion provided.',
      },
    },
  ],
}

// Strategic Management — a vocational rubric whose final grade is decided by a
// Grade Profile (see the rules below), not by the weighted percentage.
export const strategicRubric = {
  name: 'Strategic Management',
  levels: [
    { key: 'distinction', label: 'Distinction', points: 4 },
    { key: 'merit', label: 'Merit', points: 3 },
    { key: 'pass', label: 'Pass', points: 2 },
    { key: 'fail', label: 'Fail', points: 1 },
  ],
  criteria: [
    {
      id: 'crit_knowledge',
      name: 'Knowledge of Strategic Management',
      weight: 1,
      cells: {
        distinction: 'Comprehensive, accurate command of strategic concepts, models and theory, applied with insight.',
        merit: 'Sound knowledge of the key concepts and models, with minor gaps.',
        pass: 'Adequate grasp of core concepts; understanding is mostly descriptive.',
        fail: 'Concepts are largely absent, inaccurate or misunderstood.',
      },
    },
    {
      id: 'crit_application',
      name: 'Application and Analysis',
      weight: 1,
      cells: {
        distinction: 'Models are applied rigorously to the case; analysis is incisive and well evidenced.',
        merit: 'Models are applied correctly with generally sound analysis.',
        pass: 'Some application of models; analysis is basic or partly descriptive.',
        fail: 'Little or no application; analysis is missing or irrelevant.',
      },
    },
    {
      id: 'crit_evaluation',
      name: 'Strategic Evaluation',
      weight: 1,
      cells: {
        distinction: 'Balanced, critical evaluation of options leading to justified, well-reasoned recommendations.',
        merit: 'Reasoned evaluation of options with mostly justified conclusions.',
        pass: 'Limited evaluation; conclusions are asserted rather than justified.',
        fail: 'No meaningful evaluation; conclusions absent or unsupported.',
      },
    },
    {
      id: 'crit_originality',
      name: 'Originality of Thought',
      weight: 1,
      cells: {
        distinction: 'Independent, creative thinking that goes well beyond the source material.',
        merit: 'Some original insight beyond the taught material.',
        pass: 'Largely derivative; occasional independent thought.',
        fail: 'No originality; wholly reproduces source material.',
      },
    },
    {
      id: 'crit_persuasion',
      name: 'Persuasion',
      weight: 1,
      cells: {
        distinction: 'Compelling, coherent argument that persuades the reader throughout.',
        merit: 'Clear and mostly convincing argument.',
        pass: 'Argument is present but uneven or only partly convincing.',
        fail: 'Argument is unclear, contradictory or absent.',
      },
    },
    {
      id: 'crit_presentation',
      name: 'Quality of Presentation and Referencing',
      weight: 1,
      cells: {
        distinction: 'Polished, well-structured presentation with flawless, consistent referencing.',
        merit: 'Well presented with accurate referencing; minor lapses only.',
        pass: 'Acceptable presentation; referencing is inconsistent or incomplete.',
        fail: 'Poorly presented; referencing largely missing or incorrect.',
      },
    },
  ],
}

// The overall-assessment rules, expressed as a Grade Profile. Checked top → bottom;
// the first rule whose conditions all hold sets the final grade. Each rule awards a
// band of the Vocational scale; each is a "primary" requirement + an optional floor.
// "Fail" is not a rule — it falls out of the weighted-average band when nothing matches.
const strategicProfileOverrides = [
  {
    id: 'ov_dist',
    targetBandId: 'band_dist',
    conditions: [
      { id: 'c_d1', quantifier: 'atLeast', count: 4, matcher: 'reach', levelKey: 'distinction' },
      { id: 'c_d2', quantifier: 'atMost', count: 0, matcher: 'below', levelKey: 'merit' },
    ],
  },
  {
    id: 'ov_merit',
    targetBandId: 'band_merit',
    conditions: [
      { id: 'c_m1', quantifier: 'atLeast', count: 4, matcher: 'reach', levelKey: 'merit' },
      { id: 'c_m2', quantifier: 'atMost', count: 0, matcher: 'below', levelKey: 'pass' },
    ],
  },
  {
    id: 'ov_pass',
    targetBandId: 'band_pass',
    conditions: [{ id: 'c_p1', quantifier: 'atLeast', count: 6, matcher: 'reach', levelKey: 'pass' }],
  },
]

// One band-ful profile, used on both the rubric (which now carries a grade scale)
// and the assignment using the same scale, so the rules carry over 1:1.
export const strategicRules = {
  mode: 'profile',
  passLevelKey: 'pass',
  gate: { enabled: false },
  guarantee: { enabled: false, criterionIds: [], mode: 'any', minBandId: 'band_pass' },
  profile: { overrides: strategicProfileOverrides },
}

// === Grade rules ===========================================================
// Used when Pass/Fail grading is enabled. This is the assignment-level shape
// (includes the guarantee's minimum band). Rubrics carry a band-less version.
export const defaultRules = {
  passLevelKey: 'developing', // a criterion passes at >= "Developing"
  gate: { enabled: true }, // every criterion must pass, otherwise resubmission
  guarantee: {
    enabled: true,
    criterionIds: ['crit_thesis'], // key criteria whose passing locks a minimum grade
    mode: 'any', // 'all' | 'any' of the selected must pass
    minBandId: 'band_b', // …guarantee at least a "B"
  },
}

// === Rubric outcomes (rich text) ===========================================
const essayOutcomes = `## What this assesses

By completing this assignment you will:

- **Construct an argument** — state and sustain a clear, defensible thesis.
- **Reason with evidence** — integrate credible sources to support each claim.
- **Communicate clearly** — write with correct grammar, mechanics and academic tone.

| Outcome | Demonstrated by |
| --- | --- |
| Critical thinking | A sustained, evidence-backed argument |
| Academic integrity | Accurate citations in a consistent style |
| Written communication | Clear, well-structured, error-free prose |`

const labOutcomes = `## What this assesses

- **Design an investigation** — frame a testable hypothesis with a clear rationale.
- **Work methodically** — follow a reproducible procedure with justified controls.
- **Analyze data** — organize results and draw a supported conclusion.

| Skill | Evidence |
| --- | --- |
| Scientific inquiry | A testable hypothesis and a sound method |
| Data analysis | Correctly analyzed, well-presented data |`

const strategicOutcomes = `## What this assesses

This unit is graded by a **grade profile** — your overall grade depends on how many
criteria reach each level, not on an average score.

- **Distinction** — achieve Distinction in at least 4 of the 6 criteria, with no criterion
  below Merit (so at most 2 criteria may be at Merit).
- **Merit** — reach at least Merit in at least 4 criteria, with no criterion below Pass
  (so at most 2 criteria may be at Pass).
- **Pass** — reach at least Pass in every criterion.
- **Fail** — the evidence does not meet a Pass in every criterion.

| Outcome | Demonstrated by |
| --- | --- |
| Strategic knowledge | Accurate use of models and theory |
| Critical evaluation | Justified, well-reasoned recommendations |
| Professional communication | Persuasive, well-presented, properly referenced work |`

// === Global libraries (seeded) =============================================
export const defaultGradeScales = [
  { id: 'gs_letter', name: 'Letter Grade (Pass/Fail)', passFailEnabled: true, bands: defaultBands },
  { id: 'gs_simple', name: 'Percentage (Simple)', passFailEnabled: false, bands: simpleBands },
  { id: 'gs_vocational', name: 'Vocational (Distinction / Merit / Pass / Fail)', passFailEnabled: true, bands: vocationalBands },
]

export const defaultRubrics = [
  {
    id: 'rub_essay',
    name: defaultRubric.name,
    levels: defaultRubric.levels,
    criteria: defaultRubric.criteria,
    outcomes: essayOutcomes,
    // Band-less rules — the guarantee's minimum band is chosen on the assignment.
    rules: {
      passLevelKey: 'developing',
      gate: { enabled: true },
      guarantee: { enabled: true, criterionIds: ['crit_thesis'], mode: 'any' },
    },
  },
  {
    id: 'rub_lab',
    name: labRubric.name,
    levels: labRubric.levels,
    criteria: labRubric.criteria,
    outcomes: labOutcomes,
    rules: {
      passLevelKey: 'emerging',
      gate: { enabled: true },
      guarantee: { enabled: false, criterionIds: [], mode: 'any' },
    },
  },
  {
    id: 'rub_strategic',
    name: strategicRubric.name,
    levels: strategicRubric.levels,
    criteria: strategicRubric.criteria,
    outcomes: strategicOutcomes,
    // Optional grade scale on the rubric — unlocks Grade Profile rules that target
    // real bands. The assignment may still choose its own scale (project priority).
    gradeScaleId: 'gs_vocational',
    rules: strategicRules,
  },
]

// === Assignments (reference library items by id) ===========================
const essayContent = `## Overview

Write a **5-paragraph argumentative essay** taking a clear position on the prompt below. Your essay should make a defensible claim and support it with credible evidence.

> **Prompt:** Should standardized testing determine academic success?

## Requirements

- 800–1,200 words
- At least **three** credible sources, cited in APA or MLA
- A clear thesis stated in the introduction
- A counter-argument addressed before your conclusion

## Submission checklist

| Item | Required |
| --- | --- |
| Thesis statement | Yes |
| 3+ cited sources | Yes |
| Reference list | Yes |
| Word count 800–1,200 | Yes |`

const labContent = `## Lab Report — Reaction Rate & Temperature

Investigate how temperature affects the rate of a chemical reaction and report your findings.

## Sections to include

1. **Hypothesis** — a testable prediction with rationale
2. **Method** — reproducible procedure with controls
3. **Data & Analysis** — tables, units, and analysis
4. **Conclusion** — tied back to your hypothesis

Submit a single PDF. Raw data tables may be included in an appendix.`

const strategicContent = `## Strategic Management — Case Study Report

Analyse the strategic position of the organisation in the case study and recommend a
future strategy. Your report is assessed against six criteria and graded by a **grade
profile** (Distinction / Merit / Pass / Fail).

## Sections to include

1. **Strategic analysis** — apply relevant models (e.g. PESTEL, Porter's Five Forces, VRIO).
2. **Evaluation of options** — generate and critically evaluate realistic strategic options.
3. **Recommendation** — a justified, well-reasoned recommendation.

## How it is graded

| Overall grade | Requirement |
| --- | --- |
| Distinction | Distinction in ≥ 4 criteria; none below Merit |
| Merit | Merit or better in ≥ 4 criteria; none below Pass |
| Pass | At least a Pass in every criterion |
| Fail | Does not meet a Pass in every criterion |`

export const defaultAssignments = [
  {
    id: 'asg_essay',
    title: 'Argumentative Essay #1042',
    content: essayContent,
    gradeScaleId: 'gs_letter',
    rubricId: 'rub_essay',
    outcomes: essayOutcomes,
    dueDate: '2026-06-24',
    points: 100,
    status: 'published',
    submitted: false,
  },
  {
    id: 'asg_lab',
    title: 'Chemistry Lab Report',
    content: labContent,
    gradeScaleId: 'gs_simple',
    rubricId: 'rub_lab',
    outcomes: labOutcomes,
    dueDate: '2026-06-30',
    points: 60,
    status: 'published',
    submitted: false,
  },
  {
    id: 'asg_strategic',
    title: 'Strategic Management — Case Study Report',
    content: strategicContent,
    gradeScaleId: 'gs_vocational',
    rubricId: 'rub_strategic',
    outcomes: strategicOutcomes,
    dueDate: '2026-07-05',
    points: 100,
    status: 'published',
    submitted: false,
  },
  {
    id: 'asg_draft',
    title: 'Poetry Analysis (draft)',
    content: '## Poetry Analysis\n\nAnalyze the imagery and tone of the assigned poem.',
    gradeScaleId: 'gs_letter',
    rubricId: 'rub_essay',
    outcomes: essayOutcomes,
    dueDate: '2026-07-10',
    points: 100,
    status: 'draft',
    submitted: false,
  },
]

// === Dummy student submissions =============================================
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

const labSubmission = {
  student: 'Riley Chen',
  title: 'Effect of Temperature on Reaction Rate',
  body: [
    'Hypothesis: Increasing the temperature of the reactants will increase the reaction rate, because higher temperatures raise the average kinetic energy of the particles and therefore the frequency of effective collisions.',
    'Method: Sodium thiosulfate and hydrochloric acid were combined at five temperatures (10, 20, 30, 40, 50 °C). The independent variable was temperature; the dependent variable was the time for the solution to obscure a marked cross. Concentration and volume were held constant as controls. Each temperature was repeated three times and averaged.',
    'Data & Analysis: Reaction time fell from 64 s at 10 °C to 11 s at 50 °C. Plotting rate (1/time) against temperature produced a clear positive, roughly exponential trend, consistent with collision theory. Minor scatter at 30 °C is attributed to a delayed start of timing.',
    'Conclusion: The data supports the hypothesis — reaction rate increased with temperature across the tested range. A useful extension would be to measure the rate at narrower intervals to estimate the activation energy.',
  ],
}

const strategicSubmission = {
  student: 'Morgan Ellis',
  title: 'Strategic Review & Future Direction — NorthAxis Logistics',
  body: [
    'Strategic position: A PESTEL scan highlights tightening emissions regulation and volatile fuel costs as the dominant external pressures, while Porter’s Five Forces shows intense rivalry among regional carriers and rising buyer power from large e-commerce clients. A VRIO assessment identifies NorthAxis’s integrated tracking platform as a rare, hard-to-imitate resource that underpins a temporary competitive advantage.',
    'Analysis: Mapping the platform capability against the competitive forces shows it chiefly neutralises buyer power by raising switching costs, but does little to offset the cost pressure from fuel and compliance. The firm’s thin operating margin leaves limited slack to absorb a regulatory shock, so the analysis points to a strategy that monetises the platform advantage while structurally lowering the cost base.',
    'Evaluation of options: Three options were generated — (a) organic expansion into adjacent last-mile delivery, (b) a horizontal alliance with a rail freight operator to cut long-haul emissions and cost, and (c) licensing the tracking platform to smaller carriers. Each was weighed on strategic fit, financial feasibility and risk. Option (b) scores highest: it addresses the two dominant external pressures simultaneously, though it carries partner-dependency risk that must be managed contractually.',
    'Recommendation: Pursue the rail-freight alliance as the primary strategy, with platform licensing (option c) as a complementary revenue stream that exploits the existing capability at low marginal cost. A staged rollout with clear exit clauses mitigates partner risk. This combination defends the current advantage, diversifies revenue, and positions NorthAxis ahead of the emissions regulation curve.',
  ],
}

const submissionsById = {
  asg_essay: sampleSubmission,
  asg_lab: labSubmission,
  asg_strategic: strategicSubmission,
  asg_draft: sampleSubmission,
}

// Return the dummy submission for an assignment (falls back to the essay).
export const submissionFor = (assignmentId) => submissionsById[assignmentId] ?? sampleSubmission
