export function StatCard({ icon, label, value, iconBg, iconColor, trend, trendType }) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <div className="stat-icon" style={{ background: iconBg }}>
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
        {trend && (
          <div className={`stat-trend stat-trend-${trendType || 'neutral'}`}>
            {trendType === 'up' && '↗'}
            {trendType === 'down' && '↘'}
            {trendType === 'neutral' && '—'}
            <span style={{ marginLeft: 3 }}>{trend}</span>
          </div>
        )}
      </div>
      <div>
        <div className="stat-number">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  )
}

