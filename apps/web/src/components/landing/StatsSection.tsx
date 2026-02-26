const STATS = [
  { value: "<50ms", label: "Sync latency" },
  { value: "100%", label: "Conflict-free" },
  { value: "0 KB", label: "Data on our servers" },
  { value: "∞", label: "Concurrent editors" },
];

export default function StatsSection() {
  return (
    <section className="stats-section">
      <div className="container">
        <div className="stats-grid">
          {STATS.map(({ value, label }) => (
            <div key={label} className="stat-cell">
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
