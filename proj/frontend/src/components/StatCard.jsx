export default function StatCard({ icon: Icon, label, value, tone = "action" }) {
  return (
    <div className="stat-card" role="group" aria-label={`${label}: ${value}`}>
      <div className="stat-card-top">
        <span className="stat-card-label">{label}</span>
        <div className={`stat-card-icon tone-${tone}`} aria-hidden="true">
          <Icon />
        </div>
      </div>
      <div className="stat-card-value">{value}</div>
    </div>
  );
}
