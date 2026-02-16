import { Link } from "gatsby"
import { StaticImage } from "gatsby-plugin-image"
import React, { useState } from "react"
import { Button, Container, Modal, Nav, Navbar, NavDropdown, Stack } from "react-bootstrap"
import { FaBars, FaMagnifyingGlass } from "react-icons/fa6"
import { DiscordInvite, DiscordThread } from "../util/siteVariables"
import SearchModalCard from "./SearchModalCard"
import SearchModalSearchbar from "./SearchModalSearchbar"
import allParts from "../util/parts"
import allResources from "../util/resources"

type NavbarProps = {
    isHomepage?: boolean
}

const allPartsAndResources = [...new Set([
    allParts,
    allResources
].flat())] as (ItemData | ResourceData)[]

/**
 * Creates a {@link https://react-bootstrap.netlify.app/docs/components/navbar | React-Bootstrap Navbar}
 * for use navigating at the top of a page.
 * 
 * @param NavbarProps - a {@link NavbarProps} object
 */
export default ({ isHomepage }: NavbarProps) => {
    const [showModal, setShowModal] = useState(false)
    const [isSpinning, setIsSpinning] = useState(false)

    const handleLogoClick = () => {
        setIsSpinning(true);
        setTimeout(() => setIsSpinning(false), 600); // match animation duration
    };

    return (
        <Navbar fixed="top" expand="lg" data-bs-theme="dark">
            <Container>
                <Navbar.Brand href="/" onClick={handleLogoClick}>
                    <StaticImage
                        src="../../static/images/logo.png"
                        width={55}
                        height={55}
                        className={(isHomepage ? "d-inline-block" : "d-xs-inline-block d-md-none") + " align-top" + (isSpinning ? " spin-once" : "")}
                        alt="ESK8CAD.COM logo" />

                    <span className={(isHomepage ? "d-none" : "d-none d-md-inline-block")}>
                        ESK8CAD.COM
                    </span>
                </Navbar.Brand>

                <Stack direction="horizontal" gap={3}>
                    {/* Mobile Search Button */}
                    <Nav.Link className="d-md-block d-lg-none navbar-toggler" onClick={() => setShowModal(true)} aria-label="Sitewide search modal trigger"><FaMagnifyingGlass style={{ height: "1rem", width: "1rem" }} /></Nav.Link>
                    {/* Mobile Navigation Toggle */}
                    <Navbar.Toggle label="Menu toggle" aria-controls="site-navbar"><FaBars style={{ height: "1rem", width: "1rem" }} /></Navbar.Toggle>
                </Stack>

                {/* Navbar */}
                <Navbar.Collapse id="site-navbar">
                    <Nav variant="underline" justify>
                        <Nav.Link href="/">Home</Nav.Link>
                        <Nav.Link as={Link} to="/submit">Submit</Nav.Link>
                        <NavDropdown title="Board Platforms" renderMenuOnMount={true} focusFirstItemOnShow="keyboard" id="nav-parts-dropdown">
                            <NavDropdown.Item as={Link} to="/parts/street">Street board DIY/Generic</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/offroad">Off-Road board DIY/Generic</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/misc">Misc</NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item as={Link} to="/parts/backfire">Backfire</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/bioboards">Bioboards</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/electronics">VESC Electronics</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/evolve">Evolve</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/exway">Exway</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/hoyt">Hoyt St</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/lacroix">Lacroix</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/mboards">MBoards</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/meepo">Meepo</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/onsra">Onsra</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/radium">Radium Performance</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/trampa">Trampa</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/tynee">Tynee</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/parts/wowgo">Wowgo</NavDropdown.Item>
                        </NavDropdown>
                        <NavDropdown title="Resources" renderMenuOnMount={true} focusFirstItemOnShow="keyboard" id="nav-resources-dropdown">
                            <NavDropdown.Item href="/resources/applications" target="_self">Applications</NavDropdown.Item>
                            <NavDropdown.Item href="/resources/repositories" target="_self">Code Repositories</NavDropdown.Item>
                            <NavDropdown.Item href="/resources/spreadsheets" target="_self">Spreadsheets</NavDropdown.Item>
                            <NavDropdown.Item href="/resources/vendors" target="_self">Vendors</NavDropdown.Item>
                            <NavDropdown.Item href="/resources/videoguides" target="_self">Video Guides</NavDropdown.Item>
                            <NavDropdown.Item href="/resources/websites" target="_self">Websites</NavDropdown.Item>
                            <NavDropdown.Item href="/resources/writtenguides" target="_self">Written Guides</NavDropdown.Item>
                        </NavDropdown>
                        <NavDropdown title="Submit Changes" renderMenuOnMount={true} focusFirstItemOnShow="keyboard" id="nav-contribute-dropdown">
                            <NavDropdown.Item href={DiscordInvite} target="_blank">1. Join Vescify Discord</NavDropdown.Item>
                            <NavDropdown.Item href={DiscordThread} target="_blank">2. Post in Thread</NavDropdown.Item>
                        </NavDropdown>
                        {/* Desktop Search Button */}
                        <Nav.Link className="d-none d-lg-block" onClick={() => setShowModal(true)} aria-label="Sitewide search modal trigger"><FaMagnifyingGlass /></Nav.Link>
                    </Nav>
                </Navbar.Collapse>

                {/* Search Modal */}
                <Modal
                    show={showModal}
                    variant="outline-info"
                    size="lg"
                    fullscreen="md-down"
                    centered={true}
                    onHide={() => setShowModal(false)}
                    scrollable={true}>
                    <Modal.Header>
                        <Modal.Title>Sitewide Search</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        {/* Search area */}
                        <SearchModalSearchbar />

                        <Stack direction="vertical" gap={3}>
                            {/* List parts */}
                            {!!allPartsAndResources.length &&
                                allPartsAndResources.map(SearchModalCard)
                            }
                        </Stack>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button variant="outline-info" onClick={() => setShowModal(false)}>
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>
            </Container>
        </Navbar>
    )
}
