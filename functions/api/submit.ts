import type { KVNamespace, PagesFunction } from "@cloudflare/workers-types";

interface Env {
    GITHUB_TOKEN: string;
    SUBMIT_RATE_LIMIT: KVNamespace;
}

interface PartData {
    title: string;
    imageSrc: string;
    platform: string[];
    fabricationMethod: string[];
    typeOfPart: string[];
    dropboxUrl: string;
    dropboxZipLastUpdated: string;
    externalUrl: string;
    isOem?: boolean;
}

export const onRequestPost: PagesFunction<Env> = async (context): Promise<any> => {
    const { request, env } = context;

    try {
        const clientIP = request.headers.get("cf-connecting-ip") || "anonymous";
        const now = Date.now();

        // 1. Rate Limit Check (Early)
        const lastSub = await env.SUBMIT_RATE_LIMIT.get(clientIP);
        if (lastSub && now - parseInt(lastSub) < 60000) {
            return new Response(JSON.stringify({ error: "Slow down! One submission per minute please." }), {
                status: 429,
                headers: { "Content-Type": "application/json" }
            }) as any;
        }

        // 2. Parse Body
        const body = await request.json() as { parts: PartData[], hp_field?: string };
        const { parts, hp_field } = body;

        // 3. Honeypot check
        if (hp_field) {
            return new Response(JSON.stringify({ success: true, message: "Accepted" }), { status: 200 }) as any;
        }

        if (!parts || !Array.isArray(parts) || parts.length === 0) {
            return new Response(JSON.stringify({ error: "No parts provided" }), { status: 400 }) as any;
        }

        // 4. Validate Batch
        for (const part of parts) {
            if (!part.title || !part.platform?.length || !part.typeOfPart?.length || !part.externalUrl) {
                return new Response(JSON.stringify({ error: `Part "${part.title || 'Unknown'}" is missing required fields.` }), { status: 400 }) as any;
            }
        }

        // --- GitHub Workflow (Batched) ---
        const token = env.GITHUB_TOKEN;
        const owner = 'Focerqc';
        const repo = 'CLONEpubparts.xyz';
        const baseBranch = 'master';
        const filePath = 'src/util/parts.ts';
        const apiHeaders = {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Cloudflare-Pages-Function'
        };

        // Get Base SHA
        const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`, { headers: apiHeaders });
        if (!refRes.ok) throw new Error(`Failed to get base SHA: ${refRes.status}`);
        const refData = (await refRes.json()) as { object: { sha: string } };
        const baseSha = refData.object.sha;

        // Create Branch (Unique for the batch)
        const branchName = `bulk-add-${Date.now()}`;
        const branchRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
            method: 'POST',
            headers: apiHeaders,
            body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: baseSha }),
        });
        if (!branchRes.ok) throw new Error(`Failed to create branch: ${branchRes.status}`);

        // Get Current Content of parts.ts
        const contentRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branchName}`, { headers: apiHeaders });
        if (!contentRes.ok) throw new Error(`Failed to fetch file: ${contentRes.status}`);
        const contentData = (await contentRes.json()) as { content: string; sha: string };
        const base64Content = contentData.content;
        const fileSha = contentData.sha;

        let currentContent = decodeURIComponent(escape(atob(base64Content)));

        // Format each part and append to a block
        let partsToAddString = "";
        for (const part of parts) {
            // Add OEM PART to tags if checked
            const tags = [...part.typeOfPart];
            if (part.isOem && !tags.includes("OEM PART")) {
                tags.push("OEM PART");
            }

            const finalEntry = {
                title: part.title.trim(),
                fabricationMethod: part.fabricationMethod || ['3d Printed'],
                typeOfPart: tags,
                imageSrc: part.imageSrc || '',
                externalUrl: part.externalUrl,
                dropboxUrl: part.dropboxUrl || '',
                dropboxZipLastUpdated: part.dropboxZipLastUpdated || new Date().toISOString().split('T')[0],
                platform: part.platform,
            };
            partsToAddString += `, \n${JSON.stringify(finalEntry, null, 2)}`;
        }

        // Insert into the array in parts.ts
        const updatedContent = currentContent.replace(/\]\s*as\s*ItemData\[\]/, `${partsToAddString}\n] as ItemData[]`);
        const newBase64Content = btoa(unescape(encodeURIComponent(updatedContent)));

        // Commit File
        const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
            method: 'PUT',
            headers: apiHeaders,
            body: JSON.stringify({
                message: `Bulk add ${parts.length} parts`,
                content: newBase64Content,
                sha: fileSha,
                branch: branchName,
            }),
        });
        if (!commitRes.ok) throw new Error(`Commit failed: ${commitRes.status}`);

        // Open One PR for the whole batch
        const prRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
            method: 'POST',
            headers: apiHeaders,
            body: JSON.stringify({
                title: `Batch Submission: ${parts.length} New Parts`,
                head: branchName,
                base: baseBranch,
                body: `Bulk submission via ESK8CAD.com.\n\nParts submitted:\n${parts.map(p => `- ${p.title} (${p.externalUrl})`).join('\n')}`,
            }),
        });

        if (prRes.ok) {
            const prData = (await prRes.json()) as { html_url: string };
            // 5. Rate Limit only after success
            await env.SUBMIT_RATE_LIMIT.put(clientIP, now.toString());
            return new Response(JSON.stringify({ success: true, prUrl: prData.html_url }), {
                headers: { 'Content-Type': 'application/json' }
            }) as any;
        } else {
            throw new Error(`PR creation failed: ${prRes.status}`);
        }

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        }) as any;
    }
};