import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { ToastContainer } from '../components/Toast.jsx'
import { useToast } from '../hooks/useToast.js'

export function TrabajoDetalle() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { toasts, showToast, removeToast } = useToast()

  const [trabajo,  setTrabajo]  = useState(null)
  const [etapas,   setEtapas]   = useState([])
  const [clientes, setClientes] = useState([])
  const [historial,setHistorial]= useState([])
  const [form,     setForm]     = useState({})
  const [loading,  setLoading]  = useState(false)

  const loadData = useCallback(async () => {
    const [{ data: t }, { data: e }, { data: c }, { data: h }] = await Promise.all([
      supabase.from('trabajos').select('*, clientes(nombre)').eq('id', id).single(),
      supabase.from('etapas').select('*').order('orden'),
      supabase.from('clientes').select('*').order('nombre'),
      supabase.from('historial_etapas').select('*, etapas(nombre, color)').eq('trabajo_id', id).order('fecha', { ascending: false }),
    ])
    setTrabajo(t)
    setEtapas(e  || [])
    setClientes(c || [])
    setHistorial(h || [])
    if (t) setForm({ nombre: t.nombre, cliente_id: t.cliente_id || '', prioridad: t.prioridad, descripcion: t.descripcion || '', etapa_id: t.etapa_id })
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  const handleSave = async () => {
    setLoading(true)
    const prev_etapa = trabajo.etapa_id

    const { error } = await supabase.from('trabajos').update({
      nombre:      form.nombre,
      cliente_id:  form.cliente_id  || null,
      prioridad:   form.prioridad,
      descripcion: form.descripcion || null,
      etapa_id:    form.etapa_id,
    }).eq('id', id)

    if (error) { showToast(error.message, 'error'); setLoading(false); return }

    if (form.etapa_id !== prev_etapa) {
      await supabase.from('historial_etapas').insert([{ trabajo_id: id, etapa_id: form.etapa_id }])
    }

    setLoading(false)
    loadData()
    showToast('Trabajo guardado correctamente', 'success')
  }

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const formatDateTime = (d) => {
    if (!d) return ''
    return new Date(d).toLocaleString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  if (!trabajo) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#9AA3B2' }}>
      Cargando...
    </div>
  )

  return (
    <div className="detail-page">
      {/* Breadcrumb */}
      <div className="breadcrumb" onClick={() => navigate('/trabajos')}>
        <ArrowLeft size={14} />
        <span>Volver a trabajos</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px' }}>{trabajo.nombre}</h1>
          <span style={{ fontSize: 11, color: '#9AA3B2', fontFamily: 'monospace' }}>#{id.slice(0, 8)}</span>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
          <Save size={14} />
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      {/* Layout */}
      <div className="detail-layout">
        {/* Izquierda: info editable */}
        <div className="detail-section">
          <div className="detail-card">
            <h3>Información del trabajo</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="field">
                <label>Nombre del trabajo</label>
                <input className="input" value={form.nombre || ''} onChange={e => set('nombre', e.target.value)} />
              </div>
              <div className="field">
                <label>Cliente</label>
                <select className="select" value={form.cliente_id || ''} onChange={e => set('cliente_id', e.target.value)}>
                  <option value="">Sin cliente</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Prioridad</label>
                <select className="select" value={form.prioridad || 'media'} onChange={e => set('prioridad', e.target.value)}>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
              </div>
              <div className="field">
                <label>Descripción</label>
                <textarea className="textarea" value={form.descripcion || ''} onChange={e => set('descripcion', e.target.value)}
                  placeholder="Descripción del trabajo..." />
              </div>
            </div>
          </div>
        </div>

        {/* Derecha: etapa + historial */}
        <div className="detail-section">
          {/* Selector de etapa */}
          <div className="detail-card">
            <h3>Etapa actual</h3>
            <div className="etapa-selector">
              {etapas.map(etapa => (
                <div
                  key={etapa.id}
                  className={`etapa-option${form.etapa_id === etapa.id ? ' selected' : ''}`}
                  onClick={() => set('etapa_id', etapa.id)}
                >
                  <div className="etapa-option-dot" style={{ background: etapa.color }} />
                  <span>{etapa.nombre}</span>
                  {form.etapa_id === etapa.id && (
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: '#6B5CE7', fontWeight: 600 }}>
                      Actual
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Historial */}
          <div className="detail-card">
            <h3>Historial de etapas</h3>
            {historial.length === 0 ? (
              <p style={{ fontSize: 12, color: '#9AA3B2' }}>Sin historial registrado.</p>
            ) : (
              <div className="historial-list">
                {historial.map(h => (
                  <div key={h.id} className="historial-item">
                    <div className="historial-dot" style={{ background: h.etapas?.color || '#9AA3B2' }} />
                    <div>
                      <div style={{ fontSize: 12, color: '#1E2235', fontWeight: 500 }}>
                        Movido a <strong>{h.etapas?.nombre || 'etapa eliminada'}</strong>
                      </div>
                      <div className="historial-date">{formatDateTime(h.fecha)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
