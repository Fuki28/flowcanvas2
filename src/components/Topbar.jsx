import { Search, Plus, Menu } from 'lucide-react'

export function Topbar({ title, subtitle, onNewWork, onSearch, searchValue, onMenuClick }) {
  return (
    <div className="topbar">
      <div className="topbar-left">
        {onMenuClick && (
          <button className="hamburger-btn" onClick={onMenuClick}>
            <Menu size={22} />
          </button>
        )}
        <div>
          <div className="topbar-title">{title}</div>
          {subtitle && <div className="topbar-sub">{subtitle}</div>}
        </div>
      </div>
      <div className="topbar-right">
        {onSearch !== undefined && (
          <div className="search-box">
            <Search size={14} />
            <input
              placeholder="Buscar trabajos..."
              value={searchValue || ''}
              onChange={e => onSearch(e.target.value)}
            />
          </div>
        )}
        {onNewWork && (
          <button className="btn btn-primary" onClick={onNewWork}>
            <Plus size={15} />
            Nuevo trabajo
          </button>
        )}
      </div>
    </div>
  )
}
