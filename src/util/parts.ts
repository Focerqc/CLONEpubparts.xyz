
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
    },
    // Platform Placeholders
    { title: "placeholder_Street (DIY/Generic)", fabricationMethod: ["Other"], typeOfPart: ["Miscellaneous"], imageSrc: "/images/parts/placeholder.png", platform: ["Street (DIY/Generic)"] },
    { title: "placeholder_Off-Road (DIY/Generic)", fabricationMethod: ["Other"], typeOfPart: ["Miscellaneous"], imageSrc: "/images/parts/placeholder.png", platform: ["Off-Road (DIY/Generic)"] },
    { title: "placeholder_Misc", fabricationMethod: ["Other"], typeOfPart: ["Miscellaneous"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_VESC Electronics", fabricationMethod: ["Other"], typeOfPart: ["Miscellaneous"], imageSrc: "/images/parts/placeholder.png", platform: ["VESC Electronics"] },
    { title: "placeholder_MBoards", fabricationMethod: ["Other"], typeOfPart: ["Miscellaneous"], imageSrc: "/images/parts/placeholder.png", platform: ["MBoards"] },
    { title: "placeholder_Meepo", fabricationMethod: ["Other"], typeOfPart: ["Miscellaneous"], imageSrc: "/images/parts/placeholder.png", platform: ["Meepo"] },
    { title: "placeholder_Radium Performance", fabricationMethod: ["Other"], typeOfPart: ["Miscellaneous"], imageSrc: "/images/parts/placeholder.png", platform: ["Radium Performance"] },
    { title: "placeholder_Bioboards", fabricationMethod: ["Other"], typeOfPart: ["Miscellaneous"], imageSrc: "/images/parts/placeholder.png", platform: ["Bioboards"] },
    { title: "placeholder_Hoyt St", fabricationMethod: ["Other"], typeOfPart: ["Miscellaneous"], imageSrc: "/images/parts/placeholder.png", platform: ["Hoyt St"] },
    { title: "placeholder_Lacroix", fabricationMethod: ["Other"], typeOfPart: ["Miscellaneous"], imageSrc: "/images/parts/placeholder.png", platform: ["Lacroix"] },
    { title: "placeholder_Trampa", fabricationMethod: ["Other"], typeOfPart: ["Miscellaneous"], imageSrc: "/images/parts/placeholder.png", platform: ["Trampa"] },
    { title: "placeholder_Evolve", fabricationMethod: ["Other"], typeOfPart: ["Miscellaneous"], imageSrc: "/images/parts/placeholder.png", platform: ["Evolve"] },
    { title: "placeholder_Backfire", fabricationMethod: ["Other"], typeOfPart: ["Miscellaneous"], imageSrc: "/images/parts/placeholder.png", platform: ["Backfire"] },
    { title: "placeholder_Exway", fabricationMethod: ["Other"], typeOfPart: ["Miscellaneous"], imageSrc: "/images/parts/placeholder.png", platform: ["Exway"] },
    { title: "placeholder_Onsra", fabricationMethod: ["Other"], typeOfPart: ["Miscellaneous"], imageSrc: "/images/parts/placeholder.png", platform: ["Onsra"] },
    { title: "placeholder_Wowgo", fabricationMethod: ["Other"], typeOfPart: ["Miscellaneous"], imageSrc: "/images/parts/placeholder.png", platform: ["Wowgo"] },
    { title: "placeholder_Tynee", fabricationMethod: ["Other"], typeOfPart: ["Miscellaneous"], imageSrc: "/images/parts/placeholder.png", platform: ["Tynee"] },

    // Tag Placeholders
    { title: "placeholder_Deck", fabricationMethod: ["Other"], typeOfPart: ["Deck"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Truck", fabricationMethod: ["Other"], typeOfPart: ["Truck"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Motor", fabricationMethod: ["Other"], typeOfPart: ["Motor"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Enclosure", fabricationMethod: ["Other"], typeOfPart: ["Enclosure"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Adapter", fabricationMethod: ["Other"], typeOfPart: ["Adapter"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Battery Box", fabricationMethod: ["Other"], typeOfPart: ["Battery Box"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Mount", fabricationMethod: ["Other"], typeOfPart: ["Mount"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Hardware", fabricationMethod: ["Other"], typeOfPart: ["Miscellaneous"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Remote", fabricationMethod: ["Other"], typeOfPart: ["Remote"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_BMS", fabricationMethod: ["Other"], typeOfPart: ["BMS"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_ESC", fabricationMethod: ["Other"], typeOfPart: ["ESC"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Drivetrain", fabricationMethod: ["Other"], typeOfPart: ["Drivetrain"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Wheel", fabricationMethod: ["Other"], typeOfPart: ["Wheel"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Pulley", fabricationMethod: ["Other"], typeOfPart: ["Pulley"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Bearing", fabricationMethod: ["Other"], typeOfPart: ["Bearing"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Gasket", fabricationMethod: ["Other"], typeOfPart: ["Gasket"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Bracket", fabricationMethod: ["Other"], typeOfPart: ["Bracket"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Miscellaneous", fabricationMethod: ["Other"], typeOfPart: ["Miscellaneous"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] }
] as ItemData[]

const platform = (platformType: PlatformType) => {
    return allParts
        .filter((p) => p.platform.includes(platformType))
        .sort((a, b) => a.title.localeCompare(b.title))
}

const tag = (type: PartType) => {
    return allParts
        .filter((p) => p.typeOfPart.includes(type))
        .sort((a, b) => a.title.localeCompare(b.title))
}

export default allParts.sort((a, b) => a.title.localeCompare(b.title))

// Platform Exports
export const mboardsParts = platform("MBoards")
export const meepoParts = platform("Meepo")
export const radiumParts = platform("Radium Performance")
export const bioboardsParts = platform("Bioboards")
export const hoytParts = platform("Hoyt St")
export const lacroixParts = platform("Lacroix")
export const trampaParts = platform("Trampa")
export const evolveParts = platform("Evolve")
export const backfireParts = platform("Backfire")
export const exwayParts = platform("Exway")
export const onsraParts = platform("Onsra")
export const wowgoParts = platform("Wowgo")
export const tyneeParts = platform("Tynee")
export const streetParts = platform("Street (DIY/Generic)")
export const offRoadParts = platform("Off-Road (DIY/Generic)")
export const miscParts = platform("Misc")

// Tag Exports
export const deckParts = tag("Deck")
export const truckParts = tag("Truck")
export const motorParts = tag("Motor")
export const enclosureParts = tag("Enclosure")
export const adapterParts = tag("Adapter")
export const batteryBoxParts = tag("Battery Box")
export const mountParts = tag("Mount")
export const remoteParts = tag("Remote")
export const bmsParts = tag("BMS")
export const escParts = tag("ESC")
export const drivetrainParts = tag("Drivetrain")
export const wheelParts = tag("Wheel")
export const pulleyParts = tag("Pulley")
export const bearingParts = tag("Bearing")
export const gasketParts = tag("Gasket")
export const bracketParts = tag("Bracket")
export const miscellaneousParts = tag("Miscellaneous")

// Onewheel legacy data scrubbed
