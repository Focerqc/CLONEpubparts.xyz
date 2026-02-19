import { type PageProps } from "gatsby"
import React from "react"
import { Container, Row } from "react-bootstrap"
import CopyrightCard from "../../components/CopyrightCard"
import ItemCard from "../../components/ItemCard"
import ItemListSearchbar from "../../components/ItemListSearchbar"
import SiteFooter from "../../components/SiteFooter"
import SiteMetaData from "../../components/SiteMetaData"
import SiteNavbar from "../../components/SiteNavbar"
import "../../scss/pages/items.scss"
import { acedeckParts } from "../../util/parts"

const Page: React.FC<PageProps> = () => {
    return (
        <>
            
            <SiteMetaData
            title="Acedeck Parts | ESK8CAD.COM"
            description="Open source or otherwise aftermarket parts for the Acedeck platform" /><header>
                <SiteNavbar />
                <h1 className="flex-center">Acedeck Parts</h1>
            </header>
            <main className="page-items">
                <Container>
                    <ItemListSearchbar partList={acedeckParts} />
                    <h2 id="itemListHeader" style={{ display: "block" }}>Items</h2>
                    <h2 id="noResultsText" style={{ display: "none", minHeight: "200px" }}>No results.</h2>
                    <Row>
                        {!!acedeckParts.length && acedeckParts.map(ItemCard)}
                        <CopyrightCard />
                    </Row>
                </Container>
            </main>
            <SiteFooter />
        </>
    )
}
export default Page
