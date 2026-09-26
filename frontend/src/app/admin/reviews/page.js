import { getAdminReviews } from "@/lib/admin";
import { PageHeader, Panel, EmptyState, FilterTabs } from "@/components/admin/ui";
import ReviewModeration from "@/components/admin/ReviewModeration";

export const metadata = { title: "Reviews" };

const FILTERS = [
    { value: "", label: "All" },
    { value: "true", label: "Visible" },
    { value: "false", label: "Hidden" },
];

export default async function AdminReviewsPage({ searchParams }) {
    const params = await searchParams;
    const visible = typeof params?.visible === "string" ? params.visible : "";
    const rating = typeof params?.rating === "string" ? params.rating : "";

    const reviews = await getAdminReviews({ visible, rating });

    return (
        <>
            <PageHeader eyebrow="Customers" title="Reviews" count={reviews.length} />

            <div className="mb-5 flex flex-wrap items-start gap-x-8 gap-y-2">
                <FilterTabs
                    basePath="/admin/reviews"
                    param="visible"
                    current={visible}
                    options={FILTERS}
                />

                <FilterTabs
                    basePath="/admin/reviews"
                    param="rating"
                    current={rating}
                    options={[
                        { value: "", label: "Any rating" },
                        ...[5, 4, 3, 2, 1].map((star) => ({
                            value: String(star),
                            label: `${star}★`,
                        })),
                    ]}
                />
            </div>

            {reviews.length === 0 ? (
                <Panel>
                    <EmptyState
                        title={
                            visible || rating ? "Nothing matches that." : "No reviews yet."
                        }
                        body={
                            visible || rating
                                ? "Clear the filters to see every review."
                                : "Reviews appear once customers whose orders you have marked completed write them."
                        }
                    />
                </Panel>
            ) : (
                <ReviewModeration reviews={reviews} />
            )}
        </>
    );
}
