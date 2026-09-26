import { getApplications } from "@/lib/admin";
import { PageHeader, Panel, EmptyState, FilterTabs } from "@/components/admin/ui";
import ApplicationList from "@/components/admin/ApplicationList";

export const metadata = { title: "Dealer applications" };

const FILTERS = [
    { value: "", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "on_hold", label: "On hold" },
    { value: "verified", label: "Verified" },
    { value: "rejected", label: "Rejected" },
];

export default async function AdminApplicationsPage({ searchParams }) {
    const params = await searchParams;
    const status = typeof params?.status === "string" ? params.status : "";

    const applications = await getApplications({ status });

    return (
        <>
            <PageHeader
                eyebrow="Network"
                title="Dealer applications"
                count={applications.length}
            />

            <FilterTabs
                basePath="/admin/applications"
                current={status}
                options={FILTERS}
            />

            {applications.length === 0 ? (
                <Panel>
                    <EmptyState
                        title={
                            status
                                ? "Nothing with that status."
                                : "No applications yet."
                        }
                        body={
                            status
                                ? "Clear the filter to see every application."
                                : "Applications submitted from the dealers page arrive here with their registration and VAT documents."
                        }
                    />
                </Panel>
            ) : (
                <ApplicationList applications={applications} />
            )}
        </>
    );
}
