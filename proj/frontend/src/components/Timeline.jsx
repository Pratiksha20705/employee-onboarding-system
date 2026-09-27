export default function Timeline({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="timeline">
      {items.map((item, i) => (
        <div className="timeline-item" key={i}>
          <div className="timeline-dot-col">
            <div className="timeline-dot" />
            {i < items.length - 1 && <div className="timeline-line" />}
          </div>
          <div className="timeline-content">
            <div className="timeline-time">{item.time}</div>
            <div className="timeline-text">{item.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
