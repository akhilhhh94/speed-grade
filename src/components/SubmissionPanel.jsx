import { sampleSubmission } from '../data/sampleData.js'

// Read-only student submission shown on the left of the evaluation page.
// Minimal by design: title + body text, with a light document chrome so it
// reads like the artefact a teacher is actually grading.
export default function SubmissionPanel() {
  const { student, title, body } = sampleSubmission
  const words = body.join(' ').trim().split(/\s+/).length

  return (
    <div className="lg:sticky lg:top-6 lg:self-start">
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
              {student.split(' ').map((n) => n[0]).join('')}
            </span>
            {student}'s submission
          </div>
          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate-400 ring-1 ring-slate-200">
            {words} words
          </span>
        </div>

        <article className="max-h-[70vh] overflow-y-auto px-6 py-5">
          <h3 className="mb-4 text-lg font-bold leading-snug text-slate-900">{title}</h3>
          <div className="space-y-3.5 text-sm leading-relaxed text-slate-600">
            {body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </article>
      </div>
    </div>
  )
}
