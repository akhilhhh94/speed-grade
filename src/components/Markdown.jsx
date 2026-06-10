import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Rich-content renderer for author-supplied markdown (assignment instructions,
// rubric descriptor cells, sample submissions). Supports GFM — notably tables —
// via remark-gfm. react-markdown renders to a React element tree (no
// dangerouslySetInnerHTML), so raw HTML in the source is not executed.
//
// Tailwind v4 ships no element defaults, so every tag is styled explicitly with
// literal class strings (also keeps us compliant with the no-dynamic-class rule).

const COMPONENTS = {
  h1: ({ children }) => <h1 className="mt-4 mb-2 text-lg font-bold text-slate-900 first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-4 mb-2 text-base font-bold text-slate-900 first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-3 mb-1.5 text-sm font-bold text-slate-800 first:mt-0">{children}</h3>,
  p: ({ children }) => <p className="my-2 leading-relaxed first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5 first:mt-0 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5 first:mt-0 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer" className="font-medium text-indigo-600 underline underline-offset-2 hover:text-indigo-700">
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-indigo-200 pl-3 text-slate-500 italic">{children}</blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] text-slate-700">{children}</code>
  ),
  hr: () => <hr className="my-4 border-slate-200" />,
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto first:mt-0 last:mb-0">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-slate-50">{children}</thead>,
  th: ({ children }) => (
    <th className="border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="border border-slate-200 px-3 py-2 align-top text-slate-600">{children}</td>,
}

export default function Markdown({ children, className = '' }) {
  if (!children) return null
  return (
    <div className={`text-sm text-slate-600 ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
