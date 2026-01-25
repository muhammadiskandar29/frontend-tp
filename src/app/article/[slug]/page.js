import React from "react";
import { headers } from "next/headers";
import ArticleClient from "./ArticleClient";
import { getBackendUrl } from "@/config/api";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * 🥇 PURE PUBLIC FETCH - Tanpa Token, Persis Postman
 * Menghindari backend masuk ke mode private yang memblokir draft publik
 */
async function getArticle(slug) {
    if (!slug) {
        console.error("[ARTICLE] slug from params is UNDEFINED!");
        return null;
    }

    const fetchOptions = {
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        cache: 'no-store'
    };

    try {
        const url = getBackendUrl(`post/slug/${slug}`);
        console.log("[ARTICLE] Fetching URL:", url);

        const res = await fetch(url, fetchOptions);

        if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
                console.log("[ARTICLE] Success on Public Fetch!");
                return json.data;
            }
        }

        // Fallback jika slug tidak ketemu, coba ID
        console.warn("[ARTICLE] Slug not found, trying ID fallback...");
        const resId = await fetch(getBackendUrl(`post/${slug}`), fetchOptions);
        if (resId.ok) {
            const jsonId = await resId.json();
            if (jsonId.success) return jsonId.data;
        }

    } catch (err) {
        console.error("[ARTICLE] Critical Error Fetching:", err);
    }
    return null;
}

export async function generateMetadata({ params }) {
    // 🥈 Perbaiki params: SESUAI SARAN, JANGAN PAKE AWAIT
    const { slug } = params;
    const data = await getArticle(slug);

    if (!data) return { title: "Article Not Found" };

    return {
        title: `${data.title} | Ternak Properti`,
        description: data.meta_description || data.title,
    };
}

export default async function PublicArticlePage({ params }) {
    headers(); // Force Dynamic

    // 🥈 Perbaiki params: SESUAI SARAN, JANGAN PAKE AWAIT
    const { slug } = params;
    console.log("[ARTICLE] Render Page for Slug:", slug);

    const data = await getArticle(slug);

    if (!data) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="text-center p-8 max-w-md">
                    <div className="mb-4 text-red-500">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Artikel Tidak Ditemukan</h1>
                    <p className="text-gray-500 mt-2">Server tidak dapat menemukan konten untuk alamat ini.</p>
                    <div className="mt-4 p-3 bg-gray-50 rounded text-xs font-mono text-gray-400">
                        Slug: {String(slug)}
                    </div>
                    <a href="/sales/bonus" className="mt-6 inline-block w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition">
                        Kembali ke Dashboard
                    </a>
                </div>
            </div>
        );
    }

    return <ArticleClient article={{
        title: data.title,
        author: data.author || "Ternak Properti Team",
        date: data.create_at || "Just now",
        content: data.content
    }} />;
}
