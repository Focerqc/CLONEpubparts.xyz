import { type HeadFC, type PageProps } from "gatsby"
import React, { useState, useCallback, Component, ErrorInfo, ReactNode } from "react"
import { Container, Button, Form, Alert, Spinner, Image, Card, Row, Col, Badge, Modal } from "react-bootstrap"
import SiteFooter from "../components/SiteFooter"
import SiteMetaData from "../components/SiteMetaData"
import SiteNavbar from "../components/SiteNavbar"
import ClientOnly from "../components/ClientOnly"

// --- Error Boundary ---
interface ErrorBoundaryProps { children: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; error: Error | null; }

class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }
    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <Container className="py-5 text-center">
                    <Alert variant="danger" className="py-5 shadow">
                        <h2 className="fw-bold">Something went wrong</h2>
                        <p className="opacity-75">{this.state.error?.message || "A critical error occurred."}</p>
                        <Button variant="outline-danger" onClick={() => window.location.reload()}>Reload Page</Button>
                    </Alert>
                </Container>
            );
        }
        return this.props.children;
    }
}

// --- Constants ---
const PLATFORMS = [
    "Street (DIY/Generic)", "Off-Road (DIY/Generic)", "Misc", "3D Servisas", "Acedeck", "Apex Boards",
    "Backfire", "Bioboards", "Boardnamics", "Defiant Board Society", "Evolve", "Exway",
    "Fluxmotion", "Hoyt St", "Lacroix Boards", "Linnpower", "MBoards", "MBS", "Meepo",
    "Newbee", "Propel", "Radium Performance", "Stooge Raceboards", "Summerboard",
    "Trampa Boards", "Wowgo"
]
const TAGS = [
    "Anti-sink plate", "Battery", "Battery building parts", "Bearing", "BMS", "Bushing", "Charge Port",
    "Charger case", "Complete board", "Connector", "Cover", "Deck", "Drill hole Jig", "Enclosure",
    "ESC", "Fender", "Foothold / Bindings", "Fuse holder", "Gland", "Guard / Bumper", "Headlight",
    "Heatsink", "Idler", "Motor", "Motor Mount", "Mount", "Pulley", "Remote", "Riser",
    "Shocks / Damper", "Sprocket", "Stand", "Thumbwheel", "Tire", "Truck", "Wheel", "Wheel Hub"
]
const FAB_METHODS = ["3d Printed", "CNC", "Molded", "Other"]

interface PartData {
    id: string;
    url: string;
    title: string;
    imageSrc: string;
    platform: string[];
    fabricationMethod: string[];
    typeOfPart: string[];
    dropboxUrl: string;
    dropboxZipLastUpdated: string;
    isOem: boolean;
}

// --- Sub-Component: PartForm ---
const PartForm: React.FC<{
    part: PartData;
    index: number;
    onUpdate: (id: string, data: Partial<PartData>) => void;
    onRemove: (id: string) => void;
    canRemove: boolean;
}> = ({ part, index, onUpdate, onRemove, canRemove }) => {
    const [isLocalLoading, setIsLocalLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'platform' | 'tag' | null>(null)
    const [showErrorModal, setShowErrorModal] = useState(false)
    const [modalMessage, setModalMessage] = useState("")

    const handleFetchMetadata = async (e: React.FormEvent) => {
        e.preventDefault()
        const targetUrl = part.url.trim()
        if (!targetUrl) return

        if (targetUrl.length > 500) {
            setModalMessage("URL is too long (max 500 characters).")
            setShowErrorModal(true)
            return
        }

        setIsLocalLoading(true)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)

        try {
            const res = await fetch(`/api/scrape?url=${encodeURIComponent(targetUrl)}`, {
                signal: controller.signal
            })
            const data = (await res.json()) as { success: boolean; title?: string; image?: string; message?: string };
            console.log(`[Scraper API] Metadata for Part #${index + 1}:`, data);
            clearTimeout(timeoutId)

            if (!res.ok || data.success === false) {
                throw new Error(data.message || "Scrape Failed: Could not fetch metadata.");
            }

            onUpdate(part.id, {
                title: data.title || part.title,
                imageSrc: data.image || part.imageSrc,
            })
        } catch (err: unknown) {
            clearTimeout(timeoutId)
            const errorObj = err as Error;
            const msg = errorObj.name === 'AbortError'
                ? "Request timed out after 8 seconds. Please fill details manually."
                : (errorObj.message || "Scrape Failed: Could not fetch metadata.");
            setModalMessage(msg)
            setShowErrorModal(true)
        } finally {
            setIsLocalLoading(false)
        }
    }

    const setSingleValue = (field: 'platform' | 'fabricationMethod' | 'typeOfPart', val: string) => {
        onUpdate(part.id, { [field]: [val] });
    }

    return (
        <Card className="bg-dark text-light border-secondary shadow-lg mb-5 part-form-card">
            <Card.Header className="bg-secondary border-0 p-4 d-flex justify-content-between align-items-center">
                <h4 className="mb-0 fs-5 fw-bold uppercase letter-spacing-1">Part #{index + 1}</h4>
                {canRemove && (
                    <Button variant="outline-danger" size="sm" onClick={() => onRemove(part.id)}>Remove</Button>
                )}
            </Card.Header>
            <Card.Body className="p-4 p-md-5">
                <Form onSubmit={handleFetchMetadata}>
                    <Form.Group className="mb-4">
                        <Form.Label className="fw-bold fs-5">Project Link</Form.Label>
                        <Form.Control
                            type="url"
                            placeholder="Paste Printables or Thingiverse URL here"
                            className="input-contrast text-white border-secondary p-3 shadow-sm"
                            value={part.url}
                            onChange={e => onUpdate(part.id, { url: e.target.value })}
                            required
                        />
                    </Form.Group>
                    <div className="d-flex align-items-center gap-3 mb-4">
                        <Button variant="primary" type="submit" size="lg" className="px-5 py-3 fw-bold shadow-sm" disabled={isLocalLoading} style={{ minWidth: '180px' }}>
                            {isLocalLoading ? <><Spinner animation="border" size="sm" className="me-2" /> Loading...</> : "Fetch Metadata"}
                        </Button>
                        <Form.Check
                            type="checkbox"
                            id={`oem-check-${part.id}`}
                            label="OEM PART"
                            className="fw-bold text-primary"
                            checked={part.isOem}
                            onChange={e => onUpdate(part.id, { isOem: e.target.checked })}
                        />
                    </div>
                </Form>

                <hr className="my-5 border-secondary opacity-25" />

                <Row className="gx-5">
                    <Col md={7}>
                        <Form.Group className="mb-4">
                            <Form.Label className="small uppercase fw-bold opacity-75 text-light">Part Title *</Form.Label>
                            <Form.Control
                                className="input-contrast text-white border-secondary p-3 shadow-sm"
                                value={part.title}
                                onChange={e => onUpdate(part.id, { title: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-4">
                            <Form.Label className="small uppercase fw-bold opacity-75 text-light">Image URL</Form.Label>
                            <Form.Control
                                className="input-contrast text-white border-secondary p-3 shadow-sm"
                                value={part.imageSrc}
                                onChange={e => onUpdate(part.id, { imageSrc: e.target.value })}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={5}>
                        <div className="bg-black rounded border border-secondary overflow-hidden position-relative shadow-inner" style={{ width: '100%', paddingBottom: '75%' }}>
                            {part.imageSrc && <Image src={part.imageSrc} className="position-absolute w-100 h-100 p-2" style={{ objectFit: 'contain' }} />}
                        </div>
                    </Col>
                </Row>

                <div className="my-5">
                    <div className="d-flex gap-2 mb-2">
                        <Button variant={activeTab === 'platform' ? 'primary' : 'outline-light'} onClick={() => setActiveTab('platform')}>Board Platform *</Button>
                        <Button variant={activeTab === 'tag' ? 'primary' : 'outline-light'} onClick={() => setActiveTab('tag')}>Technical Tag *</Button>
                    </div>
                    <div className={`mt-3 p-4 rounded bg-secondary border border-secondary shadow-sm ${!activeTab ? 'd-none' : ''}`}>
                        <div className="d-flex flex-wrap gap-2">
                            {(activeTab === 'platform' ? PLATFORMS : TAGS).map(opt => (
                                <Badge
                                    key={opt}
                                    bg={(activeTab === 'platform' ? part.platform : part.typeOfPart).includes(opt) ? "primary" : "none"}
                                    className="p-2 border border-light cursor-pointer shadow-sm"
                                    onClick={() => setSingleValue(activeTab === 'platform' ? 'platform' : 'typeOfPart', opt)}
                                >
                                    {opt}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>

                <Row className="mb-4">
                    <Col md={6}>
                        <Form.Label className="small uppercase fw-bold opacity-75 text-light">Fab Method *</Form.Label>
                        <div className="d-flex flex-wrap gap-2 p-3 bg-secondary rounded border border-secondary shadow-inner">
                            {FAB_METHODS.map(m => (
                                <Button key={m} size="sm" variant={part.fabricationMethod.includes(m) ? "primary" : "outline-light"} onClick={() => setSingleValue('fabricationMethod', m)}>{m}</Button>
                            ))}
                        </div>
                    </Col>
                    <Col md={6}>
                        <Form.Label className="small uppercase fw-bold opacity-75 text-light">Mirror Link</Form.Label>
                        <Form.Control
                            className="input-contrast text-white border-secondary p-3 shadow-sm"
                            value={part.dropboxUrl}
                            onChange={e => onUpdate(part.id, { dropboxUrl: e.target.value })}
                        />
                    </Col>
                </Row>
            </Card.Body>
            <Modal show={showErrorModal} onHide={() => setShowErrorModal(false)} centered contentClassName="bg-dark text-light border-secondary">
                <Modal.Header closeButton closeVariant="white" className="border-secondary"><Modal.Title className="fw-bold">Scrape Failed</Modal.Title></Modal.Header>
                <Modal.Body><p>{modalMessage}</p></Modal.Body>
                <Modal.Footer className="border-secondary"><Button variant="outline-light" onClick={() => setShowErrorModal(false)}>Close</Button></Modal.Footer>
            </Modal>
        </Card>
    )
}

// --- Main Component: SubmitPage ---
const SubmitPage: React.FC<PageProps> = () => {
    const createEmptyPart = (): PartData => ({
        id: Math.random().toString(36).substr(2, 9),
        url: "",
        title: "",
        imageSrc: "",
        platform: [],
        fabricationMethod: ["3d Printed"],
        typeOfPart: [],
        dropboxUrl: "",
        dropboxZipLastUpdated: typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : "",
        isOem: false
    })

    const [forms, setForms] = useState<PartData[]>([createEmptyPart()])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [hpField, setHpField] = useState("")
    const [manualUrl, setManualUrl] = useState<string | null>(null)
    const [warning, setWarning] = useState<string | null>(null)

    const updatePart = useCallback((id: string, data: Partial<PartData>) => {
        setForms(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
    }, [])

    const removePart = useCallback((id: string) => {
        setForms(prev => prev.length > 1 ? prev.filter(p => p.id !== id) : prev)
    }, [])

    const addPart = () => {
        if (forms.length < 10) {
            setForms(prev => [...prev, createEmptyPart()])
        }
    }

    const handleFinalSubmit = async () => {
        // Validation check
        for (const part of forms) {
            if (!part.url || !part.title || part.platform.length === 0 || part.typeOfPart.length === 0) {
                setError(`Please complete all required fields for every part (Form for "${part.title || 'unnamed part'}").`)
                window.scrollTo({ top: 0, behavior: 'smooth' })
                return
            }
        }

        setIsSubmitting(true)
        setError(null)
        setManualUrl(null)
        setWarning(null)

        try {
            const payload = {
                parts: forms.map(p => ({
                    title: p.title,
                    imageSrc: p.imageSrc,
                    platform: p.platform,
                    fabricationMethod: p.fabricationMethod,
                    typeOfPart: p.typeOfPart,
                    dropboxUrl: p.dropboxUrl,
                    dropboxZipLastUpdated: p.dropboxZipLastUpdated,
                    externalUrl: p.url,
                    isOem: p.isOem
                })),
                hp_field: hpField
            }

            const res = await fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            const result = (await res.json()) as {
                error?: string;
                success?: boolean;
                prUrl?: string | null;
                manualUrl?: string | null;
                warning?: string | null;
            };

            console.log("[Submit API] Final Response:", result);

            if (!res.ok && !result.manualUrl) {
                throw new Error(result.error || "Submission request failed.")
            }

            if (result.manualUrl) {
                setManualUrl(result.manualUrl)
                setWarning(result.warning || null)
            }

            setIsSubmitted(true)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } catch (err: unknown) {
            setError((err as Error).message)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <AppErrorBoundary>
            <div className="bg-black text-light min-vh-100">
                <SiteNavbar />
                <Container className="py-5" style={{ maxWidth: '900px' }}>
                    <header className="text-center mb-5">
                        <h1 className="display-4 fw-bold">Submit Parts</h1>
                        <p className="text-light opacity-50">Contribute CAD models to our catalog. Batch up to 10 parts in one PR.</p>
                    </header>

                    <ClientOnly fallback={<div className="text-center py-5"><Spinner animation="border" /></div>}>
                        <div style={{ minHeight: '100px' }}>
                            {isSubmitted ? (
                                <Alert variant={manualUrl ? "warning" : "success"} className="mb-5 p-4 border-0 shadow-lg text-center">
                                    <h4 className="fw-bold mb-2">{manualUrl ? "⚠️ Branch Pushed!" : "🚀 Submission Received!"}</h4>
                                    <p className="mb-3 opacity-75">
                                        {manualUrl
                                            ? (warning || "Your changes were saved, but automated PR creation skipped. Please click below to finish.")
                                            : "Thank you for contributing. Your request has been sent for review."
                                        }
                                    </p>
                                    {manualUrl && (
                                        <Button
                                            variant="warning"
                                            className="fw-bold mb-3 px-4"
                                            href={manualUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Complete PR on GitHub
                                        </Button>
                                    )}
                                    <div className="mt-3">
                                        <Button variant="outline-dark" size="sm" onClick={() => { setIsSubmitted(false); setForms([createEmptyPart()]); setManualUrl(null); setWarning(null); }}>Start New Batch</Button>
                                    </div>
                                </Alert>
                            ) : (
                                error && (
                                    <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-4 border-0 shadow-sm p-4">
                                        <p className="mb-2 fw-bold">Submission Error:</p>
                                        <p className="mb-0">{error}</p>
                                    </Alert>
                                )
                            )}
                        </div>

                        {!isSubmitted && (
                            <>
                                {forms.map((part, idx) => (
                                    <PartForm
                                        key={part.id}
                                        part={part}
                                        index={idx}
                                        onUpdate={updatePart}
                                        onRemove={removePart}
                                        canRemove={forms.length > 1}
                                    />
                                ))}

                                <div className="d-flex flex-column gap-4 mb-5 pb-5">
                                    {forms.length < 10 && (
                                        <Button variant="outline-primary" size="lg" className="py-3 border-dashed" onClick={addPart} disabled={isSubmitting}>
                                            + Add Another Part ({forms.length}/10)
                                        </Button>
                                    )}

                                    <div className="p-4 bg-dark rounded border border-secondary shadow-lg">
                                        <div className="d-flex flex-column gap-3">
                                            <p className="small text-light opacity-50 mb-0">
                                                Note: Fine-grained tokens may require manual PR confirmation. For full automation, a Classic PAT with "repo" scope is recommended.
                                            </p>
                                            <input
                                                type="hidden"
                                                name="hp_field"
                                                value={hpField}
                                                onChange={e => setHpField(e.target.value)}
                                                style={{ display: 'none' }}
                                                tabIndex={-1}
                                                autoComplete="off"
                                            />
                                            <Button
                                                variant="primary"
                                                size="lg"
                                                className="px-5 py-3 fw-bold shadow-lg"
                                                onClick={handleFinalSubmit}
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? <><Spinner animation="border" size="sm" className="me-2" /> Creating Pull Request...</> : `Submit All ${forms.length} Parts`}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </ClientOnly>
                </Container>

                <SiteFooter />

                <style dangerouslySetInnerHTML={{
                    __html: `
                    .bg-secondary { background-color: #121417 !important; } 
                    .border-secondary { border-color: #24282d !important; } 
                    .input-contrast { background-color: #2b3035 !important; border-color: #495057 !important; color: #fff !important; } 
                    .shadow-inner { box-shadow: inset 0 2px 8px rgba(0,0,0,0.7); } 
                    .cursor-pointer { cursor: pointer; } 
                    .uppercase { text-transform: uppercase; }
                    .letter-spacing-1 { letter-spacing: 0.1rem; }
                    .border-dashed { border-style: dashed !important; border-width: 2px !important; }
                    .part-form-card { overflow: visible !important; }
                ` }} />
            </div>
        </AppErrorBoundary>
    )
}

export default SubmitPage
