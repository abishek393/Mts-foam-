import Button from "@/components/Button";

// The 404 body, shared by the two not-found routes: the one inside (site),
// which Next uses for a notFound() thrown by a page in that group, and the one
// at the app root, which catches URLs that match no route at all.
export default function NotFoundView() {
    return (
        <div className="shell flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
            <p className="eyebrow mb-5">404</p>

            <h1 className="display mb-5 text-[2.5rem] sm:text-[3rem]">
                We couldn&apos;t find that page
            </h1>

            <p className="mb-10 max-w-md text-[0.9375rem] leading-7 text-ink-soft">
                The page may have moved, or the product may no longer be in the
                catalogue.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
                <Button href="/products" size="lg">
                    Browse the catalogue
                </Button>

                <Button href="/" variant="secondary" size="lg">
                    Back to home
                </Button>
            </div>
        </div>
    );
}
