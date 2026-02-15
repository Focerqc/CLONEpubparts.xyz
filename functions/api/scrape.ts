
export const onRequestGet = async (context: any) => {
    const { request } = context;
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
        return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const res = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            }
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch URL: ${res.status}`);
        }

        const html = await res.text();

        // Simple regex-based scraping
        const getMeta = (prop: string) => {
            const match = html.match(new RegExp(`<meta[^>]*property="${prop}"[^>]*content="([^"]*)"`, 'i')) ||
                html.match(new RegExp(`<meta[^>]*name="${prop}"[^>]*content="([^"]*)"`, 'i'));
            return match ? match[1].replace(/&quot;/g, '"') : '';
        };

        const title = getMeta('og:title') || getMeta('twitter:title') || (html.match(/<title>([^<]*)<\/title>/i)?.[1] || '');
        const image = getMeta('og:image') || getMeta('twitter:image');
        const description = getMeta('og:description') || getMeta('description');

        return new Response(JSON.stringify({
            title: title.trim(),
            imageSrc: image,
            description: description.trim()
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message || 'Scraping failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
