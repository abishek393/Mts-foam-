import { getSession } from "@/lib/auth";
import SectionHeading from "@/components/SectionHeading";
import CheckoutView from "@/components/CheckoutView";

export const metadata = {
    title: "Checkout",
    description:
        "Send your selected products to 4STAR as an order request. No payment is taken.",
};

export default async function CheckoutPage() {
    // Not redirected when signed out — the cart lives in the browser, so the
    // sign-in step happens inline and the selection survives it.
    const user = await getSession();

    return (
        <div className="shell py-14 sm:py-20">
            <SectionHeading eyebrow="Checkout" title="Place your order request">
                <p>
                    There is no payment step. Confirm your details and we will come back
                    with a quote against the specification below.
                </p>
            </SectionHeading>

            <CheckoutView user={user} />
        </div>
    );
}
