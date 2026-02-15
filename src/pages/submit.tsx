
import { type HeadFC, type PageProps } from "gatsby"
import React, { useState } from "react"
import { Container, Button, Form, Alert, Spinner, Image, Card, Row, Col, Badge } from "react-bootstrap"
import SiteFooter from "../components/SiteFooter"
import SiteMetaData from "../components/SiteMetaData"
import SiteNavbar from "../components/SiteNavbar"

export const Head: HeadFC = () => (
    <>
        <html lang="en" />
        <SiteMetaData title="Submit Part | ESK8CAD.COM" />
    </>
)

const SubmitPage: React.FC<PageProps> = () => {
    // Steps: 'input' -> 'review' -> 'success'
    const [step, setStep] = useState<'input' | 'review' | 'success'>('input')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successData, setSuccessData] = useState<{ prUrl?: string, manualUrl?: string } | null>(null)
    const [activeField, setActiveField] = useState<'platform' | 'fabricationMethod' | 'typeOfPart' | null>(null)

    // Form Data
    const [url, setUrl] = useState("")
    const [partData, setPartData] = useState({
        title: "",
        imageSrc: "",
        platform: [] as string[],
        description: "",
        fabricationMethod: ["3d Printed"] as string[],
        typeOfPart: [] as string[],
        dropboxUrl: "",
        dropboxZipLastUpdated: new Date().toISOString().split('T')[0]
    })

    const platforms = [
        "MBoards", "Meepo", "Radium Performance", "Bioboards", "Hoyt St", "Lacroix", "Trampa", "Evolve", "Backfire", "Exway", "Onsra", "Wowgo", "Tynee", "Other"
    ]

    const fabricationMethods = ["3d Printed", "CNC", "Molded", "Other"]

    const commonTags = [
        "Deck", "Truck", "Motor", "Enclosure", "Adapter",
        "Battery Box", "Mount", "Hardware", "Remote", "BMS",
        "ESC", "Drivetrain", "Wheel", "Pulley", "Bearing",
        "Gasket", "Bracket", "Miscellaneous"
    ]

    // Generic toggle for array fields
    const toggleArrayValue = (field: 'platform' | 'fabricationMethod' | 'typeOfPart', value: string) => {
        setPartData(prev => {
            const current = (prev as any)[field] as string[];
            const next = current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value];
            return { ...prev, [field]: next };
        });
    }

    // Step 1: Scrape
    const handleScrape = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!url) return

        setIsLoading(true)
        setError(null)

        try {
            const res = await fetch(`/api/scrape?url=${encodeURIComponent(url)}`)
            if (!res.ok) throw new Error('Failed to fetch/scrape URL')

            const data = await res.json()
            setPartData(prev => ({
                ...prev,
                title: data.title || "",
                imageSrc: data.imageSrc || "",
                description: data.description || ""
            }))
            setStep('review')
        } catch (err: any) {
            console.error('Scrape error:', err)
            // Fallback: allow manual entry if scrape fails
            setPartData(prev => ({ ...prev, title: "" }))
            setStep('review')
        } finally {
            setIsLoading(false)
        }
    }

    // Step 2: Submit PR
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const res = await fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    printablesUrl: url,
                    editedPart: {
                        title: partData.title,
                        imageSrc: partData.imageSrc,
                        platform: partData.platform.length > 0 ? partData.platform : ["Other"],
                        fabricationMethod: partData.fabricationMethod.length > 0 ? partData.fabricationMethod : ["Other"],
                        typeOfPart: partData.typeOfPart,
                        dropboxUrl: partData.dropboxUrl,
                        dropboxZipLastUpdated: partData.dropboxZipLastUpdated
                    }
                })
            })

            const text = await res.text()
            let data
            try {
                data = JSON.parse(text)
            } catch {
                throw new Error(`Server error: ${text.substring(0, 100)}...`)
            }

            if (!res.ok) throw new Error(data.error || 'Submission failed')

            setSuccessData(data)
            setStep('success')
        } catch (err: any) {
            console.error('Submit error:', err)
            setError(err.message || 'Submission failed')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="bg-black text-light min-vh-100">
            <header>
                <SiteNavbar />
                <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '150px' }}>
                    <h1 className="display-4 fw-bold">Submit a Part</h1>
                </Container>
            </header>

            <main>
                <Container className="py-5">
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>

                        {error && <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-4">{error}</Alert>}

                        {/* Step 1: Input URL */}
                        {step === 'input' && (
                            <Card className="bg-dark text-light border-secondary shadow-lg">
                                <Card.Body className="p-5">
                                    <h3 className="mb-4 text-center">Start Your Submission</h3>
                                    <p className="mb-4 text-center text-muted">
                                        Paste a Printables link to automatically scrape details and prepare your entry for the ESK8CAD catalog.
                                    </p>
                                    <Form onSubmit={handleScrape}>
                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-bold">Printables URL</Form.Label>
                                            <Form.Control
                                                type="url"
                                                placeholder="https://www.printables.com/model/..."
                                                value={url}
                                                onChange={e => setUrl(e.target.value)}
                                                required
                                                disabled={isLoading}
                                                className="bg-secondary text-light border-secondary placeholder-light p-3"
                                            />
                                        </Form.Group>
                                        <div className="d-grid">
                                            <Button variant="primary" type="submit" disabled={isLoading || !url} size="lg" className="py-3 shadow">
                                                {isLoading ? <><Spinner size="sm" animation="border" className="me-2" /> Scraping...</> : 'Continue to Review'}
                                            </Button>
                                        </div>
                                    </Form>
                                </Card.Body>
                            </Card>
                        )}

                        {/* Step 2: Review & Edit */}
                        {step === 'review' && (
                            <Card className="bg-dark text-light border-secondary shadow-lg">
                                <Card.Header className="bg-secondary border-dark py-3">
                                    <h4 className="mb-0">Review & Customize Details</h4>
                                </Card.Header>
                                <Card.Body className="p-5">
                                    <Form onSubmit={handleSubmit}>
                                        <Row className="mb-4">
                                            <Col md={7}>
                                                <Form.Group className="mb-4">
                                                    <Form.Label className="fw-bold">Part Title</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        value={partData.title}
                                                        onChange={e => setPartData({ ...partData, title: e.target.value })}
                                                        required
                                                        placeholder="Enter the name of the part"
                                                        className="bg-secondary text-light border-secondary p-3"
                                                    />
                                                </Form.Group>

                                                <Form.Group className="mb-4">
                                                    <Form.Label className="fw-bold">Image URL</Form.Label>
                                                    <Form.Control
                                                        type="url"
                                                        value={partData.imageSrc}
                                                        onChange={e => setPartData({ ...partData, imageSrc: e.target.value })}
                                                        placeholder="Manually paste an image link if needed"
                                                        className="bg-secondary text-light border-secondary p-3"
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={5} className="text-center">
                                                {partData.imageSrc ? (
                                                    <div className="position-relative h-100 d-flex align-items-center">
                                                        <Image src={partData.imageSrc} fluid rounded className="bg-dark border-secondary shadow w-100" style={{ maxHeight: '350px', objectFit: 'cover' }} />
                                                    </div>
                                                ) : (
                                                    <div className="d-flex align-items-center justify-content-center bg-secondary text-light rounded shadow h-100" style={{ minHeight: '200px' }}>
                                                        <span className="text-muted">No Image Found</span>
                                                    </div>
                                                )}
                                            </Col>
                                        </Row>

                                        <div className="mb-5">
                                            {/* Tab-like buttons over the selection box */}
                                            <div className="d-flex gap-2 mb-0">
                                                <div
                                                    className={`px-4 py-3 rounded-top border-top border-start border-end ${activeField === 'platform' ? 'bg-primary border-primary text-white' : 'bg-dark border-secondary text-muted'} cursor-pointer fw-bold`}
                                                    onClick={() => setActiveField('platform')}
                                                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                                >
                                                    Target Platform(s) {partData.platform.length > 0 && <Badge bg="light" text="dark" className="ms-2">{partData.platform.length}</Badge>}
                                                </div>
                                                <div
                                                    className={`px-4 py-3 rounded-top border-top border-start border-end ${activeField === 'typeOfPart' ? 'bg-primary border-primary text-white' : 'bg-dark border-secondary text-muted'} cursor-pointer fw-bold`}
                                                    onClick={() => setActiveField('typeOfPart')}
                                                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                                >
                                                    Part Tags {partData.typeOfPart.length > 0 && <Badge bg="light" text="dark" className="ms-2">{partData.typeOfPart.length}</Badge>}
                                                </div>
                                            </div>

                                            {/* Full-width Selection Box */}
                                            <div
                                                className="p-4 rounded-bottom rounded-end border border-secondary shadow-inner"
                                                style={{
                                                    backgroundColor: '#111315',
                                                    minHeight: '220px',
                                                    borderWidth: '2px',
                                                    marginTop: '-1px' // connect to tabs
                                                }}
                                            >
                                                {!activeField || activeField === 'fabricationMethod' ? (
                                                    <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted py-5 text-center">
                                                        <p className="mb-2 fw-bold">Select Categorization</p>
                                                        <p className="mb-0 small">Click "Target Platform(s)" or "Part Tags" above to begin categorizing your part.</p>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                                            <h6 className="text-primary fw-bold mb-0">
                                                                Select {activeField === 'platform' ? 'Platforms' : 'Tags'}
                                                            </h6>
                                                            <Button variant="link" size="sm" className="text-muted p-0" onClick={() => setActiveField(null)}>Close</Button>
                                                        </div>
                                                        <div className="d-flex flex-wrap gap-2">
                                                            {(activeField === 'platform' ? platforms.sort() : commonTags.sort()).map(opt => {
                                                                const isSelected = (partData as any)[activeField].includes(opt);
                                                                return (
                                                                    <Button
                                                                        key={opt}
                                                                        variant={isSelected ? "primary" : "outline-secondary"}
                                                                        size="sm"
                                                                        onClick={() => toggleArrayValue(activeField, opt)}
                                                                        className="px-3 py-2 fw-medium border-2"
                                                                        style={{ minWidth: 'fit-content' }}
                                                                    >
                                                                        {opt} {isSelected && "✓"}
                                                                    </Button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Active selections summary */}
                                            {(partData.platform.length > 0 || partData.typeOfPart.length > 0) && (
                                                <div className="mt-3 d-flex flex-wrap gap-2">
                                                    {partData.platform.map(p => <Badge key={p} pill bg="info" className="p-2">Platform: {p}</Badge>)}
                                                    {partData.typeOfPart.map(t => <Badge key={t} pill bg="success" className="p-2">Tag: {t}</Badge>)}
                                                </div>
                                            )}
                                        </div>

                                        <hr className="my-5 border-secondary" />

                                        <Form.Group className="mb-4">
                                            <Form.Label className="fw-bold">Mirror Download Link <Badge bg="secondary" className="ms-2 opacity-75">Optional</Badge></Form.Label>
                                            <Form.Control
                                                type="url"
                                                placeholder="Direct link to Dropbox, GDrive, Mega, etc."
                                                value={partData.dropboxUrl}
                                                onChange={e => setPartData({ ...partData, dropboxUrl: e.target.value })}
                                                className="bg-secondary text-light border-secondary p-3"
                                            />
                                            <Form.Text className="text-muted">A secondary link in case the original goes down.</Form.Text>
                                        </Form.Group>

                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-4">
                                                    <Form.Label className="fw-bold">Fabrication Method(s)</Form.Label>
                                                    <div
                                                        className={`p-3 rounded border ${activeField === 'fabricationMethod' ? 'border-primary' : 'border-secondary'} bg-secondary text-light cursor-pointer d-flex flex-wrap gap-2`}
                                                        onClick={() => setActiveField('fabricationMethod')}
                                                        style={{ cursor: 'pointer', minHeight: '58px' }}
                                                    >
                                                        {partData.fabricationMethod.length > 0 ? (
                                                            partData.fabricationMethod.map(m => (
                                                                <Badge
                                                                    key={m}
                                                                    bg="primary"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        toggleArrayValue('fabricationMethod', m);
                                                                    }}
                                                                >
                                                                    {m} ×
                                                                </Badge>
                                                            ))
                                                        ) : (
                                                            <span className="text-muted">Tap to select methods...</span>
                                                        )}
                                                    </div>
                                                    {activeField === 'fabricationMethod' && (
                                                        <div className="mt-2 p-3 bg-dark border border-secondary rounded d-flex flex-wrap gap-2">
                                                            {fabricationMethods.sort().map(m => {
                                                                const isSelected = partData.fabricationMethod.includes(m);
                                                                return (
                                                                    <Button
                                                                        key={m}
                                                                        variant={isSelected ? "primary" : "outline-secondary"}
                                                                        size="sm"
                                                                        onClick={() => toggleArrayValue('fabricationMethod', m)}
                                                                    >
                                                                        {m}
                                                                    </Button>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-4">
                                                    <Form.Label className="fw-bold">Last Updated</Form.Label>
                                                    <Form.Control
                                                        type="date"
                                                        value={partData.dropboxZipLastUpdated}
                                                        onChange={e => setPartData({ ...partData, dropboxZipLastUpdated: e.target.value })}
                                                        className="bg-dark text-light border-secondary p-3"
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>


                                        <div className="d-flex gap-3 justify-content-end mt-5 pt-4 border-top border-secondary">
                                            <Button variant="outline-light" onClick={() => setStep('input')} disabled={isLoading} className="px-4 py-2">Back</Button>
                                            <Button variant="primary" type="submit" disabled={isLoading} size="lg" className="px-5 py-3 shadow fw-bold">
                                                {isLoading ? <><Spinner size="sm" animation="border" className="me-2" /> Processing...</> : 'Submit to Catalog'}
                                            </Button>
                                        </div>
                                        <div className="text-end mt-3">
                                            <small className="text-muted">
                                                Note: "Submit" means sending your data/changes to the site admins via a <strong>Pull Request</strong>, where it will be reviewed and merged into the live catalog.
                                            </small>
                                        </div>
                                    </Form>
                                </Card.Body>
                            </Card>
                        )}

                        {/* Step 3: Success */}
                        {step === 'success' && successData && (
                            <Card className="bg-dark text-light border-secondary shadow-lg text-center overflow-hidden">
                                <div className="bg-secondary py-4 border-bottom border-success" style={{ borderBottomWidth: '4px !important' }}>
                                    <h4 className="mb-0 display-6 fw-bold text-white">Submission Processed!</h4>
                                </div>
                                <Card.Body className="p-5">
                                    <p className="lead mb-4">
                                        Your part <strong>{partData.title}</strong> has been successfully prepared and submitted for review.
                                    </p>

                                    <div className="bg-secondary bg-opacity-25 p-4 rounded border border-secondary mb-5">
                                        {successData.prUrl ? (
                                            <>
                                                <p className="mb-4">A <strong>Pull Request</strong> has been automatically created on GitHub. This is a request to an admin to add your data to the live site.</p>
                                                <div className="d-grid gap-3">
                                                    <Button href={successData.prUrl} target="_blank" variant="primary" size="lg" className="py-3 fw-bold">
                                                        View Pull Request on GitHub
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="p-3 border border-warning rounded bg-warning bg-opacity-10 mb-4 text-start">
                                                    <h5 className="text-warning">Action Required</h5>
                                                    <p className="mb-0 small text-light">
                                                        We successfully saved your changes to a new branch, but we couldn't automatically open the <strong>Pull Request</strong> due to GitHub permissions.
                                                        <br /><br />
                                                        <strong>What to do:</strong> Click the button below to open the GitHub compare page, then click "Create pull request" to finish submitting your data for review.
                                                    </p>
                                                </div>
                                                {successData.manualUrl && (
                                                    <div className="d-grid shadow">
                                                        <Button href={successData.manualUrl} target="_blank" variant="warning" size="lg" className="py-3 fw-bold text-dark">
                                                            Finish Pull Request Manually
                                                        </Button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    <div className="d-grid col-md-6 mx-auto">
                                        <Button variant="outline-light" onClick={() => {
                                            setStep('input')
                                            setUrl("")
                                            setPartData(prev => ({
                                                title: "", imageSrc: "", platform: "Miscellaneous Items",
                                                description: "", typeOfPart: [], dropboxUrl: "",
                                                fabricationMethod: "3d Printed",
                                                dropboxZipLastUpdated: new Date().toISOString().split('T')[0]
                                            }))
                                            setSuccessData(null)
                                        }} className="py-2">
                                            Submit Another Part
                                        </Button>
                                    </div>

                                    <p className="small text-muted mt-5">
                                        Once an admin merges your request, the part will be live on the site!
                                    </p>
                                </Card.Body>
                            </Card>
                        )}

                    </div>
                </Container>
            </main>

            <SiteFooter />

            <style dangerouslySetInnerHTML={{
                __html: `
                .form-control:focus, .form-select:focus {
                    background-color: #495057 !important;
                    color: white !important;
                    border-color: #0d6efd !important;
                    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25) !important;
                }
                .badge-outline-secondary {
                    background-color: transparent !important;
                    color: #adb5bd !important;
                }
                .badge-outline-secondary:hover {
                    background-color: #6c757d !important;
                    color: white !important;
                }
            `}} />
        </div>
    )
}

export default SubmitPage
