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
    if (!slug) return null;
    const url = getBackendUrl(`post/slug/${slug}`);
    LOG("Fetching article from URL:", url);

    try {
        const res = await fetch(url, { cache: "no-store" });

        // 🧪 DEBUG: Ambil raw response untuk investigasi format backend
        const rawText = await res.text();
        LOG("Backend raw response:", rawText);

        if (!res.ok) {
            LOG("Slug fetch failed, status:", res.status);
            // Fallback trial by ID
            const resId = await fetch(getBackendUrl(`post/${slug}`), { cache: "no-store" });
            if (!resId.ok) return null;
            const jsonId = await resId.json();
            return jsonId?.data ?? null;
        }

        const json = JSON.parse(rawText);
        return json?.data ?? null;
    } catch (e) {
        ERR("Critical fetch error:", e);
        return null;
    }
}

/**
 * 🥈 METADATA (Sync Approach for Debugging)
 */
export function generateMetadata({ params }) {
    const { slug } = params || {};
    return {
        title: slug
            ? `${slug} | Ternak Properti`
            : "Article | Ternak Properti",
    };
}

/**
 * 🥉 MAIN PAGE
 */
export default async function PublicArticlePage({ params }) {
    headers(); // force dynamic

    // Pakai plain params sesuai saran
    const { slug } = params || {};

    if (!slug) {
        LOG("Slug not found in route params");
        notFound();
    }

    LOG("Processing article for slug:", slug);
    const data = await getArticle(slug);

    if (!data) {
        LOG("Article data not found in backend for slug:", slug);
        notFound(); // ⬅️ Hasil akhir jika data null
    }

    return (
        <ArticleClient
            article={{
                title: data.title,
                author: data.author || "Ternak Properti Team",
                date: data.create_at || "Just now",
                content: data.content,
            }}
        />
    );
}
