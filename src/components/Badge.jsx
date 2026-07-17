export function PriorityBadge({ prioridad }) {
  return (
    <span className={`badge badge-${prioridad}`}>
      {prioridad.charAt(0).toUpperCase() + prioridad.slice(1)}
    </span>
  )
}

export function EtapaBadge({ etapa }) {
  if (!etapa) return null
  return (
    <span className="badge" style={{
      background: etapa.color + '22',
      color: etapa.color,
    }}>
      <span className="badge-dot" style={{ background: etapa.color }} />
      {etapa.nombre}
    </span>
  )
}
