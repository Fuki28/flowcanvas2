import { useState, useEffect, useCallback } from 'react'
import { Briefcase, Clock, Zap, CheckCircle } from 'lucide-react'
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
  const activos   = trabajos.filter(t => {
    const e = etapas.find(e => e.id === t.etapa_id)
    return e && e.orden < etapas.length
  }).length
  const enDiseno     = trabajos.filter(t => etapas.find(e => e.id === t.etapa_id)?.orden === 1).length
  const enProduccion = trabajos.filter(t => etapas.find(e => e.id === t.etapa_id)?.orden === 2).length
  const entregados   = trabajos.filter(t => {
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
            <StatCard icon={<Briefcase size={20}/>}   label="Trabajos activos"  value={activos}   iconBg="#EEF0FD" iconColor="#6B5CE7" />
            <StatCard icon={<Clock size={20}/>}        label="En diseño"         value={enDiseno}   iconBg="#FFFBEB" iconColor="#F5A623" />
            <StatCard icon={<Zap size={20}/>}          label="En producción"     value={enProduccion} iconBg="#EFF6FF" iconColor="#3B82F6" />
            <StatCard icon={<CheckCircle size={20}/>}  label="Entregados"        value={entregados} iconBg="#ECFDF5" iconColor="#22C55E" />
          </div>

          {/* Kanban */}
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600 }}>Tablero de trabajos</h2>
          </div>
          <KanbanBoard
            etapas={etapas}
            trabajos={trabajos}
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
