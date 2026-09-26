import NotFoundView from "@/components/NotFoundView";

export const metadata = { title: "Page not found" };

// Used when a page inside (site) calls notFound() — a product slug that does
// not exist, for instance. It renders inside the site layout, so it keeps the
// header and footer.
export default function SiteNotFound() {
    return <NotFoundView />;
}
