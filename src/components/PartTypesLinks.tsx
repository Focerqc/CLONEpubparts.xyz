import React from "react"
import { Button } from "react-bootstrap"

/**
 * PartTypesLinks: Displays all available board platforms/brands.
 * Updated to include the full list of 14 platforms used in the submission form.
 */
const PartTypesLinks: React.FC = () => {
    const platforms = [
        { label: "MBoards", href: "/parts/mboards" },
        { label: "Meepo", href: "/parts/meepo" },
        { label: "Radium Performance", href: "/parts/radium" },
        { label: "Bioboards", href: "/parts/bioboards" },
        { label: "Hoyt St", href: "/parts/hoyt" },
        { label: "Lacroix", href: "/parts/lacroix" },
        { label: "Trampa", href: "/parts/trampa" },
        { label: "Evolve", href: "/parts/evolve" },
        { label: "Backfire", href: "/parts/backfire" },
        { label: "Exway", href: "/parts/exway" },
        { label: "Onsra", href: "/parts/onsra" },
        { label: "Wowgo", href: "/parts/wowgo" },
        { label: "Tynee", href: "/parts/tynee" },
        { label: "Other", href: "/parts/other" }
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
