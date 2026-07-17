import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ArrowLeft, Search, Briefcase, Mail, Phone, Pencil, Trash2, Folder, Printer, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Sidebar } from '../components/Sidebar.jsx'
import { Topbar } from '../components/Topbar.jsx'
import { Modal } from '../components/Modal.jsx'
import { StatCard } from '../components/StatCard.jsx'
import { KanbanBoard } from '../components/KanbanBoard.jsx'
import { NewWorkModal } from '../components/NewWorkModal.jsx'
import { EtapaBadge } from '../components/Badge.jsx'
import { ToastContainer } from '../components/Toast.jsx'
import { useToast } from '../hooks/useToast.js'

const getInitials = (name) => {
  if (!name) return '—'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

const getAvatarColor = (name) => {
  const colors = ['#6B5CE7', '#3B82F6', '#10B981', '#F5A623', '#EF4444', '#EC4899', '#8B5CF6']
  if (!name) return '#9AA3B2'
  const charCode = name.charCodeAt(0) || 0
  return colors[charCode % colors.length]
}

// ── DASHBOARD DE UN CLIENTE ────────────────────────────────────
function ClienteDashboard({ cliente, etapas, onBack, showToast, onEdit, onDelete }) {
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
            className="client-avatar-badge"
            style={{ background: getAvatarColor(cliente.nombre), width: 36, height: 36, fontSize: 13 }}
          >
            {getInitials(cliente.nombre)}
          </div>
          <div>
            <div className="topbar-title">{cliente.nombre}</div>
            <div className="topbar-sub" style={{ fontSize: 11, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {cliente.email && <span><Mail size={11} className="me-1" />{cliente.email}</span>}
              {cliente.telefono && <span><Phone size={11} className="me-1" />{cliente.telefono}</span>}
              <span>• Dashboard de trabajos</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-outline-secondary" style={{ height: 36, fontSize: 13 }} onClick={() => onEdit(cliente)}>
            Editar cliente
          </button>
          <button className="btn btn-outline-danger" style={{ height: 36, fontSize: 13 }} onClick={() => onDelete(cliente.id)}>
            Eliminar cliente
          </button>
          <button className="btn btn-primary" style={{ height: 36, fontSize: 13 }} onClick={() => { setDefaultEtapaId(null); setModal(true) }}>
            <Plus size={15} className="me-1" />
            Nuevo trabajo
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Stats del cliente con StatCards */}
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
          <StatCard icon={<Folder size={20}/>}      label="Trabajos activos" value={activos}    trend="+12%" trendType="up"      iconBg="#EEF0FD" iconColor="#6B5CE7" />
          <StatCard icon={<Printer size={20}/>}     label="En proceso"       value={enProceso}  trend="— ="  trendType="neutral" iconBg="#EFF6FF" iconColor="#3B82F6" />
          <StatCard icon={<CheckCircle size={20}/>} label="Entregados"       value={entregados} trend="+40%" trendType="up"      iconBg="#ECFDF5" iconColor="#22C55E" />
        </div>

        {/* Tablero Kanban del cliente */}
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyHeight: 'space-between' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Tablero de trabajos</h2>
        </div>

        {trabajos.length === 0 ? (
          <div className="empty-state">
            <p>Este cliente no tiene trabajos aún.</p>
            <button className="btn btn-primary animate-pulse" onClick={() => setModal(true)}>
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
  const [trabajos, setTrabajos] = useState([])
  const [counts,   setCounts]   = useState({})
  const [user,     setUser]     = useState(null)
  
  // States del formulario / modal
  const [modal,    setModal]    = useState(false)
  const [nombre,   setNombre]   = useState('')
  const [email,    setEmail]    = useState('')
  const [telefono, setTelefono] = useState('')
  const [editingCliente, setEditingCliente] = useState(null)
  const [deleteClientId, setDeleteClientId] = useState(null)

  const [loading,  setLoading]  = useState(false)
  const [selected, setSelected] = useState(null) // cliente activo para dashboard
  const [search,   setSearch]   = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const { toasts, showToast, removeToast } = useToast()

  const loadAll = useCallback(async () => {
    const [{ data: e }, { data: c }, { data: t }] = await Promise.all([
      supabase.from('etapas').select('*').order('orden'),
      supabase.from('clientes').select('*').order('nombre'),
      supabase.from('trabajos').select('*').order('created_at', { ascending: false }),
    ])
    setEtapas(e || [])
    setClientes(c || [])
    setTrabajos(t || [])
    
    const map = {}
    ;(t || []).forEach(tr => { if (tr.cliente_id) map[tr.cliente_id] = (map[tr.cliente_id] || 0) + 1 })
    setCounts(map)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    loadAll()
  }, [loadAll])

  const handleSave = async () => {
    if (!nombre.trim()) return
    setLoading(true)
    
    let error;
    if (editingCliente) {
      // Intentar actualizar en Supabase (puede dar error si no se han creado las columnas email y telefono en la DB)
      const { error: err } = await supabase.from('clientes').update({
        nombre: nombre.trim(),
        email: email.trim() || null,
        telefono: telefono.trim() || null
      }).eq('id', editingCliente.id)
      error = err
    } else {
      const { error: err } = await supabase.from('clientes').insert([{
        nombre: nombre.trim(),
        email: email.trim() || null,
        telefono: telefono.trim() || null
      }])
      error = err
    }

    setLoading(false)
    if (error) {
      // Manejar error amigable si las columnas no existen en la base de datos
      if (error.message.includes('column') || error.code === 'PGRST104') {
        showToast('⚠️ Error: Debes ejecutar la consulta SQL para agregar las columnas "email" y "telefono" en Supabase.', 'error')
      } else {
        showToast(error.message, 'error')
      }
      return
    }

    setModal(false)
    setNombre('')
    setEmail('')
    setTelefono('')
    setEditingCliente(null)
    loadAll()
    showToast(editingCliente ? 'Cliente actualizado' : 'Cliente creado', 'success')
  }

  const handleDeleteCliente = async () => {
    if (!deleteClientId) return
    setLoading(true)
    
    // 1. Obtener los trabajos vinculados al cliente
    const { data: jobs } = await supabase.from('trabajos').select('id').eq('cliente_id', deleteClientId)
    const jobIds = (jobs || []).map(j => j.id)

    // 2. Eliminar el historial de etapas de los trabajos
    if (jobIds.length > 0) {
      await supabase.from('historial_etapas').delete().in('trabajo_id', jobIds)
      // 3. Eliminar los trabajos
      await supabase.from('trabajos').delete().in('id', jobIds)
    }

    // 4. Eliminar el cliente
    const { error } = await supabase.from('clientes').delete().eq('id', deleteClientId)
    setLoading(false)
    
    if (error) {
      showToast(error.message, 'error')
      return
    }

    setDeleteClientId(null)
    setSelected(null)
    loadAll()
    showToast('Cliente eliminado correctamente', 'info')
  }

  const filtered = clientes.filter(c => c.nombre.toLowerCase().includes(search.toLowerCase()))

  const formatDateShort = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // Si hay cliente seleccionado, mostrar su dashboard
  if (selected) {
    // Buscar datos actualizados del cliente en la lista para reflejar cualquier cambio en tiempo real
    const activeCliente = clientes.find(c => c.id === selected.id) || selected
    return (
      <div className="app-layout">
        <div className="sidebar-overlay" style={{ display: mobileOpen ? 'block' : 'none' }} onClick={() => setMobileOpen(false)} />
        <Sidebar etapas={etapas} user={user} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <div className="main-content">
          <ClienteDashboard
            cliente={activeCliente}
            etapas={etapas}
            onBack={() => { setSelected(null); loadAll() }}
            showToast={showToast}
            onEdit={(c) => {
              setEditingCliente(c)
              setNombre(c.nombre || '')
              setEmail(c.email || '')
              setTelefono(c.telefono || '')
              setModal(true)
            }}
            onDelete={(id) => {
              setDeleteClientId(id)
            }}
          />
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        
        {/* Modales dentro de la vista dashboard del cliente */}
        {modal && (
          <Modal
            title="Editar cliente"
            onClose={() => { setModal(false); setEditingCliente(null); }}
            footer={
              <>
                <button className="btn btn-outline-secondary btn-sm" onClick={() => { setModal(false); setEditingCliente(null); }}>Cancelar</button>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={loading || !nombre.trim()}>
                  {loading ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </>
            }
          >
            <div className="mb-3">
              <label className="form-label">Nombre o razón social</label>
              <input className="form-control" placeholder="Ej: TechCorp S.A." value={nombre} onChange={e => setNombre(e.target.value)} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Correo electrónico</label>
              <input className="form-control" type="email" placeholder="contacto@empresa.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="form-label">Teléfono</label>
              <input className="form-control" placeholder="+593 98 765 4321" value={telefono} onChange={e => setTelefono(e.target.value)} />
            </div>
          </Modal>
        )}

        {deleteClientId && (
          <Modal
            title="¿Eliminar este cliente?"
            onClose={() => setDeleteClientId(null)}
            footer={
              <>
                <button className="btn btn-ghost" onClick={() => setDeleteClientId(null)}>No, mantenerlo</button>
                <button className="btn btn-danger" onClick={handleDeleteCliente}>Sí, eliminar</button>
              </>
            }
          >
            <p style={{ fontSize: 13, color: '#374151' }}>
              Esta acción no se puede deshacer. Se eliminarán permanentemente el cliente, todos sus trabajos vinculados y sus historiales de etapas.
            </p>
          </Modal>
        )}
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

          {/* Barra de búsqueda + botón */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
            <div className="search-box" style={{ maxWidth: 300 }}>
              <Search size={15} style={{ color: '#9AA3B2' }} />
              <input
                placeholder="Buscar clientes..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <span style={{ fontSize: 12, color: '#9AA3B2' }}>{filtered.length} cliente{filtered.length !== 1 ? 's' : ''} registrado{filtered.length !== 1 ? 's' : ''}</span>
            <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => { setEditingCliente(null); setNombre(''); setEmail(''); setTelefono(''); setModal(true); }}>
              <Plus size={14} className="me-1" />
              Nuevo cliente
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <p>{search ? 'No se encontraron clientes.' : 'No hay clientes registrados.'}</p>
              {!search && (
                <button className="btn btn-primary" onClick={() => setModal(true)}>
                  Agregar el primero
                </button>
              )}
            </div>
          ) : (
            <div className="client-grid">
              {filtered.map(c => {
                const clientJobs = trabajos.filter(t => t.cliente_id === c.id)
                const totalCount = clientJobs.length
                const activeCount = clientJobs.filter(t => {
                  const stage = etapas.find(et => et.id === t.etapa_id)
                  return stage && stage.orden < etapas.length - 1
                }).length
                const lastJob = clientJobs.length > 0 ? clientJobs[0] : null
                const lastJobStage = lastJob ? etapas.find(et => et.id === lastJob.etapa_id) : null
                const avatarColor = getAvatarColor(c.nombre)
                const initials = getInitials(c.nombre)

                return (
                  <div key={c.id} className="client-card-new" onClick={() => setSelected(c)}>
                    <div className="client-card-header">
                      <div className="client-avatar-badge" style={{ background: avatarColor, width: 36, height: 36, fontSize: 12 }}>
                        {initials}
                      </div>
                      <span className="badge" style={{ background: '#EEF0FD', color: '#6B5CE7', padding: '4px 10px', fontSize: 11, borderRadius: 100, fontWeight: 600 }}>
                        {activeCount} {activeCount === 1 ? 'activo' : 'activos'}
                      </span>
                    </div>
                    <div>
                      <div className="client-card-name">{c.nombre}</div>
                      <div className="client-card-meta">
                        <Briefcase size={13} style={{ color: '#9AA3B2' }} />
                        <span>{totalCount} {totalCount === 1 ? 'trabajo' : 'trabajos'} en total</span>
                      </div>
                      
                      <div className="last-job-box" onClick={e => e.stopPropagation()}>
                        <div className="last-job-label">ÚLTIMO TRABAJO</div>
                        {lastJob ? (
                          <>
                            <div className="last-job-title" style={{ cursor: 'pointer' }} onClick={() => navigate(`/trabajos/${lastJob.id}`)} title="Ver trabajo">
                              {lastJob.nombre}
                            </div>
                            <div style={{ marginTop: 6 }}><EtapaBadge etapa={lastJobStage} /></div>
                          </>
                        ) : (
                          <div className="last-job-title" style={{ color: '#9AA3B2', fontStyle: 'italic', fontSize: 11 }}>Sin trabajos registrados</div>
                        )}
                      </div>
                    </div>
                    <div className="client-card-footer">
                      Desde {formatDateShort(c.created_at)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal para Crear Nuevo Cliente */}
      {modal && !editingCliente && (
        <Modal
          title="Nuevo cliente"
          onClose={() => { setModal(false); setNombre(''); setEmail(''); setTelefono(''); }}
          footer={
            <>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => { setModal(false); setNombre(''); setEmail(''); setTelefono(''); }}>Cancelar</button>
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={loading || !nombre.trim()}>
                {loading ? 'Creando cliente...' : 'Crear cliente'}
              </button>
            </>
          }
        >
          <div className="mb-3">
            <label className="form-label">Nombre o razón social</label>
            <input className="form-control" placeholder="Ej: TechCorp S.A." value={nombre} onChange={e => setNombre(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Correo electrónico</label>
            <input className="form-control" type="email" placeholder="contacto@empresa.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label">Teléfono</label>
            <input className="form-control" placeholder="+593 98 765 4321" value={telefono} onChange={e => setTelefono(e.target.value)} />
          </div>
        </Modal>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
