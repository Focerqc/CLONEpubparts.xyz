
export const onRequestPost = async (context: any) => {
    const { request, env } = context;

    // 1. Validate Request
    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const { printablesUrl, editedPart } = body;

    // Minimal validation - prefer user input
    if (!printablesUrl) {
        return new Response(JSON.stringify({ error: 'Missing Printables URL' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (!editedPart?.title) {
        return new Response(JSON.stringify({ error: 'Missing part Title' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        // 2. Construct Part Object (Use frontend data DIRECTLY)
        const finalPart = {
            title: editedPart.title.trim(),
            fabricationMethod: editedPart.fabricationMethod || ['3d Printed'],
            typeOfPart: editedPart.typeOfPart?.length ? editedPart.typeOfPart : ['Miscellaneous'],
            imageSrc: editedPart.imageSrc || '',
            externalUrl: printablesUrl,
            dropboxUrl: editedPart.dropboxUrl || '',
            dropboxZipLastUpdated: editedPart.dropboxZipLastUpdated || new Date().toISOString().split('T')[0],
            platform: editedPart.platform?.length ? editedPart.platform : ['Miscellaneous Items'],
        };

        // 3. GitHub API Configuration
        const token = env.GITHUB_TOKEN;
        if (!token) throw new Error('No GITHUB_TOKEN configured');

        const owner = 'Focerqc';
        const repo = 'CLONEpubparts.xyz';
        const baseBranch = 'master';
        const filePath = 'src/util/parts.ts';
        const apiHeaders = {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Cloudflare-Pages-Function' // REQUIRED by GitHub
        };

        // 4. Git Workflow: Get SHA -> Create Branch -> Update File -> PR

        // Get Base SHA
        const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`, { headers: apiHeaders });
        if (!refRes.ok) {
            const err = await refRes.text();
            throw new Error(`Failed to get base SHA: ${refRes.status} ${err}`);
        }
        const { object: { sha: baseSha } } = await refRes.json();

        // Create Branch
        const branchName = `add-part-${Date.now()}`;
        const branchRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
            method: 'POST',
            headers: apiHeaders,
            body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: baseSha }),
        });
        if (!branchRes.ok) {
            const err = await branchRes.text();
            throw new Error(`Failed to create branch: ${branchRes.status} ${err}`);
        }

        // Get File Content
        const contentRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branchName}`, { headers: apiHeaders });
        if (!contentRes.ok) throw new Error(`Failed to fetch file: ${contentRes.status}`);
        const { content: base64Content, sha: fileSha } = await contentRes.json();

        // Decode (UTF-8 safe)
        const currentContent = decodeURIComponent(escape(atob(base64Content)));

        // Insert New Entry
        const newEntryString = JSON.stringify(finalPart, null, 2);
        // Regex finds "]" followed by " as ItemData[]" (matches src/util/parts.ts structure)
        const updatedContent = currentContent.replace(/\]\s*as\s*ItemData\[\]/, `, \n${newEntryString}\n] as ItemData[]`);

        // Encode (UTF-8 safe)
        const newBase64Content = btoa(unescape(encodeURIComponent(updatedContent)));

        // Commit File
        const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
            method: 'PUT',
            headers: apiHeaders,
            body: JSON.stringify({
                message: `Add part: ${finalPart.title}`,
                content: newBase64Content,
                sha: fileSha,
                branch: branchName,
            }),
        });
        if (!commitRes.ok) {
            const err = await commitRes.text();
            throw new Error(`Commit failed: ${commitRes.status} ${err}`);
        }

        // Open Pull Request
        const prRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
            method: 'POST',
            headers: apiHeaders,
            body: JSON.stringify({
                title: `Add Part: ${finalPart.title}`,
                head: branchName,
                base: baseBranch,
                body: `Auto-submitted via Cloudflare Pages.\nOriginal URL: ${printablesUrl}`,
            }),
        });

        // Handle PR Success OR Partial Success (403 usually means branch OK but PR forbidden)
        let prData;
        let manualUrl = `https://github.com/${owner}/${repo}/compare/${baseBranch}...${branchName}?expand=1`;

        if (prRes.ok) {
            prData = await prRes.json();
            return new Response(JSON.stringify({ success: true, prUrl: prData.html_url }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else if (prRes.status === 403) {
            // Permission error on PR creation specifically - return manual link
            console.warn('PR Forbidden 403, returning manual link');
            return new Response(JSON.stringify({
                success: true,
                prUrl: null,
                manualUrl
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } else {
            const err = await prRes.text();
            throw new Error(`PR creation failed: ${prRes.status} ${err}`);
        }

    } catch (err: any) {
        console.error('Worker Error:', err);
        return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}