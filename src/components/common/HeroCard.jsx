export default function HeroCard({
  eyebrow,
  title,
  subtitle,
  right,
  footer,
  onClick,
  children
}) {
  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      onClick={onClick}
      className="relative w-full rounded-3xl p-5 overflow-hidden text-left active:scale-[0.99] transition"
      style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #1d4ed8 100%)',
        boxShadow: '0 8px 32px rgba(37, 99, 235, 0.35)'
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {eyebrow && (
            <p
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: 'rgba(255,255,255,0.85)' }}
            >
              {eyebrow}
            </p>
          )}

          {title && (
            <h2 className="text-white text-xl font-display mt-1 leading-tight">
              {title}
            </h2>
          )}

          {subtitle && (
            <p
              className="text-xs mt-1"
              style={{ color: 'rgba(255,255,255,0.75)' }}
            >
              {subtitle}
            </p>
          )}

          {children}
        </div>

        {right && <div className="shrink-0">{right}</div>}
      </div>

      {footer && <div className="mt-4">{footer}</div>}
    </Tag>
  )
}

export function HeroIcon({ icon: Icon }) {
  return (
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center"
      style={{
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 0 24px rgba(255,255,255,0.25)'
      }}
    >
      <Icon size={24} className="text-white" strokeWidth={2} />
    </div>
  )
}

export function HeroStat({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={14} className="text-white" />
      <span className="text-xs font-medium text-white">{label}</span>
    </div>
  )
}