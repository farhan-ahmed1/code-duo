const STATS = [
  { value: "CRDT", label: "Conflict-free model" },
  { value: "15+", label: "Supported languages" },
  { value: "SQLite", label: "Persistent snapshots" },
  { value: "IndexedDB", label: "Offline local cache" },
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
