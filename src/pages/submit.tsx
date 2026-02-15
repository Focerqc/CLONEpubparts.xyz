import { type HeadFC, type PageProps } from "gatsby"
import React, { useState } from "react"
import { Container, Button, Form, Alert, Spinner, Image, Card, Row, Col, Badge } from "react-bootstrap"
import SiteFooter from "../components/SiteFooter"
import SiteMetaData from "../components/SiteMetaData"
import SiteNavbar from "../components/SiteNavbar"

/**
 * Diagnostic tracking for failed fetch attempts.
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
    // Stage Management: 'input' -> 'review' -> 'success'
    const [step, setStep] = useState<'input' | 'review' | 'success'>('input')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [diagnostics, setDiagnostics] = useState<FetchAttempt[]>([])

    // Form State
    const [url, setUrl] = useState("")
    const [partData, setPartData] = useState({
        title: "",
        imageSrc: "",
        platform: [] as string[],
        fabricationMethod: ["3d Printed"] as string[],
        typeOfPart: [] as string[],
        dropboxUrl: "",
        dropboxZipLastUpdated: new Date().toISOString().split('T')[0]
    })

    const [activeTab, setActiveTab] = useState<'platform' | 'tag' | null>(null)

    const PLATFORMS = ["MBoards", "Meepo", "Radium Performance", "Bioboards", "Hoyt St", "Lacroix", "Trampa", "Evolve", "Backfire", "Exway", "Onsra", "Wowgo", "Tynee", "Other"]
    const TAGS = ["Deck", "Truck", "Motor", "Enclosure", "Adapter", "Battery Box", "Mount", "Hardware", "Remote", "BMS", "ESC", "Drivetrain", "Wheel", "Pulley", "Bearing", "Gasket", "Bracket", "Miscellaneous"]
    const FAB_METHODS = ["3d Printed", "CNC", "Molded", "Other"]

    const toggleArray = (field: 'platform' | 'fabricationMethod' | 'typeOfPart', val: string) => {
        setPartData(prev => {
            const arr = (prev as any)[field] as string[];
            return { ...prev, [field]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] };
        });
    }

    /**
     * Resilient Metadata Scraper
     * Implements a 3-stage proxy backup with 12s timeouts.
     */
    const handleFetchMetadata = async (e: React.FormEvent) => {
        e.preventDefault()
        const targetUrl = url.trim()

        if (!targetUrl.startsWith("https://www.printables.com/model/") && !targetUrl.startsWith("https://www.thingiverse.com/thing:")) {
            setError("Invalid URL. Only Printables and Thingiverse models are supported.")
            return
        }

        setIsLoading(true)
        setError(null)
        setDiagnostics([])

        // Proxy chain per diagnostic insights
        const proxies = [
            { name: "AllOrigins (Primary)", url: "https://api.allorigins.win/raw?url=" },
            { name: "Bridged (Mirror)", url: "https://cors.bridged.cc/" },
            { name: "CorsSH (Backup)", url: "https://proxy.cors.sh/" }
        ]

        const attempts: FetchAttempt[] = []
        let successResult: { title: string, image: string } | null = null

        // Testing: Verifying with https://www.printables.com/model/123-cube
        for (const proxy of proxies) {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 12000) // 12s timeout
            const encodedUrl = encodeURIComponent(targetUrl)
            const finalRequestUrl = `${proxy.url}${encodedUrl}`

            try {
                const res = await fetch(finalRequestUrl, {
                    signal: controller.signal,
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
                })

                const bodyText = await res.text()
                clearTimeout(timeoutId)

                if (!res.ok) {
                    attempts.push({
                        proxy: proxy.name,
                        status: res.status,
                        message: "Proxy returned error state",
                        snippet: bodyText.substring(0, 300)
                    })
                    continue
                }

                const parser = new DOMParser()
                const doc = parser.parseFromString(bodyText, "text/html")

                // Extraction Logic
                const metaTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || doc.title || ""
                const cleanedTitle = metaTitle
                    .replace(/ \| Download free STL model \| Printables\.com$/, '')
                    .replace(/ - Thingiverse$/, '')
                    .trim()

                let metaImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content')
                    || doc.querySelector('img[src*="preview"], img[src*="model"], img[src*="hero"]')?.getAttribute('src')
                    || ""

                if (metaImage && !metaImage.startsWith("http")) {
                    metaImage = new URL(metaImage, targetUrl).href
                }

                if (cleanedTitle) {
                    successResult = { title: cleanedTitle, image: metaImage }
                    break
                } else {
                    attempts.push({
                        proxy: proxy.name,
                        status: "EMPTY_DATA",
                        message: "Fetch succeeded but no metadata found in HTML",
                        snippet: bodyText.substring(0, 300)
                    })
                }

            } catch (err: any) {
                clearTimeout(timeoutId)
                attempts.push({
                    proxy: proxy.name,
                    status: err.name === 'AbortError' ? 'TIMEOUT' : 'EXCEPTION',
                    message: err.message,
                    snippet: "Check network connection or proxy availability"
                })
            }
        }

        if (successResult) {
            setPartData(prev => ({ ...prev, title: successResult!.title, imageSrc: successResult!.image }))
            setStep('review')
        } else {
            setDiagnostics(attempts)
            setError("Auto-fetch failed. Protection blocks vary; manual entry is provided.")
            setStep('review')
        }
        setIsLoading(false)
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
            setStep('success')
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
                    <p className="text-light opacity-50">Contribute to the global ESK8CAD repository.</p>
                </header>

                {error && <Alert variant="danger" className="mb-4 border-0 shadow-sm">{error}</Alert>}

                {/* STEP 1: INPUT URL */}
                {step === 'input' && (
                    <Card className="bg-dark text-light border-secondary shadow-lg">
                        <Card.Body className="p-5">
                            <Form onSubmit={handleFetchMetadata}>
                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold fs-5">Project Link</Form.Label>
                                    <Form.Control
                                        type="url"
                                        placeholder="https://www.printables.com/model/..."
                                        className="bg-secondary text-white border-secondary p-3 shadow-sm"
                                        value={url}
                                        onChange={e => setUrl(e.target.value)}
                                        required
                                    />
                                    <Form.Text className="text-light opacity-40">Supports Printables and Thingiverse URLs.</Form.Text>
                                </Form.Group>
                                <div className="d-grid gap-3">
                                    <Button variant="primary" type="submit" size="lg" className="py-3 fw-bold" disabled={isLoading}>
                                        {isLoading ? <><Spinner animation="border" size="sm" className="me-2" /> Scraping...</> : "Fetch Metadata"}
                                    </Button>
                                    <div className="text-center small text-light opacity-50">
                                        Free proxies may timeout. Manual entry is always available.
                                    </div>
                                    <Button variant="outline-light" onClick={() => setStep('review')} className="opacity-50 mt-2">Skip & Enter Manually</Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                )}

                {/* STEP 2: REVIEW & CUSTOMIZE */}
                {step === 'review' && (
                    <Form onSubmit={handleFinalSubmit}>
                        <Card className="bg-dark text-light border-secondary shadow-lg mb-4">
                            <Card.Header className="bg-secondary border-0 p-4">
                                <h4 className="mb-0 fs-5 fw-bold">Meta Selection</h4>
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

                                {/* CATEGORY SELECTOR TABS */}
                                <div className="mb-5">
                                    <div className="d-flex gap-2">
                                        <Button variant={activeTab === 'platform' ? 'primary' : 'outline-light'} className="py-2 px-4 fw-bold shadow-sm" onClick={() => setActiveTab('platform')}>Board Platforms</Button>
                                        <Button variant={activeTab === 'tag' ? 'primary' : 'outline-light'} className="py-2 px-4 fw-bold shadow-sm" onClick={() => setActiveTab('tag')}>Technical Tags</Button>
                                    </div>
                                    <div className={`mt-3 p-4 rounded bg-secondary border border-secondary shadow-sm ${!activeTab && 'd-none'}`}>
                                        <div className="d-flex flex-wrap gap-2">
                                            {(activeTab === 'platform' ? PLATFORMS : TAGS).map(opt => {
                                                const isSel = (activeTab === 'platform' ? partData.platform : partData.typeOfPart).includes(opt)
                                                return (
                                                    <Badge
                                                        key={opt}
                                                        bg={isSel ? "primary" : "none"}
                                                        className={`p-2 border border-light cursor-pointer shadow-sm ${isSel ? 'text-white' : 'text-light opacity-40'}`}
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
                                        <Form.Label className="small uppercase fw-bold opacity-75 text-light">Methods</Form.Label>
                                        <div className="d-flex flex-wrap gap-2 p-3 bg-secondary rounded border border-secondary shadow-inner">
                                            {FAB_METHODS.map(m => (
                                                <Button
                                                    key={m}
                                                    size="sm"
                                                    variant={partData.fabricationMethod.includes(m) ? "primary" : "outline-light"}
                                                    className="opacity-60 fw-bold border-1"
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

                                <div className="mt-4 text-center">
                                    <small className="text-light opacity-30">Local testing may be blocked by CORS; deployment environment uses edge proxies.</small>
                                </div>
                            </Card.Body>
                            <Card.Footer className="bg-transparent border-0 p-4 text-end">
                                <Button onClick={() => setStep('input')} variant="link" className="text-light opacity-40 me-3 text-decoration-none">Back</Button>
                                <Button type="submit" variant="primary" size="lg" className="px-5 py-3 fw-bold shadow-lg" disabled={isLoading}>
                                    {isLoading ? <Spinner animation="border" size="sm" /> : "Submit Pull Request"}
                                </Button>
                            </Card.Footer>
                        </Card>
                    </Form>
                )}

                {/* DIAGNOSTIC FETCH LOGS */}
                {diagnostics.length > 0 && (
                    <Card className="bg-dark border-danger text-light mb-5 shadow">
                        <Card.Body>
                            <details>
                                <summary className="cursor-pointer text-danger fw-bold opacity-80">Full Scrape Diagnostic Logs ({diagnostics.length} attempts)</summary>
                                <div className="mt-3 small">
                                    {diagnostics.map((d, i) => (
                                        <div key={i} className="mb-3 p-3 bg-black bg-opacity-50 rounded border border-secondary border-opacity-50 shadow-sm">
                                            <div className="fw-bold text-info mb-1 uppercase letter-spacing-1">Attempt {i + 1}: {d.proxy}</div>
                                            <div className="mb-2"><strong>Status:</strong> <span className="text-danger">{d.status}</span> | {d.message}</div>
                                            <div className="text-light opacity-40 p-2 bg-dark rounded" style={{ fontSize: '0.7rem', fontFamily: 'monospace', overflowX: 'auto', whiteSpace: 'pre-wrap', maxHeight: '150px' }}>
                                                {d.snippet || "Internal error: No response body received."}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </details>
                        </Card.Body>
                    </Card>
                )}

                {/* STEP 3: SUCCESS STATE */}
                {step === 'success' && (
                    <Card className="bg-dark text-light border-secondary text-center p-5 shadow-lg">
                        <div className="display-2 mb-4">🚀</div>
                        <h2 className="fw-bold mb-4">Part Submitted!</h2>
                        <p className="mb-5 text-light opacity-60 lead">Submission has been channeled to the ESK8CAD repository. Track progress on GitHub.</p>
                        <Button variant="outline-light" size="lg" className="px-4" onClick={() => window.location.reload()}>Submit Another</Button>
                    </Card>
                )}
            </Container>

            <SiteFooter />

            <style dangerouslySetInnerHTML={{
                __html: `
                .bg-secondary { background-color: #121417 !important; }
                .border-secondary { border-color: #24282d !important; }
                .shadow-inner { box-shadow: inset 0 2px 8px rgba(0,0,0,0.7); }
                .cursor-pointer { cursor: pointer; }
                .uppercase { text-transform: uppercase; }
                .letter-spacing-1 { letter-spacing: 0.05rem; }
                .opacity-40 { opacity: 0.4; }
                .opacity-60 { opacity: 0.6; }
            `}} />
        </div>
    )
}

export default SubmitPage
