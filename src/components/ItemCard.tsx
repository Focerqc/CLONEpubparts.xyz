import React, { useState } from "react"
import { Badge, Card, Col, Stack } from "react-bootstrap"
import toTitleCase from "../hooks/toTitleCase"
import windowIsDefined from "../hooks/windowIsDefined"
import CopyLinkBadge from "./CopyLinkBadge"
import Lightbox from "./Lightbox"

/**
 * Internal component for the image and lightbox to handle state correctly 
 * without violating the Rules of Hooks when ItemCard is mapped.
 */
const ItemImage = ({ item }: { item: ItemData }) => {
    const [lightboxToggler, setLightboxToggler] = useState(false)

    if (!item.imageSrc) return null;

    return (
        <>
            <div className="card-img-holder" onClick={() => setLightboxToggler(!lightboxToggler)}>
                <img
                    src={
                        Array.isArray(item.imageSrc)
                            ? item.imageSrc[0]
                            : item.imageSrc
                    }
                    alt={"Preview image of part, " + item.title}
                    loading="lazy"
                />
            </div>

            {/* Part image lightbox */}
            <Lightbox
                src={[item.imageSrc].flat()}
                toggler={lightboxToggler}
            />
        </>
    )
}

/**
 * Creates a {@link https://react-bootstrap.netlify.app/docs/components/cards | React-Bootstrap Card}
 * with item information from an {@link ItemData}
 * object array. 
 * 
 * NOTE: This is frequently used as a .map(ItemCard) callback across the site.
 * Do not add Hooks directly to this function. Use components inside it instead.
 * 
 * @param item - an {@link ItemData} object
 * @param index - a number from a map
 */
export default (item: ItemData, index: number) => {
    return (
        <Col
            xs={{ span: 10, offset: 1 }}
            md={{ span: 6, offset: 0 }}
            lg={{ span: 4, offset: 0 }}
            className="flex-center flex-top searchableItem"
            key={`item-card-${index}`}
            parttitle={item.title}
            parttypes={item.typeOfPart?.join(",") || ""}
            partfabricationmethods={item.fabricationMethod?.join(",") || ""}>
            <Card>
                {/* Part image & Lightbox */}
                <ItemImage item={item} />

                {/* Part type badges */}
                <Stack className="display-over-top-right" direction="vertical" gap={1}>
                    {item.typeOfPart?.length &&
                        item.typeOfPart.map((p, pillIndex) => (
                            <Badge key={`item-card-${index}-pill-t-${pillIndex}`} pill bg={p.toUpperCase().includes("OEM") ? "success" : "dark"}>{toTitleCase(p)}</Badge>
                        ))
                    }

                    {item.fabricationMethod?.map((f, pillIndex) => (
                        <Badge key={`item-card-${index}-pill-f-${pillIndex}`} pill bg="dark">{f}</Badge>
                    ))}
                </Stack>

                {/* Copy Link to this item button */}
                <Stack className="display-over-top-left" direction="vertical" gap={1}>
                    <CopyLinkBadge link={!windowIsDefined() ? "#" : "http://" + window.location.host + window.location.pathname + `?search=${encodeURIComponent(item.title)}`} />
                </Stack>

                {/* Part information */}
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                        <Card.Title as="h3" className="mb-0">{item.title}</Card.Title>
                        {(item.parent?.relativePath || (item as any)._filename) && (
                            (() => {
                                const path = item.parent?.relativePath || (item as any)._filename;
                                const match = path.match(/part-(\d{4})\.json/);
                                return match ? (
                                    <Badge bg="primary" className="ms-2" style={{ fontSize: '0.7rem', padding: '0.3em 0.6em' }}>
                                        #{match[1]}
                                    </Badge>
                                ) : null;
                            })()
                        )}
                    </div>

                    {(item.externalUrl || item.dropboxUrl) &&
                        <Stack direction="vertical" gap={1}>
                            {item.externalUrl &&
                                <Card.Link href={item.externalUrl} target="_blank">External Listing</Card.Link>
                            }

                            {item.dropboxUrl &&
                                <Card.Link href={item.dropboxUrl} target="_blank">ZIP Download{!!item.dropboxZipLastUpdated &&
                                    <>{` (${item.dropboxZipLastUpdated})`}</>
                                }</Card.Link>
                            }
                        </Stack>
                    }
                </Card.Body>
            </Card>
        </Col>
    )
}
