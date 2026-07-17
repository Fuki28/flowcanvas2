import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Folder, Clock, Printer, Truck, Eye, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Sidebar } from '../components/Sidebar.jsx'
import { Topbar } from '../components/Topbar.jsx'
import { StatCard } from '../components/StatCard.jsx'
import { PriorityBadge, EtapaBadge } from '../components/Badge.jsx'
import { NewWorkModal } from '../components/NewWorkModal.jsx'
import { Modal } from '../components/Modal.jsx'
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

export function Trabajos() {
  const navigate  = useNavigate()
  const [etapas,   setEtapas]   = useState([])
  const [trabajos, setTrabajos] = useState([])
  const [clientes, setClientes] = useState([])
  const [user,     setUser]     = useState(null)
  const [search,   setSearch]   = useState('')
  const [currentTab, setCurrentTab] = useState('todos')
  const [filterEtapa, setFilterEtapa] = useState('')
  const [sortBy,   setSortBy]   = useState('recent')
  const [modal,    setModal]    = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { toasts, showToast, removeToast } = useToast()

  const loadAll = useCallback(async () => {
    const [{ data: e }, { data: t }, { data: c }] = await Promise.all([
      supabase.from('etapas').select('*').order('orden'),
      supabase.from('trabajos').select('*, clientes(nombre)').order('created_at', { ascending: false }),
      supabase.from('clientes').select('*').order('nombre'),
    ])
    setEtapas(e  || [])
    setTrabajos(t || [])
    setClientes(c || [])
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    loadAll()
  }, [loadAll])

  const handleDelete = async () => {
    await supabase.from('historial_etapas').delete().eq('trabajo_id', deleteId)
    await supabase.from('trabajos').delete().eq('id', deleteId)
    setDeleteId(null)
    loadAll()
    showToast('Trabajo eliminado', 'info')
  }

  // Filtrado por Tab y búsqueda
  const filtered = trabajos.filter(t => {
    const matchSearch = t.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (t.clientes?.nombre || '').toLowerCase().includes(search.toLowerCase())
    
    const etapa = etapas.find(e => e.id === t.etapa_id)
    let matchTab = true
    if (currentTab === 'activos') {
      matchTab = etapa && etapa.orden < etapas.length - 1
    } else if (currentTab === 'pendientes') {
      matchTab = etapa && etapa.orden === 0
    } else if (currentTab === 'proceso') {
      matchTab = etapa && (etapa.orden === 1 || etapa.orden === 2)
    } else if (currentTab === 'finalizados') {
      matchTab = etapa && etapa.orden === etapas.length - 1
    }

    const matchEtapa = filterEtapa ? t.etapa_id === filterEtapa : true
    return matchSearch && matchTab && matchEtapa
  })

  // Ordenamiento
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.created_at) - new Date(a.created_at)
    } else if (sortBy === 'old') {
      return new Date(a.created_at) - new Date(b.created_at)
    }
    return 0
  })

  // Stats para la parte superior
  const activos   = trabajos.filter(t => {
    const e = etapas.find(e => e.id === t.etapa_id)
    return e && e.orden < etapas.length
  }).length
  const enDiseno     = trabajos.filter(t => etapas.find(e => e.id === t.etapa_id)?.orden === 1).length
  const enProduccion = trabajos.filter(t => etapas.find(e => e.id === t.etapa_id)?.orden === 2).length
  const porEntregar  = trabajos.filter(t => etapas.find(e => e.id === t.etapa_id)?.orden === 3).length

  const formatDate = (d) => new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="app-layout">
      <div className="sidebar-overlay" style={{ display: mobileOpen ? 'block' : 'none' }} onClick={() => setMobileOpen(false)} />
      <Sidebar etapas={etapas} user={user} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="main-content">
        <Topbar
          title="Trabajos"
          subtitle="Gestiona y da seguimiento a todos los trabajos."
          onNewWork={() => setModal(true)}
          onSearch={setSearch}
          searchValue={search}
          onMenuClick={() => setMobileOpen(true)}
        />
        <div className="page-body">
          {/* Tarjetas de Estadísticas */}
          <div className="stat-grid" style={{ marginBottom: 24 }}>
            <StatCard icon={<Folder size={20}/>}      label="Trabajos activos" value={activos}      trend="+12%" trendType="up"      iconBg="#EEF0FD" iconColor="#6B5CE7" />
            <StatCard icon={<Clock size={20}/>}       label="En diseño"        value={enDiseno}     trend="+8%"  trendType="up"      iconBg="#FFFBEB" iconColor="#F5A623" />
            <StatCard icon={<Printer size={20}/>}     label="En producción"    value={enProduccion} trend="— ="  trendType="neutral" iconBg="#EFF6FF" iconColor="#3B82F6" />
            <StatCard icon={<Truck size={20}/>}       label="Por entregar"     value={porEntregar}  trend="-25%" trendType="down"    iconBg="#EAFDF4" iconColor="#10B981" />
          </div>

          {/* Sistema de Pestañas y Filtros */}
          <div className="tab-container">
            <div className="tab-list">
              <div className={`tab-item${currentTab === 'todos' ? ' active' : ''}`} onClick={() => { setCurrentTab('todos'); setFilterEtapa(''); }}>Todos</div>
              <div className={`tab-item${currentTab === 'activos' ? ' active' : ''}`} onClick={() => { setCurrentTab('activos'); setFilterEtapa(''); }}>Activos</div>
              <div className={`tab-item${currentTab === 'pendientes' ? ' active' : ''}`} onClick={() => { setCurrentTab('pendientes'); setFilterEtapa(''); }}>Pendientes</div>
              <div className={`tab-item${currentTab === 'proceso' ? ' active' : ''}`} onClick={() => { setCurrentTab('proceso'); setFilterEtapa(''); }}>En proceso</div>
              <div className={`tab-item${currentTab === 'finalizados' ? ' active' : ''}`} onClick={() => { setCurrentTab('finalizados'); setFilterEtapa(''); }}>Finalizados</div>
            </div>
            <div className="tab-actions">
              <select className="select-clean" value={filterEtapa} onChange={e => setFilterEtapa(e.target.value)}>
                <option value="">⚙️ Filtros</option>
                {etapas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
              <select className="select-clean" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="recent">⇅ Más recientes</option>
                <option value="old">⇅ Más antiguos</option>
              </select>
            </div>
          </div>

          {/* Tabla de Trabajos */}
          <div className="table-wrap">
            <table className="fc-table">
              <thead>
                <tr>
                  <th>TRABAJO</th>
                  <th>CLIENTE</th>
                  <th>ETAPA ACTUAL</th>
                  <th>PRIORIDAD</th>
                  <th>FECHA DE CREACIÓN</th>
                  <th style={{ width: 80 }}>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#9AA3B2', padding: '40px 16px' }}>
                      No hay trabajos que mostrar.
                    </td>
                  </tr>
                ) : sorted.map(t => {
                  const etapa = etapas.find(e => e.id === t.etapa_id)
                  const clientName = t.clientes?.nombre || '—'
                  const initials = getInitials(clientName)
                  const avatarColor = getAvatarColor(clientName)

                  return (
                    <tr key={t.id}>
                      <td>
                        <div className="job-title-cell">
                          <span className="dot-indicator" style={{ background: etapa?.color || '#9AA3B2' }} />
                          <div>
                            <div style={{ fontWeight: 600, color: '#1E2235' }}>{t.nombre}</div>
                            <div style={{ fontSize: 11, color: '#9AA3B2', marginTop: 2 }}>TRB-{t.id.slice(0, 4).toUpperCase()}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="client-avatar-cell">
                          {t.clientes ? (
                            <>
                              <div className="client-avatar-badge" style={{ background: avatarColor }}>
                                {initials}
                              </div>
                              <span style={{ fontWeight: 500, color: '#1E2235' }}>{clientName}</span>
                            </>
                          ) : (
                            <span style={{ color: '#9AA3B2' }}>—</span>
                          )}
                        </div>
                      </td>
                      <td><EtapaBadge etapa={etapa} /></td>
                      <td><PriorityBadge prioridad={t.prioridad} /></td>
                      <td style={{ color: '#9AA3B2', fontSize: 12 }}>{formatDate(t.created_at)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-icon" onClick={() => navigate(`/trabajos/${t.id}`)} title="Ver detalle">
                            <Eye size={14} />
                          </button>
                          <button className="btn-icon" onClick={() => setDeleteId(t.id)} title="Eliminar"
                            style={{ color: '#EF4444', borderColor: '#FECACA' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 16, fontSize: 12, color: '#9AA3B2' }}>
            Mostrando {sorted.length} de {trabajos.length} trabajos
          </div>
        </div>
      </div>

      {modal && (
        <NewWorkModal
          etapas={etapas}
          clientes={clientes}
          onClose={() => setModal(false)}
          onCreated={() => { setModal(false); loadAll(); showToast('Trabajo creado', 'success') }}
        />
      )}

      {deleteId && (
        <Modal
          title="¿Eliminar este trabajo?"
          onClose={() => setDeleteId(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>No, mantenerlo</button>
              <button className="btn btn-danger" onClick={handleDelete}>Sí, eliminar</button>
            </>
          }
        >
          <p style={{ fontSize: 13, color: '#374151' }}>
            Esta acción no se puede deshacer. El trabajo y su historial de etapas se perderán.
          </p>
        </Modal>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
