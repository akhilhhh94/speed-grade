import Markdown from './Markdown.jsx'

// Read-only student submission. Takes the submission as a prop so the learner
// page and the evaluation screen can each pass their assignment's dummy work.
// Body is an array of paragraphs (markdown-capable).
export default function SubmissionPanel({ submission }) {
  if (!submission) return null
  const { student, title, body } = submission
  const text = body.join('\n\n')
  const words = body.join(' ').trim().split(/\s+/).length
  const initials = student.split(' ').map((n) => n[0]).join('')

  return (
    <div className="lg:sticky lg:top-6 lg:self-start">
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
              {initials}
            </span>
            {student}'s submission
          </div>
          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate-400 ring-1 ring-slate-200">
            {words} words
          </span>
        </div>

        <article className="max-h-[70vh] overflow-y-auto px-6 py-5">
          <h3 className="mb-4 text-lg font-bold leading-snug text-slate-900">{title}</h3>
          <Markdown className="leading-relaxed">{text}</Markdown>
        </article>
      </div>
    </div>
  )
}
