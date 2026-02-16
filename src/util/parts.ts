
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
    { title: "placeholder_Truck", fabricationMethod: ["Other"], typeOfPart: ["Truck"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Bushing", fabricationMethod: ["Other"], typeOfPart: ["Bushing"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Bearing", fabricationMethod: ["Other"], typeOfPart: ["Bearing"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Wheel", fabricationMethod: ["Other"], typeOfPart: ["Wheel"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Tire", fabricationMethod: ["Other"], typeOfPart: ["Tire"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Wheel Hub", fabricationMethod: ["Other"], typeOfPart: ["Wheel Hub"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Pulley", fabricationMethod: ["Other"], typeOfPart: ["Pulley"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Sprocket", fabricationMethod: ["Other"], typeOfPart: ["Sprocket"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Idler", fabricationMethod: ["Other"], typeOfPart: ["Idler"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Thumbwheel", fabricationMethod: ["Other"], typeOfPart: ["Thumbwheel"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Motor Mount", fabricationMethod: ["Other"], typeOfPart: ["Motor Mount"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Mount", fabricationMethod: ["Other"], typeOfPart: ["Mount"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Anti-sink plate", fabricationMethod: ["Other"], typeOfPart: ["Anti-sink plate"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Riser", fabricationMethod: ["Other"], typeOfPart: ["Riser"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Deck", fabricationMethod: ["Other"], typeOfPart: ["Deck"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Foothold / Bindings", fabricationMethod: ["Other"], typeOfPart: ["Foothold / Bindings"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Motor", fabricationMethod: ["Other"], typeOfPart: ["Motor"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Battery", fabricationMethod: ["Other"], typeOfPart: ["Battery"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_BMS", fabricationMethod: ["Other"], typeOfPart: ["BMS"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_ESC", fabricationMethod: ["Other"], typeOfPart: ["ESC"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Charger case", fabricationMethod: ["Other"], typeOfPart: ["Charger case"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Charge Port", fabricationMethod: ["Other"], typeOfPart: ["Charge Port"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Connector", fabricationMethod: ["Other"], typeOfPart: ["Connector"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Fuse holder", fabricationMethod: ["Other"], typeOfPart: ["Fuse holder"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Battery building parts", fabricationMethod: ["Other"], typeOfPart: ["Battery building parts"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Enclosure", fabricationMethod: ["Other"], typeOfPart: ["Enclosure"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Cover", fabricationMethod: ["Other"], typeOfPart: ["Cover"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Fender", fabricationMethod: ["Other"], typeOfPart: ["Fender"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Guard / Bumper", fabricationMethod: ["Other"], typeOfPart: ["Guard / Bumper"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Heatsink", fabricationMethod: ["Other"], typeOfPart: ["Heatsink"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Gland", fabricationMethod: ["Other"], typeOfPart: ["Gland"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Headlight", fabricationMethod: ["Other"], typeOfPart: ["Headlight"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Remote", fabricationMethod: ["Other"], typeOfPart: ["Remote"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Shocks / Damper", fabricationMethod: ["Other"], typeOfPart: ["Shocks / Damper"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Drill hole Jig", fabricationMethod: ["Other"], typeOfPart: ["Drill hole Jig"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Stand", fabricationMethod: ["Other"], typeOfPart: ["Stand"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
    { title: "placeholder_Complete board", fabricationMethod: ["Other"], typeOfPart: ["Complete board"], imageSrc: "/images/parts/placeholder.png", platform: ["Misc"] },
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
export const vescElectronicsParts = platform("VESC Electronics")
export const streetParts = platform("Street (DIY/Generic)")
export const offRoadParts = platform("Off-Road (DIY/Generic)")
export const miscParts = platform("Misc")

// Tag Exports
export const truckParts = tag("Truck")
export const bushingParts = tag("Bushing")
export const bearingParts = tag("Bearing")
export const wheelParts = tag("Wheel")
export const tireParts = tag("Tire")
export const wheelHubParts = tag("Wheel Hub")
export const pulleyParts = tag("Pulley")
export const sprocketParts = tag("Sprocket")
export const idlerParts = tag("Idler")
export const thumbwheelParts = tag("Thumbwheel")
export const motorMountParts = tag("Motor Mount")
export const mountParts = tag("Mount")
export const antiSinkPlateParts = tag("Anti-sink plate")
export const riserParts = tag("Riser")
export const deckParts = tag("Deck")
export const footholdBindingsParts = tag("Foothold / Bindings")
export const motorParts = tag("Motor")
export const batteryParts = tag("Battery")
export const bmsParts = tag("BMS")
export const escParts = tag("ESC")
export const chargerCaseParts = tag("Charger case")
export const chargePortParts = tag("Charge Port")
export const connectorParts = tag("Connector")
export const fuseHolderParts = tag("Fuse holder")
export const batteryBuildingParts = tag("Battery building parts")
export const enclosureParts = tag("Enclosure")
export const coverParts = tag("Cover")
export const fenderParts = tag("Fender")
export const guardBumperParts = tag("Guard / Bumper")
export const heatsinkParts = tag("Heatsink")
export const glandParts = tag("Gland")
export const headlightParts = tag("Headlight")
export const remoteParts = tag("Remote")
export const shocksDamperParts = tag("Shocks / Damper")
export const drillHoleJigParts = tag("Drill hole Jig")
export const standParts = tag("Stand")
export const completeBoardParts = tag("Complete board")
export const miscellaneousParts = tag("Miscellaneous")

// Onewheel legacy data scrubbed
