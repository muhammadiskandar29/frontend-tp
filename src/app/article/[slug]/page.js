import React from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import ArticleClient from "./ArticleClient";
import { getBackendUrl } from "@/config/api";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * 🥇 PURE PUBLIC FETCH - Tanpa Token
 */
async function getArticle(slug) {
    if (!slug) return null;

    const fetchOptions = {
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        },
        cache: 'no-store'
    };

    try {
        const url = getBackendUrl(`post/slug/${slug}`);
        const res = await fetch(url, fetchOptions);

        if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) return json.data;
        }

        // Fallback coba ID jika slug tidak ketemu
        const resId = await fetch(getBackendUrl(`post/${slug}`), fetchOptions);
        if (resId.ok) {
            const jsonId = await resId.json();
            if (jsonId.success) return jsonId.data;
        }

    } catch (err) {
        console.error("[ARTICLE] Fetch Error:", err);
    }
    return null;
}

// ✅ SOLUSI 2 — JANGAN FETCH DI generateMetadata (TANPA AWAIT)
export async function generateMetadata({ params }) {
    const { slug } = params;

    if (!slug) {
        return { title: "Article" };
    }

    return {
        title: "Article | Ternak Properti",
    };
}

// ✅ SOLUSI 1 — HARD GUARD DI LEVEL PAGE (TANPA AWAIT)
export default async function PublicArticlePage({ params }) {
    headers(); // Force Dynamic

    const { slug } = params;

    if (!slug) {
        console.error("[ARTICLE] Slug missing from route");
        notFound(); // ⬅️ WAJIB
    }

    console.log("[ARTICLE] Rendering content for slug:", slug);
    const data = await getArticle(slug);

    if (!data) {
        console.error("[ARTICLE] Content not found for slug:", slug);
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="text-center p-8 max-w-md">
                    <div className="mb-4 text-red-500 text-6xl">⚠️</div>
                    <h1 className="text-2xl font-bold text-gray-800">Artikel Tidak Ditemukan</h1>
                    <p className="text-gray-500 mt-2">Server tidak dapat menemukan konten untuk alamat ini.</p>
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
