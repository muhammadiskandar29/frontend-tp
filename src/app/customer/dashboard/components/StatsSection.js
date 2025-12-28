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
            <div className="stat-card__content">
              <p className="stat-label">{stat.label}</p>
              <strong className="stat-value">
                {isLoading ? (
                  <span className="stat-loading">-</span>
                ) : (
                  stat.value
                )}
              </strong>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}


