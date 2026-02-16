
// Force deployment trigger: Updated scrape logic with Firecrawl and GraphQL fallback
interface Env {
    FIRECRAWL_API_KEY?: string;
}

interface ScrapeResult {
    title?: string;
    description?: string;
    image?: string;
    tags?: string[];
    error?: string;
}

export const onRequestGet = async (context: any) => {
    // Enable CORS
    if (context.request.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        });
    }

    const { request, env } = context;
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url');

    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
    };

    if (!targetUrl) {
        return new Response(JSON.stringify({ error: 'Missing url parameter', success: false }), { status: 400, headers });
    }

    // Initialize result object
    let data: ScrapeResult = {};

    try {
        // 1. Try Firecrawl (Free Tier / API)
        if (env.FIRECRAWL_API_KEY) {
            try {
                // Firecrawl /scrape endpoint with extract capabilities
                const firecrawlUrl = `https://api.firecrawl.dev/v1/scrape`;

                const response = await fetch(firecrawlUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${env.FIRECRAWL_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        url: targetUrl,
                        formats: ["extract"],
                        extract: {
                            schema: {
                                type: "object",
                                properties: {
                                    title: { type: "string" },
                                    description: { type: "string" },
                                    image: { type: "string" },
                                    tags: {
                                        type: "array",
                                        items: { type: "string" }
                                    }
                                },
                                required: ["title", "image"]
                            }
                        }
                    })
                });

                if (response.ok) {
                    const json = await response.json() as any;

                    if (json.success && json.data && json.data.extract) {
                        const extracted = json.data.extract;

                        data.title = extracted.title;
                        data.description = extracted.description;
                        data.image = extracted.image;
                        data.tags = extracted.tags;

                        return new Response(JSON.stringify({ ...data, success: true, source: 'firecrawl' }), { headers });
                    }
                } else {
                    console.log(`Firecrawl failed: ${response.status} ${response.statusText}`);
                }

            } catch (e) {
                console.error("Firecrawl error:", e);
            }
        }

        // 2. Fallback: Printables GraphQL (Always Free, No Key Required for Public Data)
        // Check if it's a Printables URL and we have an ID
        const printablesMatch = targetUrl.match(/printables\.com\/.*model\/(\d+)/i);
        if (printablesMatch && printablesMatch[1]) {
            const modelId = printablesMatch[1];
            try {
                const query = `
                    query PrintResults($id: ID!) {
                        print(id: $id) {
                            name
                            description
                            images {
                                filePath
                            }
                            tags {
                                name
                            }
                        }
                    }
                `;

                const gqlRes = await fetch('https://api.printables.com/graphql/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query,
                        variables: { id: modelId }
                    })
                });

                if (gqlRes.ok) {
                    const json = await gqlRes.json() as any;
                    const print = json?.data?.print;

                    if (print) {
                        data.title = print.name;
                        data.description = print.description; // HTML content, frontend can strip if needed

                        if (print.images && print.images.length > 0) {
                            const imgPath = print.images[0].filePath;
                            if (imgPath.startsWith('http')) {
                                data.image = imgPath;
                            } else {
                                data.image = `https://media.printables.com/${imgPath}`;
                            }
                        }

                        if (print.tags && Array.isArray(print.tags)) {
                            data.tags = print.tags.map((t: any) => t.name);
                        }

                        return new Response(JSON.stringify({ ...data, success: true, source: 'graphql' }), { headers });
                    }
                }
            } catch (e) {
                console.error("GraphQL error:", e);
            }
        }

        // If we reached here, both failed
        return new Response(JSON.stringify({
            error: 'Scrape Failed: Site is protected. Please enter the data manually or check your API credits.',
            success: false
        }), { status: 422, headers });

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message || 'Scrape failed', success: false }), {
            status: 500,
            headers
        });
    }
};
