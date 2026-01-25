"use client";

import { FileText, ChevronRight, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BonusArticlesCard({ articles, isLoading }) {
    const router = useRouter();

    if (isLoading) {
        return (
            <div className="bonus-articles-container skeleton">
                <div className="skeleton-header"></div>
                <div className="skeleton-item"></div>
                <div className="skeleton-item"></div>
            </div>
        );
    }

    if (!articles || articles.length === 0) return null;

    return (
        <section className="bonus-articles-section">
            <div className="section-header">
                <div className="header-title-group">
                    <h2 className="section-title">Bonus Pembelian Eksklusif</h2>
                    <p className="section-subtitle">Daftar artikel materi pembelajaran khusus untuk Anda</p>
                </div>
            </div>

            <div className="articles-grid">
                {articles.map((article) => (
                    <div
                        key={article.id}
                        className="article-card-mini"
                        onClick={() => router.push(`/article/${article.slug}`)}
                    >
                        <div className="article-icon-box">
                            <FileText size={20} className="icon-orange" />
                        </div>
                        <div className="article-info">
                            <h3 className="article-title">{article.title}</h3>
                            <div className="article-action-text">
                                Buka Artikel <ChevronRight size={14} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
        .bonus-articles-section {
          margin-top: 2rem;
          margin-bottom: 2rem;
        }
        
        .section-header {
          margin-bottom: 1.25rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #1e293b;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .section-subtitle {
          font-size: 0.875rem;
          color: #64748b;
          margin: 4px 0 0 0;
        }

        .articles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 1rem;
        }

        .article-card-mini {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .article-card-mini:hover {
          border-color: #f59e0b;
          box-shadow: 0 10px 15px -3px rgba(245, 158, 11, 0.1);
          transform: translateY(-2px);
        }

        .article-icon-box {
          width: 48px;
          height: 48px;
          background: #fffbeb;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .icon-orange {
          color: #d97706;
        }

        .article-info {
          flex: 1;
          min-width: 0;
        }

        .article-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .article-action-text {
          font-size: 0.75rem;
          color: #d97706;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 2px;
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Skeleton Loading */
        .bonus-articles-container.skeleton {
          margin-top: 2rem;
        }
        .skeleton-header {
          height: 40px;
          width: 300px;
          background: #e2e8f0;
          border-radius: 4px;
          margin-bottom: 20px;
          animation: pulse 2s infinite;
        }
        .skeleton-item {
          height: 80px;
          width: 100%;
          background: #edf2f7;
          border-radius: 12px;
          margin-bottom: 12px;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @media (max-width: 640px) {
          .articles-grid {
            grid-template-columns: 1fr;
          }
          .section-title {
            font-size: 1.25rem;
          }
        }
      `}</style>
        </section>
    );
}
