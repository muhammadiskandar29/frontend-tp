"use client";

export default function StatsSection({ stats, isLoading }) {
  return (
    <section className="stats-section">
      <div className="stats-section__header">
        <h2>Ringkasan</h2>
        <p>Overview aktivitas pembelajaran Anda</p>
      </div>
      
      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.id} className="stat-card">
            <div className="stat-card__icon-wrapper">
              <div className="stat-icon">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}


