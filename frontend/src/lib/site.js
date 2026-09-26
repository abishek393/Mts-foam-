// Site-wide constants.

export const SITE = {
    name: "4STAR",
    fullName: "4STAR Mattress & PU Foam",
    tagline: "Comfort designed for better living",
    description:
        "4STAR makes mattresses and polyurethane foam for households, furniture workshops and industrial buyers. Thirteen product lines, made to specification and supplied through an appointed dealer network.",
};

// The works at Itahari. Coordinates were supplied by 4STAR; the decimal pair is
// what every map link is built from, and the DMS strings are the same point
// written the way a survey document gives it.
export const LOCATION = {
    latitude: 26.659365,
    longitude: 87.279091,
    latitudeDMS: "N 26° 39' 33.714\"",
    longitudeDMS: "E 87° 16' 44.727\"",
};

// Roughly a 2 km box around the works — close enough to see the approach roads
// without losing the town around it. Derived rather than hardcoded so moving
// the pin moves the map with it.
const MAP_SPAN = 0.009;

export const mapEmbedUrl = () => {
    const { latitude: lat, longitude: lon } = LOCATION;

    const bbox = [lon - MAP_SPAN, lat - MAP_SPAN, lon + MAP_SPAN, lat + MAP_SPAN]
        .map((value) => value.toFixed(6))
        .join(",");

    return (
        "https://www.openstreetmap.org/export/embed.html" +
        `?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat},${lon}`
    );
};

// Opens the point in whichever map app the visitor has, phone or desktop.
export const directionsUrl = () =>
    `https://www.google.com/maps/dir/?api=1&destination=${LOCATION.latitude},${LOCATION.longitude}`;

export const CONTACT = {
    phone: "+977 985 203 4785",
    phoneHref: "tel:+9779852034785",
    // Assumed to be the same line as the phone — say if WhatsApp is elsewhere.
    whatsapp: "+977 985 203 4785",
    whatsappHref: "https://wa.me/9779852034785",
    email: "mtsfoamitahari04@gmail.com",
    emailHref: "mailto:mtsfoamitahari04@gmail.com",
    // Taken from the coordinates. A street address is still outstanding.
    address: "Itahari, Sunsari, Nepal",
};

// Seven primary links, per the design document's navigation spec. The two
// calls to action sit alongside them: Find Your Mattress and Send Inquiry.
export const NAV_LINKS = [
    { href: "/products", label: "Products" },
    { href: "/compare", label: "Compare" },
    { href: "/size-calculator", label: "Size Calculator" },
    { href: "/dealers", label: "Dealers" },
    { href: "/offers", label: "Offers" },
    { href: "/reviews", label: "Reviews" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
];

// The links that sit beside the logo on a wide screen. Nothing here is the only
// way to reach a page — the menu panel lists every link in NAV_LINKS, so this is
// purely about how crowded the bar looks.
export const PRIMARY_NAV_HREFS = [
    "/products",
    "/size-calculator",
    "/dealers",
    "/offers",
];

export const PRODUCT_GROUPS = [
    {
        key: "mattress",
        title: "Mattresses",
        description:
            "Orthopedic, memory foam, premium, spring, regular, sample and bespoke builds.",
        categories: [
            "Orthopedic",
            "Memory Foam",
            "Premium",
            "Spring",
            "Regular",
            "Sample",
            "Custom",
        ],
    },
    {
        key: "foam",
        title: "PU Foam",
        description:
            "Flexible, high density, rebonded, sheets, custom cut and industrial grades.",
        categories: [
            "Flexible",
            "High Density",
            "Rebonded",
            "Sheets",
            "Custom Cut",
            "Industrial",
        ],
    },
];

// "Why choose 4STAR" — the six numbered panels from page 4 of the document.
export const WHY_PANELS = [
    {
        title: "Quality products",
        body: "Every build has a written specification, checked before dispatch.",
    },
    {
        title: "Reliable manufacturing",
        body: "Foam production, cutting and finishing under one roof.",
    },
    {
        title: "Multiple product options",
        body: "Thirteen lines across mattresses and foam.",
    },
    {
        title: "Custom solutions",
        body: "Non-standard sizes, profiled cuts and specified densities.",
    },
    {
        title: "Dealer network",
        body: "Scheme-backed pricing, display support, planned supply.",
    },
    {
        title: "Customer support",
        body: "One team handles inquiry, quote and follow-up.",
    },
];

export const OFFER_AUDIENCES = {
    consumer: "Consumer",
    dealer: "Dealer",
    trade: "Trade",
    new_dealer: "New dealer",
};

export const DEALER_TYPES = {
    authorised: "Authorised dealer",
    distributor: "Distributor",
};

// A post-login redirect target is attacker-controllable, so only same-site
// absolute paths are honoured. "//evil.com" and "https://evil.com" are both
// rejected — the caller falls back to its own default.
export function safeNext(value) {
    if (typeof value !== "string") return null;
    if (!value.startsWith("/")) return null;
    if (value.startsWith("//")) return null;

    return value;
}
