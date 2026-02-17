import type { KVNamespace, PagesFunction } from "@cloudflare/workers-types";

// 1. Define the Interface so TypeScript knows about your KV
interface Env {
    SUBMIT_RATE_LIMIT: KVNamespace;
}

// 2. Use the PagesFunction type with your Env interface
export const onRequestPost: PagesFunction<Env> = async (context): Promise<any> => {
    const { request, env } = context;

    try {
        // Get user IP securely from Cloudflare headers
        const ip = request.headers.get("cf-connecting-ip") || "anonymous";
        const now = Date.now();

        // Check rate limit in KV
        const lastSub = await env.SUBMIT_RATE_LIMIT.get(ip);
        if (lastSub && now - parseInt(lastSub) < 60000) {
            return new Response(JSON.stringify({ error: "Slow down! One submission per minute please." }), {
                status: 429,
                headers: { "Content-Type": "application/json" }
            }) as any;
        }

        // Capture the form data
        const formData = await request.formData();

        // HONEYPOT CHECK: If 'hp_field' has any value, it's a bot
        if (formData.get("hp_field")) {
            return new Response(JSON.stringify({ success: true, message: "Accepted" }), { status: 200 }) as any;
        }

        // Proceed with your existing GitHub PR logic here...
        // (Ensure you save the new timestamp to KV after a successful PR)
        await env.SUBMIT_RATE_LIMIT.put(ip, now.toString());

        return new Response(JSON.stringify({ success: true }), { status: 200 }) as any;

    } catch (error: unknown) {
        // Fix for "Object is of type unknown" error
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return new Response(JSON.stringify({ error: errorMessage }), { status: 500 }) as any;
    }
};