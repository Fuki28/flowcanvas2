import { useState, useEffect, useCallback } from 'react'
import { Folder, Clock, Printer, Truck, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Sidebar } from '../components/Sidebar.jsx'
import { Topbar } from '../components/Topbar.jsx'
import { StatCard } from '../components/StatCard.jsx'
import { KanbanBoard } from '../components/KanbanBoard.jsx'
import { NewWorkModal } from '../components/NewWorkModal.jsx'
import { ToastContainer } from '../components/Toast.jsx'
import { useToast } from '../hooks/useToast.js'

export function Dashboard() {
  const [etapas,   setEtapas]   = useState([])
  const [trabajos, setTrabajos] = useState([])
  const [clientes, setClientes] = useState([])
  const [selectedClient, setSelectedClient] = useState('')
  const [user,     setUser]     = useState(null)
  const [modal,    setModal]    = useState(false)
  const [defaultEtapaId, setDefaultEtapaId] = useState(null)
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

  const handleMove = async (trabajo, direction) => {
    const idx = etapas.findIndex(e => e.id === trabajo.etapa_id)
    const newEtapa = etapas[idx + direction]
    if (!newEtapa) return

    await supabase.from('trabajos').update({ etapa_id: newEtapa.id }).eq('id', trabajo.id)
    await supabase.from('historial_etapas').insert([{ trabajo_id: trabajo.id, etapa_id: newEtapa.id }])

    setTrabajos(prev => prev.map(t => t.id === trabajo.id ? { ...t, etapa_id: newEtapa.id } : t))
    showToast(`Movido a "${newEtapa.nombre}"`, 'success')
  }

  const handleCreated = (data) => {
    setModal(false)
    loadAll()
    showToast('Trabajo creado correctamente', 'success')
  }

  const openModal = (etapaId = null) => {
    setDefaultEtapaId(etapaId)
    setModal(true)
  }

  // Stats
  const filteredTrabajos = selectedClient
    ? trabajos.filter(t => String(t.cliente_id) === String(selectedClient))
    : trabajos

  const activos   = filteredTrabajos.filter(t => {
    const e = etapas.find(e => e.id === t.etapa_id)
    return e && e.orden < etapas.length
  }).length
  const enDiseno     = filteredTrabajos.filter(t => etapas.find(e => e.id === t.etapa_id)?.orden === 1).length
  const enProduccion = filteredTrabajos.filter(t => etapas.find(e => e.id === t.etapa_id)?.orden === 2).length
  const porEntregar  = filteredTrabajos.filter(t => etapas.find(e => e.id === t.etapa_id)?.orden === 3).length
  const entregados   = filteredTrabajos.filter(t => {
    const e = etapas.find(e => e.id === t.etapa_id)
    return e && e.orden === etapas.length - 1
  }).length

  return (
    <div className="app-layout">
      <div className="sidebar-overlay" style={{ display: mobileOpen ? 'block' : 'none' }} onClick={() => setMobileOpen(false)} />
      <Sidebar etapas={etapas} user={user} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="main-content">
        <Topbar
          title="Dashboard"
          subtitle="Aquí tienes lo que está pasando hoy."
          onNewWork={() => openModal()}
          onMenuClick={() => setMobileOpen(true)}
        />
        <div className="page-body">
          {/* Stat cards */}
          <div className="stat-grid">
            <StatCard icon={<Folder size={20}/>}      label="Trabajos activos" value={activos}      trend="+12%" trendType="up"      iconBg="#EEF0FD" iconColor="#6B5CE7" />
            <StatCard icon={<Clock size={20}/>}       label="En diseño"        value={enDiseno}     trend="+8%"  trendType="up"      iconBg="#FFFBEB" iconColor="#F5A623" />
            <StatCard icon={<Printer size={20}/>}     label="En producción"    value={enProduccion} trend="— ="  trendType="neutral" iconBg="#EFF6FF" iconColor="#3B82F6" />
            <StatCard icon={<Truck size={20}/>}       label="Por entregar"     value={porEntregar}  trend="-25%" trendType="down"    iconBg="#EAFDF4" iconColor="#10B981" />
            <StatCard icon={<CheckCircle size={20}/>} label="Completados hoy"  value={entregados}   trend="+40%" trendType="up"      iconBg="#E6F4EA" iconColor="#137333" />
          </div>

          {/* Filtro de cliente y Kanban */}
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Tablero de trabajos</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 220 }}>
              <label style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Cliente:</label>
              <select
                className="form-select"
                style={{ minWidth: 180 }}
                value={selectedClient}
                onChange={e => setSelectedClient(e.target.value)}
              >
                <option value="">Todos los clientes</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          </div>
          <KanbanBoard
            etapas={etapas}
            trabajos={filteredTrabajos}
            onMove={handleMove}
            onAddWork={openModal}
          />
        </div>
      </div>

      {modal && (
        <NewWorkModal
          etapas={etapas}
          clientes={clientes}
          defaultEtapaId={defaultEtapaId}
          onClose={() => setModal(false)}
          onCreated={handleCreated}
        />
      )}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
