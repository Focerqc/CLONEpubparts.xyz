import React from "react"
import { Button } from "react-bootstrap"

export default () => (
    <div className="d-flex flex-wrap gap-3 mb-4">
        {[
            { label: "MBoards", href: "/parts/mboards" },
            { label: "Meepo", href: "/parts/meepo" },
            { label: "Radium Performance", href: "/parts/radium" },
            { label: "Lacroix", href: "/parts/lacroix" },
            { label: "Trampa", href: "/parts/trampa" },
            { label: "Bioboards", href: "/parts/bioboards" },
            { label: "Other", href: "/parts/other" }
        ].map(platform => (
            <Button
                key={platform.href}
                variant="outline-info"
                href={platform.href}
                className="px-4 py-2"
                style={{ fontSize: '0.9rem', minWidth: 'fit-content' }}
            >
                {platform.label}
            </Button>
        ))}
    </div>
)
