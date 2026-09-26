import Offer from "../models/Offer.js";

// Placeholder schemes from the design document (page 8).
const OFFERS = [
    {
        title: "Festive season mattress scheme",
        audience: "consumer",
        validityLabel: "[dd.mm – dd.mm]",
        eligibleProducts: ["4STAR OrthoCare", "4STAR MemoRest", "4STAR Signature"],
        description:
            "Seasonal scheme across the orthopedic, memory foam and premium lines. [Placeholder description pending 4STAR's own scheme terms.]",
        terms: "[Placeholder terms and conditions.]",
        sortOrder: 0,
    },
    {
        title: "Quarterly dealer volume scheme",
        audience: "dealer",
        validityLabel: "[Quarter, year]",
        eligibleProducts: ["All mattress lines", "High Density Foam", "Rebonded Foam"],
        description:
            "Volume-based scheme for appointed dealers across all mattress lines and the high density and rebonded foam grades. [Placeholder description.]",
        terms: "[Placeholder terms and conditions.]",
        sortOrder: 1,
    },
    {
        title: "Foam sheet trade pricing",
        audience: "trade",
        validityLabel: "Ongoing",
        eligibleProducts: ["Foam Sheets", "Flexible PU Foam"],
        description:
            "Standing trade rates on sheet stock and flexible foam for workshops and traders. [Placeholder description.]",
        terms: "[Placeholder terms and conditions.]",
        sortOrder: 2,
    },
    {
        title: "New dealer onboarding support",
        audience: "new_dealer",
        validityLabel: "Ongoing",
        eligibleProducts: ["4STAR Sample Set", "All mattress lines"],
        description:
            "Sample set, display support and planned first supply for newly appointed dealers. [Placeholder description.]",
        terms: "[Placeholder terms and conditions.]",
        sortOrder: 3,
    },
];

export const seedOffers = async () => {
    try {
        let created = 0;

        for (const offer of OFFERS) {
            const [, wasCreated] = await Offer.findOrCreate({
                where: { title: offer.title },
                defaults: { ...offer, isActive: true },
            });

            if (wasCreated) created += 1;
        }

        if (created > 0) {
            console.log(`✅ Seeded ${created} offers`);
        }
    } catch (error) {
        console.error("❌ Offer seeding failed:", error.message);
    }
};
