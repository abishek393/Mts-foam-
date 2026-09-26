import { getProducts } from "@/lib/api";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap() {
    const products = await getProducts();

    const staticRoutes = [
        "",
        "/products",
        "/compare",
        "/find-mattress",
        "/size-calculator",
        "/dealers",
        "/offers",
        "/about",
        "/contact",
    ].map((path) => ({
        url: `${BASE}${path}`,
        lastModified: new Date(),
        changeFrequency: path === "" ? "weekly" : "monthly",
        priority: path === "" ? 1 : 0.7,
    }));

    const productRoutes = products.map((product) => ({
        url: `${BASE}/products/${product.slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.8,
    }));

    return [...staticRoutes, ...productRoutes];
}
