import { getSession } from "@/lib/auth";
import { CONTACT, LOCATION, SITE, mapEmbedUrl, directionsUrl } from "@/lib/site";
import SectionHeading from "@/components/SectionHeading";
import ContactPanel from "@/components/ContactPanel";

export const metadata = {
    title: "Contact",
    description:
        "Phone, WhatsApp, email and inquiry form for 4STAR Mattress & PU Foam.",
};

const CARDS = [
    { label: "Phone", value: CONTACT.phone, href: CONTACT.phoneHref },
    { label: "WhatsApp", value: CONTACT.whatsapp, href: CONTACT.whatsappHref },
    { label: "Email", value: CONTACT.email, href: CONTACT.emailHref },
    { label: "Address", value: CONTACT.address, href: null },
];

export default async function ContactPage() {
    const user = await getSession();

    return (
        <div className="shell py-14 sm:py-20">
            <SectionHeading eyebrow="Contact" title="Get in touch">
                <p>
                    Send us a product, a size and a quantity and we&apos;ll reply with a
                    quote. You can also call or message us on WhatsApp on the number
                    below.
                </p>
            </SectionHeading>

            <div className="mt-14 grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
                <ContactPanel signedIn={Boolean(user)} />

                <div>
                    <div className="grid gap-px bg-rule sm:grid-cols-2">
                        {CARDS.map((card) => (
                            <div key={card.label} className="bg-ground p-6">
                                <p className="table-head mb-2.5">{card.label}</p>

                                {card.href ? (
                                    <a
                                        href={card.href}
                                        target={card.href.startsWith("http") ? "_blank" : undefined}
                                        rel={card.href.startsWith("http") ? "noopener noreferrer" : undefined}
                                        className="text-[1.0625rem] text-navy transition-colors hover:text-brand-red"
                                    >
                                        {card.value}
                                    </a>
                                ) : (
                                    <p className="text-[1.0625rem] text-ink">{card.value}</p>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-8">
                        <p className="table-head mb-3">Find us</p>

                        <div className="aspect-4/3 border border-rule bg-panel">
                            <iframe
                                title={`Map showing the ${SITE.name} works at ${CONTACT.address}`}
                                src={mapEmbedUrl()}
                                className="h-full w-full"
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>

                        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                            {/* Both notations, because a delivery driver reads
                                one and a survey document gives the other. */}
                            <p className="text-[0.8125rem] leading-6 text-ink-faint">
                                {LOCATION.latitude}, {LOCATION.longitude}
                                <br />
                                {LOCATION.latitudeDMS} · {LOCATION.longitudeDMS}
                            </p>

                            <a
                                href={directionsUrl()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[0.875rem] text-navy underline underline-offset-4 transition-colors hover:text-brand-red"
                            >
                                Get directions
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
