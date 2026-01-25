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

    // List of potential endpoints to try for maximum compatibility
    const endpoints = [
        `post/slug/${slug}`,  // Default slug endpoint
        `post/${slug}`,       // Potential ID or fallback endpoint
    ];

    for (const endpoint of endpoints) {
        try {
            const url = getBackendUrl(endpoint);
            console.log(`[SERVER ARTICLE] Trying fetch: ${url}`);

            const res = await fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                cache: 'no-store',
                // Adding a timeout to avoid hanging server-side
                signal: AbortSignal.timeout(10000)
            });

            if (res.ok) {
                const json = await res.json();
                if (json.success && json.data) {
                    return {
                        title: json.data.title,
                        author: json.data.author || "Ternak Properti Team",
                        date: json.data.create_at || "Just now",
                        content: json.data.content,
                        meta_description: json.data.meta_description || json.data.title
                    };
                }
            }
            console.warn(`[SERVER ARTICLE] Endpoint ${endpoint} returned status: ${res.status}`);
        } catch (err) {
            console.error(`[SERVER ARTICLE] Failed to fetch from ${endpoint}:`, err);
        }
    }

    return null;
}

export async function generateMetadata({ params }) {
    const resolvedParams = await params;
    const slug = resolvedParams?.slug;

    if (!slug) return { title: "Article Not Found" };

    const article = await getArticle(slug);

    if (!article) {
        return {
            title: "Article Not Found | Ternak Properti",
        };
    }

    return {
        title: `${article.title} | Ternak Properti`,
        description: article.meta_description,
        openGraph: {
            title: article.title,
            description: article.meta_description,
            type: 'article',
        }
    };
}

export default async function PublicArticlePage({ params }) {
    headers();

    const resolvedParams = await params;
    const slug = resolvedParams?.slug;

    const article = await getArticle(slug);

    if (!article) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-100 max-w-md">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    </div>
                    <p className="text-xl font-bold text-slate-800 mb-2">Artikel Tidak Ditemukan</p>
                    <p className="text-slate-500 mb-6">Maaf, artikel yang Anda cari tidak tersedia atau sudah tidak aktif.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    return <ArticleClient article={article} />;
}
