import SectionHeading from "@/components/SectionHeading";
import CartView from "@/components/CartView";

export const metadata = {
    title: "Cart",
    description:
        "Your selected 4STAR products, ready to send as an order request. No prices, no payment.",
};

export default function CartPage() {
    return (
        <div className="shell py-14 sm:py-20">
            <SectionHeading eyebrow="Cart" title="Your cart">
                <p>
                    Review the products, sizes and quantities you have selected. Nothing
                    is charged here — checkout sends the specification to our team, who
                    reply with a quote.
                </p>
            </SectionHeading>

            <CartView />
        </div>
    );
}
