import { redirect } from "next/navigation";
import { getMyOrders, getSession } from "@/lib/auth";
import SectionHeading from "@/components/SectionHeading";
import OrderList from "@/components/OrderList";
import Button from "@/components/Button";

export const metadata = {
    title: "My orders",
    description: "Your 4STAR order requests and their current status.",
};

export default async function OrdersPage() {
    const user = await getSession();

    if (!user) redirect("/login");

    const orders = await getMyOrders();

    return (
        <div className="shell py-14 sm:py-20">
            <SectionHeading eyebrow="Account" title="Your orders">
                <p>
                    Every order request you have placed, and where it has got to. No
                    payment is taken on this site — we reply to each order with a quote.
                </p>
            </SectionHeading>

            {orders.length === 0 ? (
                <div className="mt-12 border border-rule bg-panel px-6 py-20 text-center">
                    <p className="display mb-3 text-[1.75rem]">No orders yet</p>

                    <p className="mx-auto mb-8 max-w-md text-[0.9375rem] leading-7 text-ink-muted">
                        Add products to your cart and check out to send us a specified
                        order request.
                    </p>

                    <Button href="/products" size="lg">
                        Browse the catalogue
                    </Button>
                </div>
            ) : (
                <div className="mt-12">
                    <p className="mb-4 text-[0.875rem] text-ink-muted">
                        {orders.length} {orders.length === 1 ? "order" : "orders"}
                    </p>

                    <OrderList orders={orders} />
                </div>
            )}
        </div>
    );
}
