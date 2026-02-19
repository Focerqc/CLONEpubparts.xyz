import { Octokit } from "octokit";
import { getNextId, validateCategories } from "./_utils";

interface Env {
    GITHUB_TOKEN: string;
    SUBMIT_RATE_LIMIT: KVNamespace;
    UPSTREAM_OWNER?: string;
    UPSTREAM_REPO?: string;
    BASE_BRANCH?: string;
}

interface PartSubmission {
    title: string;
    imageSrc: string;
    platform: string[];
    fabricationMethod: string[];
    typeOfPart: string[];
    dropboxUrl?: string;
    dropboxZipLastUpdated?: string;
    externalUrl?: string;
    // Legacy support optional
    isOem?: boolean;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    try {
        const clientIP = request.headers.get("cf-connecting-ip") || "anonymous";
        const now = Date.now();

        // 1. Rate Limit
        const lastSub = await env.SUBMIT_RATE_LIMIT.get(clientIP);
        if (lastSub && now - parseInt(lastSub) < 60000) {
            return new Response(JSON.stringify({
                error: "Rate limit exceeded. Please wait 60 seconds."
            }), { status: 429, headers: { "Content-Type": "application/json" } });
        }

        // 2. Parse Body
        const body = await request.json() as { parts: PartSubmission[], hp_field?: string };
        const { parts, hp_field } = body;

        // Honeypot check
        if (hp_field) {
            return new Response(JSON.stringify({ success: true }), { status: 200 });
        }

        if (!parts || !Array.isArray(parts) || parts.length === 0) {
            return new Response(JSON.stringify({ error: "No parts provided." }), { status: 400, headers: { "Content-Type": "application/json" } });
        }

        // 3. Process each part (Though usually bulk submit is 1 part? The old code handled array)
        // We will process the FIRST part for now to ensure sequential ID stability, or handle bulk?
        // Sequential ID with bulk is tricky if we don't lock.
        // For now, let's assume 1 part per request or process sequentially.
        // The prompt implies "part-####.json", singular?
        // "Submission: ... open GitHub PR on server-side."
        // I'll handle the first part in the array to be safe and simple, or all if I can.
        // Logic says "Parse src/data/parts for the highest ... and increment".
        // If I do bulk, I reserve IDs: NextID, NextID+1...

        const owner = env.UPSTREAM_OWNER || 'Focerqc';
        const repo = env.UPSTREAM_REPO || 'CLONEpubparts.xyz';
        const baseBranch = env.BASE_BRANCH || 'master';

        const octokit = new Octokit({ auth: env.GITHUB_TOKEN });

        // 4. Get Existing Parts
        let files: string[] = [];
        try {
            const { data } = await octokit.rest.repos.getContent({
                owner,
                repo,
                path: 'src/data/parts',
                ref: baseBranch
            });

            if (Array.isArray(data)) {
                files = data.map(f => f.name);
            }
        } catch (e: any) {
            if (e.status === 404) {
                // Directory doesn't exist yet, start fresh
                files = [];
            } else if (e.status === 403 || e.status === 504) {
                // Fail-safe as requested
                return new Response(JSON.stringify({ error: "System Busy" }), { status: 503, headers: { "Content-Type": "application/json" } });
            } else {
                throw e;
            }
        }

        // 5. Calculate Next ID
        let nextIdString = getNextId(files); // e.g. "0001"
        // If multiple parts, we need to increment for each.
        let currentIdInt = parseInt(nextIdString, 10);

        const newBranchName = `submission-${nextIdString}`; // Use first ID for branch

        // Create Branch
        // Get SHA of base branch
        const { data: refData } = await octokit.rest.git.getRef({
            owner,
            repo,
            ref: `heads/${baseBranch}`
        });
        const baseSha = refData.object.sha;

        await octokit.rest.git.createRef({
            owner,
            repo,
            ref: `refs/heads/${newBranchName}`,
            sha: baseSha
        });

        const prBodyLines = [];
        const filesToCreate = [];

        for (const part of parts) {
            // Validate Tags
            // Handle Legacy isOem -> map to tag if needed, but per constraints "Reject ... if >1 non-OEM"
            // We assume client sends correct tags.
            const validation = validateCategories(part.typeOfPart);
            if (!validation.valid) {
                return new Response(JSON.stringify({ error: `Validation Error: ${validation.error}` }), { status: 400, headers: { "Content-Type": "application/json" } });
            }

            // Create Content
            const idString = currentIdInt.toString().padStart(4, '0');
            const fileName = `part-${idString}.json`;
            const filePath = `src/data/parts/${fileName}`;

            const fileContent = JSON.stringify(part, null, 2);
            // Safe Base64 encoding for Unicode
            const base64Content = btoa(unescape(encodeURIComponent(fileContent)));

            filesToCreate.push({
                path: filePath,
                content: base64Content,
                mode: '100644',
                type: 'blob'
            });

            prBodyLines.push(`- **${part.title}** (${fileName})`);
            currentIdInt++;
        }

        // 6. Commit Files (Bulk logic? Octokit createCommit needs tree)
        // We can create a Tree then a Commit.
        // Or just create file per file (slower).
        // Let's use create or update file loop for simplicity, or create specific commit.
        // For "clean" logic, creating a tree is better.

        // Create Blobs
        const treeItems = [];
        for (const f of filesToCreate) {
            const { data: blob } = await octokit.rest.git.createBlob({
                owner,
                repo,
                content: f.content,
                encoding: 'base64'
            });
            treeItems.push({
                path: f.path,
                mode: '100644' as const,
                type: 'blob' as const,
                sha: blob.sha
            });
        }

        // Create Tree
        const { data: tree } = await octokit.rest.git.createTree({
            owner,
            repo,
            base_tree: baseSha,
            tree: treeItems
        });

        // Create Commit
        const { data: commit } = await octokit.rest.git.createCommit({
            owner,
            repo,
            message: `feat: add ${parts.length} new parts`,
            tree: tree.sha,
            parents: [baseSha]
        });

        // Update Reference
        await octokit.rest.git.updateRef({
            owner,
            repo,
            ref: `heads/${newBranchName}`,
            sha: commit.sha
        });

        // 7. Create PR
        const { data: pr } = await octokit.rest.pulls.create({
            owner,
            repo,
            title: `Submission: ${parts.length} New Parts`,
            head: newBranchName,
            base: baseBranch,
            body: `Automated submission via ESK8CAD.\n\n${prBodyLines.join('\n')}`
        });

        // Success
        await env.SUBMIT_RATE_LIMIT.put(clientIP, now.toString());

        return new Response(JSON.stringify({
            success: true,
            prUrl: pr.html_url
        }), { status: 200, headers: { "Content-Type": "application/json" } });

    } catch (error: any) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
};