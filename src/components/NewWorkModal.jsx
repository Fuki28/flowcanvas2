import { useState, useEffect } from 'react'
import { Modal } from './Modal.jsx'
import { supabase } from '../lib/supabase'

export function NewWorkModal({ etapas, clientes, onClose, onCreated, defaultEtapaId, defaultClienteId }) {
  const [form, setForm] = useState({
    nombre:      '',
    cliente_id:  defaultClienteId || '',
    etapa_id:    defaultEtapaId   || (etapas[0]?.id || ''),
    prioridad:   'media',
    descripcion: '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      cliente_id: defaultClienteId || '',
      etapa_id: defaultEtapaId || prev.etapa_id || etapas[0]?.id || '',
    }))
  }, [defaultClienteId, defaultEtapaId, etapas])

  const handleSubmit = async () => {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return }
    setLoading(true)

    const { data, error: err } = await supabase
      .from('trabajos')
      .insert([{
        nombre:      form.nombre.trim(),
        cliente_id:  form.cliente_id  || null,
        etapa_id:    form.etapa_id    || null,
        prioridad:   form.prioridad,
        descripcion: form.descripcion.trim() || null,
      }])
      .select()
      .single()

    if (err) { setError(err.message); setLoading(false); return }

    if (data && form.etapa_id) {
      await supabase.from('historial_etapas').insert([{ trabajo_id: data.id, etapa_id: form.etapa_id }])
    }

    setLoading(false)
    onCreated(data)
  }

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  return (
    <Modal
      title="Nuevo trabajo"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={loading || !form.nombre.trim()}>
            {loading ? <><span className="spinner-border spinner-border-sm me-1" />Guardando...</> : 'Crear trabajo'}
          </button>
        </>
      }
    >
      <div className="d-flex flex-column gap-3">
        {error && <div className="alert alert-danger py-2" style={{ fontSize: 13 }}>{error}</div>}

        <div className="mb-2">
          <label className="form-label">Nombre del trabajo *</label>
          <input
            className="form-control"
            placeholder="Ej: Catálogo verano 2026"
            value={form.nombre}
            onChange={e => set('nombre', e.target.value)}
          />
        </div>

        <div className="mb-2">
          <label className="form-label">Cliente</label>
          <select className="form-select" value={form.cliente_id} onChange={e => set('cliente_id', e.target.value)}>
            <option value="">Sin cliente</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>

        <div className="row g-2 mb-2">
          <div className="col-6">
            <label className="form-label">Etapa inicial</label>
            <select className="form-select" value={form.etapa_id} onChange={e => set('etapa_id', e.target.value)}>
              {etapas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
          <div className="col-6">
            <label className="form-label">Prioridad</label>
            <select className="form-select" value={form.prioridad} onChange={e => set('prioridad', e.target.value)}>
              <option value="alta">Alta</option>
              <option value="media">Media</option>
              <option value="baja">Baja</option>
            </select>
          </div>
        </div>

        <div className="mb-1">
          <label className="form-label">Descripción (opcional)</label>
          <textarea
            className="form-control"
            placeholder="Descripción del trabajo..."
            rows={3}
            value={form.descripcion}
            onChange={e => set('descripcion', e.target.value)}
          />
        </div>
      </div>
    </Modal>
  )
}
