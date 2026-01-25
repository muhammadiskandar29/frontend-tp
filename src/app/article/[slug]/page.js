import React from "react";
import { headers, cookies } from "next/headers";
import ArticleClient from "./ArticleClient";
import { getBackendUrl } from "@/config/api";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Fetch article data from backend with Debug Logs
 */
async function getArticle(slug) {
    if (!slug) {
        console.error("[ARTICLE] No slug provided!");
        return null;
    }

    // Debug slug original
    console.log("[ARTICLE] Original slug from params:", slug);

    try {
        // Ambil token dari cookie (PENTING untuk artikel eksklusif)
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        const fetchOptions = {
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            cache: 'no-store'
        };

        if (token) {
            fetchOptions.headers["Authorization"] = `Bearer ${token}`;
            console.log("[ARTICLE] Token found, adding to request.");
        }

        // 🔍 TRY 1: Direct Slug
        const url1 = getBackendUrl(`post/slug/${slug}`);
        console.log("[ARTICLE] Fetching Try 1:", url1);
        const res1 = await fetch(url1, fetchOptions);

        if (res1.ok) {
            const json = await res1.json();
            if (json.success && json.data) {
                console.log("[ARTICLE] Success on Try 1!");
                return json.data;
            }
        }

        // 🔍 TRY 2: Decoded Slug (just in case)
        const decodedSlug = decodeURIComponent(slug);
        if (decodedSlug !== slug) {
            const url2 = getBackendUrl(`post/slug/${decodedSlug}`);
            console.log("[ARTICLE] Fetching Try 2 (Decoded):", url2);
            const res2 = await fetch(url2, fetchOptions);
            if (res2.ok) {
                const json = await res2.json();
                if (json.success && json.data) return json.data;
            }
        }

        // 🔍 TRY 3: Fallback to ID
        const url3 = getBackendUrl(`post/${slug}`);
        console.log("[ARTICLE] Fetching Try 3 (ID Fallback):", url3);
        const res3 = await fetch(url3, fetchOptions);
        if (res3.ok) {
            const json = await res3.json();
            if (json.success && json.data) return json.data;
        }

        console.warn("[ARTICLE] All fetch attempts failed for slug:", slug);
        return null;
    } catch (err) {
        console.error("[ARTICLE] Error in getArticle:", err);
        return null;
    }
}

export async function generateMetadata({ params }) {
    // Hybrid approach for Next.js 14/15/16
    const resolvedParams = await params;
    const slug = resolvedParams?.slug || params?.slug;

    if (!slug) return { title: "Article Not Found" };

    const data = await getArticle(slug);
    if (!data) return { title: "Article Not Found | Ternak Properti" };

    return {
        title: `${data.title} | Ternak Properti`,
        description: data.meta_description || data.title
    };
}

export default async function PublicArticlePage({ params }) {
    // Force Dynamic
    headers();

    // Hybrid params handling
    const resolvedParams = await params;
    const slug = resolvedParams?.slug || params?.slug;

    console.log("[ARTICLE PAGE] Rendering for slug:", slug);

    const data = await getArticle(slug);

    if (!data) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-100 max-w-md">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    </div>
                    <p className="text-xl font-bold text-slate-800 mb-2">Artikel Tidak Ditemukan</p>
                    <p className="text-slate-500 mb-2 text-sm">Gagal memuat konten dari server.</p>
                    <div className="bg-slate-50 p-3 rounded-lg mt-4 mb-6 text-left">
                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Debug Info:</p>
                        <p className="text-xs font-mono text-slate-600 break-all">Slug: {slug || "undefined"}</p>
                    </div>
                    <a
                        href="/sales/bonus"
                        className="inline-block w-full px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition font-bold text-sm"
                    >
                        Kembali ke Dashboard
                    </a>
                </div>
            </div>
        );
    }

    return <ArticleClient article={{
        title: data.title,
        author: data.author || "Ternak Properti Team",
        date: data.create_at || "Baru saja",
        content: data.content
    }} />;
}
