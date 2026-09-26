import { getProducts } from "@/lib/api";
import SectionHeading from "@/components/SectionHeading";
import MattressFinder from "@/components/MattressFinder";

export const metadata = {
    title: "Find your mattress",
    description:
        "Answer five short questions and we'll match you to the three closest 4STAR mattresses.",
};

export default async function FindMattressPage() {
    // Scored on the client, but fetched here so the page is server-rendered.
    const products = await getProducts({ group: "mattress" });

    return (
        <div className="shell py-14 sm:py-20">
            <SectionHeading eyebrow="Tools" title="Find your mattress">
                <p>
                    Five short questions, then the three closest matches from our range.
                    Skip anything you&apos;re unsure about — it simply won&apos;t count
                    towards the result.
                </p>
            </SectionHeading>

            <MattressFinder products={products} />
        </div>
    );
}
