"use client";

import { useRouter } from "next/navigation";
import { Check, Info, ShieldAlert, ShieldCheck } from "lucide-react";

export default function VerificationCard({ isVerified }) {
    const router = useRouter();

    if (isVerified === null || isVerified === undefined) return null;

    return (
        <>
            <div className={`status-card ${isVerified ? 'status-verified' : 'status-unverified'}`}>
                <div className={`status-icon ${isVerified ? 'icon-verified' : 'icon-unverified'}`}>
                    {isVerified ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
                </div>
                <div className="status-content">
                    <p className="status-label">STATUS AKUN</p>
                    <h3 className="status-value">{isVerified ? "TERVERIFIKASI" : "BELUM VERIFIKASI"}</h3>
                    {!isVerified && (
                        <button
                            onClick={() => router.push('/customer/otp')}
                            className="verify-now-btn"
                        >
                            Verifikasi Sekarang &rarr;
                        </button>
                    )}
                </div>
            </div>

            <style jsx>{`
        .status-card {
           display: inline-flex;
           align-items: flex-start;
           gap: 1rem;
           padding: 1.25rem;
           border-radius: 16px;
           width: 100%;
           max-width: 400px;
           box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
           border: 1px solid;
           background: white;
           transition: transform 0.2s;
           margin-top: 1rem;
        }

        .status-verified {
           background: #f0fdf4; /* Green-50 */
           border-color: #bbf7d0;
        }

        .status-unverified {
           background: #fef2f2; /* Red-50 */
           border-color: #fca5a5;
        }

        .status-icon {
           display: flex;
           align-items: center;
           justify-content: center;
           width: 48px; 
           height: 48px;
           border-radius: 12px;
           flex-shrink: 0;
        }
        
        .icon-verified { background: #dcfce7; color: #16a34a; }
        .icon-unverified { background: #fee2e2; color: #dc2626; }

        .status-content {
           display: flex;
           flex-direction: column;
           flex: 1;
        }

        .status-label {
           font-size: 0.75rem;
           font-weight: 700;
           letter-spacing: 0.05em;
           color: #64748b;
           margin-bottom: 0.25rem;
           text-transform: uppercase;
        }

        .status-value {
           font-size: 1.25rem;
           font-weight: 800;
           margin: 0;
           line-height: 1.2;
        }
        
        .status-verified .status-value { color: #15803d; }
        .status-unverified .status-value { color: #b91c1c; }
        
        .verify-now-btn {
           margin-top: 0.75rem;
           background: #dc2626;
           color: white;
           border: none;
           padding: 0.5rem 1rem;
           border-radius: 8px;
           font-size: 0.875rem;
           font-weight: 600;
           cursor: pointer;
           width: fit-content;
           display: inline-flex;
           align-items: center;
           gap: 0.5rem;
           transition: background 0.2s;
           box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
        }
        .verify-now-btn:hover { background: #b91c1c; }
      `}</style>
        </>
    );
}
