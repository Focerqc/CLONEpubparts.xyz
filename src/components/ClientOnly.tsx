import React, { useEffect, useState } from "react"

interface ClientOnlyProps {
    children: React.ReactNode
    fallback?: React.ReactNode
}

/**
 * ClientOnly: Prevents hydration mismatches by only rendering children on the client.
 * Use this for state-dependent UI or blocks that vary between server and client.
 */
const ClientOnly: React.FC<ClientOnlyProps> = ({ children, fallback = null }) => {
    const [hasMounted, setHasMounted] = useState(false)

    useEffect(() => {
        setHasMounted(true)
    }, [])

    if (!hasMounted) {
        return <>{fallback}</>
    }

    return <>{children}</>
}

export default ClientOnly
