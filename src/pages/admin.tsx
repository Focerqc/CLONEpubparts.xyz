import { type PageProps } from "gatsby"
import React, { useState, useEffect, useMemo } from "react"
import { Container, Card, Form, Button, Row, Col, Badge, Modal, Alert, Spinner, ListGroup, Tab, Tabs } from "react-bootstrap"
import SiteNavbar from "../components/SiteNavbar"
import SiteFooter from "../components/SiteFooter"
import usePartRegistry from "../hooks/usePartRegistry"

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
 * URL Normalizer: Strips URLs for comparison.
 * Printables: https://www.printables.com/model/123-name -> printables-123
 */
const normalizeUrl = (url: string | undefined): string => {
    if (!url) return "";
    let cleaned = url.toLowerCase().trim();

    // Printables specific stripping: extract model ID
    if (cleaned.includes("printables.com/model/")) {
        const match = cleaned.match(/model\/(\d+)/);
        if (match) return `printables-${match[1]}`;
    }

    // Generic normalization
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

    // Action State
    const [selectedPr, setSelectedPr] = useState<PR | null>(null)
    const [isMerging, setIsMerging] = useState(false)
    const [actionMessage, setActionMessage] = useState<string | null>(null)

    // --- Audit Logic ---
    const linkAudit = useMemo(() => {
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

    const findDuplicates = (url?: string) => {
        const norm = normalizeUrl(url);
        if (!norm) return null;
        const matching = linkAudit[norm] || [];
        return matching.length > 1 ? matching : null;
    }

    // --- Authentication ---
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
                const data = (await res.json()) as PR[];
                setPrs(data);
                setIsAuthenticated(true);
                if (typeof window !== 'undefined') sessionStorage.setItem('admin_pass', password);
            } else {
                throw new Error("Failed to fetch PRs");
            }
        } catch (err) {
            setError("Could not connect to Admin API.");
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-login
    useEffect(() => {
        const savedPass = typeof window !== 'undefined' ? sessionStorage.getItem('admin_pass') : null;
        if (savedPass) {
            setPassword(savedPass);
            fetch('/api/admin/list-prs', { headers: { 'x-admin-password': savedPass } })
                .then(res => res.ok ? res.json() : Promise.reject())
                .then(data => {
                    setPrs(data as PR[]);
                    setIsAuthenticated(true);
                })
                .catch(() => { });
        }
    }, []);

    const handleMerge = async () => {
        if (!selectedPr) return;
        setIsMerging(true);
        setActionMessage(null);

        try {
            const res = await fetch('/api/admin/merge-pr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-password': password
                },
                body: JSON.stringify({ pull_number: selectedPr.number })
            });

            const result = (await res.json()) as { error?: string; success?: boolean };
            if (!res.ok) throw new Error(result.error || "Merge failed");

            setActionMessage(`Successfully merged PR #${selectedPr.number}!`);
            setPrs(prev => prev.filter(p => p.number !== selectedPr.number));
            setTimeout(() => {
                setSelectedPr(null);
                setActionMessage(null);
            }, 1500);

        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setIsMerging(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="bg-black text-light min-vh-100 d-flex flex-column">
                <GlobalStyles />
                <SiteNavbar />
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
        <div className="bg-black text-light min-vh-100 d-flex flex-column">
            <GlobalStyles />
            <style dangerouslySetInnerHTML={{
                __html: `
                .bg-secondary { background-color: #121417 !important; } 
                .border-secondary { border-color: #24282d !important; } 
                .nav-tabs { border-bottom: 1px solid #24282d; }
                .nav-link { color: #adb5bd; border: none !important; }
                .nav-link.active { background: transparent !important; color: #0dcaf0 !important; border-bottom: 2px solid #0dcaf0 !important; }
                .list-group-item { background-color: #0b0c0d; border-color: #24282d; color: white; }
            ` }} />

            <SiteNavbar />
            <Container className="py-5 flex-grow-1">
                <div className="d-flex justify-content-between align-items-center mb-5">
                    <div>
                        <h1 className="display-5 fw-bold mb-0">Admin Dashboard</h1>
                        <p className="text-info small uppercase letter-spacing-1 mt-1 opacity-75">Control Center & Audit Scan</p>
                    </div>
                    <Button variant="outline-light" size="sm" onClick={() => {
                        setIsAuthenticated(false);
                        sessionStorage.removeItem('admin_pass');
                        setPassword("");
                    }}>Logout</Button>
                </div>

                <Tabs defaultActiveKey="queue" className="mb-4">
                    <Tab eventKey="queue" title={`Review Queue (${prs.length})`}>
                        {error && <Alert variant="danger">{error}</Alert>}
                        {prs.length === 0 && !isLoading ? (
                            <Card className="bg-dark text-white border-secondary shadow-lg p-5 text-center mt-3">
                                <Card.Body>
                                    <div className="display-1 opacity-10 mb-4">📂</div>
                                    <h3 className="fw-bold">No Pending Submissions</h3>
                                    <p className="text-muted mb-4">The review queue is currently empty.</p>
                                    <Button variant="primary" className="fw-bold px-4" onClick={() => handleLogin()}>Refresh Queue</Button>
                                </Card.Body>
                            </Card>
                        ) : (
                            <Row xs={1} md={2} lg={3} className="g-4 mt-1">
                                {prs.map(pr => (
                                    <Col key={pr.number}>
                                        <Card className="bg-dark text-white border-secondary h-100 shadow-sm border-top-primary">
                                            <Card.Header className="d-flex justify-content-between align-items-center border-secondary bg-black bg-opacity-25">
                                                <Badge bg="primary">PR #{pr.number}</Badge>
                                                <small className="text-muted">{new Date(pr.created_at).toLocaleDateString()}</small>
                                            </Card.Header>
                                            <Card.Body className="d-flex flex-column">
                                                <Card.Title className="fw-bold text-truncate" title={pr.title}>{pr.title}</Card.Title>
                                                <Card.Subtitle className="mb-3 text-muted small">by {pr.user.login}</Card.Subtitle>

                                                <div className="bg-black p-2 rounded border border-secondary mb-3 flex-grow-1" style={{ maxHeight: '120px', overflowY: 'auto', fontSize: '0.8rem' }}>
                                                    <pre className="m-0 text-white-50" style={{ whiteSpace: 'pre-wrap' }}>{pr.body}</pre>
                                                </div>

                                                <div className="d-flex gap-2 mt-auto">
                                                    <Button variant="outline-light" size="sm" href={pr.html_url} target="_blank" className="flex-grow-1">Source Code</Button>
                                                    <Button variant="success" size="sm" className="flex-grow-1 fw-bold shadow-sm" onClick={() => setSelectedPr(pr)}>Approve Merge</Button>
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        )}
                    </Tab>
                    <Tab eventKey="audit" title=" Registry Audit">
                        <Card className="bg-dark text-white border-secondary shadow-lg">
                            <Card.Header className="border-secondary bg-black bg-opacity-25 py-3">
                                <h5 className="mb-0 fw-bold text-info">Link Conflict Scan</h5>
                                <small className="text-muted">Analyzing {registryParts.length} parts for duplicate Printables or external listings.</small>
                            </Card.Header>
                            <Card.Body className="p-0">
                                <ListGroup variant="flush">
                                    {Object.entries(linkAudit)
                                        .filter(([_, matches]) => matches.length > 1)
                                        .map(([norm, matches]) => (
                                            <ListGroup.Item key={norm} className="p-4 border-secondary">
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <Badge bg="warning" text="dark">⚠️ DUPLICATE LINK</Badge>
                                                        <code className="text-info">{norm}</code>
                                                    </div>
                                                    <Badge bg="secondary" pill>{matches.length} Instances</Badge>
                                                </div>
                                                <div className="ps-3 border-start border-warning border-2 py-1 mt-3">
                                                    {matches.map((p, idx) => (
                                                        <div key={idx} className="small mb-2 d-flex justify-content-between align-items-center">
                                                            <span>
                                                                <strong className="text-light">{p.title}</strong>
                                                                <span className="text-muted mx-2">•</span>
                                                                <span className="opacity-75">{p.externalUrl}</span>
                                                            </span>
                                                            <Badge bg="dark" className="border border-secondary">Live</Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </ListGroup.Item>
                                        ))}
                                    {Object.entries(linkAudit).filter(([_, m]) => m.length > 1).length === 0 && (
                                        <div className="p-5 text-center opacity-50">
                                            <p className="mb-0">✅ No duplicate external links found in the current registry.</p>
                                        </div>
                                    )}
                                </ListGroup>
                            </Card.Body>
                        </Card>
                    </Tab>
                </Tabs>
            </Container>
            <SiteFooter />

            {/* Merge Confirmation Modal */}
            <Modal show={!!selectedPr} onHide={() => !isMerging && setSelectedPr(null)} centered contentClassName="bg-dark text-white border-secondary shadow-lg">
                <Modal.Header closeButton={!isMerging} closeVariant="white" className="border-secondary">
                    <Modal.Title>Smart Content Review</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {actionMessage ? (
                        <Alert variant="success" className="m-0 py-3">{actionMessage}</Alert>
                    ) : (
                        <>
                            <p className="mb-4">Reviewing PR <strong>#{selectedPr?.number}</strong> from <strong>{selectedPr?.user.login}</strong></p>

                            <div className="bg-black p-3 rounded border border-secondary mb-4">
                                <h6 className="small uppercase text-info mb-2 opacity-75">Submission Details:</h6>
                                <pre className="m-0 small text-white-50" style={{ whiteSpace: 'pre-wrap' }}>{selectedPr?.body}</pre>
                            </div>

                            <Alert variant="info" className="bg-info bg-opacity-10 border-info text-info small py-2">
                                <strong>Tip:</strong> Suffix checking and ID generation were handled automatically by the submission worker.
                            </Alert>
                        </>
                    )}
                </Modal.Body>
                {!actionMessage && (
                    <Modal.Footer className="border-secondary bg-black bg-opacity-10">
                        <Button variant="outline-light" onClick={() => setSelectedPr(null)} disabled={isMerging} className="px-4">Cancel</Button>
                        <Button variant="success" onClick={handleMerge} disabled={isMerging} className="px-4 fw-bold">
                            {isMerging ? <><Spinner size="sm" animation="border" className="me-2" /> Merging...</> : "Verify & Merge"}
                        </Button>
                    </Modal.Footer>
                )}
            </Modal>
        </div>
    )
}

export default AdminPage

export const Head = () => (
    <>
        <html lang="en" />
        <title>Admin Dashboard | ESK8CAD</title>
        <meta name="robots" content="noindex, nofollow" />
    </>
)
