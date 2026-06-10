// Small shared UI primitives + the band colour palette.
// NOTE: colour classes are written as complete literal strings so Tailwind's
// scanner picks them up (dynamically-built class names would be purged).

export const BAND_COLORS = {
  emerald: { dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700 ring-emerald-200', bar: 'bg-emerald-500' },
  green: { dot: 'bg-green-500', pill: 'bg-green-50 text-green-700 ring-green-200', bar: 'bg-green-500' },
  lime: { dot: 'bg-lime-500', pill: 'bg-lime-50 text-lime-700 ring-lime-200', bar: 'bg-lime-500' },
  amber: { dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-700 ring-amber-200', bar: 'bg-amber-500' },
  red: { dot: 'bg-red-500', pill: 'bg-red-50 text-red-700 ring-red-200', bar: 'bg-red-500' },
  slate: { dot: 'bg-slate-400', pill: 'bg-slate-100 text-slate-600 ring-slate-200', bar: 'bg-slate-400' },
}

export const colorOf = (token) => BAND_COLORS[token] ?? BAND_COLORS.slate

export function Card({ title, subtitle, children, className = '' }) {
  return (
    <section className={`rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 ${className}`}>
      {(title || subtitle) && (
        <header className="border-b border-slate-100 px-6 py-4">
          {title && <h2 className="text-lg font-semibold text-slate-900">{title}</h2>}
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </header>
      )}
      <div className="px-6 py-5">{children}</div>
    </section>
  )
}

export function BandPill({ band, className = '' }) {
  if (!band) return null
  const c = colorOf(band.color)
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${c.pill} ${className}`}>
      <span className={`h-2 w-2 rounded-full ${c.dot}`} />
      {band.label}
    </span>
  )
}

export function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              active
                ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 select-none">
      <span
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-indigo-600' : 'bg-slate-300'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`}
        />
      </span>
      {label && <span className="text-sm text-slate-700">{label}</span>}
    </label>
  )
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
    ghost: 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50',
    subtle: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    danger: 'bg-red-50 text-red-600 ring-1 ring-red-200 hover:bg-red-100',
  }
  return (
    <button
      className={`rounded-xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

// --- Form & layout primitives ----------------------------------------------

const BADGE_TONES = {
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
}

export function Badge({ children, tone = 'slate', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${BADGE_TONES[tone] ?? BADGE_TONES.slate} ${className}`}>
      {children}
    </span>
  )
}

export function Field({ label, hint, required, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="mb-1 block text-xs font-medium text-slate-500">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </span>
      )}
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  )
}

const inputBase =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100'

export function TextInput({ className = '', ...props }) {
  return <input className={`${inputBase} ${className}`} {...props} />
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={`${inputBase} resize-y leading-relaxed ${className}`} {...props} />
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`${inputBase} ${className}`} {...props}>
      {children}
    </select>
  )
}

export function EmptyState({ icon = '—', title, subtitle, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-400">
        {icon}
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {subtitle && <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
