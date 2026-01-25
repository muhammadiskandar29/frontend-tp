import React from "react";
import { headers } from "next/headers";
import ArticleClient from "./ArticleClient";
import { getBackendUrl } from "@/config/api";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Fetch article data from backend
 */
async function getArticle(slug) {
    if (!slug) return null;

    // Pastikan slug bersih dari karakter aneh URL (seperti tanda strip atau spasi ter-encode)
    const cleanSlug = decodeURIComponent(slug);

    try {
        const url = getBackendUrl(`post/slug/${cleanSlug}`);
        const res = await fetch(url, {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            cache: 'no-store'
        });

        if (!res.ok) {
            // Coba fallback jika slug gagal, mungkin ID?
            const fallbackUrl = getBackendUrl(`post/${cleanSlug}`);
            const fallbackRes = await fetch(fallbackUrl, { cache: 'no-store' });
            if (!fallbackRes.ok) return null;
            const fallbackJson = await fallbackRes.json();
            return (fallbackJson.success && fallbackJson.data) ? fallbackJson.data : null;
        }

        const json = await res.json();
        return (json.success && json.data) ? json.data : null;
    } catch (err) {
        console.error("[SERVER ARTICLE] Error fetching article:", err);
        return null;
    }
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const data = await getArticle(slug);

    if (!data) return { title: "Article Not Found | Ternak Properti" };

    return {
        title: `${data.title} | Ternak Properti`,
        description: data.meta_description || data.title,
        openGraph: {
            title: data.title,
            description: data.meta_description || data.title,
            type: 'article',
        }
    };
}

export default async function PublicArticlePage({ params }) {
    headers(); // Matikan browser cache (rely on next.config.js as well)

    const { slug } = await params;
    const data = await getArticle(slug);

    if (!data) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-100 max-w-md">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    </div>
                    <p className="text-xl font-bold text-slate-800 mb-2">Artikel Tidak Ditemukan</p>
                    <p className="text-slate-500 mb-2">Maaf, kami tidak bisa menemukan artikel dengan alamat tersebut.</p>
                    <p className="text-xs text-slate-400 font-mono mb-6">Slug: {decodeURIComponent(slug)}</p>
                    <a
                        href="/sales/bonus"
                        className="inline-block px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition font-bold"
                    >
                        Kembali ke Dashboard
                    </a>
                </div>
            </div>
        );
    }

    // Map data ke format yang diharapkan ArticleClient agar konsisten
    const formattedArticle = {
        title: data.title,
        author: data.author || "Ternak Properti Team",
        date: data.create_at || "Baru saja",
        content: data.content
    };

    return <ArticleClient article={formattedArticle} />;
}
