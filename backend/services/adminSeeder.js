import User from "../models/User.js";

export const seedAdmin = async () => {
    try {
        const adminExists = await User.findOne({ where: { role: "admin" } });

        if (!adminExists) {
            await User.create({
                firstName: "Super",
                lastName: "Admin",
                email: "admin@4star.com",
                password: "admin123",
                phone: "0000000000",
                role: "admin",
                isActive: true,
            });

            console.log("✅ Default admin seeded: admin@4star.com / admin123");
        }
    } catch (error) {
        console.error("❌ Admin seeding failed:", error.message);
    }
};
