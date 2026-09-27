export default function ProgressBar({ value, showLabel = true }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="progress-row">
      <div className="progress-track">
        <div
          className={`progress-fill ${pct >= 100 ? "complete" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && <span className="progress-row-label">{pct}%</span>}
    </div>
  );
}
