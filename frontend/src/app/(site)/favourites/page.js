import { redirect } from "next/navigation";
import { getMyFavourites, getSession } from "@/lib/auth";
import SectionHeading from "@/components/SectionHeading";
import ProductCard from "@/components/ProductCard";
import Button from "@/components/Button";
import CompareBar from "@/components/CompareBar";

export const metadata = {
    title: "Favourites",
    description: "The 4STAR products you have saved.",
};

export default async function FavouritesPage() {
    const user = await getSession();

    // Favourites live on the account, so there is nothing to show signed out.
    if (!user) redirect("/login");

    const { products } = await getMyFavourites();

    return (
        <div className="shell py-14 sm:py-20">
            <SectionHeading eyebrow="Account" title="Your favourites">
                <p>
                    Products you have saved. They stay on your account, so they follow
                    you between devices.
                </p>
            </SectionHeading>

            {products.length === 0 ? (
                <div className="mt-12 border border-rule bg-panel px-6 py-20 text-center">
                    <p className="display mb-3 text-[1.75rem]">Nothing saved yet</p>

                    <p className="mx-auto mb-8 max-w-md text-[0.9375rem] leading-7 text-ink-muted">
                        Use the heart on any product to save it here for later.
                    </p>

                    <Button href="/products" size="lg">
                        Browse the catalogue
                    </Button>
                </div>
            ) : (
                <>
                    <p className="mt-10 text-[0.875rem] text-ink-muted">
                        {products.length} saved
                    </p>

                    <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {products.map((product, index) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                delay={Math.min(index, 7) * 60}
                            />
                        ))}
                    </div>
                </>
            )}

            <CompareBar />
        </div>
    );
}
