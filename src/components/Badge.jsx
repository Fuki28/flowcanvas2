export function PriorityBadge({ prioridad }) {
  const dotColor = prioridad === 'alta' ? '#DC2626' : (prioridad === 'media' ? '#C2410C' : '#16A34A')
  return (
    <span className="badge-etapa" style={{
      background: dotColor + '1a',
      color: dotColor,
    }}>
      <span className="badge-dot" style={{ background: dotColor }} />
      {prioridad.charAt(0).toUpperCase() + prioridad.slice(1)}
    </span>
  )
}

export function EtapaBadge({ etapa }) {
  if (!etapa) return null
  return (
    <span className="badge-etapa" style={{
      background: etapa.color + '1a',
      color: etapa.color,
    }}>
      <span className="badge-dot" style={{ background: etapa.color }} />
      {etapa.nombre}
    </span>
  )
}

