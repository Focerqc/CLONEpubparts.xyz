
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

    // Form Data
    const [url, setUrl] = useState("")
    const [partData, setPartData] = useState({
        title: "",
        imageSrc: "",
        platform: "Miscellaneous Items",
        description: "",
        fabricationMethod: "3d Printed",
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

    // Tag management
    const toggleTag = (tag: string) => {
        if (partData.typeOfPart.includes(tag)) {
            setPartData({ ...partData, typeOfPart: partData.typeOfPart.filter(t => t !== tag) })
        } else {
            setPartData({ ...partData, typeOfPart: [...partData.typeOfPart, tag] })
        }
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
                        platform: [partData.platform],
                        fabricationMethod: [partData.fabricationMethod],
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
                                        <Row>
                                            <Col md={4} className="mb-4 text-center">
                                                {partData.imageSrc ? (
                                                    <div className="position-relative">
                                                        <Image src={partData.imageSrc} fluid rounded className="bg-dark border-secondary mb-3 shadow" style={{ maxHeight: '250px', objectFit: 'cover' }} />
                                                    </div>
                                                ) : (
                                                    <div className="d-flex align-items-center justify-content-center bg-secondary text-light rounded mb-3 shadow" style={{ height: '200px' }}>
                                                        <span className="text-muted">No Image Found</span>
                                                    </div>
                                                )}
                                                <Form.Group className="mb-3 text-start">
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
                                            <Col md={8}>
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

                                                <Row>
                                                    <Col lg={6}>
                                                        <Form.Group className="mb-4">
                                                            <Form.Label className="fw-bold">Target Platform</Form.Label>
                                                            <Form.Select
                                                                value={partData.platform}
                                                                onChange={e => setPartData({ ...partData, platform: e.target.value })}
                                                                className="bg-secondary text-light border-secondary p-3"
                                                            >
                                                                {platforms.sort().map(p => <option key={p} value={p}>{p}</option>)}
                                                            </Form.Select>
                                                        </Form.Group>
                                                    </Col>
                                                    <Col lg={6}>
                                                        <Form.Group className="mb-4">
                                                            <Form.Label className="fw-bold">Fabrication Method</Form.Label>
                                                            <Form.Select
                                                                value={partData.fabricationMethod}
                                                                onChange={e => setPartData({ ...partData, fabricationMethod: e.target.value })}
                                                                className="bg-secondary text-light border-secondary p-3"
                                                            >
                                                                {fabricationMethods.map(m => <option key={m} value={m}>{m}</option>)}
                                                            </Form.Select>
                                                        </Form.Group>
                                                    </Col>
                                                </Row>

                                                <Form.Group className="mb-4">
                                                    <Form.Label className="fw-bold d-block mb-3">Part Tags</Form.Label>
                                                    <Form.Select
                                                        className="bg-secondary text-light border-secondary p-3 mb-3"
                                                        value=""
                                                        onChange={e => {
                                                            if (e.target.value) toggleTag(e.target.value);
                                                            e.target.value = "";
                                                        }}
                                                    >
                                                        <option value="">Select a tag to add/remove...</option>
                                                        {commonTags.sort().map(tag => (
                                                            <option key={tag} value={tag}>
                                                                {partData.typeOfPart.includes(tag) ? `✓ ${tag}` : tag}
                                                            </option>
                                                        ))}
                                                    </Form.Select>

                                                    {partData.typeOfPart.length > 0 && (
                                                        <div className="d-flex flex-wrap gap-2 mb-3 p-3 border border-secondary rounded bg-dark" style={{ backgroundColor: '#16191c' }}>
                                                            {partData.typeOfPart.sort().map(tag => (
                                                                <Badge
                                                                    key={tag}
                                                                    pill
                                                                    bg="primary"
                                                                    className="p-2 fs-6"
                                                                    style={{ cursor: 'pointer' }}
                                                                    onClick={() => toggleTag(tag)}
                                                                >
                                                                    {tag} ×
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <Form.Text className="text-muted">Select tags from the dropdown. Click a badge above to remove it.</Form.Text>
                                                </Form.Group>

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
