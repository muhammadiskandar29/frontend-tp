import React from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import ArticleClient from "./ArticleClient";
import { getBackendUrl } from "@/config/api";

const LOG = (...args) => console.log("[ARTICLE]", ...args);
const ERR = (...args) => console.error("[ARTICLE][ERROR]", ...args);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * 🥇 ARTICLE FETCH
 * Fetching as a public guest (no token) to ensure draft/public access.
 */
async function getArticle(slug) {
    if (!slug) return null;
    const url = getBackendUrl(`post/slug/${slug}`);

    try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
            // Fallback: try fetching by ID if slug fails
            const resId = await fetch(getBackendUrl(`post/${slug}`), { cache: "no-store" });
            if (!resId.ok) return null;
            const jsonId = await resId.json();
            return jsonId?.data ?? null;
        }
        const json = await res.json();
        return json?.data ?? null;
    } catch (e) {
        ERR("Fetch error:", e);
        return null;
    }
}

/**
 * 🥈 METADATA
 * Next.js 15+ requires params to be awaited here too.
 */
export async function generateMetadata({ params }) {
    const { slug } = await params;
    if (!slug) return { title: "Article | Ternak Properti" };

    return {
        title: "Article | Ternak Properti",
    };
}

/**
 * 🥉 MAIN PAGE
 */
export default async function PublicArticlePage({ params }) {
    headers(); // force dynamic

    // 🔥 PENTING: Untuk Next.js 15+, params HARUS di-await.
    const awaitedParams = await params;
    const { slug } = awaitedParams;

    if (!slug) {
        LOG("Slug not found in route params");
        notFound();
    }

    LOG("Processing article for slug:", slug);
    const data = await getArticle(slug);

    if (!data) {
        LOG("Article data not found in backend for slug:", slug);
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="text-center p-8 max-w-md">
                    <div className="mb-4 text-red-500 text-6xl">⚠️</div>
                    <h1 className="text-2xl font-bold text-gray-800">Artikel Tidak Ditemukan</h1>
                    <p className="text-gray-500 mt-2">Server tidak dapat menemukan konten untuk slug: <strong>{slug}</strong></p>
                    <a href="/sales/bonus" className="mt-8 inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">
                        Kembali ke Dashboard
                    </a>
                </div>
            </div>
        );
    }

    // Success: Render the actual Article Client component
    return <ArticleClient article={{
        title: data.title,
        author: data.author || "Ternak Properti Team",
        date: data.create_at || "Just now",
        content: data.content
    }} />;
}
