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
                <div className="bg-black text-light min-vh-100 d-flex align-items-center justify-content-center">
                    <Container className="text-center">
                        <Alert variant="danger" className="py-5 shadow-lg border-0 bg-dark text-light border-danger border-opacity-25">
                            <h2 className="fw-bold mb-3">Something went wrong</h2>
                            <p className="opacity-75 mb-4">{this.state.error?.message || "A critical error occurred while rendering the page."}</p>
                            <Button variant="info" onClick={() => window.location.reload()}>Reload Page</Button>
                        </Alert>
                    </Container>
                </div>
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
interface PartFormProps {
    part: PartData;
    index: number;
    onUpdate: (id: string, data: Partial<PartData>) => void;
    onRemove: (id: string) => void;
    canRemove: boolean;
}

const PartForm: React.FC<PartFormProps> = ({ part, index, onUpdate, onRemove, canRemove }) => {
    const [isLocalLoading, setIsLocalLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<'platform' | 'tag' | null>(null)
    const [showErrorModal, setShowErrorModal] = useState(false)
    const [modalMessage, setModalMessage] = useState("")

    const handleFetchMetadata = async (e: React.FormEvent) => {
        e.preventDefault()
        const targetUrl = part.url.trim()
        if (!targetUrl) return

        setIsLocalLoading(true)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)

        try {
            const res = await fetch(`/api/scrape?url=${encodeURIComponent(targetUrl)}`, {
                signal: controller.signal
            })
            const data = (await res.json()) as { success: boolean; title?: string; image?: string; message?: string };
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
            setModalMessage(errorObj.name === 'AbortError' ? "Request timed out. Please fill details manually." : errorObj.message);
            setShowErrorModal(true)
        } finally {
            setIsLocalLoading(false)
        }
    }

    const toggleArrayValue = (field: 'platform' | 'typeOfPart', val: string) => {
        // Keeping it single-select for consistency with existing search/filtering, but allows toggling
        onUpdate(part.id, { [field]: [val] });
    }

    return (
        <Card className="bg-dark text-light border-secondary shadow-lg mb-5 rounded-xl part-form-card">
            <Card.Header className="bg-black border-0 p-4 d-flex justify-content-between align-items-center">
                <span className="small uppercase letter-spacing-1 fw-bold opacity-50">Part Model #{index + 1}</span>
                {canRemove && (
                    <Button variant="outline-danger" size="sm" className="rounded-pill px-3" onClick={() => onRemove(part.id)}>Remove</Button>
                )}
            </Card.Header>
            <Card.Body className="p-4 p-md-5">
                <Form onSubmit={handleFetchMetadata}>
                    <Form.Label className="small uppercase fw-bold opacity-75 mb-3">Data Source (Printables / Thingiverse)</Form.Label>
                    <div className="d-flex flex-column flex-md-row gap-3 mb-5">
                        <Form.Control
                            type="url"
                            placeholder="https://www.printables.com/model/..."
                            className="bg-black text-white border-secondary p-3 shadow-none flex-grow-1"
                            value={part.url}
                            onChange={e => onUpdate(part.id, { url: e.target.value })}
                            required
                        />
                        <Button variant="info" type="submit" className="px-4 fw-bold" disabled={isLocalLoading} style={{ minWidth: '160px' }}>
                            {isLocalLoading ? <Spinner animation="border" size="sm" /> : "Fetch Metadata"}
                        </Button>
                    </div>
                </Form>

                <Row className="gx-5">
                    <Col lg={7}>
                        <Form.Group className="mb-4">
                            <Form.Label className="small uppercase fw-bold opacity-75">Part Title *</Form.Label>
                            <Form.Control
                                className="bg-black text-white border-secondary p-3 shadow-none"
                                value={part.title}
                                onChange={e => onUpdate(part.id, { title: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-4">
                            <Form.Label className="small uppercase fw-bold opacity-75">Thumbnail URL</Form.Label>
                            <Form.Control
                                className="bg-black text-white border-secondary p-3 shadow-none"
                                value={part.imageSrc}
                                onChange={e => onUpdate(part.id, { imageSrc: e.target.value })}
                            />
                        </Form.Group>
                        <Form.Check
                            type="checkbox"
                            id={`oem-check-${part.id}`}
                            label="OFFICIAL OEM PART"
                            className="fw-bold text-info mb-4"
                            checked={part.isOem}
                            onChange={e => onUpdate(part.id, { isOem: e.target.checked })}
                        />
                    </Col>
                    <Col lg={5} className="d-flex align-items-center justify-content-center">
                        <div className="bg-black rounded-3 border border-secondary w-100 overflow-hidden shadow-inner d-flex align-items-center justify-content-center" style={{ aspectRatio: '16/9' }}>
                            {part.imageSrc ? (
                                <Image src={part.imageSrc} className="w-100 h-100 p-2" style={{ objectFit: 'contain' }} />
                            ) : (
                                <span className="opacity-25 small uppercase letter-spacing-1">Preview</span>
                            )}
                        </div>
                    </Col>
                </Row>

                <hr className="my-5 border-secondary opacity-25" />

                <div className="mb-5">
                    <div className="d-flex gap-2 mb-3">
                        <Button variant={activeTab === 'platform' ? 'info' : 'outline-info'} onClick={() => setActiveTab('platform')} className={activeTab === 'platform' ? 'text-white' : 'opacity-75'}>Platform *</Button>
                        <Button variant={activeTab === 'tag' ? 'success' : 'outline-success'} onClick={() => setActiveTab('tag')} className={activeTab === 'tag' ? 'text-white' : 'opacity-75'}>Category *</Button>
                    </div>
                    <div className={`p-4 rounded-3 border border-secondary bg-black bg-opacity-50 ${!activeTab ? 'd-none' : ''}`}>
                        <div className="d-flex flex-wrap gap-2">
                            {(activeTab === 'platform' ? PLATFORMS : TAGS).map(opt => (
                                <Badge
                                    key={opt}
                                    bg="none"
                                    className={`p-2 border cursor-pointer transition ${(activeTab === 'platform' ? part.platform : part.typeOfPart).includes(opt) ? (activeTab === 'platform' ? 'border-info text-info bg-info bg-opacity-10' : 'border-success text-success bg-success bg-opacity-10') : 'border-secondary opacity-50'}`}
                                    onClick={() => toggleArrayValue(activeTab === 'platform' ? 'platform' : 'typeOfPart', opt)}
                                >
                                    {opt}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>

                <Row>
                    <Col md={6} className="mb-4 mb-md-0">
                        <Form.Label className="small uppercase fw-bold opacity-75 mb-3">Primary Fabrication *</Form.Label>
                        <div className="d-flex flex-wrap gap-2 p-2 bg-black rounded border border-secondary border-opacity-50">
                            {FAB_METHODS.map(m => (
                                <Button key={m} size="sm" variant={part.fabricationMethod.includes(m) ? "secondary" : "link"} className={`text-decoration-none ${part.fabricationMethod.includes(m) ? 'text-white' : 'text-secondary opacity-50'}`} onClick={() => onUpdate(part.id, { fabricationMethod: [m] })}>{m}</Button>
                            ))}
                        </div>
                    </Col>
                    <Col md={6}>
                        <Form.Label className="small uppercase fw-bold opacity-75 mb-3">Direct Download / Mirror</Form.Label>
                        <Form.Control
                            className="bg-black text-white border-secondary p-3 shadow-none"
                            placeholder="Optional backup link"
                            value={part.dropboxUrl}
                            onChange={e => onUpdate(part.id, { dropboxUrl: e.target.value })}
                        />
                    </Col>
                </Row>
            </Card.Body>
            <Modal show={showErrorModal} onHide={() => setShowErrorModal(false)} centered contentClassName="bg-dark text-light border-secondary">
                <Modal.Header closeButton closeVariant="white" className="border-secondary"><Modal.Title className="fw-bold fs-5">Scrape Failed</Modal.Title></Modal.Header>
                <Modal.Body className="py-4"><p className="mb-0 opacity-75">{modalMessage}</p></Modal.Body>
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

    // RESTORED: Multi-part state management
    const [parts, setParts] = useState<PartData[]>([createEmptyPart()])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [hpField, setHpField] = useState("")
    const [manualUrl, setManualUrl] = useState<string | null>(null)
    const [warning, setWarning] = useState<string | null>(null)

    const updatePart = useCallback((id: string, data: Partial<PartData>) => {
        setParts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
    }, [])

    const removePart = useCallback((id: string) => {
        setParts(prev => prev.length > 1 ? prev.filter(p => p.id !== id) : prev)
    }, [])

    const addPart = () => {
        if (parts.length < 10) {
            setParts(prev => [...prev, createEmptyPart()])
        }
    }

    const handleFinalSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // Validate all entries
        for (const part of parts) {
            if (!part.url || !part.title || part.platform.length === 0 || part.typeOfPart.length === 0) {
                setError(`Validation Error: Please fill all required fields (Platform & Tag) for "${part.title || 'untitled part'}".`)
                window.scrollTo({ top: 0, behavior: 'smooth' })
                return
            }
        }

        setIsSubmitting(true)
        setError(null)
        setManualUrl(null)
        setWarning(null)

        try {
            const res = await fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    parts: parts, // Loop through entire array
                    hp_field: hpField
                })
            })
            const result = (await res.json()) as {
                error?: string;
                success?: boolean;
                prUrl?: string | null;
                manualUrl?: string | null;
                warning?: string | null;
            };

            if (!res.ok && !result.manualUrl) {
                throw new Error(result.error || "Submission failed.")
            }

            if (result.manualUrl) {
                setManualUrl(result.manualUrl)
                setWarning(result.warning)
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
            <div className="bg-black text-light min-vh-100 flex-column d-flex overflow-visible">
                <SiteNavbar />

                <header className="py-5 text-center">
                    <Container>
                        <h1 className="display-4 fw-bold mb-3" style={{ letterSpacing: '-0.02em' }}>Submit Parts</h1>
                        <p className="text-info small uppercase letter-spacing-2 fw-bold opacity-75">Contribute models to the community</p>
                    </Container>
                </header>

                <main className="flex-grow-1 pb-5">
                    <Container style={{ maxWidth: '900px' }}>
                        <ClientOnly fallback={<div className="text-center py-5 opacity-25"><Spinner animation="border" /></div>}>
                            <div style={{ minHeight: '120px' }}>
                                {isSubmitted ? (
                                    <Alert variant={manualUrl ? "warning" : "success"} className="mb-5 p-4 border-0 shadow-lg text-center bg-dark text-light border border-secondary">
                                        <h4 className="fw-bold mb-3">{manualUrl ? "⚠️ Branch Pushed" : "🚀 Submission Sent!"}</h4>
                                        <p className="mb-4 opacity-75 mx-auto" style={{ maxWidth: '500px' }}>
                                            {manualUrl
                                                ? (warning || "Automated PR creation failed, but your branch is safe. Click below to finish manually.")
                                                : "Thank you for contributing! Your request has been queued for review."
                                            }
                                        </p>
                                        <div className="d-flex flex-column align-items-center gap-2">
                                            {manualUrl && (
                                                <Button
                                                    variant="warning"
                                                    className="fw-bold px-5 py-2 shadow"
                                                    href={manualUrl}
                                                    target="_blank"
                                                >
                                                    Open PR on GitHub
                                                </Button>
                                            )}
                                            <Button variant="outline-light" size="sm" className="mt-4 opacity-50" onClick={() => { setIsSubmitted(false); setParts([createEmptyPart()]); setManualUrl(null); setWarning(null); }}>Submit Another Batch</Button>
                                        </div>
                                    </Alert>
                                ) : (
                                    error && (
                                        <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-5 border-0 shadow bg-dark text-danger border border-danger border-opacity-25">
                                            <span className="fw-bold">Error:</span> {error}
                                        </Alert>
                                    )
                                )}
                            </div>

                            {!isSubmitted && (
                                <>
                                    {/* Loop through the parts array to render form sections */}
                                    {parts.map((part, idx) => (
                                        <PartForm
                                            key={part.id}
                                            part={part}
                                            index={idx}
                                            onUpdate={updatePart}
                                            onRemove={removePart}
                                            canRemove={parts.length > 1}
                                        />
                                    ))}

                                    <div className="d-flex flex-column gap-4 mb-5">
                                        {parts.length < 10 && (
                                            <Button variant="outline-info" size="lg" className="py-4 border-dashed border-opacity-25 text-info fw-bold rounded-xl" onClick={addPart}>
                                                + Add Another Part Model ({parts.length}/10)
                                            </Button>
                                        )}

                                        <div className="p-4 p-md-5 bg-dark rounded-4 border border-secondary shadow-lg mt-4">
                                            <div className="d-flex flex-column gap-4 text-center">
                                                <div className="mx-auto" style={{ maxWidth: '600px' }}>
                                                    <p className="small text-light opacity-50 mb-0">
                                                        Submit all entries together. This will create one GitHub branch and one Pull Request.
                                                    </p>
                                                </div>
                                                <input
                                                    type="hidden"
                                                    name="hp_field"
                                                    value={hpField}
                                                    onChange={e => setHpField(e.target.value)}
                                                    className="d-none"
                                                    tabIndex={-1}
                                                />
                                                <Button
                                                    variant="primary"
                                                    size="lg"
                                                    className="px-5 py-3 fw-bold shadow-lg rounded-pill mx-auto"
                                                    onClick={() => handleFinalSubmit()}
                                                    disabled={isSubmitting}
                                                    style={{ minWidth: '300px' }}
                                                >
                                                    {isSubmitting ? (
                                                        <><Spinner animation="border" size="sm" className="me-2" /> Creating Pull Request...</>
                                                    ) : (
                                                        `Submit All ${parts.length} Parts`
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </ClientOnly>
                    </Container>
                </main>

                <SiteFooter />

                <style dangerouslySetInnerHTML={{
                    __html: `
                    .letter-spacing-1 { letter-spacing: 0.1rem; }
                    .letter-spacing-2 { letter-spacing: 0.3rem; }
                    .uppercase { text-transform: uppercase; }
                    .border-dashed { border-style: dashed !important; border-width: 2px !important; }
                    .transition { transition: all 0.2s ease-in-out; }
                    .cursor-pointer { cursor: pointer; }
                    .rounded-xl { border-radius: 1rem !important; }
                    .shadow-inner { box-shadow: inset 0 2px 10px rgba(0,0,0,0.8); }
                    .bg-dark { background-color: #090a0b !important; }
                    .border-secondary { border-color: #24282d !important; }
                    .part-form-card { overflow: visible !important; }
                ` }} />
            </div>
        </AppErrorBoundary>
    )
}

export default SubmitPage
