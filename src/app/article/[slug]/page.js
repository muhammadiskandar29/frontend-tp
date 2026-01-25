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
 */
async function getArticle(slug) {
    LOG("Start fetching article:", slug);
    if (!slug) return null;

    const url = getBackendUrl(`post/slug/${slug}`);
    LOG("Request URL:", url);

    try {
        const res = await fetch(url, { cache: "no-store" });
        LOG("Response status:", res.status);

        if (!res.ok) {
            const raw = await res.text();
            ERR("Fetch failed raw:", raw);
            return null;
        }

        const json = await res.json();
        return json?.data ?? null;
    } catch (e) {
        ERR("Critical fetch error:", e);
        return null;
    }
}

// ✅ SOLUSI 2 — STATIC METADATA UNTUK DEBUG
export function generateMetadata({ params }) {
    return { title: "Article | Ternak Properti" };
}

// ✅ SOLUSI 1 — DIAGNOSTIC PAGE
export default async function PublicArticlePage({ params }) {
    headers(); // force dynamic

    // FAKTA: params adalah plain object di App Router Page
    const { slug } = params;

    LOG("DEBUG PARAMS:", JSON.stringify(params));

    if (!slug) {
        LOG("Slug missing from route - rendering diagnostic view");
        return (
            <div style={{ padding: '20px', fontFamily: 'monospace' }}>
                <h1>Diagnostic: Slug Missing</h1>
                <p>Params detected by Next.js:</p>
                <pre>{JSON.stringify(params, null, 2)}</pre>
            </div>
        );
    }

    LOG("Rendering content for slug:", slug);
    const data = await getArticle(slug);

    if (!data) {
        ERR("Data null for slug:", slug);
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="text-center p-8 max-w-md">
                    <div className="mb-4 text-red-500 text-6xl">⚠️</div>
                    <h1 className="text-2xl font-bold text-gray-800">Artikel Tidak Ditemukan</h1>
                    <p className="text-gray-500 mt-2">Server tidak dapat menemukan konten untuk slug: <strong>{slug}</strong></p>
                    <pre style={{ fontSize: '10px', marginTop: '20px', textAlign: 'left', background: '#f4f4f4', padding: '10px' }}>
                        Debug: {JSON.stringify(params, null, 2)}
                    </pre>
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
