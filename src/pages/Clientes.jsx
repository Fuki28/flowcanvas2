import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Sidebar } from '../components/Sidebar.jsx'
import { Topbar } from '../components/Topbar.jsx'
import { Modal } from '../components/Modal.jsx'
import { KanbanBoard } from '../components/KanbanBoard.jsx'
import { NewWorkModal } from '../components/NewWorkModal.jsx'
import { EtapaBadge, PriorityBadge } from '../components/Badge.jsx'
import { ToastContainer } from '../components/Toast.jsx'
import { useToast } from '../hooks/useToast.js'

function hashColor(str) {
  const palette = ['#6B5CE7','#F5A623','#3B82F6','#22C55E','#EF4444','#9B59B6','#4ECDC4','#E8664A']
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return palette[Math.abs(h) % palette.length]
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

// ── DASHBOARD DE UN CLIENTE ────────────────────────────────────
function ClienteDashboard({ cliente, etapas, onBack, showToast }) {
  const [trabajos,   setTrabajos]   = useState([])
  const [clientes,   setClientes]   = useState([])
  const [modal,      setModal]      = useState(false)
  const [defaultEtapaId, setDefaultEtapaId] = useState(null)

  const loadTrabajos = useCallback(async () => {
    const [{ data: t }, { data: c }] = await Promise.all([
      supabase.from('trabajos').select('*, clientes(nombre)').eq('cliente_id', cliente.id).order('created_at', { ascending: false }),
      supabase.from('clientes').select('*').order('nombre'),
    ])
    setTrabajos(t || [])
    setClientes(c || [])
  }, [cliente.id])

  useEffect(() => { loadTrabajos() }, [loadTrabajos])

  const handleMove = async (trabajo, direction) => {
    const idx = etapas.findIndex(e => e.id === trabajo.etapa_id)
    const newEtapa = etapas[idx + direction]
    if (!newEtapa) return
    await supabase.from('trabajos').update({ etapa_id: newEtapa.id }).eq('id', trabajo.id)
    await supabase.from('historial_etapas').insert([{ trabajo_id: trabajo.id, etapa_id: newEtapa.id }])
    setTrabajos(prev => prev.map(t => t.id === trabajo.id ? { ...t, etapa_id: newEtapa.id } : t))
    showToast(`Movido a "${newEtapa.nombre}"`, 'success')
  }

  const activos   = trabajos.length
  const entregados = trabajos.filter(t => etapas.find(e => e.id === t.etapa_id)?.orden === etapas.length - 1).length
  const enProceso  = trabajos.filter(t => {
    const e = etapas.find(e => e.id === t.etapa_id)
    return e && e.orden > 0 && e.orden < etapas.length - 1
  }).length

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Mini topbar del cliente */}
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-icon" onClick={onBack} title="Volver a clientes">
            <ArrowLeft size={16} />
          </button>
          <div
            style={{ width: 32, height: 32, borderRadius: '50%', background: hashColor(cliente.nombre), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}
          >
            {getInitials(cliente.nombre)}
          </div>
          <div>
            <div className="topbar-title">{cliente.nombre}</div>
            <div className="topbar-sub">Dashboard de trabajos del cliente</div>
          </div>
        </div>
        <button className="btn btn-primary" style={{ height: 36, fontSize: 13 }} onClick={() => { setDefaultEtapaId(null); setModal(true) }}>
          <Plus size={15} className="me-1" />
          Nuevo trabajo
        </button>
      </div>

      <div className="page-body">
        {/* Stats del cliente — Bootstrap row */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-sm-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body d-flex align-items-center gap-3">
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EEF0FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-briefcase" style={{ color: '#6B5CE7', fontSize: 20 }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#9AA3B2' }}>Trabajos activos</div>
                  <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{activos}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body d-flex align-items-center gap-3">
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-lightning" style={{ color: '#3B82F6', fontSize: 20 }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#9AA3B2' }}>En proceso</div>
                  <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{enProceso}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body d-flex align-items-center gap-3">
                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-check-circle" style={{ color: '#22C55E', fontSize: 20 }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#9AA3B2' }}>Entregados</div>
                  <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{entregados}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tablero Kanban del cliente */}
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Tablero de trabajos</h2>
        </div>

        {trabajos.length === 0 ? (
          <div className="empty-state">
            <i className="bi bi-kanban" style={{ fontSize: 48, opacity: 0.3 }} />
            <p>Este cliente no tiene trabajos aún.</p>
            <button className="btn btn-primary" onClick={() => setModal(true)}>
              <Plus size={14} className="me-1" />
              Crear primer trabajo
            </button>
          </div>
        ) : (
          <KanbanBoard
            etapas={etapas}
            trabajos={trabajos}
            onMove={handleMove}
            onAddWork={(etapaId) => { setDefaultEtapaId(etapaId); setModal(true) }}
          />
        )}
      </div>

      {modal && (
        <NewWorkModal
          etapas={etapas}
          clientes={clientes}
          defaultEtapaId={defaultEtapaId}
          defaultClienteId={cliente.id}
          onClose={() => setModal(false)}
          onCreated={() => { setModal(false); loadTrabajos(); showToast('Trabajo creado', 'success') }}
        />
      )}
    </div>
  )
}

// ── LISTA DE CLIENTES ─────────────────────────────────────────
export function Clientes() {
  const [etapas,   setEtapas]   = useState([])
  const [clientes, setClientes] = useState([])
  const [counts,   setCounts]   = useState({})
  const [user,     setUser]     = useState(null)
  const [modal,    setModal]    = useState(false)
  const [nombre,   setNombre]   = useState('')
  const [loading,  setLoading]  = useState(false)
  const [selected, setSelected] = useState(null) // cliente activo para dashboard
  const [search,   setSearch]   = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const { toasts, showToast, removeToast } = useToast()

  const loadAll = useCallback(async () => {
    const [{ data: e }, { data: c }, { data: t }] = await Promise.all([
      supabase.from('etapas').select('*').order('orden'),
      supabase.from('clientes').select('*').order('nombre'),
      supabase.from('trabajos').select('cliente_id'),
    ])
    setEtapas(e || [])
    setClientes(c || [])
    const map = {}
    ;(t || []).forEach(tr => { if (tr.cliente_id) map[tr.cliente_id] = (map[tr.cliente_id] || 0) + 1 })
    setCounts(map)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    loadAll()
  }, [loadAll])

  const handleCreate = async () => {
    if (!nombre.trim()) return
    setLoading(true)
    const { data, error } = await supabase.from('clientes').insert([{ nombre: nombre.trim() }]).select().single()
    setLoading(false)
    if (error) { showToast(error.message, 'error'); return }
    setModal(false)
    setNombre('')
    loadAll()
    showToast('Cliente creado', 'success')
  }

  const filtered = clientes.filter(c => c.nombre.toLowerCase().includes(search.toLowerCase()))

  // Si hay cliente seleccionado, mostrar su dashboard
  if (selected) {
    return (
      <div className="app-layout">
        <div className="sidebar-overlay" style={{ display: mobileOpen ? 'block' : 'none' }} onClick={() => setMobileOpen(false)} />
        <Sidebar etapas={etapas} user={user} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="main-content">
          <ClienteDashboard
            cliente={selected}
            etapas={etapas}
            onBack={() => { setSelected(null); loadAll() }}
            showToast={showToast}
          />
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    )
  }

  return (
    <div className="app-layout">
      <div className="sidebar-overlay" style={{ display: mobileOpen ? 'block' : 'none' }} onClick={() => setMobileOpen(false)} />
      <Sidebar etapas={etapas} user={user} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="main-content">
        <Topbar title="Clientes" subtitle="Gestiona tu base de clientes." onMenuClick={() => setMobileOpen(true)} />
        <div className="page-body">

          {/* Barra de búsqueda + botón — Bootstrap */}
          <div className="d-flex flex-column flex-sm-row gap-2 mb-4">
            <div className="input-group" style={{ maxWidth: 320 }}>
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted" />
              </span>
              <input
                className="form-control border-start-0"
                placeholder="Buscar cliente..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <button className="btn btn-primary ms-sm-auto" onClick={() => setModal(true)}>
              <i className="bi bi-plus-lg me-1" />
              Nuevo cliente
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-people" style={{ fontSize: 48, opacity: 0.3 }} />
              <p>{search ? 'No se encontraron clientes.' : 'No hay clientes registrados.'}</p>
              {!search && (
                <button className="btn btn-primary" onClick={() => setModal(true)}>
                  Agregar el primero
                </button>
              )}
            </div>
          ) : (
            <div className="client-grid">
              {filtered.map(c => (
                <div key={c.id} className="client-card" onClick={() => setSelected(c)}>
                  <div className="client-avatar" style={{ background: hashColor(c.nombre) }}>
                    {getInitials(c.nombre)}
                  </div>
                  <div className="client-name">{c.nombre}</div>
                  <div className="client-count">
                    {counts[c.id] || 0} trabajo{(counts[c.id] || 0) !== 1 ? 's' : ''}
                  </div>
                  <span className="badge rounded-pill" style={{ background: '#EEF0FD', color: '#6B5CE7', fontSize: 11 }}>
                    <i className="bi bi-arrow-right me-1" />
                    Ver tablero
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modal && (
        <Modal
          title="Nuevo cliente"
          onClose={() => { setModal(false); setNombre('') }}
          footer={
            <>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => { setModal(false); setNombre('') }}>Cancelar</button>
              <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={loading || !nombre.trim()}>
                {loading ? <><span className="spinner-border spinner-border-sm me-1" />Guardando...</> : 'Crear cliente'}
              </button>
            </>
          }
        >
          <div className="mb-3">
            <label className="form-label">Nombre del cliente</label>
            <input
              className="form-control"
              placeholder="Ej: Restaurante Sabor"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
          </div>
        </Modal>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
