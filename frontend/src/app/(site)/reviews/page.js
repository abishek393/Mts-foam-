import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getMyReviews } from "@/lib/reviews";
import SectionHeading from "@/components/SectionHeading";
import ReviewManager from "@/components/ReviewManager";

export const metadata = {
    title: "Reviews",
    description:
        "Rate and review the 4STAR products you have received, and manage the reviews you have written.",
};

export default async function ReviewsPage() {
    const user = await getSession();

    if (!user) redirect("/login?next=/reviews");

    const { reviewable, reviews } = await getMyReviews();

    return (
        <div className="shell py-14 sm:py-20">
            <SectionHeading eyebrow="Reviews" title="Rate what you've received">
                <p>
                    Reviews on this site come only from customers who have actually
                    received the product — so what you read here is from people who own
                    one.
                </p>
            </SectionHeading>

            <ReviewManager reviewable={reviewable} reviews={reviews} />
        </div>
    );
}
