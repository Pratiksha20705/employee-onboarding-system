import { ChevronRight } from "lucide-react";

export default function Pipeline({ stages }) {
  return (
    <div className="pipeline">
      {stages.map((stage, i) => (
        <div key={stage.key} style={{ display: "flex", alignItems: "stretch", flex: 1 }}>
          <div className={`pipeline-stage accent-${i + 1}`}>
            <span className="pipeline-stage-count">{stage.count}</span>
            <span className="pipeline-stage-label">{stage.label}</span>
            <span className="pipeline-stage-sub">candidates</span>
          </div>
          {i < stages.length - 1 && (
            <span className="pipeline-arrow">
              <ChevronRight size={16} />
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
