import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Eye } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Sidebar } from '../components/Sidebar.jsx'
import { Topbar } from '../components/Topbar.jsx'
import { PriorityBadge, EtapaBadge } from '../components/Badge.jsx'
import { NewWorkModal } from '../components/NewWorkModal.jsx'
import { Modal } from '../components/Modal.jsx'
import { ToastContainer } from '../components/Toast.jsx'
import { useToast } from '../hooks/useToast.js'

export function Trabajos() {
  const navigate  = useNavigate()
  const [etapas,   setEtapas]   = useState([])
  const [trabajos, setTrabajos] = useState([])
  const [clientes, setClientes] = useState([])
  const [user,     setUser]     = useState(null)
  const [search,   setSearch]   = useState('')
  const [filterEtapa, setFilterEtapa] = useState('')
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

  const filtered = trabajos.filter(t => {
    const matchSearch = t.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (t.clientes?.nombre || '').toLowerCase().includes(search.toLowerCase())
    const matchEtapa  = filterEtapa ? t.etapa_id === filterEtapa : true
    return matchSearch && matchEtapa
  })

  const formatDate = (d) => new Date(d).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: '2-digit' })

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
          {/* Filtros */}
          <div className="filters-row">
            <select className="select" style={{ width: 180 }} value={filterEtapa} onChange={e => setFilterEtapa(e.target.value)}>
              <option value="">Todas las etapas</option>
              {etapas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
            <span style={{ fontSize: 12, color: '#9AA3B2' }}>{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Tabla */}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Trabajo</th>
                  <th>Cliente</th>
                  <th>Etapa</th>
                  <th>Prioridad</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#9AA3B2', padding: '40px 16px' }}>
                      No hay trabajos que mostrar.
                    </td>
                  </tr>
                ) : filtered.map(t => {
                  const etapa = etapas.find(e => e.id === t.etapa_id)
                  return (
                    <tr key={t.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{t.nombre}</div>
                        <div style={{ fontSize: 11, color: '#9AA3B2' }}>#{t.id.slice(0,8)}</div>
                      </td>
                      <td style={{ color: '#374151' }}>{t.clientes?.nombre || <span style={{ color: '#9AA3B2' }}>—</span>}</td>
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

          <div style={{ marginTop: 10, fontSize: 12, color: '#9AA3B2' }}>
            Mostrando {filtered.length} de {trabajos.length} trabajos
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
