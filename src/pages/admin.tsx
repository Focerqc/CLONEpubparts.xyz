import { type PageProps } from "gatsby"
import React, { useState, useEffect, useMemo } from "react"
import { Container, Card, Form, Button, Row, Col, Badge, Modal, Alert, Spinner, ListGroup, Tab, Tabs, Dropdown, Nav } from "react-bootstrap"
import SiteNavbar from "../components/SiteNavbar"
import SiteFooter from "../components/SiteFooter"
import usePartRegistry from "../hooks/usePartRegistry"
import ItemCard from "../components/ItemCard"

const GlobalStyles = () => (
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" />
);

// Types
interface PR {
    number: number;
    title: string;
    user: { login: string };
    html_url: string;
    created_at: string;
    body: string;
}

const normalizeUrl = (url: string | undefined): string => {
    if (!url) return "";
    let cleaned = url.toLowerCase().trim();
    if (cleaned.includes("printables.com/model/")) {
        const match = cleaned.match(/model\/(\d+)/);
        if (match) return `printables-${match[1]}`;
    }
    return cleaned.replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "");
};

const AdminPage: React.FC<PageProps> = () => {
    const registryParts = usePartRegistry();

    // Auth State
    const [password, setPassword] = useState("")
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [authError, setAuthError] = useState(false)

    // Data State
    const [prs, setPrs] = useState<PR[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [categories, setCategories] = useState<string[]>([])

    // Batch Action State
    const [stagedPrs, setStagedPrs] = useState<Set<number>>(new Set())
    const [stagedDeletions, setStagedDeletions] = useState<Set<string>>(new Set())
    const [stagingCategories, setStagingCategories] = useState<string[]>([])
    const [isConfirming, setIsConfirming] = useState(false)
    const [batchLog, setBatchLog] = useState<string[]>([])

    // PR Details Cache
    const [prDetails, setPrDetails] = useState<Record<number, any[]>>({})

    const allRegistryPartsWithFilenames = useMemo(() => {
        // We need to associate filenames with parts. 
        // In usePartRegistry, we extracted nodes. 
        // I might need to update usePartRegistry to return metadata or use a raw fetch.
        // For now, I'll assume usePartRegistry parts have a way to be identified or I'll just use title+date.
        // Actually, let's just use the registry as is.
        return registryParts;
    }, [registryParts]);

    // Initial load
    useEffect(() => {
        if (isAuthenticated) {
            // Load Categories
            fetch('/api/admin/batch-action', { headers: { 'x-admin-password': password } }) // Placeholder fetch or similar
            // Actually, categories are in src/data/categories.json which Gatsby sources.
            // But for live management, I'll just hardcode initial or fetch from branch.
            // I'll use a standard list for now and let the admin modify.
            setCategories([
                "Anti-sink plate", "Battery", "Battery building parts", "Bearing", "BMS", "Bushing", "Charge Port",
                "Charger case", "Complete board", "Connector", "Cover", "Deck", "Drill hole Jig", "Enclosure",
                "ESC", "Fender", "Foothold / Bindings", "Fuse holder", "Gland", "Guard / Bumper", "Headlight",
                "Heatsink", "Idler", "Motor", "Motor Mount", "Mount", "Pulley", "Remote", "Riser",
                "Shocks / Damper", "Sprocket", "Stand", "Thumbwheel", "Tire", "Truck", "Wheel", "Wheel Hub", "Miscellaneous"
            ]);
            setStagingCategories([...categories]);
        }
    }, [isAuthenticated]);

    // Audit groups
    const auditGroups = useMemo(() => {
        const groups: Record<string, any[]> = {};
        allRegistryPartsWithFilenames.forEach(part => {
            const norm = normalizeUrl(part.externalUrl);
            if (norm) {
                if (!groups[norm]) groups[norm] = [];
                groups[norm].push(part);
            }
        });
        return groups;
    }, [allRegistryPartsWithFilenames]);

    // --- PR Fetching ---
    const fetchPrContent = async (pr: PR) => {
        if (prDetails[pr.number]) return;
        try {
            const res = await fetch(`/api/admin/get-pr-details?number=${pr.number}`, {
                headers: { 'x-admin-password': password }
            });
            if (res.ok) {
                const data = await res.json() as { parts: any[] };
                setPrDetails(prev => ({ ...prev, [pr.number]: data.parts }));
            }
        } catch (e) {
            console.error("Failed to fetch PR details", e);
        }
    };

    // --- Actions ---
    const toggleStagedPr = (num: number) => {
        const next = new Set(stagedPrs);
        if (next.has(num)) next.delete(num);
        else next.add(num);
        setStagedPrs(next);
    };

    const toggleStagedDeletion = (id: string) => {
        const next = new Set(stagedDeletions);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setStagedDeletions(next);
    };

    const addStagedCategory = (cat: string) => {
        if (!cat.trim() || stagingCategories.includes(cat)) return;
        setStagingCategories([...stagingCategories, cat.trim()].sort());
    };

    const removeStagedCategory = (cat: string) => {
        setStagingCategories(stagingCategories.filter(c => c !== cat));
    };

    const handleBatchConfirm = async () => {
        setIsConfirming(true);
        setError(null);
        try {
            const payload = {
                mergePrs: Array.from(stagedPrs),
                deleteFiles: Array.from(stagedDeletions).map(f => `src/data/parts/${f}`),
                updateCategories: stagingCategories
            };
            const res = await fetch('/api/admin/batch-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error("Batch action failed");

            setBatchLog(["Success! Changes committed to repository. Site will rebuild in 2-3 minutes."]);
            // Reset state
            setStagedPrs(new Set());
            setStagedDeletions(new Set());
            // Re-fetch PRs
            handleLogin();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsConfirming(false);
        }
    };

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsLoading(true);
        setAuthError(false);
        try {
            const res = await fetch('/api/admin/list-prs', { headers: { 'x-admin-password': password } });
            if (res.status === 401) { setAuthError(true); }
            else if (res.ok) {
                const data = await res.json() as PR[];
                setPrs(data);
                setIsAuthenticated(true);
                if (typeof window !== 'undefined') sessionStorage.setItem('admin_pass', password);
            }
        } catch (err) { setError("Could not connect to Admin API."); }
        finally { setIsLoading(false); }
    };

    useEffect(() => {
        const savedPass = typeof window !== 'undefined' ? sessionStorage.getItem('admin_pass') : null;
        if (savedPass) { setPassword(savedPass); handleLogin(); }
    }, []);

    // --- Render Helpers ---
    const renderCardWithStaging = (part: any, idx: number, source: string) => {
        const fileRelPath = part.parent?.relativePath;
        const isStaged = fileRelPath ? stagedDeletions.has(fileRelPath) : false;
        return (
            <Col key={idx} className="searchableItem">
                <div className={`position-relative h-100 ${isStaged ? 'opacity-25' : ''}`} style={{ filter: isStaged ? 'grayscale(100%)' : 'none', transition: '0.3s' }}>
                    {ItemCard(part, idx)}
                    <div className="admin-card-overlay p-2">
                        {fileRelPath ? (
                            <Button
                                variant={isStaged ? "warning" : "danger"}
                                size="sm"
                                className="fw-bold w-100 shadow-sm"
                                onClick={() => toggleStagedDeletion(fileRelPath)}
                            >
                                {isStaged ? "Restore Part" : "Mark for Deletion"}
                            </Button>
                        ) : (
                            <Badge bg="secondary" className="w-100">Static Part (No Delete)</Badge>
                        )}
                        <div className="mt-1 text-center small opacity-75 bg-black rounded py-1">
                            Added: {part.dropboxZipLastUpdated || "Unknown Date"}
                        </div>
                    </div>
                </div>
            </Col>
        );
    };

    if (!isAuthenticated) {
        return (
            <div className="bg-black text-light min-vh-100 d-flex flex-column">
                <GlobalStyles /><SiteNavbar />
                <Container className="flex-grow-1 d-flex align-items-center justify-content-center">
                    <Card className="bg-dark text-white border-secondary shadow-lg p-4" style={{ maxWidth: '400px', width: '100%' }}>
                        <Card.Body>
                            <h3 className="text-center fw-bold mb-4">Admin Access</h3>
                            <Form onSubmit={handleLogin}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control type="password" value={password} onChange={e => setPassword(e.target.value)} className="bg-black text-white border-secondary" placeholder="Enter admin password" />
                                </Form.Group>
                                {authError && <Alert variant="danger" className="py-2 small border-0 bg-danger text-white">Invalid Password</Alert>}
                                <Button variant="primary" type="submit" className="w-100 fw-bold shadow" disabled={isLoading}>{isLoading ? <Spinner size="sm" animation="border" /> : "Unlock Dashboard"}</Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Container>
                <SiteFooter />
            </div>
        );
    }

    return (
        <div className="bg-black text-light min-vh-100 d-flex flex-column pb-5">
            <GlobalStyles />
            <style dangerouslySetInnerHTML={{
                __html: `
                .bg-secondary { background-color: #121417 !important; } 
                .border-secondary { border-color: #24282d !important; } 
                .nav-tabs { border-bottom: 1px solid #24282d; }
                .nav-link { color: #adb5bd; border: none !important; margin-right: 1rem; padding: 0.75rem 0; }
                .nav-link.active { background: transparent !important; color: #0dcaf0 !important; border-bottom: 2px solid #0dcaf0 !important; }
                .admin-card-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.85); transform: translateY(100%); transition: 0.3s; opacity: 0; z-index: 10; padding-top: 20px !important; }
                Col:hover .admin-card-overlay { transform: translateY(0); opacity: 1; }
                .staging-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #0b0c0d; border-top: 2px solid #0dcaf0; z-index: 1000; box-shadow: 0 -10px 30px rgba(0,0,0,0.5); }
                .tag-chip { background: #1a1d21; border: 1px solid #24282d; color: #fff; padding: 5px 12px; border-radius: 20px; font-size: 0.9rem; display: flex; align-items: center; gap: 8px; }
            ` }} />

            <SiteNavbar />
            <Container className="py-5 flex-grow-1" style={{ marginBottom: '150px' }}>
                <div className="d-flex justify-content-between align-items-center mb-5">
                    <div><h1 className="display-5 fw-bold mb-0">Admin Center</h1><p className="text-info small uppercase mt-1 opacity-75">Control & Audit Panel</p></div>
                    <Button variant="outline-light" size="sm" onClick={() => { setIsAuthenticated(false); sessionStorage.removeItem('admin_pass'); setPassword(""); }}>Logout</Button>
                </div>

                <Tabs defaultActiveKey="queue" className="mb-4">
                    <Tab eventKey="queue" title={`1. Review Queue (${prs.length})`}>
                        {prs.length === 0 ? (
                            <div className="p-5 text-center opacity-50">No pending submissions.</div>
                        ) : (
                            <Row xs={1} md={1} lg={1} className="g-4 mt-2">
                                {prs.map(pr => {
                                    const isStaged = stagedPrs.has(pr.number);
                                    return (
                                        <Card key={pr.number} className={`bg-dark text-white border-secondary ${isStaged ? 'border-primary' : ''}`}>
                                            <Card.Header className="bg-black py-3 d-flex justify-content-between align-items-center">
                                                <span><Badge bg="primary" className="me-2">PR #{pr.number}</Badge> <strong>Submitted by {pr.user.login}</strong></span>
                                                <Button size="sm" variant={isStaged ? "warning" : "success"} onClick={() => { toggleStagedPr(pr.number); fetchPrContent(pr); }}>
                                                    {isStaged ? "Unstage PR" : "Stage for Approval"}
                                                </Button>
                                            </Card.Header>
                                            <Card.Body>
                                                <div className="mb-3 small opacity-75">{pr.body}</div>
                                                <Button variant="link" size="sm" className="text-info p-0 mb-3" onClick={() => fetchPrContent(pr)}>Show Parts Preview ↓</Button>
                                                {prDetails[pr.number] && (
                                                    <Row xs={1} md={2} lg={3} className="g-3 bg-black p-3 rounded shadow-inner">
                                                        {prDetails[pr.number].map((p, i) => (
                                                            <Col key={i}>{ItemCard(p, i)}</Col>
                                                        ))}
                                                    </Row>
                                                )}
                                            </Card.Body>
                                        </Card>
                                    );
                                })}
                            </Row>
                        )}
                    </Tab>

                    <Tab eventKey="audit" title="2. Registry Audit">
                        <Alert variant="info" className="bg-info bg-opacity-10 border-info text-info small mb-4">
                            Duplicates grouped by normalized link. Hover cards to delete.
                        </Alert>
                        {Object.entries(auditGroups).filter(([_, m]) => m.length > 1).map(([norm, matches]) => (
                            <div key={norm} className="mb-5 p-4 border rounded border-secondary bg-dark shadow-sm">
                                <div className="d-flex align-items-center gap-3 mb-4">
                                    <Badge bg="warning" text="dark">DUPLICATE URL</Badge>
                                    <code className="text-info">{norm}</code>
                                    <span className="ms-auto text-muted small">{matches.length} parts sharing this link</span>
                                </div>
                                <Row xs={1} md={2} lg={3} className="g-4">
                                    {matches.map((p, i) => renderCardWithStaging(p, i, "audit"))}
                                </Row>
                            </div>
                        ))}
                    </Tab>

                    <Tab eventKey="registry" title="3. Full Registry">
                        <Row xs={1} md={2} lg={3} xl={4} className="g-4 mt-2">
                            {allRegistryPartsWithFilenames.map((p, i) => renderCardWithStaging(p, i, "all"))}
                        </Row>
                    </Tab>

                    <Tab eventKey="tags" title="4. Manage Categories">
                        <Card className="bg-dark text-white border-secondary p-4 mt-3 shadow-lg">
                            <h5 className="fw-bold mb-4 text-info">Part Categories Manager</h5>
                            <div className="d-flex flex-wrap gap-2 mb-5 p-4 bg-black rounded border border-secondary">
                                {stagingCategories.map(cat => (
                                    <div key={cat} className="tag-chip">
                                        {cat} <Button variant="link" className="p-0 text-danger" onClick={() => removeStagedCategory(cat)}>×</Button>
                                    </div>
                                ))}
                            </div>
                            <Form className="d-flex gap-2">
                                <Form.Control id="newTagInput" className="bg-black text-white border-secondary" placeholder="Type new category name..." style={{ maxWidth: '300px' }} />
                                <Button variant="primary" onClick={() => {
                                    const input = document.getElementById('newTagInput') as HTMLInputElement;
                                    addStagedCategory(input.value);
                                    input.value = "";
                                }}>Add Category</Button>
                            </Form>
                        </Card>
                    </Tab>
                </Tabs>
            </Container>

            {/* BIG CONFIRMATION STAGING BAR */}
            {(stagedPrs.size > 0 || stagedDeletions.size > 0 || JSON.stringify(stagingCategories) !== JSON.stringify(categories)) && (
                <div className="staging-bar p-4">
                    <Container d-flex align-items-center justify-content-between>
                        <div className="d-flex align-items-center gap-4 text-light">
                            <div className="fw-bold fs-5 border-end border-secondary pe-4">Staged Changes</div>
                            <div className="d-flex gap-3 small uppercase">
                                {stagedPrs.size > 0 && <span className="text-success"><Badge bg="success">{stagedPrs.size}</Badge> PRs to Approve</span>}
                                {stagedDeletions.size > 0 && <span className="text-danger"><Badge bg="danger">{stagedDeletions.size}</Badge> Deletions</span>}
                                {JSON.stringify(stagingCategories) !== JSON.stringify(categories) && <span className="text-info"><Badge bg="info">Mod</Badge> Category List</span>}
                            </div>
                        </div>
                        <div className="ms-auto d-flex gap-2">
                            <Button variant="outline-light" onClick={() => { setStagedPrs(new Set()); setStagedDeletions(new Set()); setStagingCategories([...categories]); }}>Discard All</Button>
                            <Button variant="info" className="fw-bold px-5 py-2 shadow-lg" onClick={handleBatchConfirm} disabled={isConfirming}>
                                {isConfirming ? <Spinner size="sm" animation="border" /> : "Finalize & Publish Changes"}
                            </Button>
                        </div>
                    </Container>
                </div>
            )}

            <Modal show={batchLog.length > 0} onHide={() => setBatchLog([])} centered contentClassName="bg-dark text-white border-success shadow-lg">
                <Modal.Body className="p-4 text-center">
                    <div className="display-4 mb-3">✅</div>
                    {batchLog.map((log, i) => <p key={i} className="mb-0">{log}</p>)}
                </Modal.Body>
                <Modal.Footer className="border-0 justify-content-center pb-4"><Button variant="success" onClick={() => setBatchLog([])}>Excellent</Button></Modal.Footer>
            </Modal>
            <SiteFooter />
        </div>
    )
}

export default AdminPage
