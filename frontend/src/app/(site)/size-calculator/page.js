import SectionHeading from "@/components/SectionHeading";
import SizeCalculator from "@/components/SizeCalculator";

export const metadata = {
    title: "Size calculator",
    description:
        "Work out surface area, volume and the metric equivalent of any mattress or foam size, then send the measurements straight to us.",
};

export default function SizeCalculatorPage() {
    return (
        <div className="shell py-14 sm:py-20">
            <SectionHeading eyebrow="Tools" title="Size calculator">
                <p>
                    Enter length, width and thickness in inches — or start from a preset —
                    and we&apos;ll work out the surface area, volume and metric
                    equivalent. Send the measurements to us when you&apos;re ready.
                </p>
            </SectionHeading>

            <SizeCalculator />
        </div>
    );
}
