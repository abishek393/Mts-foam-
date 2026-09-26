import Product from "../models/Product.js";

// Placeholder catalogue taken from the design document (page 5).
// Every specification here is placeholder content pending 4STAR's own data.
const MATTRESSES = [
    {
        slug: "4star-orthocare",
        name: "4STAR OrthoCare",
        category: "Orthopedic",
        firmness: "Firm",
        thicknesses: ["6 in", "8 in"],
        sizes: ["36×72 in", "48×72 in", "60×72 in", "72×72 in"],
        coreSpec: "HR 40 D",
        shortDescription:
            "A firm orthopedic build for supported, level sleep.",
        description:
            "A firm orthopedic build: a high-resilience foam core under a thin comfort layer, quilted in a knit fabric. Suited to sleepers who want the spine held level rather than cradled.",
        features: [
            "High-resilience 40 D foam core",
            "Thin comfort layer over a firm base",
            "Quilted knit fabric cover",
            "Even weight distribution across the sleeping surface",
        ],
        applications: ["Back support", "Guest rooms", "Everyday household use"],
        keySpec: "HR 40 D core · Firm",
        isFeatured: true,
    },
    {
        slug: "4star-memorest",
        name: "4STAR MemoRest",
        category: "Memory Foam",
        firmness: "Medium-soft",
        thicknesses: ["6 in", "8 in"],
        sizes: ["36×72 in", "48×72 in", "60×72 in", "72×78 in"],
        coreSpec: "Memory foam over HR base",
        shortDescription:
            "A memory foam top layer that contours to the sleeper.",
        description:
            "A medium-soft build with a memory foam comfort layer above a high-resilience base. The top layer follows the body's shape to spread pressure at the shoulder and hip.",
        features: [
            "Memory foam comfort layer",
            "High-resilience supporting base",
            "Pressure relief at shoulder and hip",
            "Quilted knit fabric cover",
        ],
        applications: ["Pressure relief", "Side sleepers", "Couples"],
        keySpec: "Memory foam top · Medium-soft",
        isFeatured: true,
    },
    {
        slug: "4star-signature",
        name: "4STAR Signature",
        category: "Premium",
        firmness: "Medium-firm",
        thicknesses: ["8 in", "10 in"],
        sizes: ["48×72 in", "60×72 in", "72×78 in"],
        coreSpec: "Layered HR with premium finish",
        shortDescription:
            "The premium line — layered construction and a finished edge.",
        description:
            "A medium-firm premium build with layered high-resilience foam and a finished edge. The thickest option in the range at 10 inches.",
        features: [
            "Layered high-resilience construction",
            "Finished and reinforced edge",
            "Available up to 10 in thickness",
            "Premium quilted cover",
        ],
        applications: ["Master bedrooms", "Hospitality", "Long-term comfort"],
        keySpec: "Layered HR · Up to 10 in",
        isFeatured: true,
    },
    {
        slug: "4star-springline",
        name: "4STAR SpringLine",
        category: "Spring",
        firmness: "Medium",
        thicknesses: ["8 in"],
        sizes: ["48×72 in", "60×72 in", "72×78 in"],
        coreSpec: "Spring unit with foam comfort layers",
        shortDescription:
            "A spring unit with foam comfort layers above and below.",
        description:
            "A medium-feel mattress built on a spring unit, with foam comfort layers on both faces. Offers more bounce and airflow than an all-foam build.",
        features: [
            "Spring support unit",
            "Foam comfort layers top and bottom",
            "Greater airflow through the core",
            "Single 8 in thickness",
        ],
        applications: ["Cooler sleep", "Couples", "Everyday household use"],
        keySpec: "Spring core · 8 in",
    },
    {
        slug: "4star-everyday",
        name: "4STAR EveryDay",
        category: "Regular",
        firmness: "Medium-firm",
        thicknesses: ["4 in", "5 in", "6 in"],
        sizes: ["30×72 in", "36×72 in", "48×72 in", "60×72 in"],
        coreSpec: "Standard foam core",
        shortDescription:
            "The everyday line, in the widest spread of sizes and thicknesses.",
        description:
            "A medium-firm everyday mattress in the broadest size range we make, from a 30 inch single upward, and in thicknesses from 4 to 6 inches.",
        features: [
            "Widest size range in the catalogue",
            "Four, five and six inch options",
            "Standard foam core",
            "Suited to high-turnover and bulk supply",
        ],
        applications: ["Hostels", "Staff quarters", "Guest rooms", "Bulk supply"],
        keySpec: "Standard core · 4–6 in",
    },
    {
        slug: "4star-sample-set",
        name: "4STAR Sample Set",
        category: "Sample",
        firmness: "Various",
        thicknesses: ["Sample cut"],
        sizes: ["12×12 in samples"],
        coreSpec: "One cut per line",
        shortDescription:
            "Twelve-inch square cuts across the range, for dealers and specifiers.",
        description:
            "A set of 12×12 inch cuts covering the range, so a dealer or specifier can judge firmness and finish by hand before ordering.",
        features: [
            "One 12×12 in cut per mattress line",
            "Shows firmness, core and cover finish",
            "Supplied to new dealers as part of onboarding",
        ],
        applications: ["Dealer display", "Specification", "New dealer onboarding"],
        keySpec: "12×12 in cuts · All lines",
    },
    {
        slug: "4star-bespoke",
        name: "4STAR Bespoke",
        category: "Custom",
        firmness: "Your choice",
        thicknesses: ["Custom"],
        sizes: ["Made to measure"],
        coreSpec: "Specified per order",
        shortDescription:
            "Made to measure — your dimensions, your firmness, your core.",
        description:
            "A mattress cut to dimensions you supply, in the firmness and core specification you choose. Send measurements through the size calculator and we quote against them.",
        features: [
            "Any dimensions within production limits",
            "Firmness and core specified per order",
            "Profiled and non-standard shapes",
            "Quoted against your own measurements",
        ],
        applications: ["Non-standard beds", "Caravans and boats", "Fitted furniture"],
        keySpec: "Made to measure",
    },
];

const FOAMS = [
    {
        slug: "flexible-pu-foam",
        name: "Flexible PU Foam",
        category: "Flexible",
        density: "24–32 D",
        thicknesses: ["1 in", "2 in", "3 in", "4 in", "6 in", "8 in"],
        sizes: ["Sheet", "Block", "Cut to size"],
        shortDescription:
            "General purpose flexible foam in the 24 to 32 density band.",
        description:
            "Flexible polyurethane foam supplied by sheet, block or finished cut, in densities from 24 to 32 and thicknesses from 1 to 8 inches.",
        features: [
            "24–32 density band",
            "1 to 8 inch thicknesses",
            "Supplied as sheet, block or finished cut",
            "Consistent batch-to-batch density",
        ],
        applications: ["Upholstery", "Cushions", "Packaging"],
        keySpec: "24–32 D · 1–8 in",
    },
    {
        slug: "high-density-foam",
        name: "High Density Foam",
        category: "High Density",
        density: "40 D",
        thicknesses: ["1 in", "2 in", "3 in", "4 in", "6 in", "8 in"],
        sizes: ["Sheet", "Block", "Cut to size"],
        shortDescription:
            "40 density foam for seating and mattress cores.",
        description:
            "A 40 density grade that holds its shape under repeated load — the same grade used in our own mattress cores, supplied to furniture workshops by sheet or block.",
        features: [
            "40 density throughout",
            "Holds shape under repeated load",
            "Same grade used in 4STAR mattress cores",
            "1 to 8 inch thicknesses",
        ],
        applications: ["Sofa seating", "Mattress cores"],
        keySpec: "40 D · 1–8 in",
        isFeatured: true,
    },
    {
        slug: "rebonded-foam",
        name: "Rebonded Foam",
        category: "Rebonded",
        density: "80–120 D",
        thicknesses: ["1 in", "2 in", "3 in", "4 in"],
        sizes: ["Sheet", "Roll", "Cut to size"],
        shortDescription:
            "Dense rebonded foam for base layers and flooring.",
        description:
            "Bonded foam in the 80 to 120 density band — the firmest grade we supply, used where load spreading matters more than comfort.",
        features: [
            "80–120 density band",
            "Firmest grade in the range",
            "1 to 4 inch thicknesses",
            "Supplied as sheet or roll",
        ],
        applications: ["Base layers", "Underlay", "Gym flooring"],
        keySpec: "80–120 D · 1–4 in",
    },
    {
        slug: "foam-sheets",
        name: "Foam Sheets",
        category: "Sheets",
        density: "24–40 D",
        thicknesses: ["0.5 in", "1 in", "2 in", "3 in", "4 in"],
        sizes: ["Standard sheet"],
        shortDescription:
            "Sheet stock from half an inch, for workshops and small orders.",
        description:
            "Sheet stock across the 24 to 40 density band, starting at half an inch — the format for workshops, traders and small orders that don't need a full block.",
        features: [
            "From 0.5 in thickness",
            "24–40 density band",
            "Small order quantities accepted",
            "Standard sheet dimensions",
        ],
        applications: ["Workshops", "Traders", "Small orders"],
        keySpec: "24–40 D · From 0.5 in",
    },
    {
        slug: "custom-cut-foam",
        name: "Custom Cut Foam",
        category: "Custom Cut",
        density: "Per order",
        thicknesses: ["To specification"],
        sizes: ["To specification"],
        shortDescription:
            "Profiled and shaped cuts to your drawing.",
        description:
            "Foam cut to a supplied drawing or sample, in the density you specify. Includes profiled surfaces and shaped cavities for packaging inserts.",
        features: [
            "Cut to drawing or sample",
            "Density specified per order",
            "Profiled and shaped cuts",
            "Repeatable across reorders",
        ],
        applications: ["Packaging inserts", "Shaped cushions"],
        keySpec: "Cut to specification",
    },
    {
        slug: "industrial-foam",
        name: "Industrial Foam",
        category: "Industrial",
        density: "Per order",
        thicknesses: ["To specification"],
        sizes: ["To specification"],
        shortDescription:
            "Technical grades for filtration, acoustic and protective use.",
        description:
            "Foam grades specified for a technical function rather than comfort — filtration media, acoustic treatment and protective packaging.",
        features: [
            "Grade specified to the application",
            "Filtration and acoustic media",
            "Protective packaging grades",
            "Supplied to drawing",
        ],
        applications: ["Filtration", "Acoustic treatment", "Protective packaging"],
        keySpec: "Technical grades · To specification",
    },
];

// Real 4STAR mattress photography. The mapping of photo to product line is not
// yet accurate — these are the two shots currently available — but they are
// genuine product images rather than drawn placeholders.
const MATTRESS_IMAGES = [
    "/images/products/mattress-photo-1.jpg",
    "/images/products/mattress-photo-2.jpg",
];

// No foam photography yet, so the foam lines keep their drawn placeholders.
const FOAM_IMAGES = [
    "/images/products/foam-1.svg",
    "/images/products/foam-2.svg",
    "/images/products/foam-3.svg",
    "/images/products/foam-4.svg",
];

const imagesFor = (group) => (group === "mattress" ? MATTRESS_IMAGES : FOAM_IMAGES);

// Rows seeded before the photography arrived still point at the drawn SVGs.
// Repair those, but never touch images an admin has since set themselves, and
// never write when the stored value already matches — otherwise every restart
// would rewrite every row for nothing.
const needsImageRepair = (images, group) => {
    if (!Array.isArray(images) || images.length === 0) return true;

    const wanted = imagesFor(group);
    if (images.length === wanted.length && images.every((src, i) => src === wanted[i])) {
        return false;
    }

    // Only replace the drawn placeholders, never an admin's own uploads.
    return images.every(
        (src) =>
            typeof src === "string" &&
            src.startsWith(`/images/products/${group}-`) &&
            src.endsWith(".svg")
    );
};

export const seedProducts = async () => {
    try {
        const rows = [
            ...MATTRESSES.map((p, i) => ({ ...p, group: "mattress", sortOrder: i })),
            ...FOAMS.map((p, i) => ({ ...p, group: "foam", sortOrder: 100 + i })),
        ];

        let created = 0;
        let repaired = 0;

        for (const row of rows) {
            const [product, wasCreated] = await Product.findOrCreate({
                where: { slug: row.slug },
                defaults: {
                    ...row,
                    images: imagesFor(row.group),
                    leadTime: "[Placeholder]",
                    isFeatured: row.isFeatured ?? false,
                    isActive: true,
                },
            });

            if (wasCreated) {
                created += 1;
            } else if (needsImageRepair(product.images, row.group)) {
                await product.update({ images: imagesFor(row.group) });
                repaired += 1;
            }
        }

        if (created > 0) {
            console.log(`✅ Seeded ${created} products (${rows.length} lines total)`);
        }

        if (repaired > 0) {
            console.log(`✅ Updated imagery on ${repaired} existing products`);
        }
    } catch (error) {
        console.error("❌ Product seeding failed:", error.message);
    }
};
