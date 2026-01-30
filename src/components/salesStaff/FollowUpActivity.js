export default function FollowUpActivity({ followUpHistory }) {
    return (
        <section className="dashboard-panels">
            <article className="panel">
                <div className="panel__header">
                    <div>
                        <h3 className="panel__title">Aktivitas Follow-Up</h3>
                        <p className="panel__subtitle">Riwayat interaksi terakhir Anda</p>
                    </div>
                </div>
                <div className="activity-feed">
                    {followUpHistory.length > 0 ? (
                        followUpHistory.map((log, idx) => (
                            <div className="activity-item" key={log.id || idx}>
                                <div className={`activity-status-dot ${log.status === "1" ? 'success' : 'failed'}`}></div>
                                <div className="activity-content">
                                    <div className="activity-meta">
                                        <span className="a-customer">{log.customer}</span>
                                        <span className="a-time">{log.tanggal}</span>
                                    </div>
                                    <p className="a-type">{log.follup}</p>
                                    <p className="a-desc">{log.keterangan?.substring(0, 60)}...</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-activity">Belum ada riwayat follow up.</div>
                    )}
                </div>
            </article>
        </section>
    );
}
