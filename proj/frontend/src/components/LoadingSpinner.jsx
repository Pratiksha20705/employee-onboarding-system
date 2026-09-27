export default function LoadingSpinner({ label = "Loading…", size = "md" }) {
  return (
    <div className="loading-row">
      <span className={`spinner ${size === "lg" ? "spinner-lg" : ""}`} />
      <span>{label}</span>
    </div>
  );
}
