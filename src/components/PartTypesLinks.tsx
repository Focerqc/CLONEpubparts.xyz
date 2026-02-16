import React from "react"
import { Button } from "react-bootstrap"

/**
 * PartTypesLinks: Displays all available board platforms/brands.
 * Updated to include the full list of 14 platforms used in the submission form.
 */
const PartTypesLinks: React.FC = () => {
    const platforms = [
        { label: "Street board DIY/Generic", href: "/parts/street" },
        { label: "Off-Road board DIY/Generic", href: "/parts/offroad" },
        { label: "Misc", href: "/parts/misc" },
        { label: "Backfire", href: "/parts/backfire" },
        { label: "Bioboards", href: "/parts/bioboards" },
        { label: "Evolve", href: "/parts/evolve" },
        { label: "Exway", href: "/parts/exway" },
        { label: "Hoyt St", href: "/parts/hoyt" },
        { label: "Lacroix", href: "/parts/lacroix" },
        { label: "MBoards", href: "/parts/mboards" },
        { label: "Meepo", href: "/parts/meepo" },
        { label: "Onsra", href: "/parts/onsra" },
        { label: "Radium Performance", href: "/parts/radium" },
        { label: "Trampa", href: "/parts/trampa" },
        { label: "Tynee", href: "/parts/tynee" },
        { label: "VESC Electronics", href: "/parts/electronics" },
        { label: "Wowgo", href: "/parts/wowgo" }
    ]

    return (
        <div className="d-flex flex-wrap gap-3 mb-4" style={{ overflow: 'visible' }}>
            {platforms.map(platform => (
                <Button
                    key={platform.href}
                    variant="outline-info"
                    href={platform.href}
                    className="px-4 py-2 border-2 fw-bold"
                    style={{
                        fontSize: '0.95rem',
                        minWidth: '140px',
                        flex: '1 0 auto',
                        maxWidth: 'fit-content',
                        transition: 'all 0.2s ease'
                    }}
                >
                    {platform.label}
                </Button>
            ))}
        </div>
    )
}

export default PartTypesLinks
