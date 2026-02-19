import { type PageProps } from "gatsby"
import React, { useState, useEffect } from "react"
import { Container, Card, Form, Button, Row, Col, Badge, Modal, Alert, Spinner } from "react-bootstrap"
import SiteNavbar from "../components/SiteNavbar"
import SiteFooter from "../components/SiteFooter"
import ClientOnly from "../components/ClientOnly"

// Types
interface PR {
    number: number;
    title: string;
    user: { login: string };
    html_url: string;
    created_at: string;
    body: string;
}

const AdminPage: React.FC<PageProps> = () => {
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
                // Simple session persistence for reload convenience
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

    // Auto-login if session exists
    useEffect(() => {
        const savedPass = typeof window !== 'undefined' ? sessionStorage.getItem('admin_pass') : null;
        if (savedPass) {
            setPassword(savedPass);
            // Trigger login logic (need to extract or use effect? Let's just call fetch directly to avoid stale state issues)
            fetch('/api/admin/list-prs', { headers: { 'x-admin-password': savedPass } })
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error(res.statusText);
                })
                .then(data => {
                    setPrs(data as PR[]);
                    setIsAuthenticated(true);
                })
                .catch(() => { /* Silent fail on auto-login */ });
        }
    }, []);


    // --- Actions ---
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

            const result = (await res.json()) as { error?: string; success?: boolean; message?: string };

            if (!res.ok) throw new Error(result.error || "Merge failed");

            // Success
            setActionMessage(`Successfully merged PR #${selectedPr.number}!`);
            setPrs(prev => prev.filter(p => p.number !== selectedPr.number)); // Optimistic UI update
            setTimeout(() => {
                setSelectedPr(null); // Close modal
                setActionMessage(null);
            }, 1500);

        } catch (err: any) {
            alert(`Error: ${err.message}`);
        } finally {
            setIsMerging(false);
        }
    };

    // --- Render ---

    if (!isAuthenticated) {
        return (
            <div className="bg-black text-light min-vh-100 d-flex flex-column">
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
                                {authError && <Alert variant="danger" className="py-2 small">Invalid Password</Alert>}
                                <Button variant="primary" type="submit" className="w-100 fw-bold" disabled={isLoading}>
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
            {/* Styles Injection for consistency */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .bg-secondary { background-color: #121417 !important; } 
                .border-secondary { border-color: #24282d !important; } 
                .cursor-pointer { cursor: pointer; } 
            ` }} />

            <SiteNavbar />
            <Container className="py-5 flex-grow-1">
                <div className="d-flex justify-content-between align-items-center mb-5">
                    <h1 className="display-5 fw-bold">Admin Dashboard</h1>
                    <Button variant="outline-light" size="sm" onClick={() => {
                        setIsAuthenticated(false);
                        sessionStorage.removeItem('admin_pass');
                        setPassword("");
                    }}>Logout</Button>
                </div>

                {error && <Alert variant="danger">{error}</Alert>}

                {prs.length === 0 && !isLoading ? (
                    <div className="text-center py-5 opacity-50">
                        <h4>No pending Pull Requests.</h4>
                        <p>Good job! The queue is clear.</p>
                        <Button variant="outline-primary" onClick={() => handleLogin()}>Refresh</Button>
                    </div>
                ) : (
                    <Row xs={1} md={2} lg={3} className="g-4">
                        {prs.map(pr => (
                            <Col key={pr.number}>
                                <Card className="bg-dark text-white border-secondary h-100 shadow-sm">
                                    <Card.Header className="d-flex justify-content-between align-items-center border-secondary">
                                        <Badge bg="primary">PR #{pr.number}</Badge>
                                        <small className="text-muted">{new Date(pr.created_at).toLocaleDateString()}</small>
                                    </Card.Header>
                                    <Card.Body className="d-flex flex-column">
                                        <Card.Title className="fw-bold text-truncate" title={pr.title}>{pr.title}</Card.Title>
                                        <Card.Subtitle className="mb-3 text-muted small">by {pr.user.login}</Card.Subtitle>

                                        <div className="bg-black p-2 rounded border border-secondary mb-3 flex-grow-1" style={{ maxHeight: '100px', overflowY: 'auto', fontSize: '0.8rem' }}>
                                            <pre className="m-0 text-white-50" style={{ whiteSpace: 'pre-wrap' }}>{pr.body?.slice(0, 150)}...</pre>
                                        </div>

                                        <div className="d-flex gap-2 mt-auto">
                                            <Button variant="outline-light" size="sm" href={pr.html_url} target="_blank" className="flex-grow-1">View on GitHub</Button>
                                            <Button variant="success" size="sm" className="flex-grow-1 fw-bold" onClick={() => setSelectedPr(pr)}>Merge</Button>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </Container>
            <SiteFooter />

            {/* Merge Confirmation Modal */}
            <Modal show={!!selectedPr} onHide={() => !isMerging && setSelectedPr(null)} centered contentClassName="bg-dark text-white border-secondary">
                <Modal.Header closeButton={!isMerging} closeVariant="white" className="border-secondary">
                    <Modal.Title>Confirm Merge</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {actionMessage ? (
                        <Alert variant="success" className="m-0">{actionMessage}</Alert>
                    ) : (
                        <>
                            <p>Are you sure you want to merge <strong>{selectedPr?.title}</strong>?</p>
                            <p className="small text-muted">This will squash and merge the PR into the main branch.</p>
                        </>
                    )}
                </Modal.Body>
                {!actionMessage && (
                    <Modal.Footer className="border-secondary">
                        <Button variant="outline-light" onClick={() => setSelectedPr(null)} disabled={isMerging}>Cancel</Button>
                        <Button variant="success" onClick={handleMerge} disabled={isMerging}>
                            {isMerging ? <Spinner size="sm" animation="border" /> : "Confirm Merge"}
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
