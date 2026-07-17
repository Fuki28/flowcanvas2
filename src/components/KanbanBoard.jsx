import { useNavigate } from 'react-router-dom'
import { Plus, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { PriorityBadge } from './Badge.jsx'

function KanbanCard({ trabajo, etapas, onMove, etapaIndex, totalEtapas }) {
  const navigate = useNavigate()

  const formatDate = (d) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })
  }

  const etapa = etapas.find(e => e.id === trabajo.etapa_id)
  const borderColor = etapa?.color || '#E8ECF4'

  return (
    <div
      className="kanban-card"
      style={{ borderLeftColor: borderColor }}
      onClick={() => navigate(`/trabajos/${trabajo.id}`)}
    >
      <div className="kanban-card-title">{trabajo.nombre}</div>
      <div className="kanban-card-client">
        {trabajo.clientes?.nombre || 'Sin cliente'}
      </div>
      <PriorityBadge prioridad={trabajo.prioridad} />
      <div className="kanban-card-footer">
        <div className="kanban-card-date" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Calendar size={10} />
          {formatDate(trabajo.created_at)}
        </div>
        <div className="kanban-card-actions" onClick={e => e.stopPropagation()}>
          <button
            className="kanban-card-mv"
            disabled={etapaIndex === 0}
            onClick={() => onMove(trabajo, -1)}
            title="Mover a etapa anterior"
          >‹</button>
          <button
            className="kanban-card-mv"
            disabled={etapaIndex === totalEtapas - 1}
            onClick={() => onMove(trabajo, 1)}
            title="Mover a siguiente etapa"
          >›</button>
        </div>
      </div>
    </div>
  )
}

export function KanbanBoard({ etapas, trabajos, onMove, onAddWork }) {
  return (
    <div className="kanban-board">
      {etapas.map((etapa, etapaIndex) => {
        const cols = trabajos.filter(t => t.etapa_id === etapa.id)
        return (
          <div key={etapa.id} className="kanban-col">
            <div className="kanban-col-header">
              <div className="kanban-col-title">
                <span className="kanban-col-dot" style={{ background: etapa.color }} />
                {etapa.nombre}
              </div>
              <span className="kanban-col-count">{cols.length}</span>
            </div>

            {cols.map(trabajo => (
              <KanbanCard
                key={trabajo.id}
                trabajo={trabajo}
                etapas={etapas}
                etapaIndex={etapaIndex}
                totalEtapas={etapas.length}
                onMove={onMove}
              />
            ))}

            <button className="kanban-add-btn" onClick={() => onAddWork(etapa.id)}>
              <Plus size={13} />
              Agregar trabajo
            </button>
          </div>
        )
      })}
    </div>
  )
}
