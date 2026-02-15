import { type HeadFC, type PageProps } from "gatsby"
import React, { useState } from "react"
import { Container, Button, Form, Alert, Spinner, Image, Card, Row, Col, Badge } from "react-bootstrap"
import SiteFooter from "../components/SiteFooter"
import SiteMetaData from "../components/SiteMetaData"
import SiteNavbar from "../components/SiteNavbar"
import ClientOnly from "../components/ClientOnly"

/**
 * Diagnostic tracking for fetch attempts.
 */
interface FetchAttempt {
    proxy: string;
    status: number | string;
    message: string;
    snippet: string;
}

export const Head: HeadFC = () => (
    <>
        <html lang="en" />
        <SiteMetaData title="Submit Part | ESK8CAD.COM" />
    </>
)

const SubmitPage: React.FC<PageProps> = () => {
    // Stage Management
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [attempts, setAttempts] = useState<FetchAttempt[]>([])

    // Form State
    const [url, setUrl] = useState("")
    const [partData, setPartData] = useState({
        title: "",
        imageSrc: "",
        platform: [] as string[],
        fabricationMethod: ["3d Printed"] as string[],
        typeOfPart: [] as string[],
        dropboxUrl: "",
        dropboxZipLastUpdated: typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : ""
    })

    const [activeTab, setActiveTab] = useState<'platform' | 'tag' | null>(null)

    const PLATFORMS = ["MBoards", "Meepo", "Radium Performance", "Bioboards", "Hoyt St", "Lacroix", "Trampa", "Evolve", "Backfire", "Exway", "Onsra", "Wowgo", "Tynee", "Other"]
    const TAGS = ["Deck", "Truck", "Motor", "Enclosure", "Adapter", "Battery Box", "Mount", "Hardware", "Remote", "BMS", "ESC", "Drivetrain", "Wheel", "Pulley", "Bearing", "Gasket", "Bracket", "Miscellaneous"]
    const FAB_METHODS = ["3d Printed", "CNC", "Molded", "Other"]

    const toggleArray = (field: 'platform' | 'fabricationMethod' | 'typeOfPart', val: string) => {
        setPartData(prev => {
            const arr = (prev as any)[field] as string[];
            const next = arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
            return { ...prev, [field]: next };
        });
    }

    /**
     * handleFetchMetadata: Direct fetch -> AllOrigins fallback.
     */
    const handleFetchMetadata = async (e: React.FormEvent) => {
        e.preventDefault()
        const targetUrl = url.trim()
        if (!targetUrl) return

        setIsLoading(true)
        setError(null)
        const currentAttempts: FetchAttempt[] = []

        try {
            let html = ""

            // Attempt 1: Direct
            try {
                const res = await fetch(targetUrl)
                const text = await res.text()
                currentAttempts.push({ proxy: "Direct", status: res.status, message: res.ok ? "Success" : "Failed", snippet: text.substring(0, 200) })
                if (res.ok) html = text
            } catch (err: any) {
                currentAttempts.push({ proxy: "Direct", status: "Exception", message: err.message, snippet: "" })
            }

            // Attempt 2: AllOrigins fallback
            if (!html) {
                const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`
                try {
                    const res = await fetch(proxy)
                    const text = await res.text()
                    currentAttempts.push({ proxy: "AllOrigins", status: res.status, message: res.ok ? "Success" : "Failed", snippet: text.substring(0, 200) })
                    if (res.ok) html = text
                } catch (err: any) {
                    currentAttempts.push({ proxy: "AllOrigins", status: "Exception", message: err.message, snippet: "" })
                }
            }

            setAttempts(currentAttempts)

            if (!html) throw new Error("Metadata fetch blocked. Protection active.")

            const parser = new DOMParser()
            const doc = parser.parseFromString(html, "text/html")

            const titleMeta = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || doc.title || ""
            const cleanedTitle = titleMeta
                .replace(/ \| Download free STL model \| Printables\.com$/i, '')
                .replace(/ - Thingiverse$/i, '')
                .trim()

            let imgMeta = doc.querySelector('meta[property="og:image"]')?.getAttribute('content')
                || doc.querySelector('img[src*="preview"], img[src*="model"], img[src*="hero"]')?.getAttribute('src')
                || ""

            if (imgMeta && !imgMeta.startsWith("http")) {
                imgMeta = new URL(imgMeta, targetUrl).href
            }

            setPartData(prev => ({ ...prev, title: cleanedTitle || prev.title, imageSrc: imgMeta || prev.imageSrc }))

        } catch (err: any) {
            setError("Fetch failed. Please enter details manually.")
            console.error("Scrape error:", err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            const res = await fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ printablesUrl: url, editedPart: partData })
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error || "Submission failed")
            setIsSubmitted(true)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="bg-black text-light min-vh-100">
            <SiteNavbar />
            <Container className="py-5" style={{ maxWidth: '900px' }}>
                <header className="text-center mb-5">
                    <h1 className="display-4 fw-bold">Submit a Part</h1>
                    <p className="text-light opacity-50">Contribute CAD models and parts to our ESK8 catalog.</p>
                </header>

                <ClientOnly fallback={<div className="text-center py-5"><Spinner animation="border" /></div>}>
                    {isSubmitted ? (
                        <Alert variant="success" className="mb-5 p-4 border-0 shadow-lg text-center">
                            <h4 className="fw-bold mb-2">🚀 Submission Received!</h4>
                            <p className="mb-3 opacity-75">Thank you for contributing. Your request has been sent for review.</p>
                            <Button variant="outline-success" onClick={() => { setIsSubmitted(false); setUrl(""); setPartData({ title: "", imageSrc: "", platform: [], fabricationMethod: ["3d Printed"], typeOfPart: [], dropboxUrl: "", dropboxZipLastUpdated: new Date().toISOString().split('T')[0] }) }}>Submit Another</Button>
                        </Alert>
                    ) : (
                        <>
                            {error && <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-4 border-0 shadow-sm">{error}</Alert>}

                            {/* URL SCOPE */}
                            <Card className="bg-dark text-light border-secondary shadow-lg mb-4">
                                <Card.Body className="p-4 p-md-5">
                                    <Form onSubmit={handleFetchMetadata}>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-bold fs-5">Project Link</Form.Label>
                                            <Form.Control
                                                type="url"
                                                placeholder="Paste Printables or Thingiverse URL here"
                                                className="bg-secondary text-white border-secondary p-3 shadow-sm"
                                                value={url}
                                                onChange={e => setUrl(e.target.value)}
                                                required
                                            />
                                            <Form.Text className="text-light opacity-40">Supports Printables and Thingiverse URLs.</Form.Text>
                                        </Form.Group>
                                        <div className="d-flex flex-wrap gap-3">
                                            <Button variant="primary" type="submit" size="lg" className="px-5 py-3 fw-bold" disabled={isLoading}>
                                                {isLoading ? <><Spinner animation="border" size="sm" className="me-2" /> Fetching...</> : "Fetch Metadata"}
                                            </Button>
                                            <Button variant="outline-light" onClick={() => setError(null)} className="opacity-50">Skip to Manual</Button>
                                        </div>
                                    </Form>
                                </Card.Body>
                            </Card>

                            {/* PART DATA */}
                            <Form onSubmit={handleFinalSubmit}>
                                <Card className="bg-dark text-light border-secondary shadow-lg mb-4">
                                    <Card.Header className="bg-secondary border-0 p-4">
                                        <h4 className="mb-0 fs-5 fw-bold uppercase letter-spacing-1">Meta Selection</h4>
                                    </Card.Header>
                                    <Card.Body className="p-4 p-md-5">
                                        <Row className="gx-5">
                                            <Col md={7}>
                                                <Form.Group className="mb-4">
                                                    <Form.Label className="small uppercase fw-bold opacity-75 text-light">Part Title</Form.Label>
                                                    <Form.Control
                                                        className="bg-secondary text-white border-secondary p-3 shadow-sm"
                                                        value={partData.title}
                                                        onChange={e => setPartData({ ...partData, title: e.target.value })}
                                                        required
                                                        placeholder="e.g. Radium Performance Motor Plate"
                                                    />
                                                </Form.Group>
                                                <Form.Group className="mb-4">
                                                    <Form.Label className="small uppercase fw-bold opacity-75 text-light">Image Source (Direct Link)</Form.Label>
                                                    <Form.Control
                                                        className="bg-secondary text-white border-secondary p-3 shadow-sm"
                                                        value={partData.imageSrc}
                                                        onChange={e => setPartData({ ...partData, imageSrc: e.target.value })}
                                                        placeholder="https://..."
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={5}>
                                                <Form.Label className="small uppercase fw-bold opacity-75 text-light">Visual Preview</Form.Label>
                                                <div className="bg-black rounded border border-secondary overflow-hidden position-relative shadow-inner" style={{ width: '100%', paddingBottom: '75%', backgroundColor: '#090a0b' }}>
                                                    {partData.imageSrc ? (
                                                        <Image
                                                            src={partData.imageSrc}
                                                            className="position-absolute w-100 h-100 p-2"
                                                            style={{ objectFit: 'contain' }}
                                                            onError={(e) => { (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="h-100 d-flex align-items-center justify-content-center text-muted small">Preview unavailable</div>' }}
                                                        />
                                                    ) : (
                                                        <div className="position-absolute w-100 h-100 d-flex align-items-center justify-content-center text-muted small">No Preview</div>
                                                    )}
                                                </div>
                                            </Col>
                                        </Row>

                                        <hr className="my-5 border-secondary opacity-25" />

                                        <div className="mb-5">
                                            <div className="d-flex gap-2">
                                                <Button variant={activeTab === 'platform' ? 'primary' : 'outline-light'} className="py-2 px-4 fw-bold shadow-sm" onClick={() => setActiveTab('platform')}>Board Platforms</Button>
                                                <Button variant={activeTab === 'tag' ? 'primary' : 'outline-light'} className="py-2 px-4 fw-bold shadow-sm" onClick={() => setActiveTab('tag')}>Technical Tags</Button>
                                            </div>
                                            <div className={`mt-3 p-4 rounded bg-secondary border border-secondary shadow-sm ${!activeTab ? 'd-none' : ''}`}>
                                                <div className="d-flex flex-wrap gap-2">
                                                    {(activeTab === 'platform' ? PLATFORMS : TAGS).map(opt => {
                                                        const isSel = (activeTab === 'platform' ? partData.platform : partData.typeOfPart).includes(opt)
                                                        return (
                                                            <Badge
                                                                key={opt}
                                                                bg={isSel ? "primary" : "none"}
                                                                className={`p-2 border border-light cursor-pointer shadow-sm ${isSel ? 'text-white' : 'text-light opacity-50'}`}
                                                                style={{ cursor: 'pointer', transition: 'all 0.1s ease' }}
                                                                onClick={() => toggleArray(activeTab === 'platform' ? 'platform' : 'typeOfPart', opt)}
                                                            >
                                                                {opt} {isSel && "✓"}
                                                            </Badge>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                            <div className="mt-3 d-flex flex-wrap gap-2">
                                                {partData.platform.map(p => <Badge key={p} bg="info" className="text-dark py-2 px-3 shadow-sm border border-info">P: {p}</Badge>)}
                                                {partData.typeOfPart.map(t => <Badge key={t} bg="success" className="py-2 px-3 shadow-sm border border-success">T: {t}</Badge>)}
                                            </div>
                                        </div>

                                        <Row className="mb-4">
                                            <Col md={6}>
                                                <Form.Label className="small uppercase fw-bold opacity-75 text-light">Fab Methods</Form.Label>
                                                <div className="d-flex flex-wrap gap-3 p-3 bg-secondary rounded border border-secondary shadow-inner">
                                                    {FAB_METHODS.map(m => (
                                                        <Button
                                                            key={m}
                                                            size="sm"
                                                            variant={partData.fabricationMethod.includes(m) ? "primary" : "outline-light"}
                                                            className={`fw-bold border-1 ${!partData.fabricationMethod.includes(m) ? 'opacity-50' : ''}`}
                                                            onClick={() => toggleArray('fabricationMethod', m)}
                                                        >
                                                            {m}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Label className="small uppercase fw-bold opacity-75 text-light">Mirror Link (Optional)</Form.Label>
                                                <Form.Control
                                                    className="bg-secondary text-white border-secondary p-3 shadow-sm"
                                                    value={partData.dropboxUrl}
                                                    onChange={e => setPartData({ ...partData, dropboxUrl: e.target.value })}
                                                    placeholder="Direct file repository link"
                                                />
                                            </Col>
                                        </Row>
                                    </Card.Body>
                                    <Card.Footer className="bg-transparent border-0 p-4 text-end">
                                        <Button type="submit" variant="primary" size="lg" className="px-5 py-3 fw-bold shadow-lg" disabled={isLoading}>
                                            {isLoading ? <Spinner animation="border" size="sm" /> : "Open Pull Request"}
                                        </Button>
                                    </Card.Footer>
                                </Card>
                            </Form>

                            {/* DEBUG LOG */}
                            {attempts.length > 0 && (
                                <Card className="bg-dark border-secondary text-light mt-4">
                                    <Card.Body>
                                        <details>
                                            <summary className="cursor-pointer fw-bold opacity-75">Fetch Debug Log</summary>
                                            <div className="mt-3">
                                                <Button
                                                    size="sm"
                                                    variant="outline-info"
                                                    className="mb-2"
                                                    onClick={() => navigator.clipboard.writeText(JSON.stringify(attempts, null, 2))}
                                                >
                                                    Copy Log
                                                </Button>
                                                <pre className="p-3 bg-black rounded" style={{ fontSize: '0.7rem', maxHeight: '200px', overflow: 'auto' }}>
                                                    {JSON.stringify(attempts, null, 2)}
                                                </pre>
                                            </div>
                                        </details>
                                    </Card.Body>
                                </Card>
                            )}
                        </>
                    )}
                </ClientOnly>
            </Container>

            <SiteFooter />

            <style dangerouslySetInnerHTML={{
                __html: `
                .bg-secondary { background-color: #121417 !important; }
                .border-secondary { border-color: #24282d !important; }
                .shadow-inner { box-shadow: inset 0 2px 8px rgba(0,0,0,0.7); }
                .cursor-pointer { cursor: pointer; }
                .uppercase { text-transform: uppercase; }
                .letter-spacing-1 { letter-spacing: 0.1rem; }
            `}} />
        </div>
    )
}

export default SubmitPage
