import { type HeadFC, type PageProps } from "gatsby"
import React from "react"
import { Container, Row } from "react-bootstrap"
import CopyrightCard from "../../../components/CopyrightCard"
import ItemCard from "../../../components/ItemCard"
import ItemListSearchbar from "../../../components/ItemListSearchbar"
import SiteFooter from "../../../components/SiteFooter"
import SiteMetaData from "../../../components/SiteMetaData"
import SiteNavbar from "../../../components/SiteNavbar"
import "../../../scss/pages/items.scss"
import { headlightParts } from "../../../util/parts"

export const Head: HeadFC = () => (
    <>
        <html lang="en" />
        <SiteMetaData
            title="Headlight Parts | ESK8CAD.COM"
            description="Open source Headlight components for electric skateboards" />
    </>
)

const Page: React.FC<PageProps> = () => {
    return (
        <>
            <header>
                <SiteNavbar />
                <h1 className="flex-center">
                    Headlight Parts
                </h1>
            </header>
            <main className="page-items">
                <Container>
                    <ItemListSearchbar partList={headlightParts} />
                    <h2 id="itemListHeader" style={{ display: "block" }}>Items</h2>
                    <h2 id="noResultsText" style={{ display: "none", minHeight: "200px" }}>No results.</h2>
                    <Row>
                        {!!headlightParts.length && headlightParts.map(ItemCard)}
                        <CopyrightCard />
                    </Row>
                </Container>
            </main>
            <SiteFooter />
        </>
    )
}

export default Page
