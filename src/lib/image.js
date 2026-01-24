/**
 * Image Utilities
 * Centralized image URL building and handling
 */

/**
 * Build image URL from backend path
 * Backend returns path without "storage/" prefix, e.g., "produk/header/xxx.png"
 * This function returns a proxy URL: /api/image?path=...
 * Proxy handler (src/app/api/image/route.js) adds /storage/ prefix and fetches from BACKEND_URL
 */
export const buildImageUrl = (path) => {
    if (!path) return "";
    if (typeof path !== "string") return "";

    // If already a full URL with https, or a blob/data URL, return directly
    if (
        path.startsWith("https://") ||
        path.startsWith("http://") ||
        path.startsWith("blob:") ||
        path.startsWith("data:")
    ) {
        return path;
    }

    // Clean path
    let cleanPath = path;

    // If path is full HTTP URL, extract pathname
    if (path.startsWith("http://")) {
        try {
            const url = new URL(path);
            // If it's already an absolute URL to the backend, we still want to proxy it
            // to avoid Mixed Content (HTTPS -> HTTP) issues on Vercel
            cleanPath = url.pathname;
        } catch {
            cleanPath = path;
        }
    }

    // Normalize backslashes (for Windows paths)
    cleanPath = cleanPath.replace(/\\/g, "/");

    // Remove leading slash
    cleanPath = cleanPath.replace(/^\/+/, "");

    // Remove "storage/" prefix if already there (proxy will add it)
    cleanPath = cleanPath.replace(/^storage\//, "");

    // Remove double slashes
    cleanPath = cleanPath.replace(/\/+/g, "/");

    // Encode URL
    const encodedPath = encodeURIComponent(cleanPath);

    // Use proxy to avoid mixed content HTTPS/HTTP
    return `/api/image?path=${encodedPath}`;
};

/**
 * Resolve header source from various possible formats
 */
export const resolveHeaderSource = (header) => {
    if (!header) return "";
    let rawPath = "";
    if (typeof header === "string") {
        rawPath = header;
    } else if (header?.path && typeof header.path === "string") {
        rawPath = header.path;
    } else if (header?.value && typeof header.value === "string") {
        rawPath = header.value;
    }

    if (rawPath) {
        rawPath = rawPath.replace(/\\/g, '/');
    }

    return buildImageUrl(rawPath);
};
