"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import "@/styles/customer/cstdashboard.css"; // Reuse dashboard styles for member-card

export default function MemberPage() {
    const params = useParams();
    const { id } = params;
    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        // Simulasi fetch data atau fetch real data jika ada endpoint public
        // Karena ini halaman public (untuk scan QR), kita asumsikan ada endpoint public atau kita fetch data customer
        // dan tampilkan jika user yang login sama, atau ini halaman verified member public.

        // Untuk saat ini kita simulasi display dulu
        async function fetchMember() {
            try {
                // TODO: Ganti dengan endpoint real fetch member by ID
                // const res = await fetch(`/api/member/${id}`);
                // const data = await res.json();

                // Mock data semnetara
                setMember({
                    id: id,
                    nama: "Member Verified",
                    status: "BASIC",
                    joinDate: new Date().toLocaleDateString()
                });
            } catch (err) {
                setError("Member tidak ditemukan");
            } finally {
                setLoading(false);
            }
        }

        if (id) {
            fetchMember();
        }
    }, [id]);

    if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    if (error) return <div className="flex items-center justify-center min-h-screen text-red-500">{error}</div>;

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="max-w-md w-full">
                <h1 className="text-2xl font-bold text-center mb-8 text-gray-800">Kartu Member Ternak Properti</h1>

                <div className="member-card">
                    <div className="member-card__top">
                        <div className="member-card__brand">TERNAK PROPERTI</div>
                        <div className="member-card__qr">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
                                <path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5H15zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h3v2h-3v-2zm-3 0h2v3h-2v-3zm3 3h3v3h-3v-3zm-3 3h2v3h-2v-3z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" style={{ color: '#000' }} />
                            </svg>
                        </div>
                    </div>

                    <div className="member-card__body">
                        <div className="member-card__label">MEMBER ID</div>
                        <div className="member-card__number">
                            {(() => {
                                const str = String(id).padStart(12, '0');
                                return str.match(/.{1,4}/g).join(' ');
                            })()}
                        </div>
                    </div>

                    <div className="member-card__footer">
                        <div style={{ maxWidth: "70%" }}>
                            <div className="member-card__label">CARDHOLDER</div>
                            <div className="member-card__holder-name">
                                {member.nama}
                            </div>
                        </div>

                        <div className="member-card__status">
                            <div className="member-card__label">MEMBER</div>
                            <div className="member-card__status-value">{member.status}</div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center text-gray-500 text-sm">
                    <p>© 2026 Ternak Properti. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}
