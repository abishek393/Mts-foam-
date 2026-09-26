import { getAllInquiries, getAssignees } from "@/lib/admin";
import { PageHeader, Panel, EmptyState, FilterTabs } from "@/components/admin/ui";
import InquiryTable from "@/components/admin/InquiryTable";

export const metadata = { title: "Inquiries" };

const FILTERS = [
    { value: "", label: "All" },
    { value: "new", label: "New" },
    { value: "contacted", label: "Contacted" },
    { value: "quoted", label: "Quoted" },
    { value: "closed", label: "Closed" },
];

export default async function AdminInquiriesPage({ searchParams }) {
    const params = await searchParams;
    const status = typeof params?.status === "string" ? params.status : "";

    const [inquiries, assignees] = await Promise.all([
        getAllInquiries({ status }),
        getAssignees(),
    ]);

    return (
        <>
            <PageHeader
                eyebrow="Sales"
                title="Inquiries"
                count={inquiries.length}
            />

            <FilterTabs basePath="/admin/inquiries" current={status} options={FILTERS} />

            <Panel>
                {inquiries.length === 0 ? (
                    <EmptyState
                        title={status ? "Nothing with that status." : "No inquiries yet."}
                        body={
                            status
                                ? "Try another status, or clear the filter to see everything."
                                : "Inquiries sent from product pages, the finder and the contact form all land here."
                        }
                    />
                ) : (
                    <InquiryTable inquiries={inquiries} assignees={assignees} />
                )}
            </Panel>
        </>
    );
}
