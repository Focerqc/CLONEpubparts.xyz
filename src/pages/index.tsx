import { type PageProps } from "gatsby"
import React from "react"
import { Container } from "react-bootstrap"
import PartTypesLinks from "../components/PartTypesLinks"
import TechnicalTagsLinks from "../components/TechnicalTagsLinks"
import ResourceTypesLinks from "../components/ResourceTypesLinks"
import SiteFooter from "../components/SiteFooter"
import SiteMetaData from "../components/SiteMetaData"
import SiteNavbar from "../components/SiteNavbar"
import ClientOnly from "../components/ClientOnly"

const Page: React.FC<PageProps> = () => {
    return (
        <div className="bg-black text-light min-vh-100 pb-5">
            
            <SiteMetaData title="Home | ESK8CAD.COM" /><header>
                <SiteNavbar isHomepage={true} />

                <div className="py-5 text-center">
                    <h1 className="display-3 fw-bold mb-0" style={{ letterSpacing: '-0.02em' }}>ESK8CAD.COM</h1>
                    <p className="mt-2 text-info small uppercase letter-spacing-2 fw-bold opacity-75">Super epic ESK8 Parts Library</p>
                </div>
            </header>

            <main>
                <Container>
                    <div className="mb-5 lead opacity-75 text-center mx-auto" style={{ maxWidth: '800px' }}>
                        <p>A curated collection of OEM and DIY ESK8 CAD files — .STEP and .STL formats for enclosures, motor mounts, trucks, and other custom components.</p>
                        <p>We believe in a stronger, more resilient DIY community through shared designs. Contributions are welcome. See the navbar!</p>
                        <p className="small">Onewheel parts? Visit <a href="https://PubParts.xyz" className="text-info text-decoration-none fw-bold">PubParts.xyz</a></p>
                    </div>

                    {/* SECTION: BOARD PLATFORMS */}
                    <div className="mb-5">
                        <h2 className="h4 fw-bold uppercase letter-spacing-1 mb-4 border-bottom border-secondary pb-2" style={{ color: '#0dcaf0' }}>Board Platforms</h2>
                        <ClientOnly fallback={<div className="py-4 text-center opacity-25">Loading platforms...</div>}>
                            <div className="grid-fix-container">
                                <PartTypesLinks />
                            </div>
                        </ClientOnly>
                    </div>

                    {/* SECTION: PART CATEGORIES */}
                    <div className="mb-5">
                        <h2 className="h4 fw-bold uppercase letter-spacing-1 mb-4 border-bottom border-secondary pb-2" style={{ color: '#198754' }}>Part Categories</h2>
                        <ClientOnly fallback={<div className="py-4 text-center opacity-25">Loading categories...</div>}>
                            <div className="grid-fix-container">
                                <TechnicalTagsLinks />
                            </div>
                        </ClientOnly>
                    </div>

                    {/* SECTION: RESOURCES */}
                    <div className="mb-5">
                        <h2 className="h4 fw-bold uppercase letter-spacing-1 mb-4 border-bottom border-secondary pb-2" style={{ color: '#800000' }}>Community Resources</h2>
                        <ClientOnly fallback={<div className="py-4 text-center opacity-25">Loading resources...</div>}>
                            <div className="grid-fix-container">
                                <ResourceTypesLinks />
                            </div>
                        </ClientOnly>
                    </div>
                </Container>
            </main>

            <SiteFooter />

            <style dangerouslySetInnerHTML={{
                __html: `
                .letter-spacing-1 { letter-spacing: 0.15rem; }
                .letter-spacing-2 { letter-spacing: 0.3rem; }
                .uppercase { text-transform: uppercase; }
                .grid-fix-container {
                    display: block;
                    width: 100%;
                    overflow: visible !important;
                    min-height: 100px;
                }
                /* Ensure all buttons in the grids can wrap and breathe */
                .btn {
                    margin-bottom: 0.5rem;
                }
                main, .container {
                    overflow: visible !important;
                }
            `}} />
        </div>
    )
}

export default Page
