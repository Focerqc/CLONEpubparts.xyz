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
import { glandParts } from "../../../util/parts"

export const Head: HeadFC = () => (
    <>
        <html lang="en" />
        <SiteMetaData
            title="Gland Parts | ESK8CAD.COM"
            description="Open source Gland components for electric skateboards" />
    </>
)

const Page: React.FC<PageProps> = () => {
    return (
        <>
            <header>
                <SiteNavbar />
                <h1 className="flex-center">
                    Gland Parts
                </h1>
            </header>
            <main className="page-items">
                <Container>
                    <ItemListSearchbar partList={glandParts} />
                    <h2 id="itemListHeader" style={{ display: "block" }}>Items</h2>
                    <h2 id="noResultsText" style={{ display: "none", minHeight: "200px" }}>No results.</h2>
                    <Row>
                        {!!glandParts.length && glandParts.map(ItemCard)}
                        <CopyrightCard />
                    </Row>
                </Container>
            </main>
            <SiteFooter />
        </>
    )
}

export default Page
