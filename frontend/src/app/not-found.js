import SiteLayout from "./(site)/layout";
import NotFoundView from "@/components/NotFoundView";

export const metadata = { title: "Page not found" };

// The global 404, for URLs that match no route at all. It renders inside the
// root layout, which carries no navigation, so it pulls the site chrome in
// itself — otherwise an unmatched URL would land on a bare page with no way
// back into the site.
export default function NotFound() {
    return (
        <SiteLayout>
            <NotFoundView />
        </SiteLayout>
    );
}
