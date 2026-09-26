import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/database.js";
import { PRODUCT_DIR, SITE_ASSET_DIR } from "./config/storage.js";

// Loads every model and wires their associations before sync runs.
import "./models/index.js";

import { seedAdmin } from "./services/adminSeeder.js";
import { seedProducts } from "./services/productSeeder.js";
import { seedDealers } from "./services/dealerSeeder.js";
import { seedOffers } from "./services/offerSeeder.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import dealerRoutes from "./routes/dealerRoutes.js";
import dealerApplicationRoutes from "./routes/dealerApplicationRoutes.js";
import offerRoutes from "./routes/offerRoutes.js";
import inquiryRoutes from "./routes/inquiryRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import favouriteRoutes from "./routes/favouriteRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import marketerRoutes from "./routes/marketerRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import { initRealtime } from "./services/realtime.js";

dotenv.config();

const port = process.env.PORT || 5000;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Product imagery is public marketing material. Note this mounts the products
// directory specifically — uploads/dealer-docs stays off the static path and is
// served only through the admin-guarded document route.
app.use("/uploads/products", express.static(PRODUCT_DIR));

// The payment QR is meant to be scanned by anyone checking out, so it is public
// like product imagery. uploads/payment-proofs stays off the static path — a
// customer's bank screenshot goes out only through the guarded order route.
app.use("/uploads/site", express.static(SITE_ASSET_DIR));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/dealers", dealerRoutes);
app.use("/api/dealer-applications", dealerApplicationRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/favourites", favouriteRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/marketer", marketerRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
    res.send("The backend of this website is running");
});

app.use((req, res) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Express is wrapped in a plain HTTP server so Socket.IO can share the port —
// live chat needs a connection that stays open, which app.listen alone cannot
// give it. This is also why the API must be deployed somewhere that supports
// long-lived connections rather than on serverless functions.
const server = http.createServer(app);

initRealtime(server, { corsOrigin: process.env.CLIENT_ORIGIN || "*" });

server.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log("Live chat ready on the same port");

    try {
        await connectDB();
    } catch {
        console.error("Startup halted — database unavailable, skipping seeders.");
        return;
    }

    await seedAdmin();
    await seedProducts();
    await seedDealers();
    await seedOffers();
});
