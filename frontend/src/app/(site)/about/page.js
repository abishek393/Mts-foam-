import SectionHeading from "@/components/SectionHeading";
import CTASection from "@/components/CTASection";

export const metadata = {
    title: "About",
    description:
        "4STAR makes mattresses and polyurethane foam for households, furniture workshops and industrial buyers — foam produced in-house, supplied through an appointed dealer network.",
};

// Four-entry story timeline and four capability panels, per the design document.
const TIMELINE = [
    {
        marker: "01",
        title: "Foam production",
        body: "Polyurethane foam produced in-house, by batch, to a written density specification. [Placeholder history and dates.]",
    },
    {
        marker: "02",
        title: "Mattress manufacturing",
        body: "The same foam grades taken through cutting, layering, quilting and finishing under one roof. [Placeholder.]",
    },
    {
        marker: "03",
        title: "Custom and industrial work",
        body: "Profiled cuts, non-standard sizes and technical grades for filtration, acoustic and protective use. [Placeholder.]",
    },
    {
        marker: "04",
        title: "Dealer network",
        body: "Distribution through appointed dealers, with direct supply for larger business orders. [Placeholder scale and coverage.]",
    },
];

const CAPABILITIES = [
    {
        title: "Manufacturing facility",
        body: "Foam production, cutting and finishing on one site, so a batch can be traced from block to finished mattress. [Placeholder figures.]",
    },
    {
        title: "Quality standards",
        body: "Every build carries a written specification, checked before dispatch. [Placeholder certifications.]",
    },
    {
        title: "Technology & production",
        body: "Cutting and profiling to drawing, repeatable across reorders. [Placeholder equipment detail.]",
    },
    {
        title: "Distribution network",
        body: "Appointed dealers and distributors, with direct supply for business orders. [Placeholder coverage.]",
    },
];

const VALUES = [
    ["Vision", "Comfort designed for better living — sleep and seating built to a specification, not to a price point."],
    ["Mission", "To make mattresses and foam whose quality a household, a workshop and an industrial buyer can each rely on."],
    ["Values", "Batch discipline, written specifications, and a repeat order that behaves like the first one."],
];

export default function AboutPage() {
    return (
        <div className="pb-14 sm:pb-20">
            <div className="shell py-14 sm:py-20">
                <SectionHeading eyebrow="Company" title="About 4STAR" />

                <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-16">
                    <div className="space-y-6 text-[1.0625rem] leading-8 text-ink-soft">
                        <p>
                            4STAR makes mattresses and polyurethane foam for households,
                            furniture workshops and industrial buyers. Because the foam is
                            produced in-house, the same batch discipline that governs a
                            sheet of high-density foam governs the mattress built on top
                            of it — and a dealer&apos;s repeat order behaves like the
                            first one.{" "}
                            <em className="text-ink-faint not-italic">
                                [Placeholder introduction.]
                            </em>
                        </p>

                        <p>
                            The range runs from everyday mattresses through orthopedic and
                            memory-foam models to bespoke sizes cut to a customer&apos;s
                            own measurements, alongside foam grades supplied by sheet,
                            block or finished cut.
                        </p>
                    </div>

                    <div className="space-y-6 text-[1.0625rem] leading-8 text-ink-soft">
                        <p>
                            Distribution runs through appointed dealers, with direct supply
                            for larger business orders.{" "}
                            <em className="text-ink-faint not-italic">
                                [Placeholder history and scale.]
                            </em>
                        </p>

                        <p>
                            No prices appear anywhere on this site and there is no
                            checkout. Every conversation starts as an inquiry, and we reply
                            with a quote against your specification.
                        </p>
                    </div>
                </div>
            </div>

            <div className="shell">
                <section className="grid gap-8 border-y border-rule py-14 sm:grid-cols-3">
                    {VALUES.map(([title, body]) => (
                        <div key={title}>
                            <p className="eyebrow mb-4">{title}</p>

                            <p className="text-[0.9375rem] leading-7 text-ink-soft">{body}</p>
                        </div>
                    ))}
                </section>

                <section className="py-16">
                    <h2 className="display mb-10 text-[1.875rem]">Our story</h2>

                    <ol className="grid gap-px bg-rule sm:grid-cols-2 lg:grid-cols-4">
                        {TIMELINE.map((entry) => (
                            <li key={entry.marker} className="bg-ground p-6">
                                <p className="display mb-4 text-[2rem] text-accent">
                                    {entry.marker}
                                </p>

                                <h3 className="mb-2.5 text-[1.0625rem] text-ink">
                                    {entry.title}
                                </h3>

                                <p className="text-[0.875rem] leading-6 text-ink-muted">
                                    {entry.body}
                                </p>
                            </li>
                        ))}
                    </ol>
                </section>

                <section className="border-t border-rule py-16">
                    <h2 className="display mb-10 text-[1.875rem]">Capabilities</h2>

                    <div className="grid gap-6 sm:grid-cols-2">
                        {CAPABILITIES.map((capability) => (
                            <div
                                key={capability.title}
                                className="border border-rule bg-panel p-7"
                            >
                                <h3 className="display mb-3 text-[1.375rem]">
                                    {capability.title}
                                </h3>

                                <p className="text-[0.9375rem] leading-7 text-ink-soft">
                                    {capability.body}
                                </p>
                            </div>
                        ))}
                    </div>

                    <p className="mt-8 text-[0.8125rem] text-ink-faint">
                        Each panel awaits real figures and certifications.
                    </p>
                </section>

                <CTASection
                    dark
                    eyebrow="Get in touch"
                    title="Tell us what you need built"
                    body="Send a product, a size and a quantity — or your own measurements — and our team replies with a quote and next steps."
                    primary={{ href: "/contact", label: "Send Inquiry" }}
                    secondary={{ href: "/products", label: "Explore Mattresses" }}
                />
            </div>
        </div>
    );
}
