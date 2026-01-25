import React from "react";
import { headers } from "next/headers";
import ArticleClient from "./ArticleClient";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getArticle(slug) {
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.ternakproperti.com";
    try {
        const res = await fetch(`${baseUrl}/api/post/slug/${slug}`, {
            headers: {
                "Content-Type": "application/json",
            },
            cache: 'no-store'
        });

        if (!res.ok) return null;

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
        return null;
    } catch (err) {
        console.error("Fetch article error:", err);
        return null;
    }
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const article = await getArticle(slug);

    if (!article) {
        return {
            title: "Article Not Found",
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
    headers(); // Force request-bound dynamic rendering and prevent browser caching
    const { slug } = await params;
    const article = await getArticle(slug);

    if (!article) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-xl font-bold text-slate-800 mb-2">Artikel Tidak Ditemukan</p>
                    <p className="text-slate-500">Maaf, artikel yang Anda cari tidak tersedia atau telah dihapus.</p>
                </div>
            </div>
        );
    }

    return <ArticleClient article={article} />;
}
