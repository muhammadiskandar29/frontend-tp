export default async function Page({ params }) {
    // MOMENT OF TRUTH: Await params karena ini Next.js 16
    const awaitedParams = await params;

    return (
        <pre style={{ padding: 40, fontSize: '20px', background: '#000', color: '#0f0' }}>
            PROMISE RESOLVED: {JSON.stringify(awaitedParams, null, 2)}
        </pre>
    );
}
