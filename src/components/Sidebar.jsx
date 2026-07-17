import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const navItems = [
  { label: 'Dashboard',     icon: 'bi-grid',         path: '/dashboard' },
  { label: 'Trabajos',      icon: 'bi-briefcase',    path: '/trabajos' },
  { label: 'Clientes',      icon: 'bi-people',       path: '/clientes' },
  { label: 'Configuración', icon: 'bi-gear',         path: '/configuracion' },
]

export function Sidebar({ etapas = [], user, mobileOpen, onClose }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [username, setUsername] = useState('')

  useEffect(() => {
    if (user?.id) {
      supabase.from('perfiles').select('username').eq('id', user.id).single()
        .then(({ data }) => { if (data) setUsername(data.username) })
    }
  }, [user])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const handleNav = (path) => {
    navigate(path)
    if (onClose) onClose()
  }

  const initials = username ? username.slice(0, 2).toUpperCase() : (user?.email?.slice(0, 2).toUpperCase() || 'U')

  return (
    <aside className={`sidebar${mobileOpen ? ' mobile-open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <i className="bi bi-layout-text-sidebar-reverse" style={{ color: '#6B5CE7', fontSize: 14 }} />
        </div>
        <div className="sidebar-logo-text">
          <span>Flow</span><span>Canvas</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <div
            key={item.path}
            className={`sidebar-nav-item${location.pathname === item.path ? ' active' : ''}`}
            onClick={() => handleNav(item.path)}
          >
            <i className={`bi ${item.icon}`} style={{ fontSize: 16, flexShrink: 0 }} />
            <span>{item.label}</span>
          </div>
        ))}
      </nav>

      {/* Flujo actual */}
      {etapas.length > 0 && (
        <div className="sidebar-flow">
          <div className="sidebar-flow-label">Flujo actual</div>
          {etapas.map((e, i) => (
            <div key={e.id} className="sidebar-flow-item">
              <div className="sidebar-flow-dot" style={{ background: e.color }} />
              <span className="sidebar-flow-name">{e.nombre}</span>
              {i < etapas.length - 1 && <div className="sidebar-flow-line" />}
            </div>
          ))}
          <button className="sidebar-edit-btn" onClick={() => handleNav('/configuracion')}>
            <i className="bi bi-pencil" style={{ fontSize: 11 }} />
            <span>Editar flujo</span>
          </button>
        </div>
      )}

      {/* Usuario */}
      <div className="sidebar-user">
        <div className="sidebar-user-avatar">{initials}</div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">@{username || 'usuario'}</div>
          <div className="sidebar-user-role">Administrador</div>
        </div>
        <div className="sidebar-logout" onClick={handleLogout} title="Cerrar sesión">
          <i className="bi bi-box-arrow-right" style={{ fontSize: 15 }} />
        </div>
      </div>
    </aside>
  )
}
