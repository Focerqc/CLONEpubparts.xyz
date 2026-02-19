import { type PageProps } from "gatsby"
import React, { useState, useEffect, useMemo } from "react"
import { Container, Card, Form, Button, Row, Col, Badge, Modal, Alert, Spinner, Tab, Tabs } from "react-bootstrap"
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

/**
 * URL Normalizer: Strips URLs for comparison and deduplication.
 * Specific support for Printables model IDs.
 */
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

    // Batch Action Staging
    const [stagedPrs, setStagedPrs] = useState<Set<number>>(new Set())
    const [stagedDeletions, setStagedDeletions] = useState<Set<string>>(new Set())
    const [stagingCategories, setStagingCategories] = useState<string[]>([])
    const [isConfirming, setIsConfirming] = useState(false)
    const [batchLog, setBatchLog] = useState<string[]>([])

    // PR Details Cache
    const [prDetails, setPrDetails] = useState<Record<number, any[]>>({})

    // Initialize Categories
    useEffect(() => {
        if (isAuthenticated) {
            // Default list until we have a proper fetcher for the live file
            const defaultCats = [
                "Anti-sink plate", "Battery", "Battery building parts", "Bearing", "BMS", "Bushing", "Charge Port",
                "Charger case", "Complete board", "Connector", "Cover", "Deck", "Drill hole Jig", "Enclosure",
                "ESC", "Fender", "Foothold / Bindings", "Fuse holder", "Gland", "Guard / Bumper", "Headlight",
                "Heatsink", "Idler", "Motor", "Motor Mount", "Mount", "Pulley", "Remote", "Riser",
                "Shocks / Damper", "Sprocket", "Stand", "Thumbwheel", "Tire", "Truck", "Wheel", "Wheel Hub", "Miscellaneous"
            ];
            setCategories(defaultCats);
            setStagingCategories([...defaultCats]);
        }
    }, [isAuthenticated]);

    // Group parts by normalized URL for auditing
    const auditGroups = useMemo(() => {
        const groups: Record<string, any[]> = {};
        registryParts.forEach(part => {
            const norm = normalizeUrl(part.externalUrl);
            if (norm) {
                if (!groups[norm]) groups[norm] = [];
                groups[norm].push(part);
            }
        });
        return groups;
    }, [registryParts]);

    // --- Data Fetching ---
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

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsLoading(true);
        setAuthError(false);
        try {
            const res = await fetch('/api/admin/list-prs', {
                headers: { 'x-admin-password': password }
            });
            if (res.status === 401) {
                setAuthError(true);
                setIsAuthenticated(false);
            } else if (res.ok) {
                const data = await res.json() as PR[];
                setPrs(data);
                setIsAuthenticated(true);
                if (typeof window !== 'undefined') sessionStorage.setItem('admin_pass', password);
            }
        } catch (err) {
            setError("Could not connect to Admin API.");
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-login from session
    useEffect(() => {
        const savedPass = typeof window !== 'undefined' ? sessionStorage.getItem('admin_pass') : null;
        if (savedPass && !isAuthenticated && !isLoading) {
            setPassword(savedPass);
            // We need to bypass the event object for handleLogin
            const performAutoLogin = async () => {
                setIsLoading(true);
                setAuthError(false);
                try {
                    const res = await fetch('/api/admin/list-prs', { headers: { 'x-admin-password': savedPass } });
                    if (res.ok) {
                        const data = await res.json() as PR[];
                        setPrs(data);
                        setIsAuthenticated(true);
                    }
                } catch (err) { setError("Auto-login failed."); }
                finally { setIsLoading(false); }
            };
            performAutoLogin();
        }
    }, [isAuthenticated]);

    // --- Action Handlers ---
    const toggleStagedPr = (num: number) => {
        const next = new Set(stagedPrs);
        if (next.has(num)) next.delete(num);
        else next.add(num);
        setStagedPrs(next);
    };

    const toggleStagedDeletion = (path: string) => {
        const next = new Set(stagedDeletions);
        if (next.has(path)) next.delete(path);
        else next.add(path);
        setStagedDeletions(next);
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

            setBatchLog(["Success! Changes committed to repository. Site will rebuild shortly."]);
            setStagedPrs(new Set());
            setStagedDeletions(new Set());
            handleLogin();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsConfirming(false);
        }
    };

    // --- UI Renderers ---
    const renderPartCardWithAdminControls = (part: any, idx: number) => {
        const fileRelPath = (part as any).parent?.relativePath;
        const isStaged = fileRelPath ? stagedDeletions.has(fileRelPath) : false;

        return (
            <Col key={idx} className="searchableItem">
                <div
                    className={`position-relative h-100 ${isStaged ? 'opacity-25' : ''}`}
                    style={{ filter: isStaged ? 'grayscale(100%)' : 'none', transition: '0.3s' }}
                >
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
                            <Badge bg="secondary" className="w-100">Static Part (Source Required)</Badge>
                        )}
                        <div className="mt-1 text-center small opacity-75 bg-black rounded py-1">
                            Ref: {fileRelPath || "N/A"}
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
                                    <Form.Control
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="bg-black text-white border-secondary"
                                        placeholder="Enter admin password"
                                    />
                                </Form.Group>
                                {authError && <Alert variant="danger" className="py-2 small border-0 bg-danger text-white">Invalid Password</Alert>}
                                <Button variant="primary" type="submit" className="w-100 fw-bold shadow" disabled={isLoading}>
                                    {isLoading ? <Spinner size="sm" animation="border" /> : "Unlock Dashboard"}
                                </Button>
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
                .nav-link { color: #adb5bd; border: none !important; margin-right: 1.5rem; padding: 1rem 0; font-weight: 600; }
                .nav-link.active { background: transparent !important; color: #0dcaf0 !important; border-bottom: 2px solid #0dcaf0 !important; }
                .admin-card-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.9); transform: translateY(100%); transition: 0.3s; opacity: 0; z-index: 10; padding: 15px !important; border-top: 1px solid #dc3545; }
                .searchableItem:hover .admin-card-overlay { transform: translateY(0); opacity: 1; }
                .staging-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #0b0c0d; border-top: 2px solid #0dcaf0; z-index: 1000; box-shadow: 0 -10px 40px rgba(0,0,0,0.8); }
                .tag-chip { background: #1a1d21; border: 1px solid #24282d; color: #fff; padding: 6px 14px; border-radius: 20px; font-size: 0.9rem; display: flex; align-items: center; gap: 10px; transition: 0.2s; }
                .tag-chip:hover { border-color: #dc3545; }
            ` }} />

            <SiteNavbar />
            <Container className="py-5 flex-grow-1" style={{ marginBottom: '160px' }}>
                <div className="d-flex justify-content-between align-items-end mb-5">
                    <div>
                        <h1 className="display-4 fw-bold mb-0">Admin Center</h1>
                        <p className="text-info small uppercase mt-2 letter-spacing-2 opacity-75 font-monospace">Central Registry Management</p>
                    </div>
                    <Button variant="outline-light" size="sm" onClick={() => { setIsAuthenticated(false); sessionStorage.removeItem('admin_pass'); setPassword(""); }}>Logout Session</Button>
                </div>

                <Tabs defaultActiveKey="queue" className="mb-5 custom-admin-tabs">
                    <Tab eventKey="queue" title={`1. Review Queue (${prs.length})`}>
                        {prs.length === 0 ? (
                            <div className="py-5 text-center bg-dark rounded border border-secondary shadow-sm mt-3">
                                <p className="mb-0 opacity-50 fw-bold">No pending submissions found.</p>
                            </div>
                        ) : (
                            <Row xs={1} className="g-4 mt-2">
                                {prs.map(pr => {
                                    const isStaged = stagedPrs.has(pr.number);
                                    return (
                                        <Card key={pr.number} className={`bg-dark text-white border-secondary shadow-sm ${isStaged ? 'border-primary' : ''}`}>
                                            <Card.Header className="bg-black py-3 d-flex justify-content-between align-items-center">
                                                <span><Badge bg="primary" className="me-2 px-3">PR #{pr.number}</Badge> <strong>Submitted by {pr.user.login}</strong></span>
                                                <Button size="sm" variant={isStaged ? "warning" : "success"} className="fw-bold px-4" onClick={() => { toggleStagedPr(pr.number); fetchPrContent(pr); }}>
                                                    {isStaged ? "Unstage PR" : "Stage for Approval"}
                                                </Button>
                                            </Card.Header>
                                            <Card.Body>
                                                <Alert variant="secondary" className="bg-black border-secondary text-light small py-2 mb-3">
                                                    {pr.body || "No description provided."}
                                                </Alert>
                                                <Button variant="link" size="sm" className="text-info p-0 mb-3 text-decoration-none fw-bold" onClick={() => fetchPrContent(pr)}>
                                                    {prDetails[pr.number] ? "↓ Contents Loaded" : "View Parts Preview..."}
                                                </Button>
                                                {prDetails[pr.number] && (
                                                    <Row xs={1} md={2} lg={3} className="g-3 bg-black p-4 rounded-3 border border-secondary">
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
                        <Alert variant="warning" className="bg-warning bg-opacity-10 border-warning text-warning small mb-4">
                            <strong>Audit Scan:</strong> Parts below share the same external listing URL. Review and remove duplicates if necessary.
                        </Alert>
                        {Object.entries(auditGroups).filter(([_, m]) => m.length > 1).map(([norm, matches]) => (
                            <div key={norm} className="mb-5 p-4 border rounded-4 border-secondary bg-dark shadow-sm">
                                <div className="d-flex align-items-center gap-3 mb-4">
                                    <Badge bg="warning" text="dark" className="px-3">DUPLICATE LISTING</Badge>
                                    <code className="text-info fs-6">{norm}</code>
                                    <span className="ms-auto text-muted small fw-bold">{matches.length} Matches</span>
                                </div>
                                <Row xs={1} md={2} lg={3} className="g-4">
                                    {matches.map((p, i) => renderPartCardWithAdminControls(p, i))}
                                </Row>
                            </div>
                        ))}
                    </Tab>

                    <Tab eventKey="registry" title="3. Full Registry">
                        <div className="mb-4 d-flex justify-content-between align-items-center">
                            <h5 className="mb-0 fw-bold">Active JSON Registry</h5>
                            <Badge bg="dark" className="border border-secondary px-3 py-2">{registryParts.length} Total Parts</Badge>
                        </div>
                        <Row xs={1} md={2} lg={3} xl={4} className="g-4">
                            {registryParts.map((p, i) => renderPartCardWithAdminControls(p, i))}
                        </Row>
                    </Tab>

                    <Tab eventKey="tags" title="4. Part Categories">
                        <Card className="bg-dark text-white border-secondary p-4 mt-3 shadow-lg border-top-primary">
                            <h5 className="fw-bold mb-4 text-info">Terminology & Tags</h5>
                            <p className="text-muted small mb-4">Add or remove part categories globally. Changes update `categories.json` upon publishing.</p>
                            <div className="d-flex flex-wrap gap-3 mb-5 p-4 bg-black rounded-4 border border-secondary shadow-inner">
                                {stagingCategories.map(cat => (
                                    <div key={cat} className="tag-chip shadow-sm">
                                        {cat}
                                        <Button
                                            variant="link"
                                            className="p-0 text-danger text-decoration-none fw-bold ms-1"
                                            onClick={() => setStagingCategories(stagingCategories.filter(c => c !== cat))}
                                        >
                                            ×
                                        </Button>
                                    </div>
                                ))}
                                {stagingCategories.length === 0 && <span className="opacity-25 italic">No categories defined...</span>}
                            </div>
                            <Form className="d-flex gap-3" onSubmit={(e) => {
                                e.preventDefault();
                                const input = document.getElementById('newTagInput') as HTMLInputElement;
                                const val = input.value.trim();
                                if (val && !stagingCategories.includes(val)) {
                                    setStagingCategories([...stagingCategories, val].sort());
                                    input.value = "";
                                }
                            }}>
                                <Form.Control
                                    id="newTagInput"
                                    className="bg-black text-white border-secondary p-3"
                                    placeholder="Enter new category name (e.g. Heatsink)..."
                                    style={{ maxWidth: '400px' }}
                                />
                                <Button variant="primary" type="submit" className="px-5 fw-bold shadow">Add Category</Button>
                            </Form>
                        </Card>
                    </Tab>
                </Tabs>
            </Container>

            {/* STAGING ACTION BAR */}
            {(stagedPrs.size > 0 || stagedDeletions.size > 0 || JSON.stringify(stagingCategories) !== JSON.stringify(categories)) && (
                <div className="staging-bar p-4">
                    <Container className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-4 text-light">
                            <div className="fw-bold fs-4 border-end border-secondary pe-4 me-2">Staged Changes</div>
                            <div className="d-flex gap-4 small uppercase fw-bold">
                                {stagedPrs.size > 0 && <span className="text-success"><Badge bg="success" className="me-2">PR review</Badge>{stagedPrs.size} to Approve</span>}
                                {stagedDeletions.size > 0 && <span className="text-danger"><Badge bg="danger" className="me-2">Registry</Badge>{stagedDeletions.size} to Delete</span>}
                                {JSON.stringify(stagingCategories) !== JSON.stringify(categories) && <span className="text-info"><Badge bg="info" className="me-2">Schema</Badge>Update Categories</span>}
                            </div>
                        </div>
                        <div className="ms-auto d-flex gap-3">
                            <Button variant="outline-light" className="px-4" onClick={() => { setStagedPrs(new Set()); setStagedDeletions(new Set()); setStagingCategories([...categories]); }}>Discard All</Button>
                            <Button variant="info" className="fw-bold px-5 py-2 shadow-lg" onClick={handleBatchConfirm} disabled={isConfirming}>
                                {isConfirming ? <><Spinner size="sm" animation="border" className="me-2" /> Processing...</> : "Finalize & Publish Changes"}
                            </Button>
                        </div>
                    </Container>
                </div>
            )}

            <Modal show={batchLog.length > 0} onHide={() => setBatchLog([])} centered contentClassName="bg-dark text-white border-success shadow-lg">
                <Modal.Body className="p-5 text-center">
                    <div className="display-1 mb-4">🚀</div>
                    <h3 className="fw-bold mb-3">Sync Complete</h3>
                    {batchLog.map((log, i) => <p key={i} className="mb-0 opacity-75">{log}</p>)}
                </Modal.Body>
                <Modal.Footer className="border-0 justify-content-center pb-5">
                    <Button variant="success" className="px-5 fw-bold" onClick={() => setBatchLog([])}>Back to Dashboard</Button>
                </Modal.Footer>
            </Modal>
            <SiteFooter />
        </div>
    )
}

export default AdminPage
