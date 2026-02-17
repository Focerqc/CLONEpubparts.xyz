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
    isOem?: boolean;
}

/**
 * Utility to log API responses while stripping sensitive information.
 */
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

        // 1. Configuration & Defaults
        const owner = env.UPSTREAM_OWNER || 'Focerqc';
        const repo = env.UPSTREAM_REPO || 'CLONEpubparts.xyz';
        const baseBranch = env.BASE_BRANCH || 'master';
        const filePath = 'src/util/parts.ts';

        // 2. Rate Limit Check (Early)
        const lastSub = await env.SUBMIT_RATE_LIMIT.get(clientIP);
        if (lastSub && now - parseInt(lastSub) < 60000) {
            return new Response(JSON.stringify({
                error: "Rate limit exceeded. Please wait 60 seconds between submissions."
            }), {
                status: 429,
                headers: { "Content-Type": "application/json" }
            }) as any;
        }

        // 3. Parse & Validate Body
        const body = await request.json() as { parts: PartData[], hp_field?: string };
        const { parts, hp_field } = body;

        // Honeypot check
        if (hp_field) {
            return new Response(JSON.stringify({ success: true, message: "Accepted" }), { status: 200 }) as any;
        }

        if (!parts || !Array.isArray(parts) || parts.length === 0) {
            return new Response(JSON.stringify({ error: "No parts provided for submission." }), { status: 400 }) as any;
        }

        for (const part of parts) {
            if (!part.title || !part.platform?.length || !part.typeOfPart?.length || !part.externalUrl) {
                return new Response(JSON.stringify({
                    error: `Part "${part.title || 'Unknown'}" is missing required fields.`
                }), { status: 400 }) as any;
            }
        }

        // --- GitHub Workflow ---
        const token = env.GITHUB_TOKEN;
        const apiHeaders = {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Cloudflare-Pages-Function'
        };

        // A. Get Base SHA
        const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`, { headers: apiHeaders });
        await logGitHubResponse("Get Base Ref", refRes);
        if (!refRes.ok) throw new Error(`Failed to access upstream repository (${refRes.status}).`);
        const refData = (await refRes.json()) as { object: { sha: string } };
        const baseSha = refData.object.sha;

        // B. Check if Branch exists (Collision detection, though unlikely with timestamp)
        const branchName = `bulk-add-${Date.now()}`;
        const checkBranchRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches/${branchName}`, { headers: apiHeaders });
        if (checkBranchRes.status !== 404) {
            throw new Error("Temporary branch collision detected. Please try again.");
        }

        // C. Create Branch
        const branchRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
            method: 'POST',
            headers: apiHeaders,
            body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: baseSha }),
        });
        await logGitHubResponse("Create Branch", branchRes);
        if (!branchRes.ok) throw new Error("Could not create transition branch in GitHub.");

        // D. Get Current Content
        const contentRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branchName}`, { headers: apiHeaders });
        if (!contentRes.ok) throw new Error("Could not retrieve parts database for patching.");
        const contentData = (await contentRes.json()) as { content: string; sha: string };
        const base64Content = contentData.content;
        const fileSha = contentData.sha;

        let currentContent = decodeURIComponent(escape(atob(base64Content)));

        // E. Patch Content
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
            partsToAddString += `, \n${JSON.stringify(finalEntry, null, 2)}`;
        }

        const updatedContent = currentContent.replace(/\]\s*as\s*ItemData\[\]/, `${partsToAddString}\n] as ItemData[]`);
        const newBase64Content = btoa(unescape(encodeURIComponent(updatedContent)));

        // F. Commit File
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
        await logGitHubResponse("Commit Changes", commitRes);
        if (!commitRes.ok) throw new Error("GitHub rejected the database commit.");

        // G. Create Pull Request (with robust error handling)
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

        const prData = await logGitHubResponse("Create PR", prRes);

        if (prRes.ok) {
            await env.SUBMIT_RATE_LIMIT.put(clientIP, now.toString());
            return new Response(JSON.stringify({
                success: true,
                prUrl: (prData as { html_url: string }).html_url
            }), {
                headers: { 'Content-Type': 'application/json' }
            }) as any;
        } else {
            // Handle specific PR errors
            const manualUrl = `https://github.com/${owner}/${repo}/compare/${baseBranch}...${branchName}?expand=1`;

            if (prRes.status === 403 || prRes.status === 422) {
                // Return success but with manual URL because the branch exists
                return new Response(JSON.stringify({
                    success: true,
                    prUrl: null,
                    manualUrl,
                    warning: "Branch pushed, but PR creation failed due to token permissions."
                }), {
                    headers: { 'Content-Type': 'application/json' }
                }) as any;
            } else if (prRes.status === 429) {
                return new Response(JSON.stringify({
                    error: "GitHub is currently rate limiting submissions. Your changes are saved to a branch, but you may need to open the PR manually.",
                    manualUrl
                }), {
                    status: 429,
                    headers: { 'Content-Type': 'application/json' }
                }) as any;
            }

            throw new Error(`PR automation failed (${prRes.status}).`);
        }

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        }) as any;
    }
};