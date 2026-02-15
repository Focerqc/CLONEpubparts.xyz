
const allParts = [
    {
        title: "Base Deck",
        fabricationMethod: ["Other"],
        typeOfPart: ["Deck"],
        imageSrc: "/images/parts/placeholder.png",
        platform: ["MBoards"]
    },
    {
        title: "6374 Motor",
        fabricationMethod: ["Other"],
        typeOfPart: ["Motor"],
        imageSrc: "/images/parts/placeholder.png",
        platform: ["Meepo"]
    },
    {
        title: "Precision Truck",
        fabricationMethod: ["Other"],
        typeOfPart: ["Truck"],
        imageSrc: "/images/parts/placeholder.png",
        platform: ["Radium Performance"]
    }
] as ItemData[]

const platform = (platformType: PlatformType) => {
    return allParts
        .filter((p) => p.platform.includes(platformType))
        .sort((a, b) => a.title.localeCompare(b.title))
}

export default allParts.sort((a, b) => a.title.localeCompare(b.title))

// New ESK8 Exports
export const mboardsParts = platform("MBoards")
export const meepoParts = platform("Meepo")
export const radiumParts = platform("Radium Performance")
export const lacroixParts = platform("Lacroix")
export const trampaParts = platform("Trampa")
export const bioboardsParts = platform("Bioboards")
export const otherParts = platform("Other")

// Legacy Onewheel Exports (Maintained for backward compatibility, will return empty sets)
export const floatwheelParts = platform("Floatwheel")
export const gtParts = platform("GT/GT-S")
export const miscParts = platform("Miscellaneous Items")
export const pintParts = platform("Pint/X/S")
export const vescElectronicsParts = platform("VESC Electronics")
export const xrParts = platform("XR/Funwheel")
export const xrClassicParts = platform("XR Classic")