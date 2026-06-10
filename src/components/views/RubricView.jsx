import { pointsRange } from '../../lib/calc.js'

// Read-only rubric grid with plain-text descriptor cells. Used on the learner
// assignment page and anywhere a non-editable rubric needs to be shown.
export default function RubricView({ rubric }) {
  if (!rubric) return null
  return (
    <div className="overflow-x-auto rounded-2xl ring-1 ring-slate-200">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 w-44 min-w-44 bg-slate-50 p-3 text-left align-bottom">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Criteria</span>
            </th>
            {rubric.levels.map((lvl) => {
              const r = pointsRange(lvl)
              const pts = r.min === r.max ? `${r.max}` : `${r.min}–${r.max}`
              return (
                <th key={lvl.key} className="min-w-52 border-l border-slate-100 bg-slate-50 p-3 text-left align-bottom">
                  <span className="block text-sm font-semibold text-slate-800">{lvl.label}</span>
                  <span className="text-xs font-normal text-slate-400">{pts} pts</span>
                </th>
              )
            })}
            <th className="w-20 min-w-20 border-l border-slate-100 bg-slate-50 p-3 text-left align-bottom text-xs font-semibold uppercase tracking-wide text-slate-500">
              Weight
            </th>
          </tr>
        </thead>
        <tbody>
          {rubric.criteria.map((c) => (
            <tr key={c.id} className="align-top">
              <td className="sticky left-0 z-10 border-t border-slate-100 bg-white p-3 text-sm font-semibold text-slate-800">
                {c.name}
              </td>
              {rubric.levels.map((lvl) => (
                <td key={lvl.key} className="border-l border-t border-slate-100 p-3">
                  <p className="text-xs leading-relaxed whitespace-pre-wrap text-slate-600">{c.cells[lvl.key] ?? ''}</p>
                </td>
              ))}
              <td className="border-l border-t border-slate-100 p-3 text-center text-sm text-slate-500">×{c.weight}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
