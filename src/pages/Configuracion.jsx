import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Sidebar } from '../components/Sidebar.jsx'
import { Topbar } from '../components/Topbar.jsx'
import { Modal } from '../components/Modal.jsx'
import { ToastContainer } from '../components/Toast.jsx'
import { useToast } from '../hooks/useToast.js'

const COLORS = ['#6B5CE7','#F5A623','#3B82F6','#22C55E','#EF4444','#9B59B6','#4ECDC4','#E8664A','#1E2235','#F59E0B']

function EtapaModal({ etapa, onClose, onSaved }) {
  const [nombre, setNombre] = useState(etapa?.nombre || '')
  const [color,  setColor]  = useState(etapa?.color  || COLORS[0])
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!nombre.trim()) return
    setLoading(true)
    if (etapa?.id) {
      await supabase.from('etapas').update({ nombre: nombre.trim(), color }).eq('id', etapa.id)
    } else {
      const { data: last } = await supabase.from('etapas').select('orden').order('orden', { ascending: false }).limit(1).single()
      const orden = (last?.orden ?? -1) + 1
      await supabase.from('etapas').insert([{ nombre: nombre.trim(), color, orden }])
    }
    setLoading(false)
    onSaved()
  }

  return (
    <Modal
      title={etapa?.id ? 'Editar etapa' : 'Nueva etapa'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading || !nombre.trim()}>
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="field">
          <label>Nombre de la etapa</label>
          <input className="input" placeholder="Ej: Revisión" value={nombre} onChange={e => setNombre(e.target.value)} />
        </div>
        <div className="field">
          <label>Color</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            {COLORS.map(c => (
              <div key={c} onClick={() => setColor(c)} style={{
                width: 28, height: 28, borderRadius: '50%', background: c,
                cursor: 'pointer', border: color === c ? '3px solid #1E2235' : '2px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'transform 0.1s',
              }}>
                {color === c && <Check size={12} color="#fff" />}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: color + '18', borderRadius: 8, border: `1.5px solid ${color}` }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
          <span style={{ fontSize: 13, fontWeight: 500, color }}>{nombre || 'Vista previa'}</span>
        </div>
      </div>
    </Modal>
  )
}

function KanbanPreviewLive({ etapas }) {
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
      {etapas.map(e => (
        <div key={e.id} style={{ minWidth: 130, borderRadius: 8, overflow: 'hidden', border: '1px solid #E8ECF4' }}>
          <div style={{ background: e.color, padding: '7px 10px', fontSize: 10, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }} />
            {e.nombre}
          </div>
          <div style={{ padding: 8, background: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[0.7, 0.5].map((w, i) => (
              <div key={i} style={{ background: '#E8ECF4', borderRadius: 4, height: 28, width: `${w * 100}%` }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function Configuracion() {
  const [etapas,   setEtapas]   = useState([])
  const [user,     setUser]     = useState(null)
  const [modal,    setModal]    = useState(false)
  const [editEtapa,setEditEtapa]= useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { toasts, showToast, removeToast } = useToast()

  const loadEtapas = useCallback(async () => {
    const { data } = await supabase.from('etapas').select('*').order('orden')
    setEtapas(data || [])
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    loadEtapas()
  }, [loadEtapas])

  const openNew  = () => { setEditEtapa(null); setModal(true) }
  const openEdit = (e) => { setEditEtapa(e);   setModal(true) }

  const handleSaved = () => {
    setModal(false)
    loadEtapas()
    showToast('Etapa guardada', 'success')
  }

  const handleDelete = async () => {
    await supabase.from('etapas').delete().eq('id', deleteId)
    setDeleteId(null)
    loadEtapas()
    showToast('Etapa eliminada', 'info')
  }

  return (
    <div className="app-layout">
      <div className="sidebar-overlay" style={{ display: mobileOpen ? 'block' : 'none' }} onClick={() => setMobileOpen(false)} />
      <Sidebar etapas={etapas} user={user} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="main-content">
        <Topbar title="Configuración" subtitle="Adapta FlowCanvas a tu empresa." onMenuClick={() => setMobileOpen(true)} />
        <div className="page-body">
          <div className="config-layout">
            {/* Izquierda: lista de etapas */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: 15, fontWeight: 600 }}>Etapas del flujo</h2>
                <button className="btn btn-primary btn-sm" onClick={openNew}>
                  <Plus size={13} />
                  Agregar etapa
                </button>
              </div>

              <p style={{ fontSize: 12, color: '#9AA3B2', marginBottom: 14 }}>
                Estas etapas definen el flujo de trabajo de tu empresa. Las puedes renombrar, colorear o eliminar.
              </p>

              {etapas.map((e, i) => (
                <div key={e.id} className="etapa-list-item">
                  <div className="etapa-list-dot" style={{ background: e.color }} />
                  <span className="etapa-list-name">{e.nombre}</span>
                  <span style={{ fontSize: 10, color: '#9AA3B2', marginRight: 4 }}>Orden {i + 1}</span>
                  <div className="etapa-list-actions">
                    <button className="btn-icon" onClick={() => openEdit(e)} title="Editar">
                      <Pencil size={13} />
                    </button>
                    <button className="btn-icon" onClick={() => setDeleteId(e.id)} title="Eliminar"
                      style={{ color: '#EF4444', borderColor: '#FECACA' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}

              {etapas.length === 0 && (
                <div className="empty-state">
                  <p>No hay etapas configuradas. Agrega la primera.</p>
                </div>
              )}
            </div>

            {/* Derecha: preview */}
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Vista previa del tablero</h2>
              <div className="detail-card" style={{ background: '#FAFAFA' }}>
                <KanbanPreviewLive etapas={etapas} />
                {etapas.length === 0 && (
                  <p style={{ fontSize: 12, color: '#9AA3B2', textAlign: 'center', padding: '20px 0' }}>
                    Agrega etapas para ver la vista previa.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {modal && (
        <EtapaModal etapa={editEtapa} onClose={() => setModal(false)} onSaved={handleSaved} />
      )}

      {deleteId && (
        <Modal
          title="¿Eliminar esta etapa?"
          onClose={() => setDeleteId(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>No, mantenerla</button>
              <button className="btn btn-danger" onClick={handleDelete}>Sí, eliminar</button>
            </>
          }
        >
          <p style={{ fontSize: 13, color: '#374151' }}>
            Si eliminas esta etapa, los trabajos que la tengan asignada quedarán sin etapa.
          </p>
        </Modal>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
