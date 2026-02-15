import { type HeadFC, type PageProps } from "gatsby"
import React from "react"
import { Container } from "react-bootstrap"
import PartTypesLinks from "../components/PartTypesLinks"
import ResourceTypesLinks from "../components/ResourceTypesLinks"
import SiteFooter from "../components/SiteFooter"
import SiteMetaData from "../components/SiteMetaData"
import SiteNavbar from "../components/SiteNavbar"

export const Head: HeadFC = () => (
    <>
        <html lang="en" />
        <SiteMetaData title="Home | ESK8CAD.COM" />
    </>
)

const Page: React.FC<PageProps> = () => {
    return (
        <>
            <header>
                <SiteNavbar isHomepage={true} />

                <h1 className="flex-center">
                    ESK8CAD.COM
                </h1>

                <p className="tagline flex-center">
                    <br />
                </p>
            </header>

            <main>
                <Container>
                    <p>A collection of open source ESK8 CAD files — .STEP and .STL formats for enclosures, motor mounts, trucks, adapters, battery boxes, and other custom components.</p>
                    <p>Your CAD contributions to make our library fully fledged are welcome (and encouraged) to help build a stronger more resilient community  </p>
                    <p>This is strictly for electric skateboard (ESK8) and related projects. For Onewheel build parts and resources, head to <a href="https://PubParts.xyz">PubParts.xyz</a>.</p>
                    <p>To quickly locate a file, use the sitewide search in the navbar. Or browse specific collections:</p>
                    <h2>Parts</h2>
                    <PartTypesLinks />
                    <h2>Resources</h2>
                    <ResourceTypesLinks />
                </Container>
            </main>

            <SiteFooter />
        </>
    )
}

export default Page