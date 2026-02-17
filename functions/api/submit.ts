import type { KVNamespace, PagesFunction } from "@cloudflare/workers-types";

interface Env {
    GITHUB_TOKEN: string;
    SUBMIT_RATE_LIMIT: KVNamespace;
    UPSTREAM_OWNER?: string;
    UPSTREAM_REPO?: string;
    BASE_BRANCH?: string;
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
    isOem: boolean;
}

const logGitHubResponse = async (label: string, response: Response) => {
    const clone = response.clone();
    try {
        const data = await clone.json();
        console.log(`[GitHub API] ${label} - Status: ${response.status}`, data);
        return data;
    } catch {
        const text = await clone.text();
        console.log(`[GitHub API] ${label} - Status: ${response.status}`, text);
        return text;
    }
};

export const onRequestPost: PagesFunction<Env> = async (context): Promise<any> => {
    const { request, env } = context;

    try {
        const clientIP = request.headers.get("cf-connecting-ip") || "anonymous";
        const now = Date.now();

        const owner = env.UPSTREAM_OWNER || 'Focerqc';
        const repo = env.UPSTREAM_REPO || 'CLONEpubparts.xyz';
        const baseBranch = env.BASE_BRANCH || 'master';
        const filePath = 'src/util/parts.ts';

        const lastSub = await env.SUBMIT_RATE_LIMIT.get(clientIP);
        if (lastSub && now - parseInt(lastSub) < 60000) {
            return new Response(JSON.stringify({
                error: "Rate limit exceeded. Please wait 60 seconds."
            }), { status: 429, headers: { "Content-Type": "application/json" } }) as any;
        }

        const body = await request.json() as { parts: PartData[], hp_field?: string };
        const { parts, hp_field } = body;

        if (hp_field) {
            return new Response(JSON.stringify({ success: true }), { status: 200 }) as any;
        }

        if (!parts || !Array.isArray(parts) || parts.length === 0) {
            return new Response(JSON.stringify({ error: "No parts provided." }), { status: 400 }) as any;
        } const token = env.GITHUB_TOKEN;
        const apiHeaders = {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Cloudflare-Pages-Function'
        };

        const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`, { headers: apiHeaders });
        if (!refRes.ok) throw new Error("Failed to access upstream repository.");
        const refData = (await refRes.json()) as { object: { sha: string } };
        const baseSha = refData.object.sha;

        const branchName = `bulk-add-${Date.now()}`;
        await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
            method: 'POST',
            headers: apiHeaders,
            body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: baseSha }),
        });

        const contentRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branchName}`, { headers: apiHeaders });
        const contentData = (await contentRes.json()) as { content: string; sha: string };
        const fileSha = contentData.sha;

        let currentContent = decodeURIComponent(escape(atob(contentData.content)));

        let partsToAddString = "";
        for (const part of parts) {
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
            partsToAddString += `,\n  ${JSON.stringify(finalEntry, null, 2)}`;
        }

        const updatedContent = currentContent.replace(/\]\s*as\s*ItemData\[\]/, `${partsToAddString}\n] as ItemData[]`);
        const newBase64Content = btoa(unescape(encodeURIComponent(updatedContent)));

        await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
            method: 'PUT',
            headers: apiHeaders,
            body: JSON.stringify({
                message: `Bulk add ${parts.length} parts via ESK8CAD`,
                content: newBase64Content,
                sha: fileSha,
                branch: branchName,
            }),
        });

        const prRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
            method: 'POST',
            headers: apiHeaders,
            body: JSON.stringify({
                title: `Batch Submission: ${parts.length} New Parts`,
                head: branchName,
                base: baseBranch,
                body: `Bulk submission via ESK8CAD.com.\n\n### Parts included:\n${parts.map(p => `- **${p.title}**: ${p.externalUrl}`).join('\n')}`,
            }),
        });

        const prData = await logGitHubResponse("Create PR", prRes);

        if (prRes.ok) {
            await env.SUBMIT_RATE_LIMIT.put(clientIP, now.toString());
            return new Response(JSON.stringify({
                success: true,
                prUrl: (prData as { html_url: string }).html_url
            }), { headers: { 'Content-Type': 'application/json' } }) as any;
        } else {
            return new Response(JSON.stringify({
                success: true,
                manualUrl: `https://github.com/${owner}/${repo}/compare/${baseBranch}...${branchName}?expand=1`,
                warning: "Branch created, but PR failed. Please open manually."
            }), { headers: { 'Content-Type': 'application/json' } }) as any;
        }

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        }) as any;
    }
};