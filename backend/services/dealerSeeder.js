import Dealer from "../models/Dealer.js";

// Placeholder dealer directory from the design document (page 8).
const DEALERS = [
    { businessName: "Placeholder Furnishings", ward: "Ward 00", city: "Kathmandu", type: "authorised" },
    { businessName: "Placeholder Home Store", ward: "Ward 00", city: "Lalitpur", type: "authorised" },
    { businessName: "Placeholder Foam Traders", ward: "Ward 00", city: "Bhaktapur", type: "distributor" },
    { businessName: "Placeholder Interiors", ward: "Ward 00", city: "Pokhara", type: "authorised" },
    { businessName: "Placeholder Trade Supply", ward: "Ward 00", city: "Biratnagar", type: "distributor" },
    { businessName: "Placeholder Bedding House", ward: "Ward 00", city: "Butwal", type: "authorised" },
];

export const seedDealers = async () => {
    try {
        let created = 0;

        for (const dealer of DEALERS) {
            const [, wasCreated] = await Dealer.findOrCreate({
                where: { businessName: dealer.businessName },
                defaults: { ...dealer, phone: "+977 0000 000000", isActive: true },
            });

            if (wasCreated) created += 1;
        }

        if (created > 0) {
            console.log(`✅ Seeded ${created} dealers`);
        }
    } catch (error) {
        console.error("❌ Dealer seeding failed:", error.message);
    }
};
