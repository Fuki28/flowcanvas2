import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const ETAPAS_PREVIEW = [
  { nombre: 'Pedido',     color: '#6B5CE7' },
  { nombre: 'Diseño',     color: '#F5A623' },
  { nombre: 'Producción', color: '#3B82F6' },
  { nombre: 'Entrega',    color: '#22C55E' },
]

function KanbanPreview() {
  return (
    <div className="kp-board">
      {ETAPAS_PREVIEW.map(col => (
        <div key={col.nombre} className="kp-col" style={{ background: col.color + '18' }}>
          <div className="kp-col-head" style={{ background: col.color }}>
            {col.nombre}
          </div>
          <div className="kp-cards">
            {[0.8, 0.6].map((w, i) => (
              <div key={i} className="kp-card">
                <div className="kp-card-dot" style={{ background: col.color }} />
                <div className="kp-card-lines">
                  <div className="kp-card-line" style={{ width: '80%' }} />
                  <div className="kp-card-line" style={{ width: `${w * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function Login() {
  const navigate = useNavigate()
  const [tab,      setTab]      = useState('login')
  const [username, setUsername] = useState('')
  const [email,    setEmail]    = useState('')
  const [pass,     setPass]     = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  // ── LOGIN con username ──
  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !pass) { setError('Ingresa tu usuario y contraseña'); return }
    setLoading(true)

    // Buscar el email asociado al username
    const { data: perfil, error: perfilErr } = await supabase
      .from('perfiles')
      .select('email')
      .eq('username', username.trim().toLowerCase())
      .single()

    if (perfilErr || !perfil) {
      setError('Usuario no encontrado')
      setLoading(false)
      return
    }

    const { error: authErr } = await supabase.auth.signInWithPassword({
      email: perfil.email,
      password: pass,
    })

    if (authErr) { setError('Contraseña incorrecta'); setLoading(false); return }
    navigate('/dashboard')
    setLoading(false)
  }

  // ── REGISTRO con username ──
  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !email.trim() || !pass) {
      setError('Todos los campos son obligatorios')
      return
    }
    if (pass.length < 6) { setError('La contraseña debe tener mínimo 6 caracteres'); return }
    setLoading(true)

    // Verificar si el username ya existe
    const { data: existing } = await supabase
      .from('perfiles')
      .select('id')
      .eq('username', username.trim().toLowerCase())
      .single()

    if (existing) { setError('Ese nombre de usuario ya está en uso'); setLoading(false); return }

    // Crear usuario en Supabase Auth
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: email.trim(),
      password: pass,
    })

    if (authErr) { setError(authErr.message); setLoading(false); return }

    // Guardar perfil con username
    if (authData.user) {
      await supabase.from('perfiles').insert([{
        id:       authData.user.id,
        username: username.trim().toLowerCase(),
        email:    email.trim(),
      }])
    }

    setLoading(false)
    setTab('login')
    setError('')
    setUsername(username.trim().toLowerCase())
    setPass('')
    alert('Cuenta creada. Ahora inicia sesión con tu usuario y contraseña.')
  }

  return (
    <div className="login-page">
      {/* Panel izquierdo */}
      <div className="login-left">
        <div className="login-form-box">
          {/* Logo */}
          <div className="login-logo">
            <div className="login-mark">
              <i className="bi bi-layout-text-sidebar-reverse" style={{ color: '#6B5CE7', fontSize: 16 }} />
            </div>
            <span style={{ fontSize: 17, fontWeight: 700 }}>
              <span style={{ color: '#1E2235' }}>Flow</span>
              <span style={{ color: '#6B5CE7' }}>Canvas</span>
            </span>
          </div>

          <div className="login-headline">
            {tab === 'login' ? <>Bienvenido a <span>FlowCanvas</span></> : <>Crea tu cuenta en <span>FlowCanvas</span></>}
          </div>
          <div className="login-sub">Organiza el flujo de trabajo de tu empresa en un solo lugar.</div>

          {/* Tabs Bootstrap */}
          <div className="login-tabs">
            <div className={`login-tab${tab === 'login' ? ' active' : ''}`} onClick={() => { setTab('login'); setError('') }}>
              Iniciar sesión
            </div>
            <div className={`login-tab${tab === 'register' ? ' active' : ''}`} onClick={() => { setTab('register'); setError('') }}>
              Crear cuenta
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-danger py-2 mb-3" style={{ fontSize: 13 }}>
              <i className="bi bi-exclamation-circle me-2" />
              {error}
            </div>
          )}

          {/* Formulario login */}
          {tab === 'login' && (
            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label className="form-label">
                  <i className="bi bi-person me-1" />
                  Usuario
                </label>
                <input
                  className="form-control"
                  placeholder="tu_usuario"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">
                  <i className="bi bi-lock me-1" />
                  Contraseña
                </label>
                <input
                  className="form-control"
                  type="password"
                  placeholder="••••••••"
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100 py-2 mt-2"
                style={{ fontSize: 14, fontWeight: 600 }}
                disabled={loading}
              >
                {loading ? <><span className="spinner-border spinner-border-sm me-2" />Cargando...</> : 'Iniciar sesión'}
              </button>
            </form>
          )}

          {/* Formulario registro */}
          {tab === 'register' && (
            <form onSubmit={handleRegister}>
              <div className="mb-3">
                <label className="form-label">
                  <i className="bi bi-person me-1" />
                  Nombre de usuario
                </label>
                <input
                  className="form-control"
                  placeholder="mi_usuario"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                />
                <div className="form-text">Solo letras, números y guiones bajos. Sin espacios.</div>
              </div>
              <div className="mb-3">
                <label className="form-label">
                  <i className="bi bi-envelope me-1" />
                  Correo electrónico
                </label>
                <input
                  className="form-control"
                  type="email"
                  placeholder="ejemplo@empresa.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">
                  <i className="bi bi-lock me-1" />
                  Contraseña
                </label>
                <input
                  className="form-control"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100 py-2 mt-2"
                style={{ fontSize: 14, fontWeight: 600 }}
                disabled={loading}
              >
                {loading ? <><span className="spinner-border spinner-border-sm me-2" />Creando cuenta...</> : 'Crear cuenta'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Panel derecho */}
      <div className="login-right">
        <div style={{ textAlign: 'center', marginBottom: 24, padding: '0 24px' }}>
          <div style={{ color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Todo tu trabajo,</div>
          <div style={{ color: '#6B5CE7', fontSize: 22, fontWeight: 700 }}>en un solo lugar.</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 8 }}>Tu flujo, tu forma.</div>
        </div>
        <KanbanPreview />
      </div>
    </div>
  )
}
