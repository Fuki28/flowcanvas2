export function StatCard({ icon, label, value, iconBg, iconColor, delta, deltaColor }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: iconBg }}>
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-number">{value}</div>
        {delta && (
          <div className="stat-delta" style={{ color: deltaColor || '#9AA3B2' }}>
            {delta}
          </div>
        )}
      </div>
    </div>
  )
}
