import { Suspense } from "react";
import SectionHeading from "@/components/SectionHeading";
import ProductComparison from "@/components/ProductComparison";

export const metadata = {
    title: "Compare",
    description:
        "Compare up to three 4STAR products side by side — category, firmness, thickness, sizes and core specification.",
};

export default function ComparePage() {
    return (
        <div className="shell py-14 sm:py-20">
            <SectionHeading eyebrow="Comparison" title="Compare products">
                <p>
                    Select up to three products from any catalogue card, then review
                    them side by side. Your selection is kept on this device.
                </p>
            </SectionHeading>

            <Suspense fallback={<div className="mt-12 h-64" />}>
                <ProductComparison />
            </Suspense>
        </div>
    );
}
