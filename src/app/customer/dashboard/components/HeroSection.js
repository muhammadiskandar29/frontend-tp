"use client";

export default function HeroSection({ customerInfo, isLoading }) {
  const customerName = customerInfo?.nama_panggilan || customerInfo?.nama || "Member";
  
  return (
    <div className="customer-dashboard__hero-wrapper">
      <div className="customer-dashboard__hero-content">
        <div className="customer-dashboard__hero-card">
          <div className="hero-greeting">
            <p className="customer-dashboard__subtitle">
              Kelola dan akses semua order Anda di satu tempat
            </p>
            <h1>
              {isLoading ? (
                "Selamat Datang!"
              ) : (
                <>
                  Selamat Datang,{" "}
                  <span className="hero-name">{customerName}!</span>
                </>
              )}
            </h1>
          </div>
          
          <div className="hero-value-props">
            <div className="value-prop-item">
              <div className="value-prop-icon">📚</div>
              <div>
                <strong>Akses Instan</strong>
                <p>Semua materi pembelajaran tersedia kapan saja</p>
              </div>
            </div>
            <div className="value-prop-item">
              <div className="value-prop-icon">🎯</div>
              <div>
                <strong>Progress Tracking</strong>
                <p>Pantau perkembangan belajar Anda</p>
              </div>
            </div>
            <div className="value-prop-item">
              <div className="value-prop-icon">💡</div>
              <div>
                <strong>Expert Support</strong>
                <p>Dapatkan bantuan dari mentor berpengalaman</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


