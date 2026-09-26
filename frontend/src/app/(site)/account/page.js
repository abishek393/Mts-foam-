import Link from "next/link";
import { redirect } from "next/navigation";
import { getMyInquiries, getMyOrders, getSession } from "@/lib/auth";
import SectionHeading from "@/components/SectionHeading";
import Button from "@/components/Button";
import InquiryButton from "@/components/InquiryButton";
import OrderList from "@/components/OrderList";

export const metadata = {
    title: "My account",
    description: "Your 4STAR inquiries and their current status.",
};

const STATUS_LABELS = {
    new: "New",
    contacted: "Contacted",
    quoted: "Quoted",
    closed: "Closed",
};

const STATUS_STYLES = {
    new: "border-navy text-navy",
    contacted: "border-accent text-accent",
    quoted: "border-accent text-accent",
    closed: "border-rule-strong text-ink-faint",
};

export default async function AccountPage() {
    const user = await getSession();

    if (!user) redirect("/login");

    const [inquiries, orders] = await Promise.all([
        getMyInquiries(),
        getMyOrders(),
    ]);

    return (
        <div className="shell py-14 sm:py-20">
            <SectionHeading eyebrow="Account" title={`Hello, ${user.firstName}`}>
                <p>
                    Every inquiry you&apos;ve sent, and where it has got to. We reply by
                    phone, WhatsApp or email using the details on each inquiry.
                </p>
            </SectionHeading>

            <div className="mt-10 flex flex-wrap gap-3">
                <InquiryButton source="contact" size="md">
                    Send a new inquiry
                </InquiryButton>

                <Button href="/cart" variant="secondary">
                    View cart
                </Button>

                <Button href="/favourites" variant="secondary">
                    Favourites
                </Button>

                <Button href="/products" variant="ghost">
                    Browse the catalogue
                </Button>
            </div>

            <section className="mt-14">
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                    <h2 className="display text-[1.75rem]">
                        Orders <span className="text-ink-faint">({orders.length})</span>
                    </h2>

                    {orders.length ? (
                        <Link
                            href="/orders"
                            className="text-[0.875rem] text-navy underline underline-offset-4 transition-colors hover:text-brand-red"
                        >
                            See all orders
                        </Link>
                    ) : null}
                </div>

                {orders.length === 0 ? (
                    <div className="border border-rule bg-panel px-6 py-12 text-center">
                        <p className="mb-2 text-[1.0625rem] text-ink">
                            You haven&apos;t placed an order yet.
                        </p>

                        <p className="mx-auto max-w-md text-[0.9375rem] leading-7 text-ink-muted">
                            Add products to your cart and check out — no payment is taken,
                            we reply with a quote.
                        </p>
                    </div>
                ) : (
                    <OrderList orders={orders.slice(0, 3)} />
                )}
            </section>

            <section className="mt-14">
                <h2 className="display mb-6 text-[1.75rem]">
                    Inquiries{" "}
                    <span className="text-ink-faint">({inquiries.length})</span>
                </h2>

                {inquiries.length === 0 ? (
                    <div className="border border-rule bg-panel px-6 py-16 text-center">
                        <p className="mb-2 text-[1.0625rem] text-ink">
                            You haven&apos;t sent any inquiries yet.
                        </p>

                        <p className="mx-auto max-w-md text-[0.9375rem] leading-7 text-ink-muted">
                            Find a product you&apos;re interested in and use Send Inquiry —
                            or send us your own measurements from the size calculator.
                        </p>
                    </div>
                ) : (
                    <div className="border-t border-rule">
                        {inquiries.map((inquiry) => (
                            <article
                                key={inquiry.id}
                                className="grid gap-4 border-b border-rule py-6 sm:grid-cols-[1fr_auto]"
                            >
                                <div>
                                    <div className="mb-2 flex flex-wrap items-center gap-3">
                                        <h3 className="display text-[1.25rem]">
                                            {inquiry.product ? (
                                                <Link
                                                    href={`/products/${inquiry.product.slug}`}
                                                    className="transition-colors hover:text-navy"
                                                >
                                                    {inquiry.productLabel ?? inquiry.product.name}
                                                </Link>
                                            ) : (
                                                inquiry.productLabel ?? "General inquiry"
                                            )}
                                        </h3>

                                        <span
                                            className={`border px-2.5 py-1 text-[0.6875rem] uppercase tracking-[0.12em] ${
                                                STATUS_STYLES[inquiry.status] ?? STATUS_STYLES.closed
                                            }`}
                                        >
                                            {STATUS_LABELS[inquiry.status] ?? inquiry.status}
                                        </span>
                                    </div>

                                    <dl className="flex flex-wrap gap-x-6 gap-y-1 text-[0.875rem] text-ink-muted">
                                        {inquiry.sizeLabel ? (
                                            <div className="flex gap-2">
                                                <dt>Size:</dt>
                                                <dd className="text-ink-soft">{inquiry.sizeLabel}</dd>
                                            </div>
                                        ) : null}

                                        {inquiry.thicknessIn ? (
                                            <div className="flex gap-2">
                                                <dt>Thickness:</dt>
                                                <dd className="text-ink-soft">
                                                    {Number(inquiry.thicknessIn)} in
                                                </dd>
                                            </div>
                                        ) : null}

                                        <div className="flex gap-2">
                                            <dt>Quantity:</dt>
                                            <dd className="text-ink-soft">{inquiry.quantity}</dd>
                                        </div>
                                    </dl>

                                    {inquiry.message ? (
                                        <p className="mt-3 max-w-2xl text-[0.9375rem] leading-7 text-ink-soft">
                                            {inquiry.message}
                                        </p>
                                    ) : null}
                                </div>

                                <p className="text-[0.8125rem] text-ink-faint sm:text-right">
                                    {new Date(inquiry.createdAt).toLocaleDateString("en-GB", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </p>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
